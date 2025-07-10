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
