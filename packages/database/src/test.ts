import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const res = await prisma.clusterSurvey.findFirst({
    where: { id: 'cmhfq73lz0000lx01vrk9968q' },
    include: {
        _count: {
            select: {
                surveyQuestion: true,
                surveyChoice: true,
            },
        },
        surveys: {
            select: {
                _count: {
                    select: {
                        surveyQuestion: true,
                        surveyChoice: true,
                    },
                },
            },
        },
    },
})
console.log('Subject Versions:', JSON.stringify(res, null, 2))
