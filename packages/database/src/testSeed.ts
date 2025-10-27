import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const now = new Date().toISOString()

await prisma.templateFile.createMany({
    skipDuplicates: true,
    data: [
        {
            name: 'Thống kê quân số học viên theo khoá',
            code: 'THONG_KE_QUAN_SO_HOC_VIEN_THEO_KHOA',
            path: 'https://minio.swantech.vn/mta/template/quan_so_hoc_vien_theo_khoa.xlsx',
            fileType: 'DOWNLOAD',
            extensions: 'xlsx',
            numberField: 0,
        },
    ],
})

// console.log(semesters)
