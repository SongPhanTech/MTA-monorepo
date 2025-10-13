import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { prisma } from '..'
import {
    AnswerStatisticsResponseSchema,
    FacultyStatisticsResponseSchema,
    HourlyAggregateResponseSchema,
    ParticipationByTypeResponseSchema,
    SimplifiedResponseSchema,
    SurveyStatisticsBySemesterResponseSchema,
} from '../dto/survey.dto'
import { SurveyStatisticSchema } from '../dto/survey-statistic.dto'
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
        { surveyType: 'Khảo sát hoạt động ngoại khoá', count: 1 },
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
            organizationId: z.string().openapi({
                description: 'ID của đơn vị cha để xem thống kê các khoa con.',
                example: 'MTA',
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

app.openapi(getFacultyStatisticsByParentUnit, async (c) => {
    const { surveyId, organizationId } = c.req.valid('query')

    const allUnitsData = [
        {
            id: 'MTA',
            unitName: 'Hoc vien ky thuat quan su',
            faculties: [
                {
                    id: 'K_CNTT',
                    organizationName: 'Khoa Công nghệ thông tin',
                    departments: [
                        {
                            id: 'BM_CNPM',
                            organizationName: 'Bộ môn Công nghệ phần mềm',
                            lecturerSurveyCount: 15,
                        },
                        {
                            id: 'BM_MMT',
                            organizationName: 'Bộ môn Mạng máy tính và Truyền thông',
                            lecturerSurveyCount: 12,
                        },
                    ],
                },
                {
                    id: 'K_VK',
                    organizationName: 'Khoa Vũ khí',
                    departments: [
                        {
                            id: 'BM_KHDL',
                            organizationName: 'Bộ môn Khoa học dữ liệu',
                            lecturerSurveyCount: 20,
                        },
                    ],
                },
            ],
        },
    ]

    const parentUnit = allUnitsData.find((unit) => unit.id === organizationId)
    if (!parentUnit) {
        return c.json({ message: `Không tìm thấy đơn vị với ID '${organizationId}'` }, 404)
    }

    const dataSource = parentUnit.faculties

    let totalSurveyedLecturersInUnit = 0
    const statisticsByFaculty = dataSource.map((faculty) => {
        const lecturerSurveyCount = faculty.departments.reduce(
            (sum, dept) => sum + dept.lecturerSurveyCount,
            0
        )
        totalSurveyedLecturersInUnit += lecturerSurveyCount
        return { ...faculty, lecturerSurveyCount }
    })

    const responseData = {
        surveyId: surveyId,
        parentUnitInfo: {
            id: parentUnit.id,
            name: parentUnit.unitName,
        },
        lecturerSurveyCount: totalSurveyedLecturersInUnit,
        statisticsByFaculty: statisticsByFaculty,
    }

    return c.json(responseData, 200)
})

const getAnswerStatistics = createRoute({
    operationId: 'get-answer-statistics-by-level',
    path: '/statistics/answers/by-satisfaction-level',
    method: 'get',
    tags: ['Statistics'],
    summary: 'Thống kê câu trả lời theo các mức độ hài lòng',
    description:
        'API trả về số lượng và tỷ lệ câu trả lời cho từng mức độ của một câu hỏi khảo sát cụ thể.',
    request: {
        query: z.object({
            surveyId: z.string().openapi({
                description: 'ID của khảo sát.',
                example: 'svy-course-quality-fall24',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Lấy dữ liệu thống kê thành công.',
            content: { 'application/json': { schema: AnswerStatisticsResponseSchema } },
        },
        404: {
            description: 'Không tìm thấy câu hỏi hoặc khảo sát.',
            content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        },
    },
})

app.openapi(getAnswerStatistics, async (c) => {
    const { surveyId } = c.req.valid('query')

    const surveyExists = !!surveyId

    if (!surveyExists) {
        return c.json({ message: 'Không tìm thấy khảo sát.' }, 404)
    }

    const satisfactionLevels: Record<number, string> = {
        1: 'Rất hài lòng',
        2: 'Hài lòng',
        3: 'Không hài lòng',
        4: 'Rất không hài lòng',
        0: 'Phân vân',
    }

    const fakeAnswerCounts: Record<number, number> = {
        1: 150, // Rất hài lòng
        2: 80, // Hài lòng
        3: 25, // Không hài lòng
        4: 5, // Rất không hài lòng
        0: 20, // Phân vân
    }

    const totalAnswers = Object.values(fakeAnswerCounts).reduce((sum, count) => sum + count, 0)

    const statistics = Object.entries(fakeAnswerCounts)
        .map(([level, count]) => {
            const levelNum = Number.parseInt(level, 10)
            return {
                level: levelNum,
                levelName: satisfactionLevels[levelNum] ?? 'Không xác định',
                count: count,
                percentage: Number.parseFloat(((count / totalAnswers) * 100).toFixed(2)),
            }
        })
        .sort((a, b) => a.level - b.level) // Sắp xếp theo thứ tự level

    const responseData = {
        surveyId: surveyId,
        totalAnswers: totalAnswers,
        statistics: statistics,
    }

    return c.json(responseData, 200)
})

const getDissatisfiedCountByFaculty = createRoute({
    operationId: 'get-dissatisfied-count-by-faculty',
    path: '/statistics/lecturers/dissatisfied-count-by-faculty', // Đường dẫn mới rõ ràng hơn
    method: 'get',
    tags: ['Statistics'],
    summary: 'Thống kê giảng viên không hài lòng theo từng Khoa',
    description: 'Trả về một đối tượng đơn giản { Tên Khoa: Số lượng } cho toàn trường.',
    request: {
        query: z.object({
            surveyId: z.string().openapi({ example: 'svy-annual-review-2025' }),
        }),
    },
    responses: {
        200: {
            description: 'Lấy dữ liệu thống kê thành công.',
            content: { 'application/json': { schema: SimplifiedResponseSchema } },
        },
    },
})

app.openapi(getDissatisfiedCountByFaculty, async (c) => {
    const { surveyId } = c.req.valid('query')

    const universityData = {
        universityName: 'Học viện Kỹ thuật Quân sự',
        faculties: [
            { id: 'K_CNTT', name: 'Khoa Công nghệ thông tin' },
            { id: 'K_KT', name: 'Khoa Kinh tế' },
            { id: 'K_NN', name: 'Khoa Ngoại ngữ' },
        ],
        lecturerRatings: [
            { lecturerId: 'gv001', facultyId: 'K_CNTT', rating: 1 },
            { lecturerId: 'gv002', facultyId: 'K_CNTT', rating: 3 }, // Không hài lòng
            { lecturerId: 'gv003', facultyId: 'K_CNTT', rating: 4 }, // Rất không hài lòng
            { lecturerId: 'gv004', facultyId: 'K_CNTT', rating: 2 },
            { lecturerId: 'gv005', facultyId: 'K_KT', rating: 3 }, // Không hài lòng
            { lecturerId: 'gv006', facultyId: 'K_KT', rating: 1 },
            { lecturerId: 'gv007', facultyId: 'K_KT', rating: 2 },
            { lecturerId: 'gv008', facultyId: 'K_KT', rating: 4 }, // Rất không hài lòng
            { lecturerId: 'gv009', facultyId: 'K_NN', rating: 2 },
            { lecturerId: 'gv010', facultyId: 'K_NN', rating: 3 }, // Không hài lòng
        ],
    }
    const dissatisfiedLecturers = universityData.lecturerRatings.filter(
        (lecturer) => lecturer.rating === 3 || lecturer.rating === 4
    )

    const facultyIdToNameMap = new Map(universityData.faculties.map((f) => [f.id, f.name]))

    const finalStatistics = dissatisfiedLecturers.reduce(
        (acc: Record<string, number>, lecturer) => {
            const facultyName = facultyIdToNameMap.get(lecturer.facultyId) || 'Khoa không xác định'
            acc[facultyName] = (acc[facultyName] || 0) + 1
            return acc
        },
        {} as Record<string, number>
    )

    const responseData = {
        surveyId: surveyId,
        universityName: universityData.universityName,
        statistics: finalStatistics,
    }

    return c.json(responseData)
})

const getCompletionByHourOfDay = createRoute({
    operationId: 'get-survey-completion-by-hour-of-day',
    path: '/statistics/surveys/completion-by-hour-of-day',
    method: 'get',
    tags: ['Statistics'],
    summary: 'Thống kê tổng hợp số lượt hoàn thành theo từng giờ trong ngày',
    description:
        'API này tổng hợp và trả về số lượt hoàn thành khảo sát cho mỗi khung giờ (0-23) trên tất cả các ngày diễn ra khảo sát.',
    request: {
        query: z.object({
            surveyId: z.string().openapi({
                description: 'ID của khảo sát cần xem thống kê.',
                example: 'svy-engagement-q4-2024',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Lấy dữ liệu thống kê thành công.',
            content: { 'application/json': { schema: HourlyAggregateResponseSchema } },
        },
    },
})

app.openapi(getCompletionByHourOfDay, (c) => {
    const { surveyId } = c.req.valid('query')

    // --- DỮ LIỆU GIẢ (MOCK DATA) CHO NHIỀU NGÀY ---
    const generateMultiDayFakeData = () => {
        const records: any[] = []
        const days = ['2024-12-01', '2024-12-02', '2024-12-03', '2024-12-04']
        const peakHours: Record<number, number> = { 9: 20, 14: 15, 21: 40 } // Giờ cao điểm chung

        days.forEach((date) => {
            for (let hour = 0; hour < 24; hour++) {
                // Thêm một chút ngẫu nhiên cho mỗi ngày
                const randomFactor = Math.random() * 0.4 + 0.8 // (0.8 to 1.2)
                const count = Math.floor(
                    (peakHours[hour] || Math.floor(Math.random() * 5)) * randomFactor
                )
                for (let i = 0; i < count; i++) {
                    const timestamp = new Date(`${date}T00:00:00Z`)
                    timestamp.setUTCHours(hour, Math.floor(Math.random() * 60))
                    records.push({ completedAt: timestamp.toISOString() })
                }
            }
        })
        return records
    }

    const allRecords = generateMultiDayFakeData()

    const uniqueDays = new Set(allRecords.map((r) => r.completedAt.slice(0, 10)))
    const surveyDurationInDays = uniqueDays.size

    const hourlyTotalCounts = Array(24).fill(0)
    allRecords.forEach((record) => {
        const hour = new Date(record.completedAt).getUTCHours()
        hourlyTotalCounts[hour]++
    })

    const hourlyAggregates = hourlyTotalCounts.map((totalCount, hour) => ({
        hour: hour,
        totalCompletionCount: totalCount,
        averageCompletionCount:
            surveyDurationInDays > 0
                ? Number.parseFloat((totalCount / surveyDurationInDays).toFixed(2))
                : 0,
    }))

    const responseData = {
        surveyId: surveyId,
        totalCompletions: allRecords.length,
        surveyDurationInDays: surveyDurationInDays,
        hourlyAggregates: hourlyAggregates,
    }

    return c.json(responseData, 200)
})

const getSurveyStatistics = createRoute({
    operationId: 'get-survey-statistics',
    path: '/surveys/{id}/statistics',
    method: 'get',
    tags: ['Statistics'],
    summary: 'Thống kê câu trả lời cho từng câu hỏi trong một đợt khảo sát',
    request: {
        params: z.object({
            id: z.string().openapi({
                description: 'ID của khảo sát cần xem thống kê.',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Lấy dữ liệu thống kê thành công.',
            content: {
                'application/json': {
                    schema: SurveyStatisticSchema,
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

app.openapi(getSurveyStatistics, async (c) => {
    const { id } = c.req.valid('param')

    const survey = await prisma.survey.findUnique({
        where: { id },
        include: {
            surveyQuestion: {
                where: {
                    type: 'SINGLE_CHOICE',
                },
            },
            surveyChoice: true,
        },
    })

    if (!survey) {
        return c.json({ message: 'Không tìm thấy khảo sát' }, 404)
    }

    const questionIds = survey.surveyQuestion.map((q) => q.id)

    const answerCounts = await prisma.surveyResponse.groupBy({
        by: ['surveyQuestionId', 'surveyChoiceId'],
        where: {
            surveyQuestionId: {
                in: questionIds,
            },
            surveyChoiceId: {
                not: null,
            },
        },
        _count: {
            surveyChoiceId: true,
        },
    })

    const answerCountMap = answerCounts.reduce(
        (acc, curr) => {
            if (curr.surveyChoiceId) {
                const key = `${curr.surveyQuestionId}-${curr.surveyChoiceId}`
                acc[key] = curr._count.surveyChoiceId
            }
            return acc
        },
        {} as Record<string, number>
    )

    const questions = survey.surveyQuestion.map((question) => {
        const answers = survey.surveyChoice.map((choice) => {
            const key = `${question.id}-${choice.id}`
            return {
                id: choice.id,
                answer: choice.answer,
                description: choice.description,
                count: answerCountMap[key] || 0,
            }
        })
        return {
            id: question.id,
            name: question.name,
            answers,
        }
    })

    const responseData = {
        surveyId: survey.id,
        surveyName: survey.name,
        questions,
    }

    return c.json(responseData, 200)
})

export default app
