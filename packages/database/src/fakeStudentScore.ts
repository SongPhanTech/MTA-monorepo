import { PrismaClient } from "../generated/prisma-client"

const prisma = new PrismaClient()

const studentId = "cmcvrfndy000iokmg3sypuo3z"

const curriculumVersion = await prisma.curriculumVersion.findFirstOrThrow({
  where: {
    students: { some: { id: studentId } },
  },
  select: {
    trainingBlocks: {
      include: { subjects: { include: { subject: true } } },
    },
  },
})

const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(({ subjects }) => subjects)

await prisma.studentSubjectScore.createMany({
  data: curriculumSubjects.map((subject) => ({
    studentId,
    subjectVersionId: subject.subjectId,
    manualFinalScore: 8,
  })),
})
