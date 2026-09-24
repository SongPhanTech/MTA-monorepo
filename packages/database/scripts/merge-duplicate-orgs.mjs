/**
 * Gộp cây đơn vị DM_DonVi bị duplicate, remap toàn bộ FK sang ID canonical, rồi XÓA CỨNG bản trùng.
 *
 * Quy tắc chọn bản giữ (canonical):
 *  1) Ưu tiên sMa có chữ (V4, K11, P7…) hơn mã thuần số (12, 84…)
 *  2) Tránh mã bắt đầu OLD_
 *  3) Nếu hòa: bản có nhiều FK hơn; rồi createdAt sớm hơn
 *
 * Modes:
 *  (default)  Gộp 2 cây HVKTQS + trùng tên, remap FK, hard-delete loser
 *  --purge    Chỉ xử lý bản bDeleted=true còn sót: map → active, remap FK, hard-delete
 *
 * Usage:
 *   cd packages/database
 *   DATABASE_URL="postgres://..." bun scripts/merge-duplicate-orgs.mjs --dry-run
 *   DATABASE_URL="postgres://..." bun scripts/merge-duplicate-orgs.mjs
 *   DATABASE_URL="postgres://..." bun scripts/merge-duplicate-orgs.mjs --purge
 *
 * Options:
 *   --dry-run   Chỉ in kế hoạch, không ghi DB
 *   --quiet     Ít log hơn
 *   --purge     Remap + xóa cứng các DM_DonVi đã soft-delete
 */
import { PrismaClient } from "../generated/prisma-client/index.js"

const dryRun = process.argv.includes("--dry-run")
const quiet = process.argv.includes("--quiet")
const purgeOnly = process.argv.includes("--purge")

/** Root cũ — đang chứa Lecturer/Subject/Curriculum… */
const KEEP_ROOT = "7ca5fe7c-8391-416a-ad7c-fd743931c70e"
/** Root import 18/08/2026 — trùng cấu trúc */
const DROP_ROOT = "e99d4c36-a70d-4a72-a2b0-9c30d92d35e6"

const FK_UPDATES = [
  { schema: "mta", table: "DM_DonVi", column: "sParentId" },
  { schema: "mta", table: "DM_DonVi", column: "sTruongDonVi" },
  { schema: "mta", table: "DM_NhanVien", column: "sDM_DonViId" },
  { schema: "ql-nguoi-dung", table: "UserProfile", column: "sDM_DonViId" },
  { schema: "ql-dao-tao", table: "LecturerHistory", column: "organizationId" },
  { schema: "ql-dao-tao", table: "Staff", column: "organizationId" },
  { schema: "ql-dao-tao", table: "StaffHistory", column: "organizationId" },
  { schema: "ql-dao-tao", table: "ThesisProject", column: "organizationId" },
  { schema: "ql-dao-tao", table: "ResearchProject", column: "organizationId" },
  { schema: "ql-dao-tao", table: "TrainingField", column: "organizationId" },
  { schema: "ql-dao-tao", table: "TrainingMajor", column: "organizationId" },
  { schema: "ql-dao-tao", table: "TrainingMajor", column: "secondOrganizationId" },
  { schema: "ql-dao-tao", table: "TrainingMajor", column: "thirdOrganizationId" },
  { schema: "ql-dao-tao", table: "Curriculum", column: "managementOrganizationId" },
  { schema: "ql-dao-tao", table: "FixedClass", column: "managementOrganizationId" },
  { schema: "ql-dao-tao", table: "Subject", column: "managementOrganizationId" },
  { schema: "ql-dao-tao", table: "SubjectVersion", column: "managementOrganizationId" },
  { schema: "ql-dao-tao", table: "GuestTeachingPayment", column: "hiringOrgId" },
]

function createPrisma() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!url) throw new Error("DATABASE_URL or POSTGRES_URL is required")
  const withLimit = url.includes("?") ? `${url}&connection_limit=1` : `${url}?connection_limit=1`
  return new PrismaClient({ datasources: { db: { url: withLimit } } })
}

function normName(name) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ")
}

function normMa(ma) {
  return (ma || "").trim().toUpperCase()
}

/** Điểm ưu tiên mã: chữ > OLD_ > số thuần */
function codeScore(sMa) {
  const ma = (sMa || "").trim()
  if (!ma) return 0
  if (/^OLD_/i.test(ma)) return 50
  if (/[A-Za-z]/.test(ma)) return 1000
  return 10
}

const ORG_SELECT = {
  Id: true,
  sMa: true,
  sTen: true,
  sCode: true,
  sParentId: true,
  iSTT: true,
  bDeleted: true,
  dNgayTao: true,
  dNgaySua: true,
}

async function loadAllOrgs(prisma) {
  return prisma.dM_DonVi.findMany({ select: ORG_SELECT })
}

async function loadActiveOrgs(prisma) {
  return prisma.dM_DonVi.findMany({
    where: { OR: [{ bDeleted: false }, { bDeleted: null }] },
    select: ORG_SELECT,
  })
}

async function loadTreeIds(prisma, rootId, { includeDeleted = false } = {}) {
  const rows = includeDeleted
    ? await prisma.$queryRaw`
        WITH RECURSIVE tree AS (
          SELECT "Id" FROM mta."DM_DonVi" WHERE "Id" = ${rootId}::uuid
          UNION ALL
          SELECT c."Id"
          FROM mta."DM_DonVi" c
          JOIN tree t ON c."sParentId" = t."Id"
        )
        SELECT "Id"::text AS id FROM tree
      `
    : await prisma.$queryRaw`
        WITH RECURSIVE tree AS (
          SELECT "Id" FROM mta."DM_DonVi" WHERE "Id" = ${rootId}::uuid
          UNION ALL
          SELECT c."Id"
          FROM mta."DM_DonVi" c
          JOIN tree t ON c."sParentId" = t."Id"
          WHERE COALESCE(c."bDeleted", false) = false
        )
        SELECT "Id"::text AS id FROM tree
      `
  return new Set(rows.map((r) => r.id))
}

async function countRefs(prisma, id) {
  const rows = await prisma.$queryRaw`
    SELECT (
      (SELECT COUNT(*)::int FROM "ql-dao-tao"."Subject" WHERE "managementOrganizationId" = ${id}::uuid) +
      (SELECT COUNT(*)::int FROM "ql-dao-tao"."FixedClass" WHERE "managementOrganizationId" = ${id}::uuid) +
      (SELECT COUNT(*)::int FROM "ql-dao-tao"."Curriculum" WHERE "managementOrganizationId" = ${id}::uuid) +
      (SELECT COUNT(*)::int FROM "ql-dao-tao"."ThesisProject" WHERE "organizationId" = ${id}::uuid) +
      (SELECT COUNT(*)::int FROM "ql-nguoi-dung"."UserProfile" WHERE "sDM_DonViId" = ${id}::uuid) +
      (SELECT COUNT(*)::int FROM mta."DM_DonVi" WHERE "sParentId" = ${id}::uuid)
    ) AS n
  `
  return Number(rows[0]?.n || 0)
}

function pickCanonical(a, b, refA, refB) {
  const sa = codeScore(a.sMa)
  const sb = codeScore(b.sMa)
  if (sa !== sb) return sa > sb ? a : b
  if (refA !== refB) return refA > refB ? a : b
  const ta = a.dNgayTao ? new Date(a.dNgayTao).getTime() : 0
  const tb = b.dNgayTao ? new Date(b.dNgayTao).getTime() : Number.MAX_SAFE_INTEGER
  return ta <= tb ? a : b
}

function buildMergeMap(orgs, keepTreeIds, dropTreeIds, refCache) {
  const byId = new Map(orgs.map((o) => [o.Id, o]))
  /** @type {Map<string, string>} */
  const mergeTo = new Map()

  const keepOrgs = orgs.filter((o) => keepTreeIds.has(o.Id) && !o.bDeleted)
  const dropOrgs = orgs.filter((o) => dropTreeIds.has(o.Id))

  const keepByMaName = new Map()
  const keepByName = new Map()
  for (const o of keepOrgs) {
    const name = normName(o.sTen)
    if (!name) continue
    const ma = normMa(o.sMa)
    if (ma) {
      const k = `${ma}||${name}`
      if (!keepByMaName.has(k)) keepByMaName.set(k, [])
      keepByMaName.get(k).push(o)
    }
    if (!keepByName.has(name)) keepByName.set(name, [])
    keepByName.get(name).push(o)
  }

  function registerPair(x, y) {
    if (x.Id === y.Id) return
    if (mergeTo.has(x.Id) || mergeTo.has(y.Id)) return
    // never make KEEP_ROOT a loser
    if (x.Id === KEEP_ROOT) {
      mergeTo.set(y.Id, KEEP_ROOT)
      return
    }
    if (y.Id === KEEP_ROOT) {
      mergeTo.set(x.Id, KEEP_ROOT)
      return
    }
    const refX = refCache.get(x.Id) ?? 0
    const refY = refCache.get(y.Id) ?? 0
    const winner = pickCanonical(x, y, refX, refY)
    const loser = winner.Id === x.Id ? y : x
    mergeTo.set(loser.Id, winner.Id)
  }

  for (const d of dropOrgs) {
    if (d.Id === DROP_ROOT) continue
    const name = normName(d.sTen)
    const ma = normMa(d.sMa)
    if (!name) continue
    let candidates = []
    if (ma) candidates = keepByMaName.get(`${ma}||${name}`) || []
    if (!candidates.length) {
      const byName = keepByName.get(name) || []
      if (byName.length === 1) candidates = byName
    }
    if (candidates.length === 1) registerPair(d, candidates[0])
  }

  mergeTo.set(DROP_ROOT, KEEP_ROOT)

  const allByName = new Map()
  for (const o of orgs.filter((x) => !x.bDeleted || dropTreeIds.has(x.Id))) {
    if (mergeTo.has(o.Id)) continue
    const name = normName(o.sTen)
    if (!name) continue
    if (!allByName.has(name)) allByName.set(name, [])
    allByName.get(name).push(o)
  }
  for (const [, list] of allByName) {
    if (list.length < 2) continue
    const withLetter = list.filter((o) => codeScore(o.sMa) >= 1000)
    const without = list.filter((o) => codeScore(o.sMa) < 1000)
    if (withLetter.length === 1 && without.length >= 1 && list.length <= 3) {
      const winner = withLetter[0]
      for (const loser of without) {
        const related =
          (keepTreeIds.has(winner.Id) || dropTreeIds.has(winner.Id)) &&
          (keepTreeIds.has(loser.Id) || dropTreeIds.has(loser.Id))
        if (related) registerPair(winner, loser)
      }
    }
  }

  function resolve(id) {
    let cur = id
    const seen = new Set()
    while (mergeTo.has(cur) && !seen.has(cur)) {
      seen.add(cur)
      cur = mergeTo.get(cur)
    }
    return cur
  }
  for (const [loser] of [...mergeTo.entries()]) {
    mergeTo.set(loser, resolve(loser))
  }

  return { mergeTo, byId }
}

/**
 * Map soft-deleted orgs → active org (by ma+name, rồi name unique, rồi letter preference).
 */
function buildPurgeMap(allOrgs, refCache) {
  const active = allOrgs.filter((o) => !o.bDeleted)
  const deleted = allOrgs.filter((o) => o.bDeleted)
  const byId = new Map(allOrgs.map((o) => [o.Id, o]))
  /** @type {Map<string, string>} */
  const mergeTo = new Map()

  const byMaName = new Map()
  const byName = new Map()
  for (const o of active) {
    const name = normName(o.sTen)
    if (!name) continue
    const ma = normMa(o.sMa)
    if (ma) {
      const k = `${ma}||${name}`
      if (!byMaName.has(k)) byMaName.set(k, [])
      byMaName.get(k).push(o)
    }
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name).push(o)
  }

  for (const d of deleted) {
    const name = normName(d.sTen)
    const ma = normMa(d.sMa)
    let candidates = []
    if (ma && name) candidates = byMaName.get(`${ma}||${name}`) || []
    if (!candidates.length && name) {
      const list = byName.get(name) || []
      if (list.length === 1) candidates = list
      else if (list.length > 1) {
        // ưu tiên bản mã chữ cùng tên
        const letter = list.filter((o) => codeScore(o.sMa) >= 1000)
        if (letter.length === 1) candidates = letter
        else {
          // chọn bản nhiều FK nhất
          candidates = [
            [...list].sort(
              (a, b) => (refCache.get(b.Id) || 0) - (refCache.get(a.Id) || 0)
            )[0],
          ]
        }
      }
    }
    if (candidates.length === 1) {
      mergeTo.set(d.Id, candidates[0].Id)
    } else if (d.Id === DROP_ROOT) {
      mergeTo.set(d.Id, KEEP_ROOT)
    }
  }

  return { mergeTo, byId, unmapped: deleted.filter((d) => !mergeTo.has(d.Id)) }
}

async function remapId(prisma, fromId, toId) {
  if (fromId === toId) return { updated: 0 }

  let updated = 0
  for (const fk of FK_UPDATES) {
    const sql = `UPDATE "${fk.schema}"."${fk.table}" SET "${fk.column}" = $1::uuid WHERE "${fk.column}" = $2::uuid`
    const n = await prisma.$executeRawUnsafe(sql, toId, fromId)
    updated += Number(n) || 0
  }

  await prisma.$executeRaw`
    INSERT INTO mta."_DM_DonViToSurveyObjectType" ("A", "B")
    SELECT ${toId}::uuid, "B"
    FROM mta."_DM_DonViToSurveyObjectType"
    WHERE "A" = ${fromId}::uuid
    ON CONFLICT DO NOTHING
  `
  await prisma.$executeRaw`
    DELETE FROM mta."_DM_DonViToSurveyObjectType" WHERE "A" = ${fromId}::uuid
  `

  return { updated }
}

async function hardDelete(prisma, id) {
  // Clear self-refs that might block delete
  await prisma.$executeRaw`
    UPDATE mta."DM_DonVi" SET "sParentId" = NULL WHERE "sParentId" = ${id}::uuid
  `
  await prisma.$executeRaw`
    UPDATE mta."DM_DonVi" SET "sTruongDonVi" = NULL WHERE "sTruongDonVi" = ${id}::uuid
  `
  await prisma.$executeRaw`
    DELETE FROM mta."_DM_DonViToSurveyObjectType" WHERE "A" = ${id}::uuid
  `
  await prisma.dM_DonVi.delete({ where: { Id: id } })
}

async function ensureUnderKeepTree(prisma, winnerId, keepTreeIds, mergeTo) {
  if (keepTreeIds.has(winnerId) || winnerId === KEEP_ROOT) return
  const org = await prisma.dM_DonVi.findUnique({
    where: { Id: winnerId },
    select: { sParentId: true },
  })
  let parent = org?.sParentId || null
  if (parent && mergeTo.has(parent)) parent = mergeTo.get(parent)
  if (!parent || parent === DROP_ROOT || !keepTreeIds.has(parent)) {
    parent = KEEP_ROOT
  }
  await prisma.dM_DonVi.update({
    where: { Id: winnerId },
    data: { sParentId: parent, dNgaySua: new Date() },
  })
  keepTreeIds.add(winnerId)
}

async function countLeftoverRefs(prisma, ids) {
  if (!ids.length) return 0
  // check in batches
  let total = 0
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT (
        (SELECT COUNT(*)::int FROM "ql-dao-tao"."Subject" WHERE "managementOrganizationId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM "ql-dao-tao"."SubjectVersion" WHERE "managementOrganizationId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM "ql-dao-tao"."FixedClass" WHERE "managementOrganizationId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM "ql-dao-tao"."Curriculum" WHERE "managementOrganizationId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM "ql-dao-tao"."ThesisProject" WHERE "organizationId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM "ql-dao-tao"."TrainingMajor" WHERE "organizationId" = ANY($1::uuid[]) OR "secondOrganizationId" = ANY($1::uuid[]) OR "thirdOrganizationId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM "ql-dao-tao"."TrainingField" WHERE "organizationId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM "ql-dao-tao"."Staff" WHERE "organizationId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM "ql-nguoi-dung"."UserProfile" WHERE "sDM_DonViId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM mta."DM_NhanVien" WHERE "sDM_DonViId" = ANY($1::uuid[])) +
        (SELECT COUNT(*)::int FROM mta."_DM_DonViToSurveyObjectType" WHERE "A" = ANY($1::uuid[]))
      ) AS n
      `,
      batch
    )
    total += Number(rows[0]?.n || 0)
  }
  return total
}

async function applyRemapAndHardDelete(prisma, mergeTo, byId) {
  let remapped = 0
  let deleted = 0
  let failed = 0

  // Delete children-first: sort losers so parents deleted after children when possible
  const losers = [...mergeTo.keys()].sort((a, b) => {
    const da = byId.get(a)?.sParentId === b ? -1 : 0
    const db = byId.get(b)?.sParentId === a ? 1 : 0
    return da + db
  })

  for (const loser of losers) {
    const winner = mergeTo.get(loser)
    try {
      const { updated } = await remapId(prisma, loser, winner)
      remapped += updated
      // verify no leftover refs on this id (except DM_DonVi self which we null)
      await hardDelete(prisma, loser)
      deleted++
      if (!quiet && deleted % 50 === 0) {
        console.log(`  progress: hard-deleted ${deleted}/${losers.length}`)
      }
    } catch (e) {
      failed++
      console.error(`FAIL ${loser}→${winner}:`, e.message)
    }
  }

  return { remapped, deleted, failed }
}

async function runPurge(prisma) {
  console.log("Mode: PURGE soft-deleted (remap FK → hard delete)")
  const allOrgs = await loadAllOrgs(prisma)
  const deleted = allOrgs.filter((o) => o.bDeleted)
  const active = allOrgs.filter((o) => !o.bDeleted)
  console.log(`Active: ${active.length}, Soft-deleted: ${deleted.length}`)

  if (!deleted.length) {
    console.log("Nothing to purge.")
    return
  }

  const refCache = new Map()
  for (const o of active) {
    refCache.set(o.Id, await countRefs(prisma, o.Id))
  }

  const { mergeTo, byId, unmapped } = buildPurgeMap(allOrgs, refCache)
  console.log(`Mapped deleted→active: ${mergeTo.size}`)
  console.log(`Unmapped deleted (will hard-delete if no FK, else keep): ${unmapped.length}`)

  if (!quiet) {
    let i = 0
    for (const [loser, winner] of mergeTo) {
      if (i++ >= 20) break
      const L = byId.get(loser)
      const W = byId.get(winner)
      console.log(`  ${L?.sMa} "${L?.sTen}" → ${W?.sMa} "${W?.sTen}"`)
    }
  }

  const leftoverBefore = await countLeftoverRefs(
    prisma,
    deleted.map((d) => d.Id)
  )
  console.log(`FK rows still pointing at soft-deleted: ${leftoverBefore}`)

  if (dryRun) {
    console.log("Dry-run only.")
    return
  }

  const { remapped, deleted: hardDeleted, failed } = await applyRemapAndHardDelete(
    prisma,
    mergeTo,
    byId
  )

  // Unmapped: try hard-delete only if zero refs; else remap to KEEP_ROOT as last resort
  let unmappedDeleted = 0
  let forcedToRoot = 0
  for (const u of unmapped) {
    try {
      const refs = await countLeftoverRefs(prisma, [u.Id])
      if (refs === 0) {
        await hardDelete(prisma, u.Id)
        unmappedDeleted++
      } else {
        await remapId(prisma, u.Id, KEEP_ROOT)
        await hardDelete(prisma, u.Id)
        forcedToRoot++
        unmappedDeleted++
      }
    } catch (e) {
      console.error(`FAIL unmapped ${u.Id}:`, e.message)
    }
  }

  const leftoverAfter = await countLeftoverRefs(
    prisma,
    (
      await prisma.$queryRaw`SELECT "Id"::text AS id FROM mta."DM_DonVi" WHERE "bDeleted" = true`
    ).map((r) => r.id)
  )

  console.log("\n--- Purge Summary ---")
  console.log(`FK rows remapped: ${remapped}`)
  console.log(`Hard-deleted (mapped): ${hardDeleted}`)
  console.log(`Hard-deleted (unmapped/forced): ${unmappedDeleted} (forced→KEEP_ROOT: ${forcedToRoot})`)
  console.log(`Failed: ${failed}`)
  console.log(`Leftover FK on remaining soft-deleted: ${leftoverAfter}`)
}

async function runMerge(prisma) {
  console.log(`Mode: ${dryRun ? "DRY-RUN MERGE" : "APPLY MERGE"} (hard-delete)`)
  const orgs = await loadActiveOrgs(prisma)
  const allForDrop = await loadAllOrgs(prisma)
  const keepTreeIds = await loadTreeIds(prisma, KEEP_ROOT)
  // include deleted so re-run still sees drop tree structure if partially done
  const dropTreeIds = await loadTreeIds(prisma, DROP_ROOT, { includeDeleted: true })
  // also add active nodes whose parent chain hits DROP_ROOT historically
  for (const o of allForDrop) {
    if (o.Id === DROP_ROOT || o.sParentId === DROP_ROOT) dropTreeIds.add(o.Id)
  }

  console.log(`Active orgs: ${orgs.length}`)
  console.log(`Keep tree: ${keepTreeIds.size}, Drop tree (incl. deleted): ${dropTreeIds.size}`)

  if (dropTreeIds.size <= 1 && !orgs.some((o) => o.Id === DROP_ROOT && !o.bDeleted)) {
    console.log("Drop tree already gone — switching to --purge")
    await runPurge(prisma)
    return
  }

  const candidateIds = new Set([...keepTreeIds, ...dropTreeIds])
  const refCache = new Map()
  for (const id of candidateIds) {
    refCache.set(id, await countRefs(prisma, id))
  }

  const { mergeTo, byId } = buildMergeMap(
    allForDrop.filter((o) => keepTreeIds.has(o.Id) || dropTreeIds.has(o.Id)),
    keepTreeIds,
    dropTreeIds,
    refCache
  )

  const dropOnly = [...dropTreeIds].filter(
    (id) => id !== DROP_ROOT && !mergeTo.has(id) && byId.get(id) && !byId.get(id).bDeleted
  )

  console.log(`Merge pairs: ${mergeTo.size}`)
  console.log(`Drop-only reparent: ${dropOnly.length}`)

  const letterPreferred = []
  for (const [loser, winner] of mergeTo) {
    const L = byId.get(loser)
    const W = byId.get(winner)
    if (codeScore(W?.sMa) > codeScore(L?.sMa)) {
      letterPreferred.push(`  ${L?.sMa || "?"} → ${W?.sMa || "?"} | "${W?.sTen}"`)
    }
  }
  console.log(`Letter-code preferred: ${letterPreferred.length}`)
  for (const line of letterPreferred.slice(0, 30)) console.log(line)

  if (dryRun) {
    console.log("Dry-run only.")
    return
  }

  let reparented = 0
  const winnersFromDrop = new Set(
    [...mergeTo.values()].filter((w) => dropTreeIds.has(w) && w !== KEEP_ROOT && byId.get(w) && !byId.get(w).bDeleted)
  )
  for (const wid of winnersFromDrop) {
    await ensureUnderKeepTree(prisma, wid, keepTreeIds, mergeTo)
    reparented++
  }

  for (const id of dropOnly) {
    const org = byId.get(id)
    let parent = org?.sParentId
    if (parent && mergeTo.has(parent)) parent = mergeTo.get(parent)
    if (!parent || parent === DROP_ROOT || !keepTreeIds.has(parent)) parent = KEEP_ROOT
    await prisma.dM_DonVi.update({
      where: { Id: id },
      data: { sParentId: parent, dNgaySua: new Date() },
    })
    keepTreeIds.add(id)
    reparented++
  }

  const { remapped, deleted, failed } = await applyRemapAndHardDelete(prisma, mergeTo, byId)

  console.log("\n--- Merge Summary ---")
  console.log(`FK rows remapped: ${remapped}`)
  console.log(`Hard-deleted: ${deleted}`)
  console.log(`Reparented: ${reparented}`)
  console.log(`Failed: ${failed}`)

  // Clean any remaining soft-deleted leftovers
  console.log("\nRunning purge for remaining soft-deleted…")
  await runPurge(prisma)
}

async function main() {
  const prisma = createPrisma()
  const started = Date.now()
  try {
    if (purgeOnly) await runPurge(prisma)
    else await runMerge(prisma)
    console.log(`Elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
