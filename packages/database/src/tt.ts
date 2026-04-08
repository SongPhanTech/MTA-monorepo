import { PrismaClient } from "../generated/prisma-client"

const prismaOld = new PrismaClient({
  datasourceUrl: "postgres://admin:123456654321@113.192.17.90:5432/mta_31_03_2026",
})

const prismaNew = new PrismaClient({
  datasourceUrl: "postgres://admin:123456654321@113.192.17.90:5432/mta",
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

console.log(c)
