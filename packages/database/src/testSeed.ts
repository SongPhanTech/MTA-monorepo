import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const now = new Date().toISOString()

const semesters = await prisma.semester.findFirst({
    where: {
        startDate: { lte: now },
        endDate: { gte: now },
    },
})

console.log(semesters)
