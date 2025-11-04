import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const now = new Date().toISOString()

const data = await prisma.lecturer.findMany({
    where: {
        mainSubjectClasses: {
            some: {
                semester: { id: 'cmff4wak60029p401qhul7ld9' },
                trainingObjectTypeId: 'cmfaifezw00b9pm01pwevm1o2',
            },
        },
    },
    orderBy: { userProfile: { firstName: 'asc' } },
    // include: {
    //     userProfile: {
    //         include: { academicDegreeType: true, academicRankType: true, level: true, rank: true },
    //     },
    //     mainSubjectClasses: { include: { semester: true } },
    //     organization: true,
    // },
})

console.log(data.length, data)
