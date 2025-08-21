import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { prisma } from '..'
import {
    FacultyStatisticsResponseSchema,
    ParticipationByTypeResponseSchema,
    SurveyStatisticsBySemesterResponseSchema,
} from '../dto/survey.dto'
import { getBufferFromUrl } from '../services/template.service'
import { getCurrentDateForReport } from '../utils'

const app = new OpenAPIHono({ strict: false })

const exportReportSurvey = createRoute({
    operationId: 'export-report-survey',
    path: '/export-report-survey',
    tags: ['Survey'],
    summary: 'Báo cáo khảo sát',
    description: 'Báo cáo khảo sát',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            surveyId: z.string().openapi('surveyId', {
                                description: 'ID của khảo sát',
                            }),
                        })
                        .openapi('export-report-survey'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Export báo cáo khảo sát.',
            content: {
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
                },
            },
        },
        400: {
            description: 'Invalid request',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

app.openapi(exportReportSurvey, async (c) => {
    const { surveyId } = c.req.valid('json')

    const survey = await prisma.survey.findFirstOrThrow({
        where: { id: surveyId },
        include: {
            surveyObjectType: true,
        },
    })
    if (!survey) {
        return c.json({ message: 'Khảo sát không tồn tại' }, 404)
    }

    const { date, month, year } = getCurrentDateForReport()
    const templateData = {
        date,
        month,
        year,
        tittle: survey.name,
        SurveyObjectType: survey.surveyObjectType.map((item) => item.name).join(', '),
        phamvi: '',
        ketqua: '',
    }

    const docxBuffer = await getBufferFromUrl('SURVEY_RP')
    const templateZip = new PizZip(docxBuffer)
    const document = new Docxtemplater(templateZip, {
        paragraphLoop: true,
        linebreaks: true,
    })

    const reportDocx = document.render(templateData)
    return c.body(reportDocx.getZip().generate({ type: 'nodebuffer' }), 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="BaoCaoKhaoThi.docx"`,
    })
})

const exportReportSurveyOrganizational = createRoute({
    operationId: 'export-report-survey-organizational',
    path: '/export-report-survey-organizational',
    tags: ['Survey'],
    summary: 'Báo cáo khảo sát theo đơn vị',
    description: 'Báo cáo khảo sát theo đơn vị',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            semesterId: z.string().openapi('semesterId', {
                                description: 'ID của học kỳ',
                            }),
                            organizationId: z.string().openapi('organizationId', {
                                description: 'ID của đơn vị',
                            }),
                        })
                        .openapi('export-report-survey'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Export báo cáo khảo sát.',
            content: {
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
                },
            },
        },
        400: {
            description: 'Invalid request',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

app.openapi(exportReportSurveyOrganizational, async (c) => {
    const { semesterId, organizationId } = c.req.valid('json')

    const semester = await prisma.semester.findFirstOrThrow({
        where: { id: semesterId },
    })
    if (!semester) {
        return c.json({ message: 'Học kỳ không tồn tại' }, 404)
    }

    const organization = await prisma.dM_DonVi.findFirstOrThrow({
        where: { Id: organizationId },
    })
    if (!organization) {
        return c.json({ message: 'Đơn vị không tồn tại' }, 404)
    }

    const { date, month, year } = getCurrentDateForReport()
    const templateData = {
        date,
        month,
        year,
        tittle: `Báo cáo khảo sát của đơn vị ${organization.sTen}`,
    }

    const docxBuffer = await getBufferFromUrl('SURVEY_RP')
    const templateZip = new PizZip(docxBuffer)
    const document = new Docxtemplater(templateZip, {
        paragraphLoop: true,
        linebreaks: true,
    })

    const reportDocx = document.render(templateData)
    return c.body(reportDocx.getZip().generate({ type: 'nodebuffer' }), 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="BaoCaoKhaoThi.docx"`,
    })
})

const getParticipationByType = createRoute({
    operationId: 'get-participation-by-type',
    path: '/statistics/participation-by-type',
    method: 'get',
    tags: ['Statistics'],
    summary: 'Thống kê số lượng sinh viên tham gia theo loại hình',
    description:
        'API này trả về dữ liệu giả về số lượng sinh viên tham gia khảo sát, được nhóm theo loại hình đào tạo.',
    request: {
        query: z.object({
            surveyId: z.string().openapi({
                description: 'ID của khảo sát cần xem thống kê.',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Lấy dữ liệu thống kê thành công.',
            content: {
                'application/json': {
                    schema: ParticipationByTypeResponseSchema,
                },
            },
        },
        404: {
            description: 'Không tìm thấy khảo sát.',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
        },
    },
})

app.openapi(getParticipationByType, async (c) => {
    const { surveyId } = c.req.valid('query')

    // Validate survey exists
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
    })

    if (!survey) {
        return c.json({ message: 'Không tìm thấy khảo sát' }, 404)
    }

    const fakeStatistics = [
        { studentType: 'Sinh viên dân sự', participantCount: 350 },
        { studentType: 'Học viên quân sự', participantCount: 120 },
        { studentType: 'Sinh viên liên thông', participantCount: 35 },
        { studentType: 'Sinh viên tại chức', participantCount: 15 },
    ]

    const totalParticipants = fakeStatistics.reduce((sum, item) => sum + item.participantCount, 0)

    const responseData = {
        surveyId: surveyId,
        totalParticipants: totalParticipants,
        statistics: fakeStatistics,
    }
    return c.json(responseData, 200)
})

const getSurveyStatisticsBySemester = createRoute({
    operationId: 'get-survey-statistics-by-semester', // Tên operationId đã được cập nhật
    path: '/statistics/surveys/count-by-semester', // Giữ nguyên đường dẫn
    method: 'get',
    tags: ['Statistics'],
    summary: 'Thống kê chi tiết số lượng khảo sát trong học kỳ',
    description:
        'API này trả về dữ liệu giả về tổng số lượng và chi tiết số lượng theo từng loại khảo sát trong một học kỳ cụ thể.',
    request: {
        query: z.object({
            semesterId: z.string().openapi({
                description: 'ID của học kỳ cần xem thống kê (ví dụ: HK1-2425).',
                example: 'HK1-2425',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Lấy dữ liệu thống kê chi tiết thành công.',
            content: {
                'application/json': {
                    // Sử dụng schema mới chi tiết hơn
                    schema: SurveyStatisticsBySemesterResponseSchema,
                },
            },
        },
        404: {
            description: 'Không tìm thấy thông tin cho học kỳ này.',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
        },
    },
})

app.openapi(getSurveyStatisticsBySemester, (c) => {
    const { semesterId } = c.req.valid('query')

    const semesterName = `Học kỳ ${semesterId.slice(2, 3)} năm học ${20 + semesterId.slice(4, 6)}-${20 + semesterId.slice(6, 8)}`

    const fakeDetails = [
        { surveyType: 'Khảo sát chất lượng môn học', count: 15 },
        { surveyType: 'Khảo sát cơ sở vật chất', count: 2 },
        { surveyType: 'Khảo sát mức độ hài lòng của sinh viên', count: 4 },
        { surveyType: 'Khảo sát hoạt động ngoại khóa', count: 1 },
    ]

    const totalSurveyCount = fakeDetails.reduce((sum, item) => sum + item.count, 0)

    const responseData = {
        semesterId: semesterId,
        semesterName: semesterName,
        totalSurveyCount: totalSurveyCount,
        details: fakeDetails,
    }

    return c.json(responseData, 200)
})

const getFacultyStatisticsByParentUnit = createRoute({
    operationId: 'get-faculty-statistics-by-parent-unit',
    path: '/statistics/faculties/by-parent-unit', // Đường dẫn mới
    method: 'get',
    tags: ['Statistics'],
    summary: 'Thống kê giảng viên theo Khoa (con của một Đơn vị)',
    description:
        'API trả về danh sách các khoa và số lượng giảng viên được khảo sát bên trong một đơn vị cha cụ thể.',
    request: {
        query: z.object({
            surveyId: z.string().openapi({
                description: 'ID của khảo sát cần xem thống kê.',
                example: 'svy-lecturer-fall-2024',
            }),
            // unitId bây giờ là bắt buộc
            unitId: z.string().openapi({
                description: 'ID của đơn vị cha để xem thống kê các khoa con.',
                example: 'D_CNTT',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Lấy dữ liệu thống kê thành công.',
            content: { 'application/json': { schema: FacultyStatisticsResponseSchema } },
        },
        404: {
            description: 'Không tìm thấy đơn vị với ID được cung cấp.',
            content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        },
    },
})

app.openapi(getFacultyStatisticsByParentUnit, (c) => {
    // Lấy surveyId và unitId (bắt buộc) từ request
    const { surveyId, unitId } = c.req.valid('query')

    // Dữ liệu giả gốc (giống như trước)
    const allUnitsData = [
        {
            id: 'D_CNTT',
            unitName: 'Trường Công nghệ thông tin và Truyền thông',
            faculties: [
                {
                    id: 'K_CNTT',
                    facultyName: 'Khoa Công nghệ thông tin',
                    departments: [
                        {
                            id: 'BM_CNPM',
                            departmentName: 'Bộ môn Công nghệ phần mềm',
                            lecturerCount: 15,
                        },
                        {
                            id: 'BM_MMT',
                            departmentName: 'Bộ môn Mạng máy tính và Truyền thông',
                            lecturerCount: 12,
                        },
                    ],
                },
                {
                    id: 'K_KHMT',
                    facultyName: 'Khoa Khoa học máy tính',
                    departments: [
                        {
                            id: 'BM_KHDL',
                            departmentName: 'Bộ môn Khoa học dữ liệu',
                            lecturerCount: 20,
                        },
                    ],
                },
            ],
        },
        {
            id: 'D_KT',
            unitName: 'Trường Kinh tế',
            faculties: [
                {
                    id: 'K_QTKD',
                    facultyName: 'Khoa Quản trị kinh doanh',
                    departments: [
                        { id: 'BM_MKT', departmentName: 'Bộ môn Marketing', lecturerCount: 25 },
                    ],
                },
            ],
        },
    ]

    // Tìm đơn vị cha trong dữ liệu gốc
    const parentUnit = allUnitsData.find((unit) => unit.id === unitId)
    if (!parentUnit) {
        return c.json({ message: `Không tìm thấy đơn vị với ID '${unitId}'` }, 404)
    }

    // `dataSource` bây giờ là mảng các khoa con
    const dataSource = parentUnit.faculties

    // Tính toán tổng số GV trong các khoa con
    let totalSurveyedLecturersInUnit = 0
    const statisticsByFaculty = dataSource.map((faculty) => {
        const totalLecturersInFaculty = faculty.departments.reduce(
            (sum, dept) => sum + dept.lecturerCount,
            0
        )
        totalSurveyedLecturersInUnit += totalLecturersInFaculty
        return { ...faculty, totalLecturersInFaculty }
    })

    // Tạo đối tượng response hoàn chỉnh theo schema mới
    const responseData = {
        surveyId: surveyId,
        parentUnitInfo: {
            id: parentUnit.id,
            name: parentUnit.unitName,
        },
        totalSurveyedLecturersInUnit: totalSurveyedLecturersInUnit,
        statisticsByFaculty: statisticsByFaculty,
    }

    return c.json(responseData)
})

export default app
