import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const organization = await prisma.organization.create({
    data: {
        name: 'Khoa CNTT',
        type: { create: { name: 'Khoa' } },
    },
})

const curriculum = await prisma.curriculum.create({
    data: {
        name: 'Công nghệ thông tin',
        code: 'CNTT-2023',
        information:
            'Công nghệ thông tin là ngành học về máy tính và công nghệ thông tin.',
        description:
            'Chương trình đào tạo Công nghệ thông tin cung cấp kiến thức và kỹ năng về lập trình, quản trị hệ thống, và phát triển phần mềm.',
        startDate: new Date(),
        managementOrganization: { connect: { id: organization.id } },
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
        trainingMajor: {
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
        trainingTime: { create: { name: '4 năm' } },
        curriculumVersion: {
            create: {
                name: 'Công nghệ thông tin 2023',
                code: 'CNTT-DS-2023',
                numberOfSemesters: 10,
                startDate: new Date(),
            },
        },
    },
})

console.log('Curriculum created:', curriculum)
