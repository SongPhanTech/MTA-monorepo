/**
 * Create missing Subjects (+ SubjectVersions) for remapped unmatched entries
 * whose Excel subject name was not found in DB, then attach them into catalog
 * and create QuestionBanks.
 *
 * Usage:
 *   DATABASE_URL=... bun scripts/create-missing-subjects-from-unmatched.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "../generated/prisma-client/index.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const CATALOG_PATH = join(__dirname, "import-catalog.json")
const dryRun = process.argv.includes("--dry-run")

function stripDiacritics(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

function normalize(s) {
  return String(s ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Clean Excel name → canonical Subject.name */
function cleanSubjectName(raw) {
  let name = String(raw || "").trim()
  // drop review notes in parentheses
  name = name.replace(/\s*\(ngân hàng này[^)]*\)\s*$/i, "").trim()
  name = name.replace(/\s{2,}/g, " ")
  // normalize common variants
  name = name.replace(/^lí thuyết\s*\+\s*thí nghiệm/i, "Lý thuyết và thí nghiệm")
  name = name.replace(/^Lý thuyết\s*\+\s*Thí nghiệm/i, "Lý thuyết và thí nghiệm")
  if (name) {
    // Title-ish: keep as provided but fix leading lowercase
    name = name.charAt(0).toUpperCase() + name.slice(1)
  }
  return name
}

const TYPE_ALIASES = {
  "cao học dân sự": "12",
  "cao học quân sự": "11",
  "đại học dân sự": "01",
  "đại học quân sự": "05",
  "dai hoc quan su": "05",
  "dai hoc dan su": "01",
  "cao hoc dan su": "12",
  "cao hoc quan su": "11",
  "chủ nhiệm hậu cần kỹ thuật trung lữ đoàn dài hạn": "17",
  "chu nhiem hau can ky thuat trung lu doan dai han": "17",
  "chủ nhiệm hậu cần kỹ thuật trung lữ đoàn ngắn hạn": "18",
  "chu nhiem hau can ky thuat trung lu doan ngan han": "18",
  "lớp chủ nhiệm hậu cần kỹ thuật trung lữ đoàn ngắn hạn": "18",
  "lop chu nhiem hau can ky thuat trung lu doan ngan han": "18",
  "cao học quốc tế": "21",
  "chủ nhiệm kho": "20",
}

/** Prefer existing subjects when Excel name is ambiguous but path is clear */
const FORCE_EXISTING = {
  "những nguyên lý cơ bản của chủ nghĩa mác lê nin":
    "Những nguyên lý cơ bản của chủ nghĩa Mác - Lênin 2",
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes("?")
        ? `${url}&connection_limit=1`
        : `${url}?connection_limit=1`,
    },
  },
})

async function main() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"))
  const targets = catalog.unmatched.filter((u) =>
    String(u.reason || "").startsWith("Remap: No matching Subject")
  )
  console.log(`Target unmatched files: ${targets.length}`)
  if (!targets.length) return

  const types = await prisma.$queryRaw`
    SELECT id, name FROM "ql-dao-tao"."TrainingObjectType" WHERE "deletedAt" IS NULL
  `
  function resolveType(nameOrId) {
    if (!nameOrId) return null
    if (types.some((t) => t.id === nameOrId)) return nameOrId
    const n = normalize(nameOrId)
    const a = normalize(stripDiacritics(nameOrId))
    const alias = TYPE_ALIASES[n] || TYPE_ALIASES[a]
    if (alias) return alias
    const hit = types.find(
      (t) => normalize(t.name) === n || normalize(stripDiacritics(t.name)) === a
    )
    return hit?.id || null
  }

  // Group by cleaned subject name
  const groups = new Map()
  for (const entry of targets) {
    const raw = entry.remappedSubjectName || entry.subjectName
    const forceKey = normalize(raw)
    let name = FORCE_EXISTING[forceKey] || cleanSubjectName(raw)
    const typeId =
      resolveType(entry.remappedTrainingType) ||
      resolveType(entry.trainingTypeId)
    if (!typeId) {
      console.warn(`  SKIP no training type: ${entry.relativePath} | "${entry.remappedTrainingType}"`)
      continue
    }
    if (!groups.has(name)) groups.set(name, { name, typeIds: new Set(), entries: [] })
    groups.get(name).typeIds.add(typeId)
    groups.get(name).entries.push({ ...entry, _cleanName: name, _typeId: typeId })
  }

  console.log(`\nWill ensure ${groups.size} subjects:`)
  for (const [name, g] of groups) {
    console.log(`  - ${name} | types=[${[...g.typeIds].join(",")}] | files=${g.entries.length}`)
  }

  const subjectByNorm = new Map()
  const allSubjects = await prisma.subject.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, code: true },
  })
  for (const s of allSubjects) {
    subjectByNorm.set(normalize(s.name), s)
    subjectByNorm.set(normalize(stripDiacritics(s.name)), s)
  }

  const createdSubjects = []
  const createdSvs = []
  const newlyMatched = []
  const newlyMissingSv = [] // shouldn't remain after we create SVs
  const still = []

  for (const [name, g] of groups) {
    let subject =
      subjectByNorm.get(normalize(name)) ||
      subjectByNorm.get(normalize(stripDiacritics(name)))

    if (!subject) {
      console.log(`\nCreating Subject: "${name}"`)
      if (dryRun) {
        subject = { id: `dry-subj-${normalize(name).slice(0, 20)}`, name, code: null }
      } else {
        subject = await prisma.subject.create({
          data: {
            name,
            active: true,
            description: "Tạo từ import NHCH (unmatched remap)",
          },
        })
      }
      createdSubjects.push(subject)
      subjectByNorm.set(normalize(name), subject)
    } else {
      console.log(`\nReuse Subject: "${subject.name}" (${subject.id})`)
    }

    // Ensure SV per training type
    const svByType = new Map()
    for (const typeId of g.typeIds) {
      let sv = null
      if (!String(subject.id).startsWith("dry-")) {
        sv = await prisma.subjectVersion.findFirst({
          where: {
            subjectId: subject.id,
            trainingObjectTypeId: typeId,
            deletedAt: null,
          },
        })
      }
      if (!sv) {
        const code = `NHCH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
        console.log(`  Creating SV type=${typeId} code=${code}`)
        if (dryRun) {
          sv = {
            id: `dry-sv-${typeId}`,
            code,
            name,
            trainingObjectTypeId: typeId,
          }
        } else {
          sv = await prisma.subjectVersion.create({
            data: {
              code,
              name,
              examType: "OfflineWritten",
              type: "Normal",
              credit: 2,
              subjectId: subject.id,
              trainingObjectTypeId: typeId,
              active: true,
              description: "Tạo từ import NHCH (unmatched remap)",
            },
          })
        }
        createdSvs.push(sv)
      } else {
        console.log(`  SV exists type=${typeId}: ${sv.id}`)
      }
      svByType.set(typeId, sv)
    }

    // Move entries → matched (QB may still be missing)
    for (const entry of g.entries) {
      const sv = svByType.get(entry._typeId)
      if (!sv) {
        still.push(entry)
        continue
      }
      newlyMatched.push({
        filePath: entry.filePath,
        relativePath: entry.relativePath,
        topFolder: entry.topFolder,
        trainingTypeId: entry._typeId,
        bmName: entry.bmName,
        subjectFolderName: entry.subjectFolderName,
        subjectName: name,
        bankName: entry.bankName,
        subjectId: subject.id,
        subjectName_db: subject.name || name,
        subjectCode: subject.code ?? null,
        subjectVersionId: sv.id,
        subjectVersionCode: sv.code,
        trainingObjectTypeId: entry._typeId,
        questionBankId: null,
        questionBankExists: false,
        remappedSubjectName: entry.remappedSubjectName,
        remappedTrainingType: entry.remappedTrainingType,
        createdSubjectFromRemap: true,
      })
    }
  }

  // Keep other unmatched
  const processedPaths = new Set(targets.map((t) => t.relativePath))
  const remainingUnmatched = [
    ...catalog.unmatched.filter((u) => !processedPaths.has(u.relativePath)),
    ...still,
  ]

  console.log(`\n=== Summary ===`)
  console.log(`Subjects created: ${createdSubjects.length}`)
  console.log(`SVs created:      ${createdSvs.length}`)
  console.log(`Files → matched:  ${newlyMatched.length}`)
  console.log(`Still unmatched:  ${remainingUnmatched.length} (of which failed: ${still.length})`)

  if (dryRun) {
    console.log("[DRY RUN] no catalog/DB write beyond reads")
    return
  }

  // Create QuestionBanks for newly matched
  let qbCreated = 0
  const qbCache = new Map()
  for (const entry of newlyMatched) {
    const key = `${entry.subjectVersionId}::${normalize(entry.bankName)}`
    if (qbCache.has(key)) {
      entry.questionBankId = qbCache.get(key)
      entry.questionBankExists = true
      continue
    }
    const existing = await prisma.questionBank.findFirst({
      where: {
        subjectVersionId: entry.subjectVersionId,
        name: entry.bankName,
        deletedAt: null,
      },
    })
    if (existing) {
      entry.questionBankId = existing.id
      entry.questionBankExists = true
      qbCache.set(key, existing.id)
      continue
    }
    const qb = await prisma.questionBank.create({
      data: {
        name: entry.bankName,
        subjectVersionId: entry.subjectVersionId,
        active: true,
      },
    })
    entry.questionBankId = qb.id
    entry.questionBankExists = true
    qbCache.set(key, qb.id)
    qbCreated++
  }
  console.log(`QuestionBanks created: ${qbCreated}`)

  writeFileSync(
    join(__dirname, `import-catalog.backup-${Date.now()}.json`),
    JSON.stringify(catalog)
  )

  const updated = {
    ...catalog,
    generatedAt: new Date().toISOString(),
    createdMissingSubjectsAt: new Date().toISOString(),
    summary: {
      totalFiles: catalog.summary.totalFiles,
      matched: catalog.matched.length + newlyMatched.length,
      missingSv: catalog.missingSv?.length || 0,
      unmatched: remainingUnmatched.length,
    },
    matched: [...catalog.matched, ...newlyMatched],
    missingSv: catalog.missingSv || [],
    unmatched: remainingUnmatched,
  }
  writeFileSync(CATALOG_PATH, JSON.stringify(updated, null, 2), "utf8")
  console.log(`\nUpdated ${CATALOG_PATH}`)
  console.log(
    `matched=${updated.summary.matched} missingSv=${updated.summary.missingSv} unmatched=${updated.summary.unmatched}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
