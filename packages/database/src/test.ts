import { AcademicRankingBaseType, PrismaClient } from '../generated/prisma-client'
import {
    academicRankingGraduationCivilian,
    academicRankingGraduationMilitary,
    academicRankingStudying,
} from './seed/academic-ranking-convert'
import { scoreConversions } from './seed/score-convert'

const prisma = new PrismaClient()

await prisma.graduationRankDowngradeCondition.deleteMany()
await prisma.graduationRankDowngradeRule.deleteMany()
await prisma.academicRankingConvert.deleteMany()
await prisma.scoreConvert.deleteMany()

const trainingCourses = await prisma.trainingCourse.findMany({
    select: { id: true, baseScore: true },
    where: {
        academicRankingConvert: { none: {} },
    },
})

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

const ranks = await prisma.academicRankingConvert.findMany({
    where: { rankOrder: { in: [1, 2] } },
    select: { id: true },
})

for (const rank of ranks) {
    await prisma.graduationRankDowngradeRule.create({
        data: {
            initialRankId: rank.id,
            conditions: {
                create: {
                    field: 'CONDUCT_SCORE',
                    operator: 'LT',
                    value: 80,
                },
            },
        },
    })
}

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
