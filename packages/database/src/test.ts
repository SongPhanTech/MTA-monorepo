import { PrismaClient } from '@prisma/client'
import { academicRankingGraduation, academicRankingStudying } from './seed/academic-ranking-convert'

const prisma = new PrismaClient()

const trainingCourses = await prisma.trainingCourse.findMany()

await Promise.all(
    trainingCourses.map((trainingCourse) =>
        prisma.academicRankingConvert.createMany({
            data: [...academicRankingGraduation, ...academicRankingStudying].map((item) => ({
                trainingCourseId: trainingCourse.id,
                ...item,
            })),
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
