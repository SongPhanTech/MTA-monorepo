import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const names = ['Quản lý', 'Nghiên cứu', 'Hỗ trợ/Phục vụ']
await prisma.staffType.createMany({
    data: names.map((name) => ({
        name,
    })),
})
