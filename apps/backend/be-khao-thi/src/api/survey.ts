import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { prisma } from '..'
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

export default app
