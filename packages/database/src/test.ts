import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const organization = await prisma.organization.create({
    data: {
        name: 'Khoa CNTT',
        type: { create: { name: 'Khoa' } },
    },
})

// const organization = await prisma.organization.findFirstOrThrow({
//     where: { name: 'Khoa CNTT' },
// })

const curriculum = await prisma.curriculum.create({
    data: {
        name: 'Công nghệ thông tin',
        code: 'CNTT-2023',
        information:
            'Công nghệ thông tin là ngành học về máy tính và công nghệ thông tin.',
        description:
            'Chương trình đào tạo Công nghệ thông tin cung cấp kiến thức và kỹ năng về lập trình, quản trị hệ thống, và phát triển phần mềm.',
        managementOrganization: { connect: { id: organization.id } },

        trainingMajor: {
            connectOrCreate: {
                where: { code: 'CNTT' },
                create: {
                    name: 'Công nghệ thông tin',
                    code: 'CNTT',
                    englishName: 'Information Technology',
                    description:
                        'Chuyên ngành Công nghệ thông tin tập trung vào phát triển phần mềm và quản trị hệ thống.',
                    summary:
                        'Chuyên ngành Công nghệ thông tin cung cấp kiến thức về lập trình, cơ sở dữ liệu, và mạng máy tính.',
                    organization: { connect: { id: organization.id } },
                    trainingField: {
                        create: {
                            name: 'Công nghệ thông tin',
                            englishName: 'Information Technology',
                            publishDate: new Date(),
                            organization: { connect: { id: organization.id } },
                        },
                    },
                },
            },
        },

        curriculumVersion: {
            create: {
                name: 'Công nghệ thông tin 2023',
                code: 'CNTT-DS-2023',
                numberOfSemesters: 10,

                trainingObjectType: {
                    connectOrCreate: {
                        where: { name: 'Quân sư' },
                        create: { name: 'Quân sư' },
                    },
                },
                trainingLevel: {
                    connectOrCreate: {
                        where: { name: 'Đại học' },
                        create: { name: 'Đại học' },
                    },
                },
                trainingTime: { create: { name: '4 năm' } },
            },
        },
    },
})

const { id: curriculumVersionId } =
    await prisma.curriculumVersion.findFirstOrThrow({})
await prisma.trainingBlock.createMany({
    data: [
        {
            id: 'cmbol4z820dk1ms0124kqhtgw',
            code: 'GDDC2',
            active: true,
            description: null,
            deletedAt: null,
            createdAt: new Date('2025-06-09T04:21:48.243Z'),
            updatedAt: new Date('2025-06-09T04:21:48.243Z'),
            name: 'Giáo dục đại cương 2',
            priority: 9,
            curriculumVersionId,
        },
        {
            id: 'cmbol5u1q0dlhms01xe6914la',
            code: 'DATN3',
            active: true,
            description: null,
            deletedAt: null,
            createdAt: new Date('2025-06-09T04:22:28.191Z'),
            updatedAt: new Date('2025-06-09T04:22:28.191Z'),
            name: 'Đồ án tốt nghiệp, thì tốt nghiệp 3',
            priority: 4,
            curriculumVersionId,
        },
        {
            id: 'cmbol6rcs0dm9ms01dxcy3iv5',
            code: 'CHQLKT5',
            active: true,
            description: null,
            deletedAt: null,
            createdAt: new Date('2025-06-09T04:23:11.357Z'),
            updatedAt: new Date('2025-06-09T04:23:11.357Z'),
            name: 'test',
            priority: 16,
            curriculumVersionId,
        },
        {
            id: 'cmbokin8z0cz1ms01o3tmcvsx',
            code: 'DATN',
            active: true,
            description: null,
            deletedAt: null,
            createdAt: new Date('2025-06-09T04:04:26.292Z'),
            updatedAt: new Date('2025-06-09T06:35:16.206Z'),
            name: 'Đồ án tốt nghiệp, thì tốt nghiệp',
            priority: 4,
            curriculumVersionId,
        },
        {
            id: 'abc',
            code: 'KKT1',
            active: true,
            description: 'description',
            deletedAt: null,
            createdAt: new Date('2000-10-02T00:00:00Z'),
            updatedAt: new Date('2025-06-09T06:37:31.107Z'),
            name: 'Cơ sở ngành',
            priority: 11,
            curriculumVersionId,
        },
        {
            id: 'cmbokaoq60crems01krgrsm1v',
            code: 'CHQLKT',
            active: true,
            description: null,
            deletedAt: null,
            createdAt: new Date('2025-06-09T03:58:14.958Z'),
            updatedAt: new Date('2025-06-09T06:38:19.829Z'),
            name: 'CHQLKT',
            priority: 2,
            curriculumVersionId,
        },
        {
            id: 'cmbokc8dx0cswms01fdq0eigf',
            code: 'CTD',
            active: false,
            description: null,
            deletedAt: null,
            createdAt: new Date('2025-06-09T03:59:27.094Z'),
            updatedAt: new Date('2025-06-09T06:38:51.042Z'),
            name: 'Công tác Đảng, công tác chính trị',
            priority: 3,
            curriculumVersionId,
        },
        {
            id: 'cmbokswyu0d8fms01ijszirou',
            code: 'GDDC',
            active: false,
            description: null,
            deletedAt: null,
            createdAt: new Date('2025-06-09T04:12:25.446Z'),
            updatedAt: new Date('2025-06-09T06:39:04.809Z'),
            name: 'Giáo dục đại cương',
            priority: 7,
            curriculumVersionId,
        },
        {
            id: 'cmbokx8g50ddvms01jbpeaip1',
            code: 'DATN2',
            active: false,
            description: null,
            deletedAt: null,
            createdAt: new Date('2025-06-09T04:15:46.950Z'),
            updatedAt: new Date('2025-06-09T06:39:26.180Z'),
            name: 'Đồ án tốt nghiệp, thì tốt nghiệp 2',
            priority: 1,
            curriculumVersionId,
        },
        {
            id: 'cmbol7goj0dn5ms01xrk3bfcn',
            code: 'CTD10',
            active: true,
            description: null,
            deletedAt: new Date('2025-06-09T06:44:54.756Z'),
            createdAt: new Date('2025-06-09T04:23:44.179Z'),
            updatedAt: new Date('2025-06-09T06:44:55.194Z'),
            name: 'Công tác Đảng, công tác chính trị test',
            priority: 5,
            curriculumVersionId,
        },
        {
            id: 'cmbol59up0dkdms015ubnqd90',
            code: 'CHQLKT2',
            active: true,
            description: null,
            deletedAt: new Date('2025-06-09T06:45:50.942Z'),
            createdAt: new Date('2025-06-09T04:22:02.017Z'),
            updatedAt: new Date('2025-06-09T06:45:51.404Z'),
            name: 'abcg',
            priority: 11,
            curriculumVersionId,
        },
    ],
})

console.log('Curriculum created:', curriculum)
