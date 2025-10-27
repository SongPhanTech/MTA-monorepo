import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const now = new Date().toISOString()

await prisma.templateFile.createMany({
    skipDuplicates: true,
    data: [
        {
            name: 'Thống kê nợ môn',
            code: 'THONG_KE_NO',
            path: 'https://minio.swantech.vn/mta/template/thong_ke_no.xlsx',
            fileType: 'DOWNLOAD',
            extensions: 'xlsx',
            numberField: 0,
        },
    ],
})

// console.log(semesters)
