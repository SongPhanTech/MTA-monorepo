import { PrismaClient } from '../generated/prisma-client'
import DMNhanvien from '../DM_Nhanvien.json'
const prisma = new PrismaClient()

const ids = DMNhanvien.map((item) => item.sCCCD.toLowerCase())

console.log(ids.length, ids[0])

const profiles = await prisma.userProfile.findMany({
    // data: {
    //   bLaGiangVien: false,
    // },
    where: {
        bLaGiangVien: true,
        lecturer: null,
    },
})

console.log(profiles.length)

// const missing = ids.filter((id) => !profiles.some((p) => p.id === id));

// console.log(missing.length, missing);
