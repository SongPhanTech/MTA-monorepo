import { $Enums, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Seed OrganizationType
    await prisma.organizationType.createMany({
        data: [
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Khoa',
                code: 'K',
                description: 'Khoa',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Bộ môn',
                code: 'BM',
                description: 'Bộ môn',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Phòng',
                code: 'P',
                description: 'Phòng',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440003',
                name: 'Trung tâm',
                code: 'TT',
                description: 'Trung tâm',
                createdAt: new Date('2025-04-03T12:58:43.507Z'),
                updatedAt: new Date('2025-04-03T12:58:43.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440004',
                name: 'Viện',
                code: 'V',
                description: 'Viện',
                createdAt: new Date('2025-04-03T12:58:44.507Z'),
                updatedAt: new Date('2025-04-03T12:58:44.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440005',
                name: 'Trường',
                code: 'T',
                description: 'Trường',
                createdAt: new Date('2025-04-03T12:58:45.507Z'),
                updatedAt: new Date('2025-04-03T12:58:45.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440006',
                name: 'Đơn vị khác',
                code: 'DVK',
                description: 'Đơn vị khác',
                createdAt: new Date('2025-04-03T12:58:46.507Z'),
                updatedAt: new Date('2025-04-03T12:58:46.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440007',
                name: 'Tổ chức khác',
                code: 'TOK',
                description: 'Tổ chức khác',
                createdAt: new Date('2025-04-03T12:58:47.507Z'),
                updatedAt: new Date('2025-04-03T12:58:47.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440008',
                name: 'Hệ',
                code: 'H',
                description: 'Hệ',
                createdAt: new Date('2025-04-03T12:58:48.507Z'),
                updatedAt: new Date('2025-04-03T12:58:48.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440009',
                name: 'Tiểu đoàn',
                code: 'd',
                description: 'Tiểu đoàn',
                createdAt: new Date('2025-04-03T12:58:49.507Z'),
                updatedAt: new Date('2025-04-03T12:58:49.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440010',
                name: 'Đại đội',
                code: 'C',
                description: 'Đại đội',
                createdAt: new Date('2025-04-03T12:58:50.507Z'),
                updatedAt: new Date('2025-04-03T12:58:50.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440011',
                name: 'Ban',
                code: 'B',
                description: 'Ban',
                createdAt: new Date('2025-04-03T12:58:51.507Z'),
                updatedAt: new Date('2025-04-03T12:58:51.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440012',
                name: 'Lớp',
                code: 'L',
                description: 'Lớp',
                createdAt: new Date('2025-04-03T12:58:52.507Z'),
                updatedAt: new Date('2025-04-03T12:58:52.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440013',
                name: 'Đội',
                code: 'D',
                description: 'Đội',
                createdAt: new Date('2025-04-03T12:58:53.507Z'),
                updatedAt: new Date('2025-04-03T12:58:53.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440015',
                name: 'Trung đội',
                code: 'TD',
                description: 'Trung đội',
                createdAt: new Date('2025-04-03T12:58:54.507Z'),
                updatedAt: new Date('2025-04-03T12:58:54.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440016',
                name: 'Chi đoàn',
                code: 'CD',
                description: 'Chi đoàn',
                createdAt: new Date('2025-04-03T12:58:55.507Z'),
                updatedAt: new Date('2025-04-03T12:58:55.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440017',
                name: 'Chi hội',
                code: 'CH',
                description: 'Chi hội',
                createdAt: new Date('2025-04-03T12:58:56.507Z'),
                updatedAt: new Date('2025-04-03T12:58:56.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440018',
                name: 'Chi bộ',
                code: 'CB',
                description: 'Chi bộ',
                createdAt: new Date('2025-04-03T12:58:57.507Z'),
                updatedAt: new Date('2025-04-03T12:58:57.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440019',
                name: 'Đoàn thể khác',
                code: 'ĐTK',
                description: 'Đoàn thể khác',
                createdAt: new Date('2025-04-03T12:58:58.507Z'),
                updatedAt: new Date('2025-04-03T12:58:58.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440020',
                name: 'Đoàn',
                code: 'Đ',
                description: 'Đoàn',
                createdAt: new Date('2025-04-03T12:58:59.507Z'),
                updatedAt: new Date('2025-04-03T12:58:59.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440021',
                name: 'Đoàn thanh niên',
                code: 'ĐTN',
                description: 'Đoàn thanh niên',
                createdAt: new Date('2025-04-03T12:59:00.507Z'),
                updatedAt: new Date('2025-04-03T12:59:00.507Z'),
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440022',
                name: 'Hội sinh viên',
                code: 'HSV',
                description: 'Hội sinh viên',
                createdAt: new Date('2025-04-03T12:59:01.507Z'),
                updatedAt: new Date('2025-04-03T12:59:01.507Z'),
            },
        ],
    })

    // Seed Organization
    await prisma.organization.createMany({
        data: [
            {
                id: '550e8400-1234-41d4-a716-446655440000',
                name: 'Học viện Kỹ thuật Quân sự',
                code: 'MTA',
                description: 'Học viện Kỹ thuật Quân sự',
                typeId: '550e8400-e29b-41d4-a716-446655440005',
                parentId: null,
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8400-1234-41d4-a716-446655440001',
                name: 'Khoa Công nghệ thông tin',
                code: 'K31',
                description: 'Khoa Công nghệ thông tin',
                typeId: '550e8400-e29b-41d4-a716-446655440000',
                parentId: '550e8400-1234-41d4-a716-446655440000',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
            {
                id: '550e8400-1234-41d4-a716-446655440002',
                name: 'Khoa Vũ Khí',
                code: 'K1',
                description: 'Khoa Vũ Khí',
                typeId: '550e8400-e29b-41d4-a716-446655440000',
                parentId: '550e8400-1234-41d4-a716-446655440000',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
            },
        ],
    })

    /// Seed UserType
    // await prisma.userType.createMany({
    //     data: [
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440000',
    //             name: 'Sinh viên',
    //             code: 'SV',
    //             description: 'Sinh viên dân sự',
    //             createdAt: new Date('2025-04-03T12:58:40.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:40.507Z'),
    //         },
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440001',
    //             name: 'Học viên',
    //             code: 'HV',
    //             description: 'Học viên quân sự chính quy',
    //             createdAt: new Date('2025-04-03T12:58:41.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:41.507Z'),
    //         },
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440002',
    //             name: 'Giảng viên',
    //             code: 'GV',
    //             description: 'Giảng viên',
    //             createdAt: new Date('2025-04-03T12:58:42.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:42.507Z'),
    //         },
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440003',
    //             name: 'Cán bộ',
    //             code: 'CB',
    //             description: 'Cán bộ',
    //             createdAt: new Date('2025-04-03T12:58:43.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:43.507Z'),
    //         },
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440004',
    //             name: 'Nhân viên',
    //             code: 'NV',
    //             description: 'Nhân viên hợp đồng',
    //             createdAt: new Date('2025-04-03T12:58:44.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:44.507Z'),
    //         },
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440005',
    //             name: 'Người lao động',
    //             code: 'NLĐ',
    //             description: 'Người lao động',
    //             createdAt: new Date('2025-04-03T12:58:45.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:45.507Z'),
    //         },
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440006',
    //             name: 'Quân nhân chuyên nghiệp',
    //             code: 'QNCN',
    //             description: 'Quân nhân chuyên nghiệp',
    //             createdAt: new Date('2025-04-03T12:58:46.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:46.507Z'),
    //         },
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440007',
    //             name: 'Nghĩa vụ',
    //             code: 'L',
    //             description: 'Lính nghĩa vụ',
    //             createdAt: new Date('2025-04-03T12:58:47.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:47.507Z'),
    //         },
    //         {
    //             id: '550e8401-e29b-41d4-a716-446655440008',
    //             name: 'Quốc tế',
    //             code: 'QT',
    //             description: 'Học viên quốc tế',
    //             createdAt: new Date('2025-04-03T12:58:48.507Z'),
    //             updatedAt: new Date('2025-04-03T12:58:48.507Z'),
    //         },
    //     ],
    // })

    // Seed TrainingObjectType
    await prisma.trainingObjectType.createMany({
        data: [
            {
                id: '550e8402-e29b-41d4-a716-446655440000',
                name: 'Quân sự',
                code: 'QS',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8402-e29b-41d4-a716-446655440001',
                name: 'Dân sự',
                code: 'DS',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
            {
                id: '550e8402-e29b-41d4-a716-446655440002',
                name: 'Quốc tế',
                code: 'QT',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
            },
        ],
    })

    // Seed TrainingType
    await prisma.trainingType.createMany({
        data: [
            {
                id: '550e8403-e29b-41d4-a716-446655440000',
                name: 'Chính quy',
                code: 'CQ',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8403-e29b-41d4-a716-446655440001',
                name: 'Không chính quy',
                code: 'KCQ',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
            {
                id: '550e8403-e29b-41d4-a716-446655440002',
                name: 'Từ xa',
                code: 'TX',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
            },
            {
                id: '550e8403-e29b-41d4-a716-446655440003',
                name: 'Tại chức',
                code: 'TC',
                createdAt: new Date('2025-04-03T12:58:43.507Z'),
                updatedAt: new Date('2025-04-03T12:58:43.507Z'),
            },
        ],
    })

    // Seed TrainingLevel
    await prisma.trainingLevel.createMany({
        data: [
            {
                id: '550e8404-e29b-41d4-a716-446655440000',
                name: 'Đại học',
                code: 'ĐH',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8404-e29b-41d4-a716-446655440001',
                name: 'Thạc sĩ',
                code: 'ThS',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
            {
                id: '550e8404-e29b-41d4-a716-446655440002',
                name: 'Tiến sĩ',
                code: 'TS',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
            },
        ],
    })

    // Seed TrainingForm
    await prisma.trainingForm.createMany({
        data: [
            {
                id: '550e8405-e29b-41d4-a716-446655440000',
                name: 'Trực tiếp',
                code: 'TT',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8405-e29b-41d4-a716-446655440001',
                name: 'Trực tuyến',
                code: 'TTY',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
            {
                id: '550e8405-e29b-41d4-a716-446655440002',
                name: 'Kết hợp',
                code: 'KH',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
            },
        ],
    })

    // Seed TrainingCourse
    await prisma.trainingCourse.createMany({
        data: [
            {
                id: '550e8406-e29b-41d4-a716-446655440000',
                code: 'K31',
                name: 'Khóa 31',
                description: 'Khóa 31',
                startDate: new Date('2025-04-03T12:58:40.507Z'),
                trainingLevelId: '550e8404-e29b-41d4-a716-446655440000',
                trainingTypeId: '550e8403-e29b-41d4-a716-446655440000',
                trainingFormId: '550e8405-e29b-41d4-a716-446655440000',
                trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8406-e29b-41d4-a716-446655440001',
                code: 'K32',
                name: 'Khóa 32',
                description: 'Khóa 32',
                startDate: new Date('2025-04-03T12:58:41.507Z'),
                trainingLevelId: '550e8404-e29b-41d4-a716-446655440001',
                trainingTypeId: '550e8403-e29b-41d4-a716-446655440001',
                trainingFormId: '550e8405-e29b-41d4-a716-446655440001',
                trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440001',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
            {
                id: '550e8406-e29b-41d4-a716-446655440002',
                code: 'K33',
                name: 'Khóa 33',
                description: 'Khóa 33',
                startDate: new Date('2025-04-03T12:58:42.507Z'),
                trainingLevelId: '550e8404-e29b-41d4-a716-446655440002',
                trainingTypeId: '550e8403-e29b-41d4-a716-446655440002',
                trainingFormId: '550e8405-e29b-41d4-a716-446655440002',
                trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440002',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
            },
        ],
    })

    // Seed FixedClass
    await prisma.fixedClass.createMany({
        data: [
            {
                id: '550e8407-e29b-41d4-a716-446655440000',
                name: 'CNTT',
                code: 'CNTT_K31',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440000',
                managementOrganizationId:
                    '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: '550e8407-e29b-41d4-a716-446655440001',
                name: 'VK',
                code: 'VK_K31',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440000',
                managementOrganizationId:
                    '550e8400-1234-41d4-a716-446655440002',
            },
            {
                id: '550e8407-e29b-41d4-a716-446655440002',
                name: 'CNTT',
                code: 'CNTT_K32',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440001',
                managementOrganizationId:
                    '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: '550e8407-e29b-41d4-a716-446655440003',
                name: 'VK',
                code: 'VK_K32',
                createdAt: new Date('2025-04-03T12:58:43.507Z'),
                updatedAt: new Date('2025-04-03T12:58:43.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440001',
                managementOrganizationId:
                    '550e8400-1234-41d4-a716-446655440002',
            },
            {
                id: '550e8407-e29b-41d4-a716-446655440004',
                name: 'CNTT',
                code: 'CNTT_K33',
                createdAt: new Date('2025-04-03T12:58:44.507Z'),
                updatedAt: new Date('2025-04-03T12:58:44.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440002',
                managementOrganizationId:
                    '550e8400-1234-41d4-a716-446655440000',
            },
        ],
    })

    // Seed TemplateFile
    await prisma.templateFile.createMany({
        data: [
            {
                id: '550e8408-e29b-41d4-a716-446655440000',
                name: 'File nhập thông tin học viên mới',
                code: 'IMPORT_USERPROFILE',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                path: 'https://minio.swantech.vn/mta/template/fileNhapMauThongTinHocVien.xlsx',
                fileType: 'UPLOAD',
                extensions: 'xlsx',
                numberField: 0,
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440001',
                name: 'File cập nhập thông tin người dùng',
                code: 'UPDATE_USERPROFILE',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                path: 'https://minio.swantech.vn/mta/template/fileCapNhatThongTin.xlsx',
                fileType: 'UPLOAD',
                extensions: 'xlsx',
                numberField: 0,
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440002',
                name: 'File tạo lớp biên chế',
                code: 'IMPORT_FIXCLASS',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                path: 'https://minio.swantech.vn/mta/template/fileDanhSachLopBienChe.xlsx',
                fileType: 'UPLOAD',
                extensions: 'xlsx',
                numberField: 0,
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440003',
                name: 'File xếp lớp',
                code: 'CLASS_DEVISION',
                createdAt: new Date('2025-04-03T12:58:43.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                path: 'https://minio.swantech.vn/mta/template/fileXepLopHocVien.xlsx',
                fileType: 'UPLOAD',
                extensions: 'xlsx',
                numberField: 0,
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440004',
                name: 'File danh sách học viên lớp',
                code: 'LIST_STUDENT_FIXCLASS',
                createdAt: new Date('2025-04-03T12:58:43.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                path: 'https://minio.swantech.vn/mta/template/DanhSachHocVienLop.docx',
                fileType: 'DOWNLOAD',
                extensions: 'docx',
                numberField: 0,
            },
        ],
    })

    // Seed PriorityObject
    await prisma.priorityObject.createMany({
        data: [
            {
                id: '550e8409-e29b-41d4-a716-446655440000',
                name: 'Đối tượng 1',
                code: 'DOITUONG1',
                createdAt: new Date('2025-04-03T12:58:44.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440001',
                name: 'Đối tượng 2',
                code: 'DOITUONG2',
                createdAt: new Date('2025-04-03T12:58:45.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440002',
                name: 'Đối tượng 3',
                code: 'DOITUONG3',
                createdAt: new Date('2025-04-03T12:58:46.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed RegistrationArea
    await prisma.registrationArea.createMany({
        data: [
            {
                id: '550e840a-e29b-41d4-a716-446655440000',
                name: 'Khu vực 1',
                code: 'KV1',
                createdAt: new Date('2025-04-03T12:58:47.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840a-e29b-41d4-a716-446655440001',
                name: 'Khu vực 2',
                code: 'KV2',
                createdAt: new Date('2025-04-03T12:58:48.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840a-e29b-41d4-a716-446655440002',
                name: 'Khu vực 3',
                code: 'KV3',
                createdAt: new Date('2025-04-03T12:58:49.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed Nationality
    await prisma.nationality.createMany({
        data: [
            {
                id: '550e840b-e29b-41d4-a716-446655440000',
                name: 'Việt Nam',
                code: 'VN',
                createdAt: new Date('2025-04-03T12:58:50.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840b-e29b-41d4-a716-446655440001',
                name: 'Lào',
                code: 'LAO',
                createdAt: new Date('2025-04-03T12:58:51.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840b-e29b-41d4-a716-446655440002',
                name: 'Campuchia',
                code: 'CAM',
                createdAt: new Date('2025-04-03T12:58:52.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840b-e29b-41d4-a716-446655440003',
                name: 'Khác',
                code: 'Khac',
                createdAt: new Date('2025-04-03T12:58:53.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed Religion
    await prisma.religion.createMany({
        data: [
            {
                id: '550e840c-e29b-41d4-a716-446655440000',
                name: 'Phật giáo',
                code: 'PG',
                createdAt: new Date('2025-04-03T12:58:54.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840c-e29b-41d4-a716-446655440001',
                name: 'Thiên chúa giáo',
                code: 'TCC',
                createdAt: new Date('2025-04-03T12:58:55.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840c-e29b-41d4-a716-446655440002',
                name: 'Hồi giáo',
                code: 'HG',
                createdAt: new Date('2025-04-03T12:58:56.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed Ethnicity
    await prisma.ethnicity.createMany({
        data: [
            {
                id: '550e840d-e29b-41d4-a716-446655440000',
                name: 'Kinh',
                code: 'K',
                createdAt: new Date('2025-04-03T12:58:57.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840d-e29b-41d4-a716-446655440001',
                name: 'Thái',
                code: 'T',
                createdAt: new Date('2025-04-03T12:58:58.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840d-e29b-41d4-a716-446655440002',
                name: 'Khmer',
                code: 'KHM',
                createdAt: new Date('2025-04-03T12:58:59.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840d-e29b-41d4-a716-446655440003',
                name: 'Mường',
                code: 'M',
                createdAt: new Date('2025-04-03T12:59:00.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840d-e29b-41d4-a716-446655440004',
                name: 'Tày',
                code: 'TAY',
                createdAt: new Date('2025-04-03T12:59:01.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840d-e29b-41d4-a716-446655440005',
                name: 'Thổ',
                code: 'THO',
                createdAt: new Date('2025-04-03T12:59:02.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840d-e29b-41d4-a716-446655440006',
                name: 'Khác',
                code: 'Khac',
                createdAt: new Date('2025-04-03T12:59:03.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed TrainingRank
    await prisma.trainingRank.createMany({
        data: [
            {
                id: '550e840e-e29b-41d4-a716-446655440000',
                name: 'Xuất sắc',
                code: 'SX',
                createdAt: new Date('2025-04-03T12:59:04.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840e-e29b-41d4-a716-446655440001',
                name: 'Tốt',
                code: 'T',
                createdAt: new Date('2025-04-03T12:59:05.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840e-e29b-41d4-a716-446655440002',
                name: 'Khá',
                code: 'K',
                createdAt: new Date('2025-04-03T12:59:06.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed TrainingLocation
    await prisma.trainingLocation.createMany({
        data: [
            {
                id: '550e840f-e29b-41d4-a716-446655440000',
                name: 'Khu A',
                code: 'A',
                createdAt: new Date('2025-04-03T12:59:07.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840f-e29b-41d4-a716-446655440001',
                name: 'Xuân Phương',
                code: 'XP',
                createdAt: new Date('2025-04-03T12:59:08.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e840f-e29b-41d4-a716-446655440002',
                name: 'Vĩnh Phúc',
                code: 'VP',
                createdAt: new Date('2025-04-03T12:59:09.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed SchoolYear
    await prisma.schoolYear.createMany({
        data: [
            {
                id: '550e8408-e29b-41d4-a716-446655440000',
                name: '2025-2026',
                code: '2025-2026',
                order: 1,
                startDate: new Date('2025-04-03T12:58:40.507Z'),
                endDate: new Date('2026-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:10.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440001',
                name: '2026-2027',
                code: '2026-2027',
                order: 2,
                startDate: new Date('2026-04-03T12:58:40.507Z'),
                endDate: new Date('2027-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:11.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440002',
                name: '2027-2028',
                code: '2027-2028',
                order: 3,
                startDate: new Date('2027-04-03T12:58:40.507Z'),
                endDate: new Date('2028-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:12.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed Semester
    await prisma.semester.createMany({
        data: [
            {
                id: '550e8409-e29b-41d4-a716-446655440000',
                name: 'Học kỳ 1',
                shortName: 'HK1',
                semesterType: $Enums.SemesterType.FIRST,
                order: 1,
                startDate: new Date('2025-04-03T12:58:40.507Z'),
                endDate: new Date('2025-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:13.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440000',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440001',
                name: 'Học kỳ 2',
                shortName: 'HK2',
                semesterType: $Enums.SemesterType.SECOND,
                order: 2,
                startDate: new Date('2025-10-03T12:58:40.507Z'),
                endDate: new Date('2026-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:14.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440000',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440002',
                name: 'Học kỳ hè',
                shortName: 'HKHE',
                order: 3,
                startDate: new Date('2026-04-03T12:58:40.507Z'),
                endDate: new Date('2026-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:15.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440000',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440003',
                name: 'Học kỳ 1',
                shortName: 'HK1',
                semesterType: $Enums.SemesterType.FIRST,
                order: 1,
                startDate: new Date('2026-04-03T12:58:40.507Z'),
                endDate: new Date('2026-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:16.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440001',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440004',
                name: 'Học kỳ 2',
                shortName: 'HK2',
                semesterType: $Enums.SemesterType.SECOND,
                order: 2,
                startDate: new Date('2026-10-03T12:58:40.507Z'),
                endDate: new Date('2027-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:17.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440001',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440005',
                name: 'Học kỳ hè',
                shortName: 'HKHE',
                order: 3,
                startDate: new Date('2027-04-03T12:58:40.507Z'),
                endDate: new Date('2027-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:18.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440001',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440006',
                name: 'Học kỳ 1',
                shortName: 'HK1',
                semesterType: $Enums.SemesterType.FIRST,
                order: 1,
                startDate: new Date('2027-04-03T12:58:40.507Z'),
                endDate: new Date('2027-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:19.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440002',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440007',
                name: 'Học kỳ 2',
                shortName: 'HK2',
                semesterType: $Enums.SemesterType.SECOND,
                order: 2,
                startDate: new Date('2027-10-03T12:58:40.507Z'),
                endDate: new Date('2028-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:20.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440002',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440008',
                name: 'Học kỳ hè',
                shortName: 'HKHE',
                order: 3,
                startDate: new Date('2028-04-03T12:58:40.507Z'),
                endDate: new Date('2028-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:21.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440002',
            },
        ],
    })

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
                                organization: {
                                    connect: { id: organization.id },
                                },
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
}

main()
    .catch((e) => {
        console.error(e)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
