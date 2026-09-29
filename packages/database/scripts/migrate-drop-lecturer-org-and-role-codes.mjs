/**
 * Migrate DB cho schema hiện tại (Lecturer/Student/Staff = BaseNoCode,
 * đơn vị GV chỉ còn ở UserProfile.sDM_DonViId).
 *
 * Trước khi DROP cột trên DB cũ:
 *  1) Lecturer.organizationId → UserProfile.sDM_DonViId
 *     - chỉ điền profile đang trống
 *     - bỏ qua organizationId không tồn tại trên mta.DM_DonVi
 *  2) Lecturer.code / Staff.code / Student.code → UserProfile.code
 *     - ưu tiên: Lecturer > Staff > Student
 *     - vừa GV vừa HV: dùng mã Lecturer (ghi đè nếu khác)
 *     - profile đã có mã (không phải case GV+HV): giữ nguyên
 *     - trùng unique UserProfile.code: skip
 *  3) Gắn FK UserProfile.sDM_DonViId → mta.DM_DonVi (nếu chưa có)
 *  4) DROP Lecturer.organizationId, DROP code trên Lecturer / Student / Staff
 *
 * Idempotent: cột/constraint đã mất thì bỏ qua.
 *
 * Usage (cwd: packages/database):
 *   bun scripts/migrate-drop-lecturer-org-and-role-codes.mjs
 *   bun scripts/migrate-drop-lecturer-org-and-role-codes.mjs --apply
 *
 * Mặc định dry-run. Đọc DATABASE_URL hoặc POSTGRES_URL từ .env / env.
 */
import { PrismaClient } from "../generated/prisma-client/index.js"

const APPLY = process.argv.includes("--apply")

function getUrl() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'Cần POSTGRES_URL hoặc DATABASE_URL, ví dụ:\n' +
        '  DATABASE_URL="postgres://..." bun scripts/migrate-drop-lecturer-org-and-role-codes.mjs --apply'
    )
  }
  return url
}

function createPrisma(url) {
  const withLimit = url.includes("?") ? `${url}&connection_limit=1` : `${url}?connection_limit=1`
  return new PrismaClient({ datasources: { db: { url: withLimit } } })
}

function trimCode(value) {
  return typeof value === "string" ? value.trim() : ""
}

async function columnExists(prisma, schema, table, column) {
  const rows = await prisma.$queryRaw`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = ${schema}
      AND table_name = ${table}
      AND column_name = ${column}
    LIMIT 1
  `
  return rows.length > 0
}

async function constraintExists(prisma, schema, name) {
  const rows = await prisma.$queryRaw`
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = ${schema}
      AND constraint_name = ${name}
    LIMIT 1
  `
  return rows.length > 0
}

async function dropRoleCodeColumn(prisma, table) {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "ql-dao-tao"."${table}" DROP CONSTRAINT IF EXISTS "${table}_code_key"`
  )
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "ql-dao-tao"."${table}_code_key"`)
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "ql-dao-tao"."${table}" DROP COLUMN IF EXISTS "code"`
  )
  console.log(`[drop] ${table}.code`)
}

async function main() {
  const url = getUrl()
  const masked = url.replace(/:([^:@/]+)@/, ":***@")
  const prisma = createPrisma(url)

  try {
    const hasLecturerOrg = await columnExists(prisma, "ql-dao-tao", "Lecturer", "organizationId")
    const hasLecturerCode = await columnExists(prisma, "ql-dao-tao", "Lecturer", "code")
    const hasStudentCode = await columnExists(prisma, "ql-dao-tao", "Student", "code")
    const hasStaffCode = await columnExists(prisma, "ql-dao-tao", "Staff", "code")
    const hasProfileDonViFk = await constraintExists(
      prisma,
      "ql-nguoi-dung",
      "UserProfile_sDM_DonViId_fkey"
    )

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? "apply" : "dry-run",
          url: masked,
          columns: {
            "Lecturer.organizationId": hasLecturerOrg,
            "Lecturer.code": hasLecturerCode,
            "Student.code": hasStudentCode,
            "Staff.code": hasStaffCode,
            "UserProfile.sDM_DonViId_fkey": hasProfileDonViFk,
          },
        },
        null,
        2
      )
    )

    if (
      !hasLecturerOrg &&
      !hasLecturerCode &&
      !hasStudentCode &&
      !hasStaffCode &&
      hasProfileDonViFk
    ) {
      console.log("\nDB đã migrate xong — không còn cột cần drop.")
      return
    }

    // ── 1) Preview / copy org ───────────────────────────────────────
    let orgWouldCopy = 0
    let orgInvalid = 0
    if (hasLecturerOrg) {
      const orgRows = await prisma.$queryRaw`
        SELECT
          COUNT(*) FILTER (
            WHERE l."organizationId" IS NOT NULL
              AND dv."Id" IS NOT NULL
              AND up."sDM_DonViId" IS NULL
          )::int AS "wouldCopy",
          COUNT(*) FILTER (
            WHERE l."organizationId" IS NOT NULL AND dv."Id" IS NULL
          )::int AS "invalidOrg",
          COUNT(*) FILTER (
            WHERE l."organizationId" IS NOT NULL
              AND up."sDM_DonViId" IS NOT NULL
              AND up."sDM_DonViId" IS DISTINCT FROM l."organizationId"
          )::int AS "keptExisting"
        FROM "ql-dao-tao"."Lecturer" l
        JOIN "ql-nguoi-dung"."UserProfile" up ON up.id = l."userProfileId"
        LEFT JOIN mta."DM_DonVi" dv ON dv."Id" = l."organizationId"
        WHERE l."deletedAt" IS NULL
      `
      orgWouldCopy = orgRows[0]?.wouldCopy ?? 0
      orgInvalid = orgRows[0]?.invalidOrg ?? 0
      const kept = orgRows[0]?.keptExisting ?? 0
      console.log(`\n[org] copy Lecturer.organizationId → UserProfile.sDM_DonViId: ${orgWouldCopy}`)
      if (kept) console.log(`[org] profile đã có đơn vị khác (giữ nguyên): ${kept}`)
      if (orgInvalid) {
        console.log(`[org] organizationId không có trên DM_DonVi (bỏ qua): ${orgInvalid}`)
      }
    } else {
      console.log("\n[org] Lecturer.organizationId đã không còn — skip copy.")
    }

    // ── 2) Preview / copy codes ─────────────────────────────────────
    const wouldCopy = []
    const overwriteLecturer = []
    const uniqueClash = []

    if (hasLecturerCode || hasStudentCode || hasStaffCode) {
      const lecturerCodeSql = hasLecturerCode ? `l.code` : `NULL`
      const staffCodeSql = hasStaffCode ? `s.code` : `NULL`
      const studentCodeSql = hasStudentCode
        ? `(
            SELECT st.code
            FROM "ql-dao-tao"."Student" st
            WHERE st."userProfileId" = up.id
              AND st."deletedAt" IS NULL
              AND st.code IS NOT NULL
              AND btrim(st.code) <> ''
            ORDER BY st."updatedAt" DESC
            LIMIT 1
          )`
        : `NULL`

      const rows = await prisma.$queryRawUnsafe(`
        SELECT
          up.id AS "userProfileId",
          up.code AS "profileCode",
          ${lecturerCodeSql} AS "lecturerCode",
          ${staffCodeSql} AS "staffCode",
          ${studentCodeSql} AS "studentCode"
        FROM "ql-nguoi-dung"."UserProfile" up
        LEFT JOIN "ql-dao-tao"."Lecturer" l
          ON l."userProfileId" = up.id AND l."deletedAt" IS NULL
        LEFT JOIN "ql-dao-tao"."Staff" s
          ON s."userProfileId" = up.id AND s."deletedAt" IS NULL
        WHERE up."deletedAt" IS NULL
          AND (
            l.id IS NOT NULL
            OR s.id IS NOT NULL
            OR EXISTS (
              SELECT 1 FROM "ql-dao-tao"."Student" st
              WHERE st."userProfileId" = up.id AND st."deletedAt" IS NULL
            )
          )
      `)

      const occupied = new Map()
      for (const row of rows) {
        const existing = trimCode(row.profileCode)
        if (existing) occupied.set(existing, row.userProfileId)
      }

      for (const row of rows) {
        const lecturer = trimCode(row.lecturerCode)
        const staff = trimCode(row.staffCode)
        const student = trimCode(row.studentCode)
        const profile = trimCode(row.profileCode)
        const chosen = lecturer || staff || student
        const bothGvHv = Boolean(lecturer && student)
        if (!chosen) continue

        const clash = occupied.get(chosen)
        const hasClash = clash && clash !== row.userProfileId

        if (!profile) {
          if (hasClash) {
            uniqueClash.push(row)
            continue
          }
          wouldCopy.push({ userProfileId: row.userProfileId, chosen })
          occupied.set(chosen, row.userProfileId)
          continue
        }

        if (bothGvHv && profile !== lecturer) {
          if (hasClash) {
            uniqueClash.push(row)
            continue
          }
          overwriteLecturer.push({ userProfileId: row.userProfileId, chosen: lecturer })
          occupied.set(lecturer, row.userProfileId)
        }
      }

      console.log(
        `\n[code] copy → UserProfile.code: ${wouldCopy.length}, overwrite GV+HV: ${overwriteLecturer.length}, clash: ${uniqueClash.length}`
      )
      if (uniqueClash.length) {
        console.log(
          `[code] mẫu clash:`,
          uniqueClash.slice(0, 5).map((r) => ({
            userProfileId: r.userProfileId,
            lecturer: trimCode(r.lecturerCode),
            student: trimCode(r.studentCode),
            staff: trimCode(r.staffCode),
            profile: trimCode(r.profileCode),
          }))
        )
      }
    } else {
      console.log("\n[code] Lecturer/Student/Staff.code đã không còn — skip copy.")
    }

    if (!APPLY) {
      console.log("\nDry-run. Chạy thêm --apply để ghi dữ liệu rồi drop cột.")
      return
    }

    // ── 3) Apply code copy ──────────────────────────────────────────
    for (const row of wouldCopy) {
      await prisma.$executeRaw`
        UPDATE "ql-nguoi-dung"."UserProfile"
        SET code = ${row.chosen}
        WHERE id = ${row.userProfileId}::uuid
          AND (code IS NULL OR btrim(code) = '')
          AND NOT EXISTS (
            SELECT 1 FROM "ql-nguoi-dung"."UserProfile" other
            WHERE other.id <> ${row.userProfileId}::uuid
              AND other.code = ${row.chosen}
          )
      `
    }
    for (const row of overwriteLecturer) {
      await prisma.$executeRaw`
        UPDATE "ql-nguoi-dung"."UserProfile"
        SET code = ${row.chosen}
        WHERE id = ${row.userProfileId}::uuid
          AND NOT EXISTS (
            SELECT 1 FROM "ql-nguoi-dung"."UserProfile" other
            WHERE other.id <> ${row.userProfileId}::uuid
              AND other.code = ${row.chosen}
          )
      `
    }
    if (wouldCopy.length || overwriteLecturer.length) {
      console.log(
        `[code] đã ghi UserProfile.code (copy=${wouldCopy.length}, overwrite=${overwriteLecturer.length})`
      )
    }

    // ── 4) Apply org copy ───────────────────────────────────────────
    if (hasLecturerOrg) {
      const copied = await prisma.$executeRaw`
        UPDATE "ql-nguoi-dung"."UserProfile" up
        SET "sDM_DonViId" = l."organizationId"
        FROM "ql-dao-tao"."Lecturer" l
        JOIN mta."DM_DonVi" dv ON dv."Id" = l."organizationId"
        WHERE up.id = l."userProfileId"
          AND l."deletedAt" IS NULL
          AND l."organizationId" IS NOT NULL
          AND up."sDM_DonViId" IS NULL
      `
      console.log(`[org] đã copy ${copied} UserProfile.sDM_DonViId`)
    }

    // ── 5) FK + index trên UserProfile.sDM_DonViId ─────────────────
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserProfile_sDM_DonViId_idx"
        ON "ql-nguoi-dung"."UserProfile" ("sDM_DonViId")
    `)
    if (!hasProfileDonViFk) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ql-nguoi-dung"."UserProfile"
          ADD CONSTRAINT "UserProfile_sDM_DonViId_fkey"
          FOREIGN KEY ("sDM_DonViId") REFERENCES mta."DM_DonVi"("Id")
          ON DELETE SET NULL
          ON UPDATE CASCADE
      `)
      console.log("[fk] đã gắn UserProfile.sDM_DonViId → DM_DonVi")
    } else {
      console.log("[fk] UserProfile.sDM_DonViId_fkey đã có")
    }

    // ── 6) DROP Lecturer.organizationId ─────────────────────────────
    if (hasLecturerOrg) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ql-dao-tao"."Lecturer"
          DROP CONSTRAINT IF EXISTS "Lecturer_organizationId_fkey"
      `)
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS "ql-dao-tao"."Lecturer_organizationId_idx"
      `)
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ql-dao-tao"."Lecturer"
          DROP COLUMN IF EXISTS "organizationId"
      `)
      console.log("[drop] Lecturer.organizationId")
    }

    // ── 7) DROP code trên role tables ───────────────────────────────
    if (hasLecturerCode) await dropRoleCodeColumn(prisma, "Lecturer")
    if (hasStudentCode) await dropRoleCodeColumn(prisma, "Student")
    if (hasStaffCode) await dropRoleCodeColumn(prisma, "Staff")

    console.log("\nXong.")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
