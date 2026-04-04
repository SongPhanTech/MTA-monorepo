import { PrismaClient } from "../generated/prisma-client"

// const prismaOld = new PrismaClient({
//   datasourceUrl: "postgres://admin:123456654321@113.192.17.90:5432/mta_31_03_2026",
// })

const prismaNew = new PrismaClient({
  datasourceUrl: "postgres://admin:123456654321@113.192.17.90:5432/mta",
})

await prismaNew.examPaper.deleteMany({
  where: {
    studentSubjectScore: {
      subjectClass: {
        trainingObjectTypeId: "01",
        semesterId: "cmmvor6bi0001mp01mgfapxwk",
      },
    },
  },
})

await prismaNew.planTrainingSubject.deleteMany({
  where: {
    planTraining: {
      trainingObjectTypeId: "01",
      semesterId: "cmmvor6bi0001mp01mgfapxwk",
    },
  },
})

await prismaNew.planTraining.deleteMany({
  where: {
    trainingObjectTypeId: "01",
    semesterId: "cmmvor6bi0001mp01mgfapxwk",
  },
})

await prismaNew.studentSubjectScoreHistory.deleteMany({
  where: {
    studentSubjectScore: {
      subjectClass: {
        trainingObjectTypeId: "01",
        semesterId: "cmmvor6bi0001mp01mgfapxwk",
      },
    },
  },
})

const students = await prismaNew.studentSubjectScore.deleteMany({
  where: {
    subjectClass: {
      trainingObjectTypeId: "01",
      semesterId: "cmmvor6bi0001mp01mgfapxwk",
    },
  },
})

console.log({ students })

const classRegisterLogs = await prismaNew.classRegisterLogs.deleteMany({
  where: {
    subjectClass: {
      trainingObjectTypeId: "01",
      semesterId: "cmmvor6bi0001mp01mgfapxwk",
    },
  },
})

const subjectClassTimes = await prismaNew.subjectClassTime.deleteMany({
  where: {
    subjectClass: {
      trainingObjectTypeId: "01",
      semesterId: "cmmvor6bi0001mp01mgfapxwk",
    },
  },
})

console.log({ subjectClassTimes })

const classes = await prismaNew.subjectClass.deleteMany({
  where: {
    trainingObjectTypeId: "01",
    semesterId: "cmmvor6bi0001mp01mgfapxwk",
  },
})

console.log({ classes })

// const ss = await prismaNew.subjectVersion.findMany({
//   where: {
//     trainingBlocks: {
//       none: {},
//     },
//   },
// })

// const curriculum = await prismaNew.curriculumVersion.findMany({
//   include: {
//     trainingBlocks: {
//       include: {
//         subjects: {
//           include: { subject: true },
//         },
//       },
//     },
//   },
// })

// for (const item of curriculum) {
//   const requiredCredits = item.trainingBlocks.reduce((acc, block) => {
//     return (
//       acc +
//       block.subjects.reduce((acc2, subject) => {
//         if (subject.type === "Mandatory" && subject.useForFinalScore) {
//           return acc2 + subject.subject.credit
//         }
//         return acc2
//       }, 0)
//     )
//   }, 0)

//   const electiveCredits = item.trainingBlocks.reduce((acc, block) => {
//     return (
//       acc +
//       block.subjects.reduce((acc2, subject) => {
//         if (subject.type === "Optional" && subject.useForFinalScore) {
//           return acc2 + subject.subject.credit
//         }
//         return acc2
//       }, 0)
//     )
//   }, 0)

//   await prismaNew.curriculumVersion.update({
//     where: { id: item.id },
//     data: {
//       requiredCredits,
//       electiveCredits,
//     },
//   })
// }

// const docsC = await prismaOld.documentClassification.findMany()

// await prismaNew.documentClassification.createMany({
//   data: docsC.map((item) => ({
//     ...item,
//     createdBy: "df692945-a305-402c-a5af-6179ca44896d",
//   })),
//   skipDuplicates: true,
// })

// const docs = await prismaOld.document.findMany()

// await prismaNew.document.createMany({
//   data: docs.map(({ uploadedById, ...item }) => ({
//     ...item,
//     uploadedById: "df692945-a305-402c-a5af-6179ca44896d",
//   })),
//   skipDuplicates: true,
// })

// const topics = await prismaOld.topic.findMany()

// await prismaNew.topic.createMany({
//   data: topics,
//   skipDuplicates: true,
// })

// const DocumentTopic = await prismaOld.documentTopic.findMany()

// await prismaNew.documentTopic.createMany({
//   data: DocumentTopic,
//   skipDuplicates: true,
// })

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

// const yearIds = await prismaNew.schoolYear.findMany()

// const semesters = await prismaOld.semester.findMany({
//   where: {
//     schoolYearId: {
//       in: yearIds.map((item) => item.id),
//     },
//   },
// })

// await prismaNew.semester.createMany({
//   data: semesters,
//   skipDuplicates: true,
// })

console.log("Done")
