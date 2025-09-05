import { PrismaClient } from '../../generated/prisma-client'
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
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNVLĐC1_CĐT',
                code: 'TNVLĐC1_CĐT',
                name: 'Thí nghiệm Vật lý đại cương 1',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'VLĐC2_CĐT',
                code: 'VLĐC2_CĐT',
                name: 'Vật lý đại cương 2',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNVLĐC2_CĐT',
                code: 'TNVLĐC2_CĐT',
                name: 'Thí nghiệm Vật lý đại cương 2',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CSLTHH',
                code: 'CSLTHH',
                name: 'Cơ sở lý thuyết hóa học',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNCSDLTHH',
                code: 'TNCSDLTHH',
                name: 'Thí nghiệm cơ sở lý thuyết hóa học',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DSTTHGT',
                code: 'DSTTHGT',
                name: 'Đại số tuyến tính và hình giải tích',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'GT1',
                code: 'GT1',
                name: 'Giải tích 1',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'GT2',
                code: 'GT2',
                name: 'Giải tích 2',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'LTXSTK',
                code: 'LTXSTK',
                name: 'Lý thuyết xác suất thống kê',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'LTCB',
                code: 'LTCB',
                name: 'Lập trình cơ bản',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TA_B11',
                code: 'TA_B11',
                name: 'Tiếng Anh B11',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TA_B12',
                code: 'TA_B12',
                name: 'Tiếng Anh B12',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'HHVKTCB',
                code: 'HHVKTCB',
                name: 'Hình họa và vẽ kỹ thuật cơ bản + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'NNLCBCNMLN1',
                code: 'NNLCBCNMLN1',
                name: 'Những nguyên lý cơ bản của chủ nghĩa Mác - Lênin 1',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'NNLCBCNMLN2',
                code: 'NNLCBCNMLN2',
                name: 'Những nguyên lý cơ bản của chủ nghĩa Mác - Lênin 2',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'PLĐC',
                code: 'PLVNĐC',
                name: 'Pháp luật đại cương',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TTHCM',
                code: 'TTHCM',
                name: 'Tư tưởng Hồ Chí Minh',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DLCM',
                code: 'DLCM',
                name: 'Đường lối cách mạng của Đảng cộng sản Việt Nam',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            // Cơ sở ngành
            {
                id: 'CLT1',
                code: 'CLT1',
                name: 'Cơ lý thuyết 1 + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'SBVL1',
                code: 'SBVL1',
                name: 'Sức bền vật liệu 1 + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNCH',
                code: 'TNCH',
                name: 'Thí nghiệm cơ học',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CLT2',
                code: 'CLT2',
                name: 'Cơ lý thuyết 2 + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'SBVL2',
                code: 'SBVL2',
                name: 'Sức bền vật liệu 2 + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'VKTCK',
                code: 'VKTCK',
                name: 'Vẽ kỹ thuật cơ khí + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'NLM',
                code: 'NLM',
                name: 'Nguyên lý máy + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CTM',
                code: 'CTM',
                name: 'Chi tiết máy',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DACTM',
                code: 'DACTM',
                name: 'Đồ án chi tiết máy',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TLMTL',
                code: 'TLMTL',
                name: 'Thủy lực và máy thủy lực',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DSBTL',
                code: 'DSBTL',
                name: 'Dung sai + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CNKL',
                code: 'CNKL',
                name: 'Công nghệ kim loại',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CSCNCTM',
                code: 'CSCNCTM',
                name: 'Cơ sở công nghệ chế tạo máy',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'VLHĐC',
                code: 'VLHĐC',
                name: 'Vật liệu học',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNVL',
                code: 'TNVL',
                name: 'Thí nghiệm vật liệu',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DCD',
                code: 'DCD',
                name: 'Động cơ điện',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CADCAE',
                code: 'CADCAE',
                name: 'CAD/CAE',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CKDT',
                code: 'CKDT',
                name: 'Cấu kiện điện tử',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNCKDT',
                code: 'TNCKDT',
                name: 'Thí nghiệm cấu kiện điện tử',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'LTMBTL',
                code: 'LTMBTL',
                name: 'Lý thuyết mạch + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNLTM',
                code: 'TNLTM',
                name: 'Thí nghiệm lý thuyết mạch + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'LTDKTD1',
                code: 'LTDKTD1',
                name: 'Lý thuyết điều khiển tự động 1 + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'ATLDVBVMT',
                code: 'ATLDVBVMT',
                name: 'An toàn lao động và bảo vệ môi trường',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'LTDKTD2',
                code: 'LTDKTD2',
                name: 'Lý thuyết điều khiển tự động 2 + BTL',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            // Chuyên ngành
            {
                id: 'HTTDTK',
                code: 'HTTDTK',
                name: 'Hệ thống tự động thủy khí',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'PTCHNVNMT',
                code: 'PTCHNVNMT',
                name: 'Phân tích cơ hệ nhiều vật nhờ máy tính',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'KTRB',
                code: 'KTRB',
                name: 'Kỹ thuật robot',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'PTVTHHTCDT',
                code: 'PTVTHHTCDT',
                name: 'Phân tích và tổ hợp hệ thống cơ điện tử',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DAPTVTHHTCDT',
                code: 'DAPTVTHHTCDT',
                name: 'Đồ án phân tích và tổ hợp hệ thống cơ điện tử',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DKMTHTSX',
                code: 'DKMTHTSX',
                name: 'Điều khiển máy tính hệ thống sản xuất',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DACNCAD',
                code: 'DACNCAD',
                name: 'Đồ án công nghệ CAD/CAM/CNC',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'HTSXLHVTH',
                code: 'HTSXLHVTH',
                name: 'Hệ thống sản xuất linh hoạt và tích hợp',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DTSBTL',
                code: 'DTSBTL',
                name: 'Điện tử số + Bài tập lớn',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNDTS',
                code: 'TNDTS',
                name: 'Thí nghiệm Điện tử số',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DTTTBTL',
                code: 'DTTTBTL',
                name: 'Điện tử tương tự + Bài tập lớn',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TNDTTT',
                code: 'TNDTTT',
                name: 'Thí nghiệm Điện tử tương tự',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TKHTN',
                code: 'TKHTN',
                name: 'Thiết kế hệ thống nhúng',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DATKHTN',
                code: 'DATKHTN',
                name: 'Đồ án thiết kế hệ thống nhúng',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'PLCPCMTTCN',
                code: 'PLCPCMTTCN',
                name: 'PLC/PC và mạng truyền thông công nghiệp',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'DTCSVKTBD',
                code: 'DTCSVKTBD',
                name: 'Điện tử công suất và kỹ thuật biến đổi',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CSTDD',
                code: 'CSTDD',
                name: 'Cơ sở truyền động điện',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'LTPTCADCAE',
                code: 'LTPTCADCAE',
                name: 'Lập trình phát triển CAD/CAE',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'CSTDHMCC',
                code: 'CSTDHMCC',
                name: 'Cơ sở tự động hóa máy công cụ',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TTCK',
                code: 'TTCK',
                name: 'Thực tập cơ khí',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TTCDT',
                code: 'TTCDT',
                name: 'Thực tập cơ điện tử',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TTD',
                code: 'TTD',
                name: 'Thực tập điện',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TTDTCB',
                code: 'TTDTCB',
                name: 'Thực tập điện tử cơ bản',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'ATDKCD',
                code: 'ATDKCD',
                name: 'An toàn điện và khí cụ điện',
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
            },
            {
                id: 'TTTN_MTA',
                code: 'TTTN_MTA',
                name: 'Thực tập tốt nghiệp',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DATN',
                code: 'DATN',
                name: 'Đồ án tốt nghiệp',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
        ],
    })

    //#region Curriculum
    console.log('Creating curriculum...')
    await prisma.curriculum.createMany({
        skipDuplicates: true,
        data: [
            {
                id: 'CDT_3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
                name: 'Cơ điện tử 3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
                description: 'Chương trình đào tạo Cơ điện tử 3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
                createdAt: new Date(),
                updatedAt: new Date(),
                managementOrganizationId: '3f9eb08b-029b-4c0e-b77f-d69a6e66ae6e',
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
