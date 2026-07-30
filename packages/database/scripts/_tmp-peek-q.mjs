import { PrismaClient } from "../generated/prisma-client/index.js"
const p = new PrismaClient()
const qs = await p.$queryRawUnsafe(`
SELECT id, LEFT(content,120) AS content, type, point, difficult, "createdAt"
FROM "khao-thi"."Question"
WHERE "questionBankId" = 'cms5jz1sf0001sh3196x8vxp4' AND "deletedAt" IS NULL`)
console.log(JSON.stringify(qs, null, 2))
await p.$disconnect()
