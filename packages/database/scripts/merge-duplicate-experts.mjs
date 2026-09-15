/**
 * Gộp các bản ghi Expert trùng lặp (cùng họ tên) thành một Expert identity,
 * bằng cách tạo thêm ExpertProfileVersion dưới Expert giữ lại — không tạo Expert mới.
 *
 * Tiêu chí trùng: LOWER(TRIM(name)) từ currentVersion (bỏ qua tên rỗng).
 * Expert giữ lại (canonical): ưu tiên có lecturerId, sau đó createdAt sớm nhất.
 *
 * Idempotent: chạy lại được (bỏ qua version/expert đã merge).
 *
 * Usage:
 *   cd packages/database
 *   DATABASE_URL="postgres://..." bun scripts/merge-duplicate-experts.mjs --dry-run --quiet
 *   DATABASE_URL="postgres://..." bun scripts/merge-duplicate-experts.mjs
 *
 * Options:
 *   --dry-run     Chỉ in thống kê, không ghi DB
 *   --quiet       Chỉ in tổng kết / tiến độ gọn
 *   --limit=<n>   Giới hạn số nhóm trùng xử lý (debug)
 *   --group=<name> Chỉ xử lý một nhóm theo tên (so khớp LOWER TRIM)
 */
import { PrismaClient } from "../generated/prisma-client/index.js"

const dryRun = process.argv.includes("--dry-run")
const quiet = process.argv.includes("--quiet")
const limitArg = process.argv.find((a) => a.startsWith("--limit="))
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : null
const groupArg = process.argv.find((a) => a.startsWith("--group="))
const ONLY_GROUP = groupArg?.split("=")[1]?.trim().toLowerCase() || null

/** Prisma interactive tx timeout (ms) — remote DB + nhiều FK update dễ vượt 5s mặc định */
const TX_TIMEOUT_MS = 180_000
const TX_MAX_WAIT_MS = 30_000

function normalizeName(name) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ")
}

function mergedVersionId(expertId) {
  return `mrg_${expertId}`
}

function createPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is required")
  const withLimit = url.includes("?") ? `${url}&connection_limit=1` : `${url}?connection_limit=1`
  return new PrismaClient({ datasources: { db: { url: withLimit } } })
}

/** @typedef {{ id: string, lecturerId: string | null, currentVersionId: string | null, createdAt: Date, currentVersion: any }} ExpertRow */

async function loadExperts(prisma) {
  /** @type {ExpertRow[]} */
  const rows = await prisma.expert.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      lecturerId: true,
      currentVersionId: true,
      createdAt: true,
      currentVersion: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return rows.filter((r) => r.currentVersion?.name && normalizeName(r.currentVersion.name))
}

/** @param {ExpertRow[]} experts */
function buildDuplicateGroups(experts) {
  /** @type {Map<string, ExpertRow[]>} */
  const map = new Map()
  for (const e of experts) {
    const key = normalizeName(e.currentVersion.name)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  }
  return [...map.entries()]
    .filter(([, list]) => list.length > 1)
    .filter(([key]) => (ONLY_GROUP ? key === ONLY_GROUP : true))
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => {
        const aLect = a.lecturerId ? 0 : 1
        const bLect = b.lecturerId ? 0 : 1
        if (aLect !== bLect) return aLect - bLect
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
      return { key, canonical: sorted[0], duplicates: sorted.slice(1) }
    })
}

async function remapVersionId(prisma, oldVersionId, newVersionId) {
  if (oldVersionId === newVersionId) return

  await prisma.councilMember.updateMany({
    where: { expertProfileVersionId: oldVersionId },
    data: { expertProfileVersionId: newVersionId },
  })
  await prisma.thesisProject.updateMany({
    where: { supervisorVersionId: oldVersionId },
    data: { supervisorVersionId: newVersionId },
  })
  await prisma.thesisProject.updateMany({
    where: { coSupervisorVersionId: oldVersionId },
    data: { coSupervisorVersionId: newVersionId },
  })
  await prisma.thesisProject.updateMany({
    where: { thirdSupervisorVersionId: oldVersionId },
    data: { thirdSupervisorVersionId: newVersionId },
  })
  await prisma.studentResearchTopic.updateMany({
    where: { supervisorVersionId: oldVersionId },
    data: { supervisorVersionId: newVersionId },
  })
  await prisma.studentResearchTopic.updateMany({
    where: { coSupervisorVersionId: oldVersionId },
    data: { coSupervisorVersionId: newVersionId },
  })
  await prisma.studentResearchTopic.updateMany({
    where: { thirdSupervisorVersionId: oldVersionId },
    data: { thirdSupervisorVersionId: newVersionId },
  })
  await prisma.studentInternship.updateMany({
    where: { supervisorVersionId: oldVersionId },
    data: { supervisorVersionId: newVersionId },
  })
  await prisma.studentInternship.updateMany({
    where: { coSupervisorVersionId: oldVersionId },
    data: { coSupervisorVersionId: newVersionId },
  })
  await prisma.expert.updateMany({
    where: { currentVersionId: oldVersionId },
    data: { currentVersionId: newVersionId },
  })
}

async function mergeM2M(prisma, canonicalId, duplicateId) {
  await prisma.$executeRaw`
    INSERT INTO "ql-dao-tao"."_ExpertToTrainingMajor" ("A", "B")
    SELECT ${canonicalId}, "B"
    FROM "ql-dao-tao"."_ExpertToTrainingMajor"
    WHERE "A" = ${duplicateId}
    ON CONFLICT DO NOTHING
  `
  await prisma.$executeRaw`
    INSERT INTO "ql-dao-tao"."_ExpertToSubjectClass" ("A", "B")
    SELECT ${canonicalId}, "B"
    FROM "ql-dao-tao"."_ExpertToSubjectClass"
    WHERE "A" = ${duplicateId}
    ON CONFLICT DO NOTHING
  `
  await prisma.$executeRaw`
    DELETE FROM "ql-dao-tao"."_ExpertToTrainingMajor" WHERE "A" = ${duplicateId}
  `
  await prisma.$executeRaw`
    DELETE FROM "ql-dao-tao"."_ExpertToSubjectClass" WHERE "A" = ${duplicateId}
  `
}

/**
 * Merge một Expert trùng vào canonical (một transaction ngắn).
 * @param {import('../generated/prisma-client/index.js').PrismaClient} prisma
 * @param {ExpertRow} canonical
 * @param {ExpertRow} dup
 */
async function mergeOneDuplicate(prisma, canonical, dup) {
  const stats = { versionsCreated: 0, expertsRemoved: 0, councilExpertUpdates: 0 }

  const dupStillActive = await prisma.expert.findFirst({
    where: { id: dup.id, deletedAt: null },
    select: { id: true, lecturerId: true, currentVersionId: true },
  })
  if (!dupStillActive) {
    return { ...stats, skipped: true }
  }

  const dupVersions = await prisma.expertProfileVersion.findMany({
    where: { expertId: dup.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })

  if (!dupVersions.length) {
    await prisma.expert.update({
      where: { id: dup.id },
      data: { deletedAt: new Date(), lecturerId: null, currentVersionId: null, active: false },
    })
    return { ...stats, expertsRemoved: 1, skipped: true }
  }

  /** @type {Map<string, string>} */
  const versionIdMap = new Map()

  for (const v of dupVersions) {
    const newVersionId =
      v.id === dupStillActive.currentVersionId || v.id === `v_${dup.id}`
        ? mergedVersionId(dup.id)
        : `mrg_${v.id}`

    const existing = await prisma.expertProfileVersion.findUnique({ where: { id: newVersionId } })
    if (existing) {
      // Đã tạo từ lần chạy trước (tx abort giữa chừng) — chỉ remap FK
      if (existing.expertId !== canonical.id) {
        await prisma.expertProfileVersion.update({
          where: { id: newVersionId },
          data: { expertId: canonical.id, deletedAt: null, active: true },
        })
      }
      versionIdMap.set(v.id, newVersionId)
      continue
    }

    versionIdMap.set(v.id, newVersionId)
    await prisma.expertProfileVersion.create({
      data: {
        id: newVersionId,
        expertId: canonical.id,
        name: v.name,
        academicDegreeTypeId: v.academicDegreeTypeId,
        academicRankTypeId: v.academicRankTypeId,
        organization: v.organization,
        position: v.position,
        specialization: v.specialization,
        workplace: v.workplace,
        inAcademy: v.inAcademy,
        phone: v.phone,
        email: v.email,
        bankAccountNumber: v.bankAccountNumber,
        bankName: v.bankName,
        projectExpert: v.projectExpert,
        thesisExpert: v.thesisExpert,
        eligiblePresident: v.eligiblePresident,
        eligibleSecretary: v.eligibleSecretary,
        validFrom: v.validFrom || dup.createdAt,
        validTo: v.validTo,
        active: v.active,
        description: v.description,
        createdBy: v.createdBy,
        createdAt: v.createdAt || dup.createdAt,
      },
    })
    stats.versionsCreated++
  }

  for (const [oldVersionId, newVersionId] of versionIdMap) {
    await remapVersionId(prisma, oldVersionId, newVersionId)
  }

  const preferredVersionId =
    versionIdMap.get(dupStillActive.currentVersionId || "") ||
    versionIdMap.get(`v_${dup.id}`) ||
    [...versionIdMap.values()][0]

  const councilUpdates = await prisma.councilMember.updateMany({
    where: { expertId: dup.id },
    data: { expertId: canonical.id },
  })
  stats.councilExpertUpdates += councilUpdates.count

  if (dupStillActive.lecturerId && !canonical.lecturerId && preferredVersionId) {
    await prisma.expert.update({
      where: { id: dup.id },
      data: { lecturerId: null },
    })
    await prisma.expert.update({
      where: { id: canonical.id },
      data: { lecturerId: dupStillActive.lecturerId, currentVersionId: preferredVersionId },
    })
    canonical.lecturerId = dupStillActive.lecturerId
    canonical.currentVersionId = preferredVersionId
  }

  await mergeM2M(prisma, canonical.id, dup.id)

  await prisma.expert.update({
    where: { id: dup.id },
    data: {
      deletedAt: new Date(),
      lecturerId: null,
      currentVersionId: null,
      active: false,
    },
  })

  await prisma.expertProfileVersion.updateMany({
    where: { expertId: dup.id },
    data: { deletedAt: new Date(), active: false },
  })

  stats.expertsRemoved++
  return stats
}

async function main() {
  const prisma = createPrisma()
  const startedAt = new Date()

  try {
    const experts = await loadExperts(prisma)
    let groups = buildDuplicateGroups(experts)

    if (LIMIT != null && LIMIT > 0) {
      groups = groups.slice(0, LIMIT)
    }

    console.log(`Mode: ${dryRun ? "DRY-RUN" : "APPLY"}`)
    console.log(`Active experts: ${experts.length}`)
    console.log(`Duplicate groups: ${groups.length}`)
    console.log(`Experts to merge: ${groups.reduce((s, g) => s + g.duplicates.length, 0)}`)
    if (!dryRun) {
      console.log(`Tx timeout: ${TX_TIMEOUT_MS}ms (per duplicate)`)
    }

    if (!groups.length) {
      console.log("Nothing to merge.")
      return
    }

    const totals = {
      versionsCreated: 0,
      expertsRemoved: 0,
      councilExpertUpdates: 0,
      skipped: 0,
      failed: 0,
    }

    let groupIdx = 0
    for (const group of groups) {
      groupIdx++
      const label = group.canonical.currentVersion.name

      if (dryRun) {
        if (!quiet) {
          console.log(
            `\n[${group.key}] canonical=${group.canonical.id} (${group.canonical.lecturerId || "no-lecturer"}) <- ${group.duplicates.map((d) => d.id).join(", ")} | ${label}`
          )
        }
        totals.versionsCreated += group.duplicates.length
        totals.expertsRemoved += group.duplicates.length
        continue
      }

      if (!quiet) {
        console.log(
          `\n[${groupIdx}/${groups.length}] ${group.key} | canonical=${group.canonical.id} <- ${group.duplicates.length} dup(s)`
        )
      } else if (groupIdx % 25 === 0 || groupIdx === groups.length) {
        console.log(`Progress: ${groupIdx}/${groups.length} groups...`)
      }

      for (const dup of group.duplicates) {
        try {
          const s = await prisma.$transaction(
            (tx) => mergeOneDuplicate(tx, group.canonical, dup),
            { maxWait: TX_MAX_WAIT_MS, timeout: TX_TIMEOUT_MS }
          )
          totals.versionsCreated += s.versionsCreated
          totals.expertsRemoved += s.expertsRemoved
          totals.councilExpertUpdates += s.councilExpertUpdates
          if (s.skipped) totals.skipped++
          if (!quiet && !s.skipped) {
            console.log(`  ok ${dup.id} (+${s.versionsCreated} version)`)
          }
        } catch (err) {
          totals.failed++
          console.error(`  FAIL ${dup.id}: ${err?.message || err}`)
        }
      }
    }

    console.log("\n--- Summary ---")
    console.log(`Versions created: ${totals.versionsCreated}`)
    console.log(`Experts soft-deleted: ${totals.expertsRemoved}`)
    console.log(`CouncilMember expertId updates: ${totals.councilExpertUpdates}`)
    console.log(`Skipped (already done): ${totals.skipped}`)
    console.log(`Failed: ${totals.failed}`)
    console.log(`Elapsed: ${((Date.now() - startedAt.getTime()) / 1000).toFixed(1)}s`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
