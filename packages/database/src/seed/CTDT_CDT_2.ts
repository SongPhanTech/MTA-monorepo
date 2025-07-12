import { PrismaClient } from '@prisma/client'
import { scoreConversions } from './score-convert'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting data import...')

    //#region TrainingCourse
    console.log('Creating training courses...')
    const trainingCourses = await prisma.trainingCourse.createManyAndReturn({
        select: { id: true },
        skipDuplicates: true,
        data: [
            {
                id: 'K25',
                name: 'Cơ điện tử',
                description: 'Khóa học Cơ điện tử',
                createdAt: new Date(),
                updatedAt: new Date(),
                semesterStartId: '550e8409-e29b-41d4-a716-446655440000',
                trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440001', // Dân sự
                coef_1: 0.1,
                coef_2: 0.3,
                coef_3: 0.6,
                scoreToPass: 4,
                scoreToTakeExam: 4,
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

    //#region Subject
    console.log('Creating subjects...')
    await prisma.subject.createMany({
        skipDuplicates: true,
        data: [
            // Đại cương
            {
                id: 'VLĐC1_CĐT',
                code: 'VLĐC1_CĐT',
                name: 'Vật lý đại cương 1',
                managementOrganizationId: 'K11',
            },
            {
                id: 'TNVLĐC1_CĐT',
                code: 'TNVLĐC1_CĐT',
                name: 'Thí nghiệm Vật lý đại cương 1',
                managementOrganizationId: 'K11',
            },
            {
                id: 'VLĐC2_CĐT',
                code: 'VLĐC2_CĐT',
                name: 'Vật lý đại cương 2',
                managementOrganizationId: 'K11',
            },
            {
                id: 'TNVLĐC2_CĐT',
                code: 'TNVLĐC2_CĐT',
                name: 'Thí nghiệm Vật lý đại cương 2',
                managementOrganizationId: 'K11',
            },
            {
                id: 'CSLTHH',
                code: 'CSLTHH',
                name: 'Cơ sở lý thuyết hóa học',
                managementOrganizationId: 'K11',
            },
            {
                id: 'TNCSDLTHH',
                code: 'TNCSDLTHH',
                name: 'Thí nghiệm cơ sở lý thuyết hóa học',
                managementOrganizationId: 'K11',
            },
            {
                id: 'DSTTHGT',
                code: 'DSTTHGT',
                name: 'Đại số tuyến tính và hình giải tích',
                managementOrganizationId: 'V4',
            },
            {
                id: 'GT1',
                code: 'GT1',
                name: 'Giải tích 1',
                managementOrganizationId: 'K11',
            },
            {
                id: 'GT2',
                code: 'GT2',
                name: 'Giải tích 2',
                managementOrganizationId: 'K11',
            },
            {
                id: 'LTXSTK',
                code: 'LTXSTK',
                name: 'Lý thuyết xác suất thống kê',
                managementOrganizationId: 'V4',
            },
            {
                id: 'LTCB',
                code: 'LTCB',
                name: 'Lập trình cơ bản',
                managementOrganizationId: 'V4',
            },
            {
                id: 'TA_B11',
                code: 'TA_B11',
                name: 'Tiếng Anh B11',
                managementOrganizationId: 'K13',
            },
            {
                id: 'TA_B12',
                code: 'TA_B12',
                name: 'Tiếng Anh B12',
                managementOrganizationId: 'K13',
            },
            {
                id: 'HHVKTCB',
                code: 'HHVKTCB',
                name: 'Hình họa và vẽ kỹ thuật cơ bản + BTL',
                managementOrganizationId: 'K13',
            },
            {
                id: 'NNLCBCNMLN1',
                code: 'NNLCBCNMLN1',
                name: 'Những nguyên lý cơ bản của chủ nghĩa Mác - Lênin 1',
                managementOrganizationId: 'K51',
            },
            {
                id: 'NNLCBCNMLN2',
                code: 'NNLCBCNMLN2',
                name: 'Những nguyên lý cơ bản của chủ nghĩa Mác - Lênin 2',
                managementOrganizationId: 'K51',
            },
            {
                id: 'PLĐC',
                code: 'PLVNĐC',
                name: 'Pháp luật đại cương',
                managementOrganizationId: 'K52',
            },
            {
                id: 'TTHCM',
                code: 'TTHCM',
                name: 'Tư tưởng Hồ Chí Minh',
                managementOrganizationId: 'K52',
            },
            {
                id: 'DLCM',
                code: 'DLCM',
                name: 'Đường lối cách mạng của Đảng cộng sản Việt Nam',
                managementOrganizationId: 'K6',
            },
            // Cơ sở ngành
            {
                id: 'CLT1',
                code: 'CLT1',
                name: 'Cơ lý thuyết 1 + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'SBVL1',
                code: 'SBVL1',
                name: 'Sức bền vật liệu 1 + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TNCH',
                code: 'TNCH',
                name: 'Thí nghiệm cơ học',
                managementOrganizationId: 'K6',
            },
            {
                id: 'CLT2',
                code: 'CLT2',
                name: 'Cơ lý thuyết 2 + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'SBVL2',
                code: 'SBVL2',
                name: 'Sức bền vật liệu 2 + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'VKTCK',
                code: 'VKTCK',
                name: 'Vẽ kỹ thuật cơ khí + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'NLM',
                code: 'NLM',
                name: 'Nguyên lý máy + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'CTM',
                code: 'CTM',
                name: 'Chi tiết máy',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DACTM',
                code: 'DACTM',
                name: 'Đồ án chi tiết máy',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TLMTL',
                code: 'TLMTL',
                name: 'Thủy lực và máy thủy lực',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DSBTL',
                code: 'DSBTL',
                name: 'Dung sai + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'CNKL',
                code: 'CNKL',
                name: 'Công nghệ kim loại',
                managementOrganizationId: 'K6',
            },
            {
                id: 'CSCNCTM',
                code: 'CSCNCTM',
                name: 'Cơ sở công nghệ chế tạo máy',
                managementOrganizationId: 'K6',
            },
            {
                id: 'VLHĐC',
                code: 'VLHĐC',
                name: 'Vật liệu học',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TNVL',
                code: 'TNVL',
                name: 'Thí nghiệm vật liệu',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DCD',
                code: 'DCD',
                name: 'Động cơ điện',
                managementOrganizationId: 'K6',
            },
            {
                id: 'CADCAE',
                code: 'CADCAE',
                name: 'CAD/CAE',
                managementOrganizationId: 'K6',
            },
            {
                id: 'CKDT',
                code: 'CKDT',
                name: 'Cấu kiện điện tử',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TNCKDT',
                code: 'TNCKDT',
                name: 'Thí nghiệm cấu kiện điện tử',
                managementOrganizationId: 'K6',
            },
            {
                id: 'LTMBTL',
                code: 'LTMBTL',
                name: 'Lý thuyết mạch + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TNLTM',
                code: 'TNLTM',
                name: 'Thí nghiệm lý thuyết mạch + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'LTDKTD1',
                code: 'LTDKTD1',
                name: 'Lý thuyết điều khiển tự động 1 + BTL',
                managementOrganizationId: 'K6',
            },
            {
                id: 'ATLDVBVMT',
                code: 'ATLDVBVMT',
                name: 'An toàn lao động và bảo vệ môi trường',
                managementOrganizationId: 'K6',
            },
            {
                id: 'LTDKTD2',
                code: 'LTDKTD2',
                name: 'Lý thuyết điều khiển tự động 2 + BTL',
                managementOrganizationId: 'K6',
            },
            // Chuyên ngành
            {
                id: 'HTTDTK',
                code: 'HTTDTK',
                name: 'Hệ thống tự động thủy khí',
                managementOrganizationId: 'K6',
            },
            {
                id: 'PTCHNVNMT',
                code: 'PTCHNVNMT',
                name: 'Phân tích cơ hệ nhiều vật nhờ máy tính',
                managementOrganizationId: 'K6',
            },
            {
                id: 'KTRB',
                code: 'KTRB',
                name: 'Kỹ thuật robot',
                managementOrganizationId: 'K6',
            },
            {
                id: 'PTVTHHTCDT',
                code: 'PTVTHHTCDT',
                name: 'Phân tích và tổ hợp hệ thống cơ điện tử',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DAPTVTHHTCDT',
                code: 'DAPTVTHHTCDT',
                name: 'Đồ án phân tích và tổ hợp hệ thống cơ điện tử',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DKMTHTSX',
                code: 'DKMTHTSX',
                name: 'Điều khiển máy tính hệ thống sản xuất',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DACNCAD',
                code: 'DACNCAD',
                name: 'Đồ án công nghệ CAD/CAM/CNC',
                managementOrganizationId: 'K6',
            },
            {
                id: 'HTSXLHVTH',
                code: 'HTSXLHVTH',
                name: 'Hệ thống sản xuất linh hoạt và tích hợp',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DTSBTL',
                code: 'DTSBTL',
                name: 'Điện tử số + Bài tập lớn',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TNDTS',
                code: 'TNDTS',
                name: 'Thí nghiệm Điện tử số',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DTTTBTL',
                code: 'DTTTBTL',
                name: 'Điện tử tương tự + Bài tập lớn',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TNDTTT',
                code: 'TNDTTT',
                name: 'Thí nghiệm Điện tử tương tự',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TKHTN',
                code: 'TKHTN',
                name: 'Thiết kế hệ thống nhúng',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DATKHTN',
                code: 'DATKHTN',
                name: 'Đồ án thiết kế hệ thống nhúng',
                managementOrganizationId: 'K6',
            },
            {
                id: 'PLCPCMTTCN',
                code: 'PLCPCMTTCN',
                name: 'PLC/PC và mạng truyền thông công nghiệp',
                managementOrganizationId: 'K6',
            },
            {
                id: 'DTCSVKTBD',
                code: 'DTCSVKTBD',
                name: 'Điện tử công suất và kỹ thuật biến đổi',
                managementOrganizationId: 'K6',
            },
            {
                id: 'CSTDD',
                code: 'CSTDD',
                name: 'Cơ sở truyền động điện',
                managementOrganizationId: 'K6',
            },
            {
                id: 'LTPTCADCAE',
                code: 'LTPTCADCAE',
                name: 'Lập trình phát triển CAD/CAE',
                managementOrganizationId: 'K6',
            },
            {
                id: 'CSTDHMCC',
                code: 'CSTDHMCC',
                name: 'Cơ sở tự động hóa máy công cụ',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TTCK',
                code: 'TTCK',
                name: 'Thực tập cơ khí',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TTCDT',
                code: 'TTCDT',
                name: 'Thực tập cơ điện tử',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TTD',
                code: 'TTD',
                name: 'Thực tập điện',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TTDTCB',
                code: 'TTDTCB',
                name: 'Thực tập điện tử cơ bản',
                managementOrganizationId: 'K6',
            },
            {
                id: 'ATDKCD',
                code: 'ATDKCD',
                name: 'An toàn điện và khí cụ điện',
                managementOrganizationId: 'K6',
            },
            {
                id: 'TTTN_MTA',
                code: 'TTTN_MTA',
                name: 'Thực tập tốt nghiệp',
                managementOrganizationId: 'MTA',
            },
            {
                id: 'DATN',
                code: 'DATN',
                name: 'Đồ án tốt nghiệp',
                managementOrganizationId: 'MTA',
            },
        ],
    })

    //#region Curriculum
    console.log('Creating curriculum...')
    await prisma.curriculum.createMany({
        skipDuplicates: true,
        data: [
            {
                id: 'CDT_K6',
                name: 'Cơ điện tử K6',
                description: 'Chương trình đào tạo Cơ điện tử K6',
                createdAt: new Date(),
                updatedAt: new Date(),
                managementOrganizationId: 'K6',
                trainingMajorId: 'tklht1746fw8c7cqdiop0mcp', // Cơ điện tử
            },
        ],
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
        console.log('Database connection closed.')
    })
    .catch(async (e) => {
        console.error('Error during data import:', e)
        await prisma.$disconnect()
    })
