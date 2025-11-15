import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

await prisma.templateFile.createMany({
    skipDuplicates: true,
    data: [
        {
            name: 'slide tốt nghiệp',
            code: 'SLIDE_TN',
            path: 'https://minio.swantech.vn/mta/template/slide_TN.pptx',
            fileType: 'DOWNLOAD',
            extensions: 'xlsx',
            numberField: 0,
        },
    ],
})
