import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

await prisma.examRoom.deleteMany({
    where: {
        exam: {
            subjectClass: {
                none: {},
            },
        },
    },
})

await prisma.exam.deleteMany({
    where: {
        subjectClass: {
            none: {},
        },
    },
})

const exams = await prisma.exam.findMany({
    include: {
        subjectClass: true,
    },
})

await Promise.all(
    exams.map((exam) => {
        return prisma.exam.update({
            where: { id: exam.id },
            data: {
                semesterId: exam.subjectClass[0]?.semesterId,
            },
        })
    })
)
