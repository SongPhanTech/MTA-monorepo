import { $Enums, AcademicRankingBaseType, ConfigKey, PrismaClient } from '@prisma/client'
import {
    academicRankingGraduationCivilian,
    academicRankingGraduationMilitary,
    academicRankingStudying,
} from './seed/academic-ranking-convert'
import { scoreConversions } from './seed/score-convert'
import { trainingData } from './seed/trainingData'

const prisma = new PrismaClient()

async function main() {
    const configs: Record<
        Exclude<ConfigKey, 'USER_SESSION_TIMEOUT' | 'ACADEMIC_ACTION_RULES'>,
        string
    > = {
        [ConfigKey.MANAGEMENT_DEPARTMENT]: 'Bộ Quốc Phòng',
        [ConfigKey.ACADEMY_NAME]: 'Học viện Kỹ thuật Quân sự',
        [ConfigKey.ACADEMY_CODE]: 'HVKTQS',
        [ConfigKey.DIRECTOR]: 'Trung tướng GS.TS Lê Minh Thái',

        [ConfigKey.PROVINCE]: 'Hà Nội',
        [ConfigKey.DISTRICT]: 'Bắc Từ Liêm',
        [ConfigKey.WARD]: 'Cổ Nhuế',
    }

    for (const [key, value] of Object.entries(configs) as [ConfigKey, string][]) {
        await prisma.config.upsert({
            where: { key },
            create: { key, value },
            update: { value },
        })
    }

    await prisma.defaultCouncilRolePayAmount.createMany({
        skipDuplicates: true,
        data: [
            {
                role: $Enums.CouncilRole.CHAIRMAN,
                amount: 200000,
            },
            {
                role: $Enums.CouncilRole.SECRETARY,
                amount: 150000,
            },
            {
                role: $Enums.CouncilRole.REVIEWER_1,
                amount: 150000,
            },
            {
                role: $Enums.CouncilRole.REVIEWER_2,
                amount: 150000,
            },
            {
                role: $Enums.CouncilRole.MEMBER,
                amount: 100000,
            },
        ],
    })

    // Seed Organization
    await prisma.dM_DonVi.createMany({
        skipDuplicates: true,
        data: [
            {
                Id: '550e8400-1234-41d4-a716-446655440000',
                sTen: 'Học viện Kỹ thuật Quân sự',
                sMa: 'MTA',
                sGhiChu: 'Học viện Kỹ thuật Quân sự',
                sParentId: null,
            },
            {
                Id: '550e8400-1234-41d4-a716-446655440001',
                sTen: 'Khoa Công nghệ thông tin',
                sMa: 'K58',
                sGhiChu: 'Khoa Công nghệ thông tin',
                sParentId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                Id: '550e8400-1234-41d4-a716-446655440002',
                sTen: 'Khoa Vũ Khí',
                sMa: 'K1',
                sGhiChu: 'Khoa Vũ Khí',
                sParentId: '550e8400-1234-41d4-a716-446655440000',
            },
        ],
    })

    // Seed TrainingObjectType
    await prisma.trainingObjectType.createMany({
        skipDuplicates: true,
        data: [
            {
                id: '550e8402-e29b-41d4-a716-446655440000',
                name: 'Đại học quân sự',
                code: 'QS',
                type: $Enums.TrainingObjectTypes.MILITARY,
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8402-e29b-41d4-a716-446655440001',
                name: 'Đại học dân sự',
                code: 'DS',
                type: $Enums.TrainingObjectTypes.CIVILIAN,
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
        ],
    })

    // Seed TrainingType
    await prisma.trainingType.createMany({
        skipDuplicates: true,
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
        skipDuplicates: true,
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

    await prisma.trainingTime.createMany({
        data: [
            {
                id: '4years',
                name: '4 năm',
            },
            {
                id: '5years',
                name: '5 năm',
            },
        ],
        skipDuplicates: true,
    })

    // Seed TrainingForm
    await prisma.trainingForm.createMany({
        skipDuplicates: true,
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

    // Seed SchoolYear
    await prisma.schoolYear.createMany({
        skipDuplicates: true,
        data: [
            {
                id: '550e8408-e29b-41d4-a716-446655440000',
                name: '2025-2026',
                code: '2025-2026',
                startDate: new Date('2025-04-03T12:58:40.507Z'),
                endDate: new Date('2026-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:10.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440001',
                name: '2026-2027',
                code: '2026-2027',
                startDate: new Date('2026-04-03T12:58:40.507Z'),
                endDate: new Date('2027-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:11.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440002',
                name: '2027-2028',
                code: '2027-2028',
                startDate: new Date('2027-04-03T12:58:40.507Z'),
                endDate: new Date('2028-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:12.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440003',
                name: '2028-2029',
                code: '2028-2029',
                startDate: new Date('2028-04-03T12:58:40.507Z'),
                endDate: new Date('2029-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:12.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8408-e29b-41d4-a716-446655440004',
                name: '2029-2030',
                code: '2029-2030',
                startDate: new Date('2029-04-03T12:58:40.507Z'),
                endDate: new Date('2030-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:13.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
        ],
    })

    // Seed Semester
    await prisma.semester.createMany({
        skipDuplicates: true,
        data: [
            {
                id: '550e8409-e29b-41d4-a716-446655440000',
                name: 'Học kỳ 1',
                shortName: 'HK1',
                semesterType: $Enums.SemesterType.FIRST,
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
                startDate: new Date('2028-04-03T12:58:40.507Z'),
                endDate: new Date('2028-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:21.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440002',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440009',
                name: 'Học kỳ 1',
                shortName: 'HK1',
                semesterType: $Enums.SemesterType.FIRST,
                startDate: new Date('2028-04-03T12:58:40.507Z'),
                endDate: new Date('2028-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:22.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440003',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440010',
                name: 'Học kỳ 2',
                shortName: 'HK2',
                semesterType: $Enums.SemesterType.SECOND,
                startDate: new Date('2028-10-03T12:58:40.507Z'),
                endDate: new Date('2029-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:23.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440003',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440011',
                name: 'Học kỳ hè',
                shortName: 'HKHE',
                startDate: new Date('2029-04-03T12:58:40.507Z'),
                endDate: new Date('2029-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:24.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440003',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440012',
                name: 'Học kỳ 1',
                shortName: 'HK1',
                semesterType: $Enums.SemesterType.FIRST,
                startDate: new Date('2029-04-03T12:58:40.507Z'),
                endDate: new Date('2029-10-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:25.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440004',
            },
            {
                id: '550e8409-e29b-41d4-a716-446655440013',
                name: 'Học kỳ 2',
                shortName: 'HK2',
                semesterType: $Enums.SemesterType.SECOND,
                startDate: new Date('2029-10-03T12:58:40.507Z'),
                endDate: new Date('2030-04-03T12:58:40.507Z'),
                createdAt: new Date('2025-04-03T12:59:26.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                schoolYearId: '550e8408-e29b-41d4-a716-446655440004',
            },
        ],
    })

    // Seed TrainingCourse
    const trainingCourses = await prisma.trainingCourse.createManyAndReturn({
        select: { id: true, baseScore: true },
        skipDuplicates: true,
        data: [
            {
                id: '550e8406-e29b-41d4-a716-446655440000',
                baseScore: AcademicRankingBaseType.Base10,
                code: 'K58',
                name: 'Khóa 58',
                description: 'Khóa 58',
                semesterStartId: '550e8409-e29b-41d4-a716-446655440000',
                trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
            },
            {
                id: '550e8406-e29b-41d4-a716-446655440001',
                baseScore: AcademicRankingBaseType.Base10,
                code: 'K59',
                name: 'Khóa 59',
                description: 'Khóa 59',
                semesterStartId: '550e8409-e29b-41d4-a716-446655440000',
                trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440001',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
            },
        ],
    })

    await Promise.all(
        trainingCourses.map((trainingCourse) =>
            prisma.scoreConvert.createMany({
                data: scoreConversions.map((scoreConversion) => ({
                    ...scoreConversion,
                    trainingCourseId: trainingCourse.id,
                })),
            })
        )
    )

    await Promise.all(
        trainingCourses
            .filter(({ baseScore }) => baseScore === AcademicRankingBaseType.Base10)
            .map((trainingCourse) =>
                prisma.academicRankingConvert.createMany({
                    skipDuplicates: true,
                    data: [...academicRankingGraduationMilitary, ...academicRankingStudying].map(
                        (conversion) => ({
                            trainingCourseId: trainingCourse.id,
                            ...conversion,
                        })
                    ),
                })
            )
    )

    await Promise.all(
        trainingCourses
            .filter(({ baseScore }) => baseScore === AcademicRankingBaseType.Base4)
            .map((trainingCourse) =>
                prisma.academicRankingConvert.createMany({
                    skipDuplicates: true,
                    data: [...academicRankingGraduationCivilian, ...academicRankingStudying].map(
                        (conversion) => ({
                            trainingCourseId: trainingCourse.id,
                            ...conversion,
                        })
                    ),
                })
            )
    )

    const ranks = await prisma.academicRankingConvert.findMany({
        where: { rankOrder: { in: [1, 2] } },
        select: { id: true },
    })

    for (const rank of ranks) {
        await prisma.graduationRankDowngradeRule.create({
            data: {
                initialRankId: rank.id,
                conditions: {
                    create: {
                        field: 'CONDUCT_SCORE',
                        operator: 'LT',
                        value: 80,
                    },
                },
            },
        })
    }

    // Seed FixedClass
    await prisma.fixedClass.createMany({
        skipDuplicates: true,
        data: [
            {
                id: '550e8407-e29b-41d4-a716-446655440000',
                name: 'CNTT',
                code: 'CNTT_K58',
                createdAt: new Date('2025-04-03T12:58:40.507Z'),
                updatedAt: new Date('2025-04-03T12:58:40.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440000',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: '550e8407-e29b-41d4-a716-446655440001',
                name: 'VK',
                code: 'VK_K58',
                createdAt: new Date('2025-04-03T12:58:41.507Z'),
                updatedAt: new Date('2025-04-03T12:58:41.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440000',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440002',
            },
            {
                id: '550e8407-e29b-41d4-a716-446655440002',
                name: 'CNTT',
                code: 'CNTT_K59',
                createdAt: new Date('2025-04-03T12:58:42.507Z'),
                updatedAt: new Date('2025-04-03T12:58:42.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440001',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: '550e8407-e29b-41d4-a716-446655440003',
                name: 'VK',
                code: 'VK_K59',
                createdAt: new Date('2025-04-03T12:58:43.507Z'),
                updatedAt: new Date('2025-04-03T12:58:43.507Z'),
                trainingCourseId: '550e8406-e29b-41d4-a716-446655440001',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440002',
            },
        ],
    })

    // Seed TemplateFile
    await prisma.templateFile.createMany({
        skipDuplicates: true,
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
        skipDuplicates: true,
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
    await prisma.dM_KhuVuc_DiaLy.createMany({
        skipDuplicates: true,
        data: [
            {
                Id: '550e840a-e29b-41d4-a716-446655440000',
                sTen: 'Khu vực 1',
                sMa: 'KV1',
            },
            {
                Id: '550e840a-e29b-41d4-a716-446655440001',
                sTen: 'Khu vực 2',
                sMa: 'KV2',
            },
            {
                Id: '550e840a-e29b-41d4-a716-446655440002',
                sTen: 'Khu vực 3',
                sMa: 'KV3',
            },
        ],
    })

    // Seed Nationality
    await prisma.dM_QuocGia.createMany({
        skipDuplicates: true,
        data: [
            {
                Id: '550e840b-e29b-41d4-a716-446655440000',
                sTen: 'Việt Nam',
                sMa: 'VN',
            },
            {
                Id: '550e840b-e29b-41d4-a716-446655440001',
                sTen: 'Lào',
                sMa: 'LAO',
            },
            {
                Id: '550e840b-e29b-41d4-a716-446655440002',
                sTen: 'Campuchia',
                sMa: 'CAM',
            },
            {
                Id: '550e840b-e29b-41d4-a716-446655440003',
                sTen: 'Khác',
                sMa: 'Khac',
            },
        ],
    })

    // Seed Religion
    await prisma.dM_TonGiao.createMany({
        skipDuplicates: true,
        data: [
            {
                Id: '550e840c-e29b-41d4-a716-446655440000',
                sTen: 'Phật giáo',
                sMa: 'PG',
            },
            {
                Id: '550e840c-e29b-41d4-a716-446655440001',
                sTen: 'Thiên chúa giáo',
                sMa: 'TCC',
            },
            {
                Id: '550e840c-e29b-41d4-a716-446655440002',
                sTen: 'Hồi giáo',
                sMa: 'HG',
            },
        ],
    })

    // Seed Ethnicity
    await prisma.dM_DanToc.createMany({
        skipDuplicates: true,
        data: [
            {
                Id: '550e840d-e29b-41d4-a716-446655440000',
                sTen: 'Kinh',
                sMa: 'K',
            },
            {
                Id: '550e840d-e29b-41d4-a716-446655440001',
                sTen: 'Thái',
                sMa: 'T',
            },
            {
                Id: '550e840d-e29b-41d4-a716-446655440002',
                sTen: 'Khmer',
                sMa: 'KHM',
            },
            {
                Id: '550e840d-e29b-41d4-a716-446655440003',
                sTen: 'Mường',
                sMa: 'M',
            },
            {
                Id: '550e840d-e29b-41d4-a716-446655440004',
                sTen: 'Tày',
                sMa: 'TAY',
            },
            {
                Id: '550e840d-e29b-41d4-a716-446655440005',
                sTen: 'Thổ',
                sMa: 'THO',
            },
            {
                Id: '550e840d-e29b-41d4-a716-446655440006',
                sTen: 'Khác',
                sMa: 'Khac',
            },
        ],
    })

    // Seed TrainingLocation
    await prisma.trainingLocation.createMany({
        skipDuplicates: true,
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

    const firstOrg = await prisma.dM_DonVi.findFirstOrThrow()
    await prisma.trainingField.createMany({
        data: trainingData.map(({ id, trainingField }) => ({
            id,
            name: trainingField,
            englishName: trainingField,
            organizationId: firstOrg?.Id,
            publishDate: new Date(),
        })),
        skipDuplicates: true,
    })

    await prisma.trainingMajor.createMany({
        data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
            trainingMajors.map(({ id, trainingMajor }) => ({
                id,
                name: trainingMajor,
                organizationId: firstOrg.Id,
                summary: '',
                trainingFieldId,
            }))
        ),
        skipDuplicates: true,
    })

    await prisma.curriculum.createMany({
        data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
            trainingMajors.map(({ id, trainingMajor }) => ({
                id,
                name: trainingMajor,
                managementOrganizationId: firstOrg.Id,
                trainingMajorId: id,
            }))
        ),
        skipDuplicates: true,
    })

    await prisma.curriculumVersion.createMany({
        data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
            trainingMajors.flatMap(({ id: trainingMajorId, curriculums }) =>
                curriculums.map((curriculum) => ({
                    curriculumId: trainingMajorId,
                    name: curriculum,
                    trainingLevelId: '550e8404-e29b-41d4-a716-446655440000',
                    trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000',
                    trainingTimeId: '4years',
                }))
            )
        ),
        skipDuplicates: true,
    })

    const _curriculum = await prisma.curriculum.create({
        data: {
            name: 'Công nghệ thông tin seed',
            code: 'CNTT-2023',
            information: 'Công nghệ thông tin là ngành học về máy tính và công nghệ thông tin.',
            description:
                'Chương trình đào tạo Công nghệ thông tin cung cấp kiến thức và kỹ năng về lập trình, quản trị hệ thống, và phát triển phần mềm.',
            managementOrganization: { connect: { Id: firstOrg.Id } },

            trainingMajor: {
                create: {
                    name: 'Công nghệ thông tin seed',
                    code: 'CNTT',
                    englishName: 'Information Technology',
                    description:
                        'Chuyên ngành Công nghệ thông tin tập trung vào phát triển phần mềm và quản trị hệ thống.',
                    summary:
                        'Chuyên ngành Công nghệ thông tin cung cấp kiến thức về lập trình, cơ sở dữ liệu, và mạng máy tính.',
                    organization: { connect: { Id: firstOrg.Id } },
                    trainingField: {
                        create: {
                            name: 'Công nghệ thông tin seed',
                            englishName: 'Information Technology',
                            publishDate: new Date(),
                            organization: {
                                connect: { Id: firstOrg.Id },
                            },
                        },
                    },
                },
            },

            curriculumVersion: {
                create: {
                    name: 'Công nghệ thông tin 2023 seed',
                    code: 'CNTT-DS-2023',
                    numberOfSemesters: 10,

                    trainingObjectType: {
                        connectOrCreate: {
                            where: { name: 'Đại học quân sự' },
                            create: {
                                name: 'Đại học quân sự',
                                type: $Enums.TrainingObjectTypes.MILITARY,
                            },
                        },
                    },
                    trainingLevel: {
                        connectOrCreate: {
                            where: { name: 'Đại học' },
                            create: { name: 'Đại học' },
                        },
                    },
                    trainingTime: {
                        connectOrCreate: {
                            where: { id: '4years' },
                            create: { name: '4 năm' },
                        },
                    },
                },
            },
        },
    })

    const trainingBlocks = await prisma.trainingBlock.createManyAndReturn({
        skipDuplicates: true,
        select: { id: true },
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
            },
        ],
    })

    const curriculumVersions = await prisma.curriculumVersion.findMany()
    await Promise.all(
        curriculumVersions.map(({ id }) => {
            prisma.curriculumVersion.update({
                where: { id },
                data: { trainingBlocks: { connect: trainingBlocks } },
            })
        })
    )

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
}

main()
    .catch((e) => {
        console.error(e)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
