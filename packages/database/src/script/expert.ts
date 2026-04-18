import { PrismaClient } from "../../generated/prisma-client"

const prisma = new PrismaClient()

const lecturers = await prisma.lecturer.findMany({
  include: {
    userProfile: true,
  },
})

for (const lecturer of lecturers) {
  await prisma.expertProfile.update({
    where: {
      lecturerId: lecturer.id,
    },
    data: {
      name: lecturer.userProfile.fullname,
    },
  })
}
