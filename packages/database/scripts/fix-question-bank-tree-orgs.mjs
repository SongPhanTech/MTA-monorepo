/**
 * Make QuestionBanks visible on EMS /thiet-lap-de-thi/ngan-hang-cau-hoi.
 *
 * The tree only lists DM_DonVi with iLoaiDonVi in [5,6,7] (Khoa / Viện / Bộ môn)
 * and only Subjects whose managementOrganizationId points at those orgs.
 *
 * This script:
 *   1. Sets iLoaiDonVi for mis-tagged Khoa / Viện / Bộ môn (currently 0 or null).
 *   2. Moves subjects (that have NHCH) off PTN / Trung tâm / Unknown onto the
 *      nearest ancestor org that the tree can display.
 *   3. Assigns managementOrganizationId for NHCH subjects created without an org
 *      (from import-catalog.json folder BM names).
 *
 * Usage:
 *   DATABASE_URL="postgres://..." bun scripts/fix-question-bank-tree-orgs.mjs [--dry-run]
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { PrismaClient } from "../generated/prisma-client/index.js"

const dryRun = process.argv.includes("--dry-run")
const VISIBLE_LOAI = [5, 6, 7]
const CATALOG_PATH = join(import.meta.dir || ".", "import-catalog.json")

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

function stripDiacritics(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

function normalize(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,;:\-–—()[\]{}'"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeAscii(s) {
  return stripDiacritics(normalize(s))
}

/** Folder "04 BM Khoa học máy tính" → "bo mon khoa hoc may tinh" */
const BM_ALIASES = {
  "bm tang": "bo mon tang thiet giap",
  "bm tang thiet giap": "bo mon tang thiet giap",
  "bm ttg": "bo mon tang thiet giap",
  "bm xmcb": "bo mon xe may cong binh",
  "bm xe may cong binh": "bo mon xe may cong binh",
  "bm oto qs": "bo mon o to quan su",
  "bm o to qs": "bo mon o to quan su",
  "bm o to quan su": "bo mon o to quan su",
  "bm dam bao thong tin co yeu": "bo mon thong tin",
}

function canonOrgName(raw) {
  let t = normalizeAscii(raw)
  t = t.replace(/^\d+\s+/, "")
  t = t.replace(/^(bm|bo mon|bọ mon)\s+/, "bo mon ")
  t = t.replace(/^khoa\s+/, "khoa ")
  t = t.replace(/^vien\s+/, "vien ")
  t = t.trim()
  return BM_ALIASES[t] || BM_ALIASES[t.replace(/^bo mon /, "bm ")] || t
}

function inferLoaiDonVi(sTen) {
  const a = normalizeAscii(sTen)
  if (/^(bo mon|bm)\b/.test(a)) return 7
  if (/^khoa\b/.test(a)) return 5
  if (/^vien\b/.test(a)) return 6
  return null
}

function buildOrgMatcher(orgs) {
  const byCanon = new Map()
  for (const org of orgs) {
    const key = canonOrgName(org.sTen)
    if (!key) continue
    const list = byCanon.get(key) || []
    list.push(org)
    byCanon.set(key, list)
  }

  function pick(list) {
    if (!list?.length) return null
    const visible = list.filter((o) => VISIBLE_LOAI.includes(o.iLoaiDonVi))
    return (visible[0] || list[0]) ?? null
  }

  return function matchOrg(rawName) {
    if (!rawName) return null
    const key = canonOrgName(rawName)
    if (!key) return null
    const exact = pick(byCanon.get(key))
    if (exact) return exact

    let best = null
    let bestScore = 0
    for (const [canon, list] of byCanon) {
      if (canon === key) continue
      let score = 0
      if (canon.startsWith(key) || key.startsWith(canon)) {
        score = Math.min(canon.length, key.length) / Math.max(canon.length, key.length)
      } else if (canon.includes(key) || key.includes(canon)) {
        score = 0.7 * (Math.min(canon.length, key.length) / Math.max(canon.length, key.length))
      }
      if (score > bestScore && score >= 0.72) {
        bestScore = score
        best = pick(list)
      }
    }
    return best
  }
}

async function nearestVisibleAncestor(orgById, org) {
  let current = org
  const seen = new Set()
  while (current?.sParentId && !seen.has(current.Id)) {
    seen.add(current.Id)
    const parent = orgById.get(current.sParentId)
    if (!parent) break
    if (VISIBLE_LOAI.includes(parent.iLoaiDonVi)) return parent
    current = parent
  }
  return null
}

async function main() {
  const orgs = await prisma.dM_DonVi.findMany({
    where: { OR: [{ bDeleted: false }, { bDeleted: null }] },
    select: {
      Id: true,
      sMa: true,
      sTen: true,
      sParentId: true,
      iLoaiDonVi: true,
    },
  })
  const orgById = new Map(orgs.map((o) => [o.Id, o]))
  const matchOrg = buildOrgMatcher(orgs)

  const stats = {
    loaiFixed: 0,
    subjectsReparented: 0,
    svOrgFilled: 0,
    orphanAssigned: 0,
    skipped: 0,
  }

  console.log(`Mode: ${dryRun ? "DRY RUN" : "APPLY"}`)
  console.log(`Loaded ${orgs.length} organizations\n`)

  // ── 1. Fix iLoaiDonVi for Khoa / Viện / Bộ môn tagged as Phòng (0) / null
  console.log("=== 1. Fix iLoaiDonVi (Khoa=5, Viện=6, Bộ môn=7) ===")
  for (const org of orgs) {
    if (org.iLoaiDonVi != null && org.iLoaiDonVi !== 0) continue
    const inferred = inferLoaiDonVi(org.sTen)
    if (!inferred) continue
    console.log(`  ${org.sMa || "-"} | ${org.sTen} | iLoaiDonVi ${org.iLoaiDonVi} → ${inferred}`)
    if (!dryRun) {
      await prisma.dM_DonVi.update({
        where: { Id: org.Id },
        data: { iLoaiDonVi: inferred },
      })
    }
    org.iLoaiDonVi = inferred
    stats.loaiFixed++
  }
  console.log(`  updated: ${stats.loaiFixed}\n`)

  const catalogBySubject = new Map()
  const catalogByBank = new Map()
  if (existsSync(CATALOG_PATH)) {
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"))
    const rows = [
      ...(catalog.matched || []),
      ...(catalog.missingSv || []),
      ...(catalog.unmatched || []),
    ]
    for (const entry of rows) {
      if (!entry.bmName) continue
      const names = [
        entry.subjectName_db,
        entry.subjectName,
        entry.remappedSubjectName,
        entry.subjectFolderName,
      ]
      for (const n of names) {
        const key = normalizeAscii(n)
        if (key && !catalogBySubject.has(key)) catalogBySubject.set(key, entry.bmName)
      }
      const bankKey = normalizeAscii(entry.bankName)
      if (bankKey && !catalogByBank.has(bankKey)) catalogByBank.set(bankKey, entry.bmName)
    }
    console.log(`Catalog BM hints: subjects=${catalogBySubject.size} banks=${catalogByBank.size}\n`)
  } else {
    console.warn(`Catalog not found at ${CATALOG_PATH} — BM matching will be weaker\n`)
  }

  async function resolveBmForSubject(subject) {
    const subjectKey = normalizeAscii(subject.name)
    if (catalogBySubject.has(subjectKey)) return catalogBySubject.get(subjectKey)
    if (subjectKey.length >= 8) {
      for (const [key, bm] of catalogBySubject) {
        if (key.includes(subjectKey) || (key.length >= 8 && subjectKey.includes(key))) return bm
      }
    }
    const banks = await prisma.questionBank.findMany({
      where: {
        deletedAt: null,
        subjectVersion: { subjectId: subject.id, deletedAt: null },
      },
      select: { name: true },
    })
    for (const b of banks) {
      const bm = catalogByBank.get(normalizeAscii(b.name))
      if (bm) return bm
    }
    if (/mat duong/.test(subjectKey)) return "Bộ môn Cầu đường sân bay"
    return null
  }

  async function assignSubjectOrg(subject, org, reason) {
    console.log(`    - ${subject.name} → ${org.sTen} (${reason})`)
    if (!dryRun) {
      await prisma.subject.update({
        where: { id: subject.id },
        data: { managementOrganizationId: org.Id },
      })
      const svRes = await prisma.subjectVersion.updateMany({
        where: { subjectId: subject.id, deletedAt: null, managementOrganizationId: null },
        data: { managementOrganizationId: org.Id },
      })
      stats.svOrgFilled += svRes.count
    }
  }

  // ── 2. Reparent NHCH subjects off orgs the tree cannot display
  console.log("=== 2. Reparent NHCH subjects from hidden orgs onto Khoa/Viện/Bộ môn ===")
  const hiddenWithQb = await prisma.$queryRaw`
    SELECT DISTINCT org."Id" AS "orgId"
    FROM "mta"."DM_DonVi" org
    JOIN "ql-dao-tao"."Subject" s ON s."managementOrganizationId" = org."Id" AND s."deletedAt" IS NULL
    JOIN "ql-dao-tao"."SubjectVersion" sv ON sv."subjectId" = s.id AND sv."deletedAt" IS NULL
    JOIN "khao-thi"."QuestionBank" qb ON qb."subjectVersionId" = sv.id AND qb."deletedAt" IS NULL
    WHERE org."iLoaiDonVi" IS NULL OR org."iLoaiDonVi" NOT IN (5, 6, 7)
  `

  for (const row of hiddenWithQb) {
    const org = orgById.get(row.orgId)
    if (!org) continue
    // Type may have been fixed in step 1
    if (VISIBLE_LOAI.includes(org.iLoaiDonVi)) continue

    const ancestor = await nearestVisibleAncestor(orgById, org)
    const subjects = await prisma.subject.findMany({
      where: {
        managementOrganizationId: org.Id,
        deletedAt: null,
        subjectVersion: {
          some: {
            deletedAt: null,
            questionBanks: { some: { deletedAt: null } },
          },
        },
      },
      select: { id: true, name: true },
    })

    if (ancestor) {
      console.log(
        `  ${org.sTen} [${org.iLoaiDonVi}] → ${ancestor.sTen} [${ancestor.iLoaiDonVi}] | ${subjects.length} subjects`
      )
      for (const s of subjects) {
        await assignSubjectOrg(s, ancestor, "parent")
        stats.subjectsReparented++
      }
      continue
    }

    console.log(`  ${org.sTen} has no visible ancestor — try catalog BM`)
    for (const s of subjects) {
      const bmName = await resolveBmForSubject(s)
      const target = matchOrg(bmName)
      if (!target || !VISIBLE_LOAI.includes(target.iLoaiDonVi)) {
        console.warn(`    SKIP "${s.name}" | bm="${bmName || "-"}"`)
        stats.skipped++
        continue
      }
      await assignSubjectOrg(s, target, bmName)
      stats.subjectsReparented++
    }
  }
  console.log(`  subjects moved: ${stats.subjectsReparented}\n`)

  // ── 3. Assign org for NHCH subjects with no managementOrganizationId
  console.log("=== 3. Assign đơn vị for NHCH subjects with no org ===")
  const orphans = await prisma.subject.findMany({
    where: {
      deletedAt: null,
      managementOrganizationId: null,
      subjectVersion: {
        some: {
          deletedAt: null,
          questionBanks: { some: { deletedAt: null } },
        },
      },
    },
    select: { id: true, name: true },
  })

  for (const s of orphans) {
    const bmName = await resolveBmForSubject(s)
    const org = matchOrg(bmName) || matchOrg(s.name)
    if (!org || !VISIBLE_LOAI.includes(org.iLoaiDonVi)) {
      console.warn(
        `  SKIP "${s.name}" | bm="${bmName || "-"}" | org=${org ? `${org.sTen} [${org.iLoaiDonVi}]` : "none"}`
      )
      stats.skipped++
      continue
    }
    await assignSubjectOrg(s, org, bmName || "name-match")
    stats.orphanAssigned++
  }
  console.log(`  orphans assigned: ${stats.orphanAssigned}\n`)

  // ── Verify remaining hidden NHCH
  const remaining = await prisma.$queryRaw`
    SELECT count(*)::int AS n
    FROM "khao-thi"."QuestionBank" qb
    JOIN "ql-dao-tao"."SubjectVersion" sv ON sv.id = qb."subjectVersionId" AND sv."deletedAt" IS NULL
    JOIN "ql-dao-tao"."Subject" s ON s.id = sv."subjectId" AND s."deletedAt" IS NULL
    LEFT JOIN "mta"."DM_DonVi" org ON org."Id" = s."managementOrganizationId"
    WHERE qb."deletedAt" IS NULL
      AND (s."managementOrganizationId" IS NULL OR org."iLoaiDonVi" IS NULL OR org."iLoaiDonVi" NOT IN (5,6,7))
  `

  console.log("=== Summary ===")
  console.log(stats)
  console.log(
    `NHCH still hidden from tree: ${remaining[0]?.n ?? "?"} ${dryRun ? "(counts include dry-run; re-run without --dry-run to apply)" : ""}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
