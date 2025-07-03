import { PrismaClient } from '@prisma/client'
import { academicWarningRules } from './seed/academic-warning-rule'

const prisma = new PrismaClient()

const trainingCourses = await prisma.trainingCourse.findMany()

await Promise.all(
    trainingCourses.map((trainingCourse) =>
        prisma.academicWarningRule.createMany({
            data: academicWarningRules.map((rule) => ({
                trainingCourseId: trainingCourse.id,
                ...rule,
            })),
        })
    )
)
