import { PrismaClient } from '../../generated/prisma-client'

const prisma = new PrismaClient()

const exam = await prisma.exam.findFirstOrThrow({
    where: { id: 'cmfp8airj002ap101ioomsz24' },
})
const room = await prisma.room.findFirstOrThrow({
    where: { id: 'cmfumsshh00031pdd2k9qq6v4' },
})

const cls = await prisma.subjectClass.findFirstOrThrow({
    where: { subjectClassStudent: { some: {} } },
    include: { subjectClassStudent: true },
})

console.log('examId', exam.id)
console.log('roomId', room.id)
console.log('classId', cls.id)

console.log(cls.subjectClassStudent.length)

await prisma.exam.update({
    where: { id: exam.id },
    data: {
        subjectClass: {
            connect: { id: cls.id },
        },
        studentSubjectScore: {
            connect: cls.subjectClassStudent.map((s) => ({ id: s.id })),
        },
    },
})

const examRoom = await prisma.examRoom.create({
    data: {
        examId: exam.id,
        roomId: room.id,
        examSessions: {
            createMany: {
                data: cls.subjectClassStudent.map((s) => ({
                    examId: exam.id,
                    studentSubjectScoreId: s.id,
                })),
            },
        },
    },
})
