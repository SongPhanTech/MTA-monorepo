/**
 * OBSOLETE sau migrate: cột Lecturer.organizationId đã drop.
 * Đồng bộ đơn vị quản lý GV (lịch sử): Lecturer.organizationId → UserProfile.sDM_DonViId
 *
 * Chỉ điền profile đang TRỐNG. Profile đã có đơn vị thì giữ nguyên (nguồn duy nhất).
 * Không đụng học viên / FixedClass.
 *
 * Usage:
 *   cd packages/database
 *   DATABASE_URL="postgres://..." bun scripts/sync-lecturer-org-to-user-profile.mjs
 *   DATABASE_URL="postgres://..." bun scripts/sync-lecturer-org-to-user-profile.mjs --apply
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

async function main() {
  const prisma = createPrisma()
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        l.id AS "lecturerId",
        l.code AS "lecturerCode",
        l."organizationId" AS "lecturerOrgId",
        up.id AS "userProfileId",
        up.fullname,
        up."sDM_DonViId" AS "profileOrgId",
        dv."Id" AS "validOrgId"
      FROM "ql-dao-tao"."Lecturer" l
      JOIN "ql-nguoi-dung"."UserProfile" up ON up.id = l."userProfileId"
      LEFT JOIN mta."DM_DonVi" dv ON dv."Id" = l."organizationId"
      WHERE l."deletedAt" IS NULL
    `

    const copied = []
    const keptProfile = []
    const skippedNull = []
    const invalidOrg = []

    for (const row of rows) {
      if (!row.lecturerOrgId) {
        skippedNull.push(row)
        continue
      }
      if (!row.validOrgId) {
        invalidOrg.push(row)
        continue
      }
      if (!row.profileOrgId) {
        copied.push(row)
        continue
      }
      keptProfile.push(row)
    }

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? "apply" : "dry-run",
          totalLecturers: rows.length,
          wouldCopy: copied.length,
          keptProfile: keptProfile.length,
          skippedNullLecturerOrg: skippedNull.length,
          invalidOrg: invalidOrg.length,
        },
        null,
        2
      )
    )

    if (invalidOrg.length) {
      console.log("\ninvalid_org (Lecturer.organizationId không có trên DM_DonVi):")
      for (const row of invalidOrg.slice(0, 50)) {
        console.log(
          `  ${row.lecturerCode || row.lecturerId} ${row.fullname || ""} org=${row.lecturerOrgId}`
        )
      }
    }

    const differed = keptProfile.filter((row) => row.profileOrgId !== row.lecturerOrgId)
    if (differed.length) {
      console.log(
        `\nkept_profile_differs (${differed.length} dòng profile ≠ lecturer — giữ profile):`
      )
      for (const row of differed.slice(0, 50)) {
        console.log(
          `  ${row.lecturerCode || row.lecturerId} ${row.fullname || ""} lecturer=${row.lecturerOrgId} profile=${row.profileOrgId}`
        )
      }
    }

    if (!APPLY) {
      console.log("\nDry-run. Chạy thêm --apply để ghi sDM_DonViId cho profile đang trống.")
      return
    }

    if (copied.length === 0) {
      console.log("Không có profile trống cần copy.")
      return
    }

    const result = await prisma.$executeRaw`
      UPDATE "ql-nguoi-dung"."UserProfile" up
      SET "sDM_DonViId" = l."organizationId"
      FROM "ql-dao-tao"."Lecturer" l
      JOIN mta."DM_DonVi" dv ON dv."Id" = l."organizationId"
      WHERE up.id = l."userProfileId"
        AND l."deletedAt" IS NULL
        AND l."organizationId" IS NOT NULL
        AND up."sDM_DonViId" IS NULL
    `
    console.log(`Updated ${result} UserProfile.sDM_DonViId`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
