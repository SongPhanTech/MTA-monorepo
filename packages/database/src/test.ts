import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const data = Array.from({ length: 100 }, (_, i) => ({
    code: `NH${2030 + i}`,
    name: `Năm học ${2030 + i}`,
    order: i + 100,
    startDate: new Date(),
}))
const years = await prisma.schoolYear.deleteMany({
    where: {
        order: {
            gte: 100,
        },
    },
})

console.log(years)
