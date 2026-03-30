import { PrismaClient } from "../../generated/prisma-client"

const prisma = new PrismaClient()

await prisma.archivedAward.deleteMany({
  where: {
    deletedAt: {
      not: null,
    },
  },
})

// await prisma.curriculumVersion.deleteMany({
//     where: {
//         deletedAt: {
//             not: null,
//         },
//     },
// })

// await prisma.trainingBlockSubject.deleteMany({
//     where: {
//         trainingBlockOnCurriculumVersion: {
//             curriculumVersionId: null,
//         },
//     },
// })

// await prisma.trainingBlockOnCurriculumVersion.deleteMany({
//     where: {
//         curriculumVersionId: null,
//     },
// })

// await prisma.subjectVersionHistory.deleteMany({})

// await prisma.subjectVersion.deleteMany({
//     where: {
//         trainingBlocks: {
//             none: {},
//         },
//         questionBanks: {
//             none: {},
//         },
//         subjectClass: {
//             none: {},
//         },
//         knowledgeBlocks: {
//             none: {},
//         },
//     },
// })
