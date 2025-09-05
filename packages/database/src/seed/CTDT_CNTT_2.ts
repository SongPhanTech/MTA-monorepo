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
                id: 'K57',
                name: 'Khóa 57',
                description: 'Khóa 57 Quân sự',
                createdAt: new Date(),
                updatedAt: new Date(),
                semesterStartId: '550e8409-e29b-41d4-a716-446655440000',
                trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000', // Quân sự
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
            {
                id: 'CSDL_CNTT',
                code: 'CSDL',
                name: 'Cơ sở dữ liệu',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'THDC_CNTT',
                code: 'THDC',
                name: 'Tin học đại cương',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TACN1IT_CNTT',
                code: 'TACN1IT',
                name: 'Tiếng Anh chuyên ngành 1 IT',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'NMNKNMIT_CNTT',
                code: 'NMNKNMIT',
                name: 'Nhập môn ngành và kỹ năng mềm IT',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TA_B11',
                code: 'TA_B11',
                name: 'Tiếng Anh B11',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TA_B12',
                code: 'TA_B12',
                name: 'Tiếng Anh B12',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LTHDTJAVACB_CNTT',
                code: 'LTHDTJAVACB',
                name: 'Lập trình hướng đối tượng và Java cơ bản',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DS_CNTT',
                code: 'DS',
                name: 'Đại số',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'NLHDH_CNTT',
                code: 'NLHDH',
                name: 'Nguyên lý hệ điều hành',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CNWEB_CNTT',
                code: 'CNWEB',
                name: 'Công nghệ Web',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DACS1IT_CNTT',
                code: 'DACS1IT',
                name: 'Đồ án cơ sở 1 (IT)',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'VL_CNTT',
                code: 'VL',
                name: 'Vật lý',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CTDLGT_CNTT',
                code: 'CTDLGT',
                name: 'Cấu trúc dữ liệu và giải thuật',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TACN2_CNTT',
                code: 'TACN2',
                name: 'Tiếng Anh chuyên ngành 2',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'KTMT_CNTT',
                code: 'KTMT',
                name: 'Kiến trúc máy tính',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LTJAVANC_CNTT',
                code: 'LTJAVANC',
                name: 'Lập trình Java nâng cao',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DACS2IT_CNTT',
                code: 'DACS2IT',
                name: 'Đồ án cơ sở 2 (IT)',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CD1IT_CNTT',
                code: 'CD1IT',
                name: 'Chuyên đề 1 (IT)',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'PTTKHT_CNTT',
                code: 'PTTKHT',
                name: 'Phân tích và thiết kế hệ thống',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TACNTH1_CNTT',
                code: 'TACNTH1',
                name: 'Tiếng Anh chuyên ngành & thực hành 1',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TR_CNTT',
                code: 'TR',
                name: 'Toán rời rạc',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'HTS_CNTT',
                code: 'HTS',
                name: 'Hệ thống số',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'MMT_CNTT',
                code: 'MMT',
                name: 'Mạng máy tính',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CNWEBNC_CNTT',
                code: 'CNWEBNC',
                name: 'Công nghệ web nâng cao',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CNPM_CNTT',
                code: 'CNPM',
                name: 'Công nghệ phần mềm',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CD2_CNTT',
                code: 'CD2',
                name: 'Chuyên đề 2',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'VDK_CNTT',
                code: 'VDK',
                name: 'Vi điều khiển',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'GT_CNTT',
                code: 'GT',
                name: 'Giải tích',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TACNTH2_CNTT',
                code: 'TACNTH2',
                name: 'Tiếng Anh chuyên ngành & thực hành 2',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'XSTK_CNTT',
                code: 'XSTK',
                name: 'Xác suất thống kê',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DACS3IT_CNTT',
                code: 'DACS3IT',
                name: 'Đồ án cơ sở 3 IT',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TTDNIT_CNTT',
                code: 'TTDNIT',
                name: 'Thực tập doanh nghiệp IT',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LTDT_CNTT',
                code: 'LTDT',
                name: 'Lập trình di động',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CD3_CNTT',
                code: 'CD3',
                name: 'Chuyên đề 3',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DACS4IT_CNTT',
                code: 'DACS4IT',
                name: 'Đồ án cơ sở 4 (IT)',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DHMT_CNTT',
                code: 'DHMT',
                name: 'Đồ họa máy tính',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'QTM_CNTT',
                code: 'QTM',
                name: 'Quản trị mạng',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'ANHT_CNTT',
                code: 'ANHT',
                name: 'Automat và Ngôn ngữ hình thức',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LTM_CNTT',
                code: 'LTM',
                name: 'Lập trình mạng',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'QLDA_CNTT',
                code: 'QLDA',
                name: 'Quản lý dự án',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TTNT_CNTT',
                code: 'TTNT',
                name: 'Trí tuệ nhân tạo',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TBD_CNTT',
                code: 'TBD',
                name: 'Trình biên dịch',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CD4_CNTT',
                code: 'CD4',
                name: 'Chuyên đề 4',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DACS5IT_CNTT',
                code: 'DACS5IT',
                name: 'Đồ án cơ sở 5 IT',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'KTPM_CNTT',
                code: 'KTPM',
                name: 'Kiểm thử phần mềm',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'XLA_CNTT',
                code: 'XLA',
                name: 'Xử lý ảnh',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LTHT_CNTT',
                code: 'LTHT',
                name: 'Lập trình hệ thống',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'PTTKGT_CNTT',
                code: 'PTTKGT',
                name: 'Phân tích và thiết kế giải thuật',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'XTHS_CNTT',
                code: 'XTHS',
                name: 'Xử lý tín hiệu số',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'HH_CNTT',
                code: 'HH',
                name: 'Hình họa',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'THML_CNTT',
                code: 'THML',
                name: 'Triết học Mác - Lênin',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TTHCM_CNTT',
                code: 'TTHCM',
                name: 'Tư tưởng Hồ Chí Minh',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'PLDC_CNTT',
                code: 'PLDC',
                name: 'Pháp luật đại cương',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CD5IT_CNTT',
                code: 'CD5IT',
                name: 'Chuyên đề 5 (IT)',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DACN1IT_CNTT',
                code: 'DACN1IT',
                name: 'Đồ án chuyên ngành 1 (IT)',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LTWIN_CNTT',
                code: 'LTWIN',
                name: 'Lập trình trong windows',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TTNM_CNTT',
                code: 'TTNM',
                name: 'Tương tác người - máy',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LTTCMT_CNTT',
                code: 'LTTCMT',
                name: 'Lập trình trò chơi trên máy tính',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TMDT_CNTT',
                code: 'TMDT',
                name: 'Thương mại điện tử',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LPMM_CNTT',
                code: 'LPMM',
                name: 'Linux & phần mềm nguồn mở',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'XLNTN_CNTT',
                code: 'XLNTN',
                name: 'Xử lý ngôn ngữ tự nhiên',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'BMATHTT_CNTT',
                code: 'BMATHTT',
                name: 'Bảo mật và An toàn hệ thống thông tin',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'KTTSDL_CNTT',
                code: 'KTTSDL',
                name: 'Kỹ thuật truyền số liệu',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TKDHVHH_CNTT',
                code: 'TKDHVHH',
                name: 'Thiết kế đồ họa động và hoạt hình',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'KTCTML_CNTT',
                code: 'KTCTML',
                name: 'Kinh tế chính trị Mác - Lênin',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'LSDCSVN_CNTT',
                code: 'LSDCSVN',
                name: 'Lịch sử Đảng Cộng sản Việt Nam',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CD6IT_CNTT',
                code: 'CD6IT',
                name: 'Chuyên đề 6 (IT)',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DACN2IT_CNTT',
                code: 'DACN2IT',
                name: 'Đồ án chuyên ngành 2 IT',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'HCSDLP_CNTT',
                code: 'HCSDLP',
                name: 'Hệ cơ sở dữ liệu phân tán',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'PTTKM_CNTT',
                code: 'PTTKM',
                name: 'Phân tích, thiết kế mạng',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'MKKDD_CNTT',
                code: 'MKKDD',
                name: 'Mạng không dây và di động',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DTDC_CNTT',
                code: 'DTDC',
                name: 'Điện toán đám mây',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'MMH_CNTT',
                code: 'MMH',
                name: 'Mật mã học',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TKLTTT_CNTT',
                code: 'TKLTTT',
                name: 'Thiết kế và lập trình tương tác',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TKDH3D_CNTT',
                code: 'TKDH3D',
                name: 'Thiết kế đồ họa 3D',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TGMT_CNTT',
                code: 'TGMT',
                name: 'Thị giác máy tính',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'XBTT_CNTT',
                code: 'XBTT',
                name: 'Xuất bản Truyền thông',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'KXPATH_CNTT',
                code: 'KXPATH',
                name: 'Kỹ xảo phim ảnh - truyền hình',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'CNXHKH_CNTT',
                code: 'CNXHKH',
                name: 'Chủ nghĩa xã hội khoa học',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'TTTNIT_CNTT',
                code: 'TTTNIT',
                name: 'Thực tập tốt nghiệp (IT)',
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
            },
            {
                id: 'DATNIT_CNTT',
                code: 'DATNIT',
                name: 'Đồ án tốt nghiệp (IT)',
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
                id: 'CNTT_K11',
                name: 'Công nghệ thông tin K11',
                description: 'Chương trình đào tạo Công nghệ thông tin K11',
                createdAt: new Date(),
                updatedAt: new Date(),
                managementOrganizationId: '550e8400-1234-41d4-a716-446655440000',
                trainingMajorId: 'ev2m2qsk1dv4y663l8eekfgb', // Công nghệ thông tin
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
