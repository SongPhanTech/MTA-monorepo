import { calcFinalScore } from '../../../libs/src/utils'
import { PrismaClient } from '../../generated/prisma-client'

const prisma = new PrismaClient()

await prisma.studentSubjectScore.updateMany({
    where: {
        attendanceScore: { gte: 5 },
        midtermScore: { gte: 5 },
    },
    data: {
        examBanned: false,
        examBannedReason: null,
    },
})
