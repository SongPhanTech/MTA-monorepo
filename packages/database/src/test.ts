import { PrismaClient } from "../generated/prisma-client"

const prismaOld = new PrismaClient({
  datasourceUrl: "postgres://admin:123456654321@113.192.17.90:5432/mta_31_03_2026",
})

const prismaNew = new PrismaClient({
  datasourceUrl: "postgres://admin:123456654321@113.192.17.90:5432/mta",
})

// const trainingField = await prismaOld.trainingField.findMany({
//   where: {
//     trainingObjectTypes: {
//       some: {
//         trainingObjectTypeId: "05",
//       },
//     },
//   },
// })

// const trainingFieldOnTrainingObjectType =
//   await prismaOld.trainingFieldOnTrainingObjectType.findMany({
//     where: {
//       trainingFieldId: {
//         in: trainingField.map((item) => item.id),
//       },
//     },
//   })

// await prismaNew.trainingField.createMany({
//   data: trainingField,
//   skipDuplicates: true
// })

// await prismaNew.trainingFieldOnTrainingObjectType.createMany({
//   data: trainingFieldOnTrainingObjectType,
//   skipDuplicates: true,
// })

// const trainingMajor = await prismaOld.trainingMajor.findMany({
//   where: {
//     trainingFieldId: {
//       in: trainingField.map((item) => item.id),
//     },
//   },
//   include: {
//     organization: true,
//   },
// })

// const org = await prismaNew.dM_DonVi.findMany({
//   where: {
//     sTen: {
//       in: trainingMajor.map((item) => item.organization?.sTen || ""),
//     },
//   },
// })

// const orgMap = new Map(org.map((item) => [item.sTen, item.Id]))
// console.log(orgMap)

// await prismaNew.trainingMajor.createMany({
//   data: trainingMajor.map(({ organization, ...item }) => ({
//     ...item,
//     organizationId: orgMap.get(organization?.sTen || "") || "d87525ce-56c9-4af8-a070-df0fac592231",
//   })),
//   skipDuplicates: true,
// })

// const trainingMajorOnTrainingObjectType =
//   await prismaOld.trainingMajorOnTrainingObjectType.findMany({
//     where: {
//       trainingMajorId: {
//         in: trainingMajor.map((item) => item.id),
//       },
//     },
//   })

// await prismaNew.trainingMajorOnTrainingObjectType.createMany({
//   data: trainingMajorOnTrainingObjectType,
//   skipDuplicates: true,
// })

const yearIds = await prismaNew.schoolYear.findMany()

const semesters = await prismaOld.semester.findMany({
  where: {
    schoolYearId: {
      in: yearIds.map((item) => item.id),
    },
  },
})

await prismaNew.semester.createMany({
  data: semesters,
  skipDuplicates: true,
})

console.log("Done")
