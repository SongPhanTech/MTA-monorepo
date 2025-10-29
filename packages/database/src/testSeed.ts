import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const now = new Date().toISOString()

await prisma.templateFile.createMany({
    skipDuplicates: true,
    data: [
        {
            name: 'Thống kê khảo sát đơn',
            code: 'THONG_KE_KHAO_SAT_DON',
            path: 'https://minio.swantech.vn/mta/template/thong_ke_khao_sat_don.xlsx',
            fileType: 'DOWNLOAD',
            extensions: 'xlsx',
            numberField: 0,
        },
        {
            name: 'Thống kê khảo sát cụm',
            code: 'THONG_KE_KHAO_SAT_CUM',
            path: 'https://minio.swantech.vn/mta/template/thong_ke_khao_sat_cum.xlsx',
            fileType: 'DOWNLOAD',
            extensions: 'xlsx',
            numberField: 0,
        },
    ],
})

// console.log(semesters)
