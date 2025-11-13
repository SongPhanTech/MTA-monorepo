import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const d = await prisma.graduationDecision.findMany({
    orderBy: [{ originalDiplomaNumber: 'desc' }, { createdAt: 'desc' }],
})

console.log(d.map((i) => i.originalDiplomaNumber))
