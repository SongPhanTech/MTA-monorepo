/**
 * Đồng bộ StudentSubjectScore từ đăng ký học (ClassRegisterLogs).
 *
 * Hai chế độ:
 * 1) repair (mặc định) — trên 1 DB: tạo SSS còn thiếu từ ClassRegisterLogs
 * 2) copy — copy SSS từ SOURCE → TARGET (chỉ bản ghi target còn thiếu)
 *
 * Usage (DB nội bộ — tạo SSS từ ClassRegisterLogs):
 *   cd packages/database
 *   DATABASE_URL="postgres://admin:123456654321@192.168.100.132:5432/mta" \
 *     bun scripts/sync-student-subject-score-from-registration.mjs --dry-run
 *
 *   # Hoặc từ root repo:
 *   ./scripts/sync-student-subject-score.sh --dry-run
 *   ./scripts/sync-student-subject-score.sh --session=cmse0eu6t0001sh3d0h9yfidl
 * Options:
 *   --dry-run              Chỉ thống kê / in mẫu, không ghi DB
 *   --mode=repair|copy     Mặc định repair (repair = 1 DB, tạo SSS từ ClassRegisterLogs)
 *   --status=PENDING,SUCCESS|SUCCESS   Trạng thái log lấy (mặc định PENDING,SUCCESS)
 *   --batch=500            Kích thước batch insert (mặc định 500)
 *   --session=<id>         Chỉ xử lý 1 ClassRegisterSession
 *   --limit=<n>            Giới hạn số bản ghi tạo (debug)
 */
import { PrismaClient } from "../generated/prisma-client/index.js"

const dryRun = process.argv.includes("--dry-run")
const modeArg = process.argv.find((a) => a.startsWith("--mode="))
const mode = modeArg?.split("=")[1] || "repair"
const batchArg = process.argv.find((a) => a.startsWith("--batch="))
const BATCH = Number(batchArg?.split("=")[1] || 500)
const sessionArg = process.argv.find((a) => a.startsWith("--session="))
const SESSION_ID = sessionArg?.split("=")[1] || process.env.SESSION_ID || null
const limitArg = process.argv.find((a) => a.startsWith("--limit="))
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : null
const statusArg = process.argv.find((a) => a.startsWith("--status="))
const LOG_STATUSES = (statusArg?.split("=")[1] || "PENDING,SUCCESS")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

function withLimit(url) {
  return url.includes("?") ? `${url}&connection_limit=1` : `${url}?connection_limit=1`
}

function createPrisma(url) {
  return new PrismaClient({
    datasources: { db: { url: withLimit(url) } },
  })
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function safeHost(url) {
  try {
    const u = new URL(url)
    return `${u.hostname}:${u.port || "5432"}/${u.pathname.replace(/^\//, "")}`
  } catch {
    return "(unparseable)"
  }
}

function pickIds(r) {
  return {
    studentId: r.studentId,
    subjectClassId: r.subjectClassId,
    subjectVersionId: r.subjectVersionId,
  }
}

async function loadIdSet(prisma, model, ids) {
  const set = new Set()
  if (!ids.length) return set
  for (const batch of chunk(ids, 1000)) {
    let rows
    if (model === "Student") {
      rows = await prisma.student.findMany({
        where: { id: { in: batch }, deletedAt: null },
        select: { id: true },
      })
    } else if (model === "SubjectClass") {
      rows = await prisma.subjectClass.findMany({
        where: { id: { in: batch }, deletedAt: null },
        select: { id: true },
      })
    } else {
      rows = await prisma.subjectVersion.findMany({
        where: { id: { in: batch }, deletedAt: null },
        select: { id: true },
      })
    }
    for (const r of rows) set.add(r.id)
  }
  return set
}

/** ClassRegisterLogs chưa có StudentSubjectScore tương ứng */
async function findMissingFromLogs(prisma, sessionId, statuses) {
  const statusList = statuses.length ? statuses : ["PENDING", "SUCCESS"]

  if (sessionId) {
    return prisma.$queryRaw`
      SELECT
        l.id AS "logId",
        l."studentId",
        l."subjectClassId",
        sc."subjectId" AS "subjectVersionId",
        crs."semesterId" AS "semesterId",
        l.status::text AS "logStatus",
        l."classRegisterSessionId",
        l."createdAt" AS "registeredAt"
      FROM "ql-dao-tao"."ClassRegisterLogs" l
      INNER JOIN "ql-dao-tao"."SubjectClass" sc
        ON sc.id = l."subjectClassId"
        AND sc."deletedAt" IS NULL
      INNER JOIN "ql-dao-tao"."ClassRegisterSession" crs
        ON crs.id = l."classRegisterSessionId"
        AND crs."deletedAt" IS NULL
      INNER JOIN "ql-dao-tao"."Student" st
        ON st.id = l."studentId"
        AND st."deletedAt" IS NULL
      LEFT JOIN "ql-dao-tao"."StudentSubjectScore" sss
        ON sss."studentId" = l."studentId"
        AND sss."subjectClassId" = l."subjectClassId"
        AND sss."deletedAt" IS NULL
      WHERE l."deletedAt" IS NULL
        AND l.active = true
        AND l.status::text = ANY(${statusList})
        AND sss.id IS NULL
        AND l."classRegisterSessionId" = ${sessionId}
      ORDER BY l."createdAt" ASC
    `
  }

  return prisma.$queryRaw`
    SELECT
      l.id AS "logId",
      l."studentId",
      l."subjectClassId",
      sc."subjectId" AS "subjectVersionId",
      crs."semesterId" AS "semesterId",
      l.status::text AS "logStatus",
      l."classRegisterSessionId",
      l."createdAt" AS "registeredAt"
    FROM "ql-dao-tao"."ClassRegisterLogs" l
    INNER JOIN "ql-dao-tao"."SubjectClass" sc
      ON sc.id = l."subjectClassId"
      AND sc."deletedAt" IS NULL
    INNER JOIN "ql-dao-tao"."ClassRegisterSession" crs
      ON crs.id = l."classRegisterSessionId"
      AND crs."deletedAt" IS NULL
    INNER JOIN "ql-dao-tao"."Student" st
      ON st.id = l."studentId"
      AND st."deletedAt" IS NULL
    LEFT JOIN "ql-dao-tao"."StudentSubjectScore" sss
      ON sss."studentId" = l."studentId"
      AND sss."subjectClassId" = l."subjectClassId"
      AND sss."deletedAt" IS NULL
    WHERE l."deletedAt" IS NULL
      AND l.active = true
      AND l.status::text = ANY(${statusList})
      AND sss.id IS NULL
    ORDER BY l."createdAt" ASC
  `
}

async function findSourceScoresForRegistration(prisma, sessionId) {
  if (sessionId) {
    return prisma.$queryRaw`
      SELECT DISTINCT ON (sss."studentId", sss."subjectClassId")
        sss.id,
        sss.code,
        sss.active,
        sss.description,
        sss."createdBy",
        sss."subjectClassId",
        sss."subjectVersionId",
        sss."studentId",
        sss."semesterId",
        sss."attendanceScore",
        sss."midtermScore",
        sss."examScore",
        sss."finalScore",
        sss."manualFinalScore",
        sss."examPostponed",
        sss."examPostponedReason",
        sss.exempted,
        sss.withdrew,
        sss."examBanned",
        sss."examBannedReason",
        sss.suspended,
        sss."suspendedReason",
        sss.repeated,
        sss."repeatedReason",
        sss."isImproving"
      FROM "ql-dao-tao"."StudentSubjectScore" sss
      INNER JOIN "ql-dao-tao"."ClassRegisterLogs" l
        ON l."studentId" = sss."studentId"
        AND l."subjectClassId" = sss."subjectClassId"
        AND l."deletedAt" IS NULL
        AND l.active = true
        AND l.status::text IN ('PENDING', 'SUCCESS')
      WHERE sss."deletedAt" IS NULL
        AND l."classRegisterSessionId" = ${sessionId}
      ORDER BY sss."studentId", sss."subjectClassId", sss."createdAt" DESC
    `
  }

  return prisma.$queryRaw`
    SELECT DISTINCT ON (sss."studentId", sss."subjectClassId")
      sss.id,
      sss.code,
      sss.active,
      sss.description,
      sss."createdBy",
      sss."subjectClassId",
      sss."subjectVersionId",
      sss."studentId",
      sss."semesterId",
      sss."attendanceScore",
      sss."midtermScore",
      sss."examScore",
      sss."finalScore",
      sss."manualFinalScore",
      sss."examPostponed",
      sss."examPostponedReason",
      sss.exempted,
      sss.withdrew,
      sss."examBanned",
      sss."examBannedReason",
      sss.suspended,
      sss."suspendedReason",
      sss.repeated,
      sss."repeatedReason",
      sss."isImproving"
    FROM "ql-dao-tao"."StudentSubjectScore" sss
    INNER JOIN "ql-dao-tao"."ClassRegisterLogs" l
      ON l."studentId" = sss."studentId"
      AND l."subjectClassId" = sss."subjectClassId"
      AND l."deletedAt" IS NULL
      AND l.active = true
      AND l.status::text IN ('PENDING', 'SUCCESS')
    WHERE sss."deletedAt" IS NULL
    ORDER BY sss."studentId", sss."subjectClassId", sss."createdAt" DESC
  `
}

async function repairMode() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("Missing DATABASE_URL")
    console.error(
      'Ví dụ máy nội bộ:\n  DATABASE_URL="postgres://admin:123456654321@192.168.100.132:5432/mta"'
    )
    process.exit(1)
  }

  const prisma = createPrisma(url)
  console.log(`[sync-sss] mode=repair dryRun=${dryRun} batch=${BATCH}`)
  console.log(`[sync-sss] DATABASE_URL host=${safeHost(url)}`)
  console.log(`[sync-sss] log statuses=${LOG_STATUSES.join(",")}`)
  if (SESSION_ID) console.log(`[sync-sss] filter session=${SESSION_ID}`)

  try {
    const missing = await findMissingFromLogs(prisma, SESSION_ID, LOG_STATUSES)
    const toCreate = LIMIT != null ? missing.slice(0, LIMIT) : missing

    console.log(`[sync-sss] ClassRegisterLogs thiếu SSS: ${missing.length}`)
    console.log(`[sync-sss] Sẽ tạo: ${toCreate.length}`)

    if (toCreate.length > 0) {
      console.log("[sync-sss] Sample (max 10):")
      for (const row of toCreate.slice(0, 10)) {
        console.log(
          `  student=${row.studentId} class=${row.subjectClassId} sv=${row.subjectVersionId} status=${row.logStatus}`
        )
      }
    }

    if (dryRun || toCreate.length === 0) {
      console.log(dryRun ? "[sync-sss] DRY-RUN — không ghi DB" : "[sync-sss] Không có gì để tạo")
      return
    }

    let created = 0
    let skipped = 0
    const touchedClasses = new Set()
    for (const batch of chunk(toCreate, BATCH)) {
      const result = await prisma.studentSubjectScore.createMany({
        data: batch.map((r) => ({
          studentId: r.studentId,
          subjectClassId: r.subjectClassId,
          subjectVersionId: r.subjectVersionId,
          semesterId: r.semesterId,
        })),
        skipDuplicates: true,
      })
      created += result.count
      skipped += batch.length - result.count
      for (const r of batch) touchedClasses.add(r.subjectClassId)
      console.log(
        `[sync-sss] batch +${result.count} (skipDup=${batch.length - result.count}) totalCreated=${created}`
      )
    }

    for (const subjectClassId of touchedClasses) {
      const actual = await prisma.studentSubjectScore.count({
        where: { subjectClassId, deletedAt: null },
      })
      await prisma.subjectClass.update({
        where: { id: subjectClassId },
        data: {
          enrolledCount: actual,
          version: { increment: 1 },
        },
      })
    }
    console.log(`[sync-sss] synced enrolledCount for ${touchedClasses.size} lớp`)

    console.log(`[sync-sss] DONE created=${created} skippedDuplicates=${skipped}`)
  } finally {
    await prisma.$disconnect()
  }
}

async function copyMode() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL
  const targetUrl = process.env.TARGET_DATABASE_URL
  if (!sourceUrl || !targetUrl) {
    console.error("copy mode cần SOURCE_DATABASE_URL (hoặc DATABASE_URL) và TARGET_DATABASE_URL")
    console.error(`Ví dụ:
  SOURCE_DATABASE_URL="postgres://admin:123456654321@192.168.100.132:5432/mta" \\
  TARGET_DATABASE_URL="postgres://admin:123456654321@103.172.78.68:5432/mta_internet" \\
    bun scripts/sync-student-subject-score-from-registration.mjs --mode=copy`)
    process.exit(1)
  }

  const source = createPrisma(sourceUrl)
  const target = createPrisma(targetUrl)
  console.log(`[sync-sss] mode=copy dryRun=${dryRun} batch=${BATCH}`)
  console.log(`[sync-sss] SOURCE=${safeHost(sourceUrl)}`)
  console.log(`[sync-sss] TARGET=${safeHost(targetUrl)}`)
  if (SESSION_ID) console.log(`[sync-sss] filter session=${SESSION_ID}`)

  try {
    const sourceRows = await findSourceScoresForRegistration(source, SESSION_ID)
    console.log(`[sync-sss] SOURCE SSS gắn đăng ký: ${sourceRows.length}`)

    const existingOnTarget = new Set()
    const pairs = sourceRows.map((r) => `${r.studentId}::${r.subjectClassId}`)
    for (const batch of chunk(pairs, 1000)) {
      const studentIds = [...new Set(batch.map((p) => p.split("::")[0]))]
      const classIds = [...new Set(batch.map((p) => p.split("::")[1]))]
      const existing = await target.studentSubjectScore.findMany({
        where: {
          deletedAt: null,
          studentId: { in: studentIds },
          subjectClassId: { in: classIds },
        },
        select: { studentId: true, subjectClassId: true },
      })
      for (const e of existing) {
        existingOnTarget.add(`${e.studentId}::${e.subjectClassId}`)
      }
    }

    const candidates = sourceRows.filter(
      (r) => !existingOnTarget.has(`${r.studentId}::${r.subjectClassId}`)
    )
    console.log(`[sync-sss] TARGET còn thiếu: ${candidates.length}`)

    const studentIds = [...new Set(candidates.map((r) => r.studentId))]
    const classIds = [...new Set(candidates.map((r) => r.subjectClassId).filter(Boolean))]
    const versionIds = [...new Set(candidates.map((r) => r.subjectVersionId))]

    const [students, classes, versions] = await Promise.all([
      loadIdSet(target, "Student", studentIds),
      loadIdSet(target, "SubjectClass", classIds),
      loadIdSet(target, "SubjectVersion", versionIds),
    ])

    const insertable = []
    const skippedFk = []
    for (const r of candidates) {
      if (!students.has(r.studentId)) {
        skippedFk.push({ reason: "missing_student", ...pickIds(r) })
        continue
      }
      if (r.subjectClassId && !classes.has(r.subjectClassId)) {
        skippedFk.push({ reason: "missing_subjectClass", ...pickIds(r) })
        continue
      }
      if (!versions.has(r.subjectVersionId)) {
        skippedFk.push({ reason: "missing_subjectVersion", ...pickIds(r) })
        continue
      }
      insertable.push(r)
    }

    const toInsert = LIMIT != null ? insertable.slice(0, LIMIT) : insertable
    console.log(`[sync-sss] Insertable (FK ok): ${insertable.length}`)
    console.log(`[sync-sss] Skip thiếu FK: ${skippedFk.length}`)
    console.log(`[sync-sss] Sẽ copy: ${toInsert.length}`)

    if (skippedFk.length > 0) {
      const byReason = skippedFk.reduce((acc, s) => {
        acc[s.reason] = (acc[s.reason] || 0) + 1
        return acc
      }, {})
      console.log("[sync-sss] Skip FK breakdown:", byReason)
      console.log("[sync-sss] Skip FK sample (max 5):", skippedFk.slice(0, 5))
    }

    if (toInsert.length > 0) {
      console.log("[sync-sss] Sample copy (max 5):")
      for (const r of toInsert.slice(0, 5)) {
        console.log(`  ${r.studentId} / ${r.subjectClassId} finalScore=${r.finalScore ?? "null"}`)
      }
    }

    if (dryRun || toInsert.length === 0) {
      console.log(dryRun ? "[sync-sss] DRY-RUN — không ghi DB" : "[sync-sss] Không có gì để copy")
      return
    }

    let created = 0
    for (const batch of chunk(toInsert, BATCH)) {
      const existingIds = new Set(
        (
          await target.studentSubjectScore.findMany({
            where: { id: { in: batch.map((r) => r.id) } },
            select: { id: true },
          })
        ).map((r) => r.id)
      )

      const data = batch.map((r) => {
        const row = {
          studentId: r.studentId,
          subjectClassId: r.subjectClassId,
          subjectVersionId: r.subjectVersionId,
          semesterId: r.semesterId,
          code: r.code,
          active: r.active ?? true,
          description: r.description,
          createdBy: r.createdBy,
          attendanceScore: r.attendanceScore,
          midtermScore: r.midtermScore,
          examScore: r.examScore,
          finalScore: r.finalScore,
          manualFinalScore: r.manualFinalScore,
          examPostponed: r.examPostponed ?? false,
          examPostponedReason: r.examPostponedReason,
          exempted: r.exempted ?? false,
          withdrew: r.withdrew ?? false,
          examBanned: r.examBanned ?? false,
          examBannedReason: r.examBannedReason,
          suspended: r.suspended ?? false,
          suspendedReason: r.suspendedReason,
          repeated: r.repeated ?? false,
          repeatedReason: r.repeatedReason,
          isImproving: r.isImproving ?? false,
        }
        if (!existingIds.has(r.id)) row.id = r.id
        return row
      })

      try {
        const result = await target.studentSubjectScore.createMany({
          data,
          skipDuplicates: true,
        })
        created += result.count
        console.log(`[sync-sss] batch +${result.count} totalCreated=${created}`)
      } catch (err) {
        console.warn(`[sync-sss] batch createMany lỗi, retry từng dòng:`, err?.message || err)
        for (const row of data) {
          try {
            await target.studentSubjectScore.create({ data: row })
            created += 1
          } catch {
            try {
              const { code: _c, id: _i, ...rest } = row
              await target.studentSubjectScore.create({ data: rest })
              created += 1
            } catch (e2) {
              console.warn(
                `[sync-sss] skip student=${row.studentId} class=${row.subjectClassId}: ${e2?.message || e2}`
              )
            }
          }
        }
        console.log(`[sync-sss] after retry totalCreated=${created}`)
      }
    }

    console.log(`[sync-sss] DONE created=${created}`)
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()])
  }
}

async function main() {
  if (mode === "copy") await copyMode()
  else if (mode === "repair") await repairMode()
  else {
    console.error(`Unknown --mode=${mode}. Dùng repair|copy`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("[sync-sss] FATAL", err)
  process.exit(1)
})
