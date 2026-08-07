/**
 * Phase 2: Create missing SubjectVersions (by cloning) and QuestionBanks.
 *
 * Reads import-catalog.json, processes "missingSv" entries and creates QB for
 * all "matched" entries that don't have one yet.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." bun scripts/bulk-import-create-sv.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { PrismaClient } from "../generated/prisma-client/index.js"

const dryRun = process.argv.includes("--dry-run")

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes("?") ? `${url}&connection_limit=1` : `${url}?connection_limit=1`,
    },
  },
})

const CATALOG_PATH = join(import.meta.dir || ".", "import-catalog.json")

async function main() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"))
  console.log(`Loaded catalog: ${catalog.summary.totalFiles} files`)
  console.log(
    `  matched=${catalog.summary.matched} missingSv=${catalog.summary.missingSv} unmatched=${catalog.summary.unmatched}`
  )

  // ── Phase 2a: Create missing SubjectVersions ─────────────────────
  // Group missingSv entries by (subjectId, trainingTypeId) to avoid duplicates
  const svToCreate = new Map()
  for (const entry of catalog.missingSv) {
    if (!entry.templateSvId) {
      console.warn(`  SKIP (no template): ${entry.relativePath}`)
      continue
    }
    const key = `${entry.subjectId}::${entry.trainingTypeId}`
    if (!svToCreate.has(key)) {
      svToCreate.set(key, {
        subjectId: entry.subjectId,
        trainingTypeId: entry.trainingTypeId,
        templateSvId: entry.templateSvId,
        subjectName: entry.subjectName_db,
        entries: [],
      })
    }
    svToCreate.get(key).entries.push(entry)
  }

  console.log(`\nNeed to create ${svToCreate.size} SubjectVersions`)

  // Verify training object types exist
  const existingTypes = await prisma.$queryRaw`
    SELECT id, code, name FROM "ql-dao-tao"."TrainingObjectType" WHERE "deletedAt" IS NULL
  `
  const typeIds = new Set(existingTypes.map((t) => t.id))
  console.log(
    `Training object types in DB: ${existingTypes.map((t) => `${t.id}(${t.name})`).join(", ")}`
  )

  const createdSvMap = new Map() // key -> new SV id

  for (const [key, info] of svToCreate) {
    if (!typeIds.has(info.trainingTypeId)) {
      console.warn(`  SKIP type ${info.trainingTypeId} not in DB for subject "${info.subjectName}"`)
      continue
    }

    // Load template SV
    const template = await prisma.subjectVersion.findUnique({
      where: { id: info.templateSvId },
    })
    if (!template) {
      console.warn(`  SKIP template SV ${info.templateSvId} not found`)
      continue
    }

    // Skip if SV already exists for this subject + training type
    const existingSv = await prisma.subjectVersion.findFirst({
      where: {
        subjectId: info.subjectId,
        trainingObjectTypeId: info.trainingTypeId,
        deletedAt: null,
      },
      select: { id: true },
    })
    if (existingSv) {
      console.log(
        `  SV exists for "${info.subjectName}" type=${info.trainingTypeId}: ${existingSv.id}`
      )
      createdSvMap.set(key, existingSv.id)
      continue
    }

    console.log(
      `  Creating SV for "${info.subjectName}" type=${info.trainingTypeId} (from template ${template.code})`
    )

    if (dryRun) {
      console.log(`    [DRY RUN] would create SV clone`)
      createdSvMap.set(key, `dry-${key}`)
      continue
    }

    const newSv = await prisma.subjectVersion.create({
      data: {
        code: template.code,
        name: template.name,
        examType: template.examType,
        type: template.type,
        credit: template.credit,
        period: template.period,
        schedulePeriod: template.schedulePeriod,
        numberOfTheory: template.numberOfTheory,
        numberOfPractical: template.numberOfPractical,
        numberOfSelfStudy: template.numberOfSelfStudy,
        numberOfPractice: template.numberOfPractice,
        numberOfReview: template.numberOfReview,
        numberOfExam: template.numberOfExam,
        numberOfOther: template.numberOfOther,
        onePoint: template.onePoint,
        week: template.week,
        subjectId: info.subjectId,
        trainingObjectTypeId: info.trainingTypeId,
        managementOrganizationId: template.managementOrganizationId,
        subjectVersionCategoryId: template.subjectVersionCategoryId,
        active: true,
      },
    })
    console.log(`    Created SV: ${newSv.id}`)
    createdSvMap.set(key, newSv.id)
  }

  // ── Phase 2b: Update catalog missingSv -> matched ─────────────────
  const nowMatched = []
  const stillMissing = []

  for (const entry of catalog.missingSv) {
    const key = `${entry.subjectId}::${entry.trainingTypeId}`
    const newSvId = createdSvMap.get(key)
    if (newSvId) {
      nowMatched.push({
        ...entry,
        subjectVersionId: newSvId,
        trainingObjectTypeId: entry.trainingTypeId,
        questionBankId: null,
        questionBankExists: false,
      })
    } else {
      stillMissing.push(entry)
    }
  }

  // Merge into matched
  const allMatched = [...catalog.matched, ...nowMatched]

  // ── Phase 2c: Create QuestionBanks where missing (dedupe by SV + name) ──
  let qbCreated = 0
  const qbCache = new Map() // `${svId}::${name}` -> qbId

  for (const entry of allMatched) {
    if (entry.questionBankExists || entry.questionBankId) continue
    if (!entry.subjectVersionId || String(entry.subjectVersionId).startsWith("dry-")) continue

    const qbKey = `${entry.subjectVersionId}::${entry.bankName}`
    if (qbCache.has(qbKey)) {
      entry.questionBankId = qbCache.get(qbKey)
      entry.questionBankExists = true
      continue
    }

    if (dryRun) {
      qbCreated++
      continue
    }

    try {
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
        qbCache.set(qbKey, existing.id)
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
      qbCache.set(qbKey, qb.id)
      qbCreated++
      if (qbCreated % 100 === 0) console.log(`  ... created ${qbCreated} QBs`)
    } catch (e) {
      console.error(`    Error creating QB "${entry.bankName}": ${e.message}`)
    }
  }

  console.log(`\nCreated ${qbCreated} new QuestionBanks`)

  // ── Save updated catalog ──────────────────────────────────────────
  const updatedCatalog = {
    ...catalog,
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: catalog.summary.totalFiles,
      matched: allMatched.length,
      missingSv: stillMissing.length,
      unmatched: catalog.unmatched.length,
    },
    matched: allMatched,
    missingSv: stillMissing,
    unmatched: catalog.unmatched,
  }

  if (!dryRun) {
    writeFileSync(CATALOG_PATH, JSON.stringify(updatedCatalog, null, 2), "utf8")
    console.log(`Saved to ${CATALOG_PATH}`)
  } else {
    console.log(`[DRY RUN] catalog not written`)
  }
  console.log(`\n=== Updated Catalog ===`)
  console.log(`Matched:    ${updatedCatalog.summary.matched}`)
  console.log(`Missing SV: ${updatedCatalog.summary.missingSv}`)
  console.log(`Unmatched:  ${updatedCatalog.summary.unmatched}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
