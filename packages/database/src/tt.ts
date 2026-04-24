import { PrismaClient } from "../generated/prisma-client"

// const prismaOld = new PrismaClient({
//   datasourceUrl: "postgres://admin:123456654321@113.192.17.90:5432/mta_31_03_2026",
// })

const prismaNew = new PrismaClient({
  datasourceUrl: "postgres://admin:123456654321@192.168.100.132:5432/mta",
})

await prismaNew.examRoom.updateMany({
  where: {
    capacity: 0,
  },
  data: {
    capacity: 100,
  },
})

// await prismaNew.archivedCertificate.deleteMany({
//   where: {
//     studentSubjectScore: {
//       subjectClassId: null,
//     },
//   },
// })

// await prismaNew.archivedCertificateOnStudentSubjectScore.deleteMany({
//   where: {
//     studentSubjectScore: {
//       subjectClassId: null,
//     },
//   },
// })

// const c = await prismaNew.studentSubjectScore.deleteMany({
//   where: {
//     subjectClassId: null,
//   },
// })

