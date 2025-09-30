import { $Enums, PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

await prisma.diplomaType.createMany({
    skipDuplicates: true,
    data: [
        {
            name: 'Bằng kỹ sư',
            code: 'BS',
            type: $Enums.DiplomaTypeEnum.ENGINEER,
        },
        {
            name: 'Bằng cử nhân',
            code: 'BC',
            type: $Enums.DiplomaTypeEnum.BACHELOR,
        },
        {
            name: 'Bằng thạc sĩ',
            code: 'BTS',
            type: $Enums.DiplomaTypeEnum.MASTER,
        },
        {
            name: 'Bằng tiến sĩ',
            code: 'BTS',
            type: $Enums.DiplomaTypeEnum.DOCTORATE,
        },
    ],
})
