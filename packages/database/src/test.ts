import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

await prisma.semester.deleteMany({})
await prisma.schoolYear.deleteMany({})
