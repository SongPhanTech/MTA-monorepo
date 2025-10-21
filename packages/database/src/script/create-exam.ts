import { PrismaClient } from '../../generated/prisma-client'

const prisma = new PrismaClient()

const cls = await prisma.subjectClass.findFirstOrThrow({
    where: { subjectClassStudent: { some: {} } },
    include: { subjectClassStudent: true },
})

const exam = await prisma.exam.create({
    data: { subjectClass: { connect: { id: cls.id } } },
})

const room = await prisma.room.findFirstOrThrow()

const examRoom = await prisma.examRoom.create({
    data: {
        examId: exam.id,
        roomId: room.id,
    },
})

await prisma.examSession.createMany({
    data: cls.subjectClassStudent.map((s) => ({
        examId: exam.id,
        examRoomId: examRoom.id,
        studentSubjectScoreId: s.id,
    })),
})

console.log(cls.subjectClassStudent.length)

console.log('examId', exam.id)
console.log('roomId', room.id)
console.log('classId', cls.id)
