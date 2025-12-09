import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

await prisma.userProfile.updateMany({
    where: {
        educationAndTraining: { some: {} },
    },
    data: { bLaHocVien: true },
})

await prisma.userProfile.updateMany({
    where: {
        lecturer: {},
    },
    data: { bLaGiangVien: true, bLaCanBoNhanVien: true, bLaNguoiDung: true },
})
