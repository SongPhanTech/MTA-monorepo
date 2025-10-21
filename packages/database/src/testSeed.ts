import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

// cuid to uuid
const profiles = await prisma.userProfile.findMany({
    where: { id: { contains: 'cm' } },
    select: { id: true },
})

const updates = profiles.map(({ id }) => ({
    id,
    newId: crypto.randomUUID(),
}))

console.log(updates)

await prisma.$executeRawUnsafe(`
        UPDATE "ql-nguoi-dung"."UserProfile" AS p
        SET "id" = data."newId"
        FROM (
            VALUES
            ${updates.map((u) => `('${u.id}', '${u.newId}')`).join(',\n')}
        ) AS data("id", "newId")
        WHERE p."id" = data."id";
        `)
