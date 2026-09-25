/**
 * Đồng bộ mã người: Lecturer.code / Staff.code / Student.code → UserProfile.code
 *
 * Ưu tiên: Lecturer > Staff > Student.
 * Vừa GV vừa HV: luôn dùng mã giảng viên (ghi đè profile nếu khác).
 * Profile trống: copy mã theo ưu tiên trên. Profile đã có mã (không phải case GV+HV) thì giữ.
 * Trùng unique UserProfile.code → skip.
 *
 * Usage:
 *   cd packages/database
 *   DATABASE_URL="postgres://..." bun scripts/sync-role-code-to-user-profile.mjs
 *   DATABASE_URL="postgres://..." bun scripts/sync-role-code-to-user-profile.mjs --apply
 *
 * Mặc định dry-run.
 */
import { PrismaClient } from "../generated/prisma-client/index.js"

const APPLY = process.argv.includes("--apply")

function createPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is required")
  return new PrismaClient()
}

function trimCode(value) {
  return typeof value === "string" ? value.trim() : ""
}

async function main() {
  const prisma = createPrisma()
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        up.id AS "userProfileId",
        up.fullname,
        up.code AS "profileCode",
        up."idCardNumber" AS "idCardNumber",
        l.code AS "lecturerCode",
        s.code AS "staffCode",
        (
          SELECT st.code
          FROM "ql-dao-tao"."Student" st
          WHERE st."userProfileId" = up.id
            AND st."deletedAt" IS NULL
            AND st.code IS NOT NULL
            AND btrim(st.code) <> ''
          ORDER BY st."updatedAt" DESC
          LIMIT 1
        ) AS "studentCode",
        (
          SELECT COUNT(DISTINCT btrim(st.code))
          FROM "ql-dao-tao"."Student" st
          WHERE st."userProfileId" = up.id
            AND st."deletedAt" IS NULL
            AND st.code IS NOT NULL
            AND btrim(st.code) <> ''
        )::int AS "studentCodeCount"
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
            SELECT 1
            FROM "ql-dao-tao"."Student" st
            WHERE st."userProfileId" = up.id AND st."deletedAt" IS NULL
          )
        )
    `

    const occupied = new Map()
    for (const row of rows) {
      const existing = trimCode(row.profileCode)
      if (existing) occupied.set(existing, row.userProfileId)
    }

    const wouldCopy = []
    const overwriteLecturer = []
    const keptSame = []
    const keptDiffers = []
    const multiSource = []
    const uniqueClash = []
    const skippedEmpty = []

    for (const row of rows) {
      const lecturer = trimCode(row.lecturerCode)
      const staff = trimCode(row.staffCode)
      const student = trimCode(row.studentCode)
      const sources = [
        ["lecturer", lecturer],
        ["staff", staff],
        ["student", student],
      ].filter(([, code]) => code)

      const distinct = [...new Set(sources.map(([, code]) => code))]
      const profile = trimCode(row.profileCode)
      const chosen = lecturer || staff || student
      const bothGvHv = Boolean(lecturer && student)

      if (distinct.length > 1) {
        multiSource.push({ ...row, distinct, sources, chosen })
      }

      if (!chosen) {
        skippedEmpty.push(row)
        continue
      }

      const clash = occupied.get(chosen)
      const hasClash = clash && clash !== row.userProfileId

      if (!profile) {
        if (hasClash) {
          uniqueClash.push({ ...row, chosen, occupiedBy: clash })
          continue
        }
        wouldCopy.push({ ...row, chosen })
        occupied.set(chosen, row.userProfileId)
        continue
      }

      if (bothGvHv && profile !== lecturer) {
        if (hasClash) {
          uniqueClash.push({ ...row, chosen: lecturer, occupiedBy: clash })
          continue
        }
        overwriteLecturer.push({ ...row, chosen: lecturer })
        occupied.set(lecturer, row.userProfileId)
        continue
      }

      if (profile === chosen) {
        keptSame.push(row)
        continue
      }
      keptDiffers.push({ ...row, distinct, chosen })
    }

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? "apply" : "dry-run",
          totalProfiles: rows.length,
          wouldCopy: wouldCopy.length,
          overwriteToLecturer: overwriteLecturer.length,
          keptSame: keptSame.length,
          keptDiffers: keptDiffers.length,
          multiSource: multiSource.length,
          uniqueClash: uniqueClash.length,
          skippedEmpty: skippedEmpty.length,
        },
        null,
        2
      )
    )

    if (overwriteLecturer.length) {
      console.log(`\noverwrite_to_lecturer (${overwriteLecturer.length} GV+HV → dùng mã GV):`)
      for (const row of overwriteLecturer.slice(0, 50)) {
        console.log(
          `  ${row.fullname || row.userProfileId} profile=${row.profileCode} → ${row.chosen} (student=${row.studentCode})`
        )
      }
    }

    if (multiSource.length) {
      console.log(`\nmulti_source (${multiSource.length} profile có nhiều mã nguồn):`)
      for (const row of multiSource.slice(0, 50)) {
        console.log(
          `  ${row.fullname || row.userProfileId} profile=${row.profileCode || "∅"} chosen=${row.chosen} codes=${row.distinct.join(",")}`
        )
      }
    }

    if (keptDiffers.length) {
      console.log(`\nkept_profile_differs (${keptDiffers.length} — giữ UserProfile.code):`)
      for (const row of keptDiffers.slice(0, 50)) {
        console.log(
          `  ${row.fullname || row.userProfileId} profile=${row.profileCode} sources=${row.distinct.join(",")}`
        )
      }
    }

    if (uniqueClash.length) {
      console.log(`\nunique_clash (${uniqueClash.length} — bỏ qua, mã đã thuộc profile khác):`)
      for (const row of uniqueClash.slice(0, 50)) {
        console.log(
          `  ${row.fullname || row.userProfileId} want=${row.chosen} occupiedBy=${row.occupiedBy}`
        )
      }
    }

    if (!APPLY) {
      console.log(
        "\nDry-run. Chạy thêm --apply để ghi UserProfile.code (profile trống + GV+HV ưu tiên mã GV)."
      )
      return
    }

    let updated = 0
    for (const row of wouldCopy) {
      const result = await prisma.$executeRaw`
        UPDATE "ql-nguoi-dung"."UserProfile"
        SET code = ${row.chosen}
        WHERE id = ${row.userProfileId}::uuid
          AND (code IS NULL OR btrim(code) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM "ql-nguoi-dung"."UserProfile" other
            WHERE other.id <> ${row.userProfileId}::uuid
              AND other.code = ${row.chosen}
          )
      `
      updated += Number(result)
    }
    let overwritten = 0
    for (const row of overwriteLecturer) {
      const result = await prisma.$executeRaw`
        UPDATE "ql-nguoi-dung"."UserProfile"
        SET code = ${row.chosen}
        WHERE id = ${row.userProfileId}::uuid
          AND NOT EXISTS (
            SELECT 1
            FROM "ql-nguoi-dung"."UserProfile" other
            WHERE other.id <> ${row.userProfileId}::uuid
              AND other.code = ${row.chosen}
          )
      `
      overwritten += Number(result)
    }
    console.log(`Updated ${updated} empty profiles, overwritten ${overwritten} GV+HV to lecturer code`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
