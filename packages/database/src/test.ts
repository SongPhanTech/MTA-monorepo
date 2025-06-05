import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const data = await prisma.trainingField.findMany({
    include: {
        organization: true,
    },
})

console.log(data)
