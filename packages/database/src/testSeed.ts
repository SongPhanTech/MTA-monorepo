import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const semesters = await prisma.semester.findMany({
    include: {
        subjectClasses: {
            select: {
                id: true,
            },
        },
    },
})

for (const semester of semesters) {
    await prisma.subjectClass.updateMany({
        data: {
            startDate: semester.startDate,
            endDate: semester.endDate,
        },
    })
}
