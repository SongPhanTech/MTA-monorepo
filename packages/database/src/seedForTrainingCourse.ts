import { AcademicRankingBaseType, PrismaClient } from "../generated/prisma-client"
import { seedAcademicActionConfig } from "./seed/academic-action-config"
import {
  academicRankingGraduationCivilian,
  academicRankingGraduationMilitary,
  academicRankingStudying,
} from "./seed/academic-ranking-convert"
import { seedAcademicWarningRule } from "./seed/academic-warning-rule"
import { scoreConversions } from "./seed/score-convert"

const prisma = new PrismaClient()

const semester = await prisma.semester.findFirstOrThrow({
  orderBy: { startDate: "asc" },
})

// await prisma.trainingCourse.create({
//     data: {
//         code: 'K59',
//         name: 'Khoá 59',
//         description: 'Khoá 59 Quân sự',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         semesterStartId: semester.id,
//         trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000', // Quân sự
//         coef_1: 0.1,
//         coef_2: 0.3,
//         coef_3: 0.6,
//         scoreToPass: 4,
//         scoreToTakeExam: 4,
//         baseScore: 'Base10',
//     },
// })

// await prisma.trainingCourse.create({
//     data: {
//         code: 'K20DS',
//         name: 'Khoá 20 DS',
//         description: 'Khoá 20 Dân sự',
//         semesterStartId: semester.id,
//         trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440001', // Quân sự
//         coef_1: 0.1,
//         coef_2: 0.3,
//         coef_3: 0.6,
//         scoreToPass: 4,
//         scoreToTakeExam: 4,
//         baseScore: 'Base10',
//     },
// })

// await seedScholarshipCriteria()
await seedAcademicActionConfig()
await seedAcademicWarningRule()

const trainingCourses = await prisma.trainingCourse.findMany({
  select: {
    id: true,
    baseScore: true,
  },
})

await Promise.all(
  trainingCourses.map((trainingCourse) =>
    prisma.scoreConvert.createMany({
      data: scoreConversions.map((scoreConversion) => ({
        ...scoreConversion,
        trainingCourseId: trainingCourse.id,
      })),
    })
  )
)

await Promise.all(
  trainingCourses
    .filter(({ baseScore }) => baseScore === AcademicRankingBaseType.Base10)
    .map((trainingCourse) =>
      prisma.academicRankingConvert.createMany({
        skipDuplicates: true,
        data: [...academicRankingGraduationMilitary, ...academicRankingStudying].map(
          (conversion) => ({
            trainingCourseId: trainingCourse.id,
            ...conversion,
          })
        ),
      })
    )
)

await Promise.all(
  trainingCourses
    .filter(({ baseScore }) => baseScore === AcademicRankingBaseType.Base4)
    .map((trainingCourse) =>
      prisma.academicRankingConvert.createMany({
        skipDuplicates: true,
        data: [...academicRankingGraduationCivilian, ...academicRankingStudying].map(
          (conversion) => ({
            trainingCourseId: trainingCourse.id,
            ...conversion,
          })
        ),
      })
    )
)
