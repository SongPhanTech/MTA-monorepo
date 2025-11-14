import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

await prisma.templateFile.createMany({
    skipDuplicates: true,
    data: [
        {
            name: 'Kết quả xác minh văn bằng',
            code: 'XAC_MINH_VAN_BANG',
            path: 'https://minio.swantech.vn/mta/template/XAC_MINH_VAN_BANG.xlsx',
            fileType: 'DOWNLOAD',
            extensions: 'xlsx',
            numberField: 0,
        },
    ],
})
