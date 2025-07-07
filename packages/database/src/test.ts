import { PrismaClient } from '@prisma/client'
import { academicRankingConversions } from './seed/academic-ranking-convert'

const prisma = new PrismaClient()

const trainingCourses = await prisma.trainingCourse.findMany()

await Promise.all(
    trainingCourses.map((trainingCourse) =>
        prisma.academicRankingConvert.createMany({
            data: academicRankingConversions.map((item) => ({
                trainingCourseId: trainingCourse.id,
                ...item,
            })),
        })
    )
)
