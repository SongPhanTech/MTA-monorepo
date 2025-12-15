import { PrismaClient } from '@workspace/db'
import { postDMNhanViens } from './api/system'

const prisma = new PrismaClient()

const block = await prisma.trainingBlockOnCurriculumVersion.deleteMany({
    where: {
        subjects: {
            none: {},
        },
    },
})

console.log(block)
