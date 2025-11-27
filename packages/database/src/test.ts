import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const subjects = await prisma.subject.findMany({
    where: { subjectVersion: { some: { name: { contains: 'tra', mode: 'insensitive' } } } },
})

console.log(subjects.map((subject) => subject.managementOrganization))
console.log(
    JSON.stringify({
        where: { subjectVersion: { some: {} } },
    })
)
