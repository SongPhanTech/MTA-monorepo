import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const users = await prisma.userProfile.findMany({
    where: {
        id: {
            startsWith: 'cmi',
        },
    },
})

for (const user of users) {
    await prisma.userProfile.update({
        where: {
            id: user.id,
        },
        data: {
            id: crypto.randomUUID(),
        },
    })
}
