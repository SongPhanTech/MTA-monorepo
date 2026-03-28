import { calcFinalScore } from "../../../libs/src/utils"
import { PrismaClient } from "../../generated/prisma-client"

const prisma = new PrismaClient()

// await prisma.studentSubjectScore.updateMany({
//     where: {
//         attendanceScore: { gte: 5 },
//         midtermScore: { gte: 5 },
//     },
//     data: {
//         examBanned: false,
//         examBannedReason: null,
//     },
// })

await prisma.academicRankingConvert.updateMany({
  where: {
    trainingCourse: {
      baseScore: "Base10",
    },
  },
  data: {
    baseScore: "Base10",
    base4Min: null,
    base4Max: null,
  },
})

await prisma.academicRankingConvert.updateMany({
  where: {
    trainingCourse: {
      baseScore: "Base4",
    },
  },
  data: {
    baseScore: "Base4",
    base10Min: null,
    base10Max: null,
  },
})

// const count = await prisma.subjectClass.count({
//     where: {
//         trainingObjectTypeId: '05',
//         semester: {
//             code: '080',
//         },
//         fixedClasses: {
//             some: {
//                 trainingCourse: {
//                     code: 'K61 2025',
//                 },
//             },
//         },
//     },
// })

// const c2 = await prisma.subjectClass.count({
//     where: {
//         trainingObjectTypeId: '05',
//         semester: {
//             code: '2025-2026 HK1',
//         },
//         fixedClasses: {
//             none: {
//                 trainingCourse: {
//                     code: 'K61 2025',
//                 },
//             },
//         },
//     },
// })

// const call = await prisma.subjectClass.count({
//     where: {
//         trainingObjectTypeId: '05',
//         semester: {
//             code: '080',
//         },
//     },
// })

// const d = await prisma.subjectClass.deleteMany({
//     where: {
//         trainingObjectTypeId: '05',
//         semester: {
//             code: '2025-2026 HK1',
//         },
//         fixedClasses: {
//             none: {
//                 trainingCourse: {
//                     code: 'K61 2025',
//                 },
//             },
//         },
//     },
// })

// console.log(count, c2, call)
// console.log('deleted', d)
