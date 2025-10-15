import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

await prisma.subjectVersion.deleteMany({
    where: {
        trainingBlocks: { none: {} },
        questionBanks: { none: {} },
        subjectClass: { none: {} },
        knowledgeBlocks: { none: {} },
    },
})
