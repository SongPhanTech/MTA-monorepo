import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const profile = await prisma.userProfile.findMany({
    where: {
        bLaHocVien: true,
        sDM_DonViId: null,
    },
})

await prisma.lecturer.deleteMany({
    where: {
        userProfile: {
            fullname: 'Bùi Thành Luân',
        },
    },
})

console.log(
    profile.map((p) => p.fullname),
    profile.length
)
