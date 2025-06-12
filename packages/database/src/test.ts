import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const semester = await prisma.semester.findFirstOrThrow();
const subject = await prisma.subjectVersion.findFirstOrThrow();

const c = await prisma.subjectClass.create({
  data: {
    name: 'CNTT61',
    startDate: new Date(),
    semesterId: semester.id,
    schedule: 'MORNING',
    subjectId: subject.id,
  }
})

console.log(c);
