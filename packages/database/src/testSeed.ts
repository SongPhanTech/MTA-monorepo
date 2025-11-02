import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const now = new Date().toISOString()

await prisma.templateFile.createMany({
    skipDuplicates: true,
    data: [
        {
            name: 'Danh sách giảng viên',
            code: 'DANH_SACH_GV',
            path: 'https://minio.swantech.vn/mta/template/danh_sach_GV.xlsx',
            fileType: 'DOWNLOAD',
            extensions: 'xlsx',
            numberField: 0,
        },
    ],
})

// console.log(semesters)
