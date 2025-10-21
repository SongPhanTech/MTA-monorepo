import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const res = await prisma.subjectVersion.findMany({
    select: {
        name: true,
        code: true,
        id: true,
        studentSubjectScore: {
            where: {
                finalScore: {
                    lt: 4,
                },
            },
        },
    },
})
console.log('Subject Versions:', res)
