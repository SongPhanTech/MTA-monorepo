import { PrismaClient } from "../generated/prisma-client"

const prisma = new PrismaClient()

const studentId = "cmcvrfndy000iokmg3sypuo3z"

const curriculumVersion = await prisma.curriculumVersion.findMany({
  select: {
    id: true,
    trainingBlocks: {
      include: { subjects: { include: { subject: true } } },
    },
  },
})

for (const cv of curriculumVersion) {
  const curriculumSubjects = cv.trainingBlocks.flatMap(({ subjects }) => subjects)

  const electiveCredits = cv.trainingBlocks.reduce((acc, block) => {
    return acc + block.electiveCreditsRequired
  }, 0)

  const requiredCredits = curriculumSubjects.reduce((acc, subject) => {
    if (subject.useForFinalScore && subject.type === "Mandatory") {
      return acc + subject.subject.credit
    }
    return acc
  }, 0)

  await prisma.curriculumVersion.update({
    where: { id: cv.id },
    data: { electiveCredits, requiredCredits },
  })
}
