import { PrismaClient } from '../../generated/prisma-client'

const prisma = new PrismaClient()


await prisma.subjectVersionHistory.deleteMany({
  where: {
    subjectVersion: {
      deletedAt: {
        not: null,
      },
    },
  }
})

await prisma.subjectVersion.deleteMany({
    where: {
        trainingBlocks: {
            none: {},
        },
        questionBanks: {
            none: {},
        },
        subjectClass: {
            none: {},
        },
        knowledgeBlocks: {
            none: {},
        },
    },
})

await prisma.subject.deleteMany({
    where: {
        // deletedAt: {
        //     not: null,
        // },
        subjectVersion: {
            none: {},
        },
    },
})


await prisma.curriculumVersion.deleteMany({
    where: {
        OR: [
          {
            deletedAt: {
                not: null,
            },
          },
          {
            curriculum: {
              deletedAt: {
                not: null,
              },
            }
          }
        ]
    },
})

await prisma.curriculum.deleteMany({
    where: {
        deletedAt: {
            not: null,
        },
    },
})

await prisma.trainingBlockSubject.deleteMany({
    where: {
        trainingBlockOnCurriculumVersion: {
            curriculumVersionId: null,
        },
    },
})

await prisma.trainingBlockOnCurriculumVersion.deleteMany({
    where: {
        curriculumVersionId: null,
    },
})
