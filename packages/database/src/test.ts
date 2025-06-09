import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

await prisma.$executeRaw`
    UPDATE "ql-nguoi-dung"."UserProfile"
    SET "fullname" = concat("firstName", ' ', "lastName");
  `
