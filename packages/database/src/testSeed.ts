import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const now = new Date().toISOString()

const data = await prisma.curriculum.findMany({
    where: { trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000', deletedAt: null },
    include: {
        curriculumVersion: {
            where: { trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000' },
            include: {
                trainingTime: true,
                trainingBlocks: { include: { subjects: { include: { subject: true } } } },
                trainingObjectType: true,
                documentFiles: true,
                fixedClasses: { include: { trainingCourse: true } },
            },
            orderBy: [{ name: 'asc' }],
        },
        managementOrganization: true,
        trainingMajor: true,
    },
    orderBy: { createdAt: 'desc' },
    // take: 10,
    // skip: 0,
})

console.log(data.length)
