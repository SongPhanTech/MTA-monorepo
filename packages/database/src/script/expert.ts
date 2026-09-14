/**
 * One-off / maintenance: đồng bộ tên Expert.currentVersion từ Lecturer.userProfile.
 * Không dùng ExpertProfile (đã migrate → Expert + ExpertProfileVersion).
 *
 * Chạy: `bun packages/database/src/script/expert.ts` (cần DATABASE_URL).
 */
import { PrismaClient } from "../../generated/prisma-client"

const prisma = new PrismaClient()

const experts = await prisma.expert.findMany({
  where: {
    deletedAt: null,
    lecturerId: { not: null },
    currentVersionId: { not: null },
  },
  include: {
    lecturer: { include: { userProfile: true } },
    currentVersion: true,
  },
})

let updated = 0
for (const expert of experts) {
  const fullname = expert.lecturer?.userProfile?.fullname
  if (!fullname || !expert.currentVersionId) continue
  if (expert.currentVersion?.name === fullname) continue

  await prisma.expertProfileVersion.update({
    where: { id: expert.currentVersionId },
    data: { name: fullname },
  })
  updated += 1
}

console.log(`Updated ${updated}/${experts.length} currentVersion.name from lecturer profile`)
await prisma.$disconnect()
