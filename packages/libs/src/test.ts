import { PrismaClient } from '@workspace/db'

const prisma = new PrismaClient({
    datasourceUrl: 'postgres://admin:123456654321@192.168.3.37:5432/mta',
})

const classes = await prisma.subjectClass.findMany({
    where: {
        examId: { in: ['008528', '008529'] },
        cancelled: false,
        deletedAt: null,
        status: 'OFFICIAL',
    },
    select: {
        id: true,
        examId: true,
        subjectId: true,
        semesterId: true,
    },
})

console.log('classes', classes)

const subjectVersionIds = [...new Set(classes.map((cls) => cls.subjectId))]

console.log('subjectVersionIds', subjectVersionIds)
