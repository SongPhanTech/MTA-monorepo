import { $Enums, PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

await prisma.diplomaType.createMany({
    skipDuplicates: true,
    data: [
        {
            name: 'BẰNG KỸ SƯ',
            englishName: 'THE DEGREE OF ENGINEER',
            code: 'BS',
            type: $Enums.DiplomaTypeEnum.ENGINEER,
        },
        {
            name: 'BẰNG CỬ NHÂN',
            englishName: 'THE DEGREE OF BACHELOR',
            code: 'BC',
            type: $Enums.DiplomaTypeEnum.BACHELOR,
        },
        {
            name: 'BẰNG THẠC SĨ',
            englishName: 'THE DEGREE OF MASTER',
            code: 'BThS',
            type: $Enums.DiplomaTypeEnum.MASTER,
        },
        {
            name: 'BẰNG TIẾN SĨ',
            englishName: 'THE DEGREE OF DOCTORATE',
            code: 'BTS',
            type: $Enums.DiplomaTypeEnum.DOCTORATE,
        },
    ],
})
