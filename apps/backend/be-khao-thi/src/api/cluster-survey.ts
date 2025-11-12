import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { models } from '@workspace/db/zod'
import { getTemplateBuffer } from '@workspace/libs/server'
import XlsxTemplate from 'xlsx-template'
import { prisma } from '..'
import { getSurveyStats, SurveyStatsSchema } from '../services/survey.service'

const app = new OpenAPIHono({ strict: false })

const getClusterSurveyStatistics = createRoute({
    operationId: 'get-cluster-survey-statistics',
    path: '/{id}/statistics',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê câu trả lời cho từng câu hỏi trong một cụm khảo sát',
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: 'Export thành công',
            content: {
                'application/json': {
                    schema: models.ClusterSurveySchema.extend({
                        choices: z.array(models.SurveyChoiceSchema),
                        choicesAnswer: z.array(z.string()),
                        choicesDesc: z.array(z.string().nullable()),
                        data: z.array(SurveyStatsSchema),
                    }),
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

app.openapi(getClusterSurveyStatistics, async (c) => {
    const { id } = c.req.valid('param')

    const cluster = await prisma.clusterSurvey.findUnique({
        where: { id },
        include: {
            surveyQuestion: {
                where: {
                    type: 'SINGLE_CHOICE',
                },
            },
            surveyChoice: { orderBy: { answer: 'asc' } },
            surveys: {
                include: {
                    lecture: {
                        include: {
                            userProfile: true,
                        },
                    },
                },
            },
        },
    })

    if (!cluster) {
        return c.json({ message: 'Không tìm thấy khảo sát' }, 404)
    }

    const statsRaw = await Promise.all(
        cluster.surveys.map(async (survey) => {
            return getSurveyStats(prisma, survey, cluster.surveyQuestion, cluster.surveyChoice)
        })
    )

    const data = {
        ...cluster,
        choices: cluster.surveyChoice,
        choicesAnswer: cluster.surveyChoice.map((c) => c.answer),
        choicesDesc: cluster.surveyChoice.map((c) => c.description),
        data: statsRaw,
    }

    return c.json(data, 200)
})

const exportClusterSurveyStatistics = createRoute({
    operationId: 'export-cluster-survey-statistics',
    path: '/{id}/statistics/export',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Excel thống kê câu trả lời cho từng câu hỏi trong một cụm khảo sát',
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: 'Export thành công',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
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

app.openapi(exportClusterSurveyStatistics, async (c) => {
    const { id } = c.req.valid('param')

    const cluster = await prisma.clusterSurvey.findUnique({
        where: { id },
        include: {
            surveyQuestion: {
                where: {
                    type: 'SINGLE_CHOICE',
                },
            },
            surveyChoice: { orderBy: { answer: 'asc' } },
            surveys: {
                include: {
                    lecture: {
                        include: {
                            userProfile: true,
                        },
                    },
                },
            },
        },
    })

    if (!cluster) {
        return c.json({ message: 'Không tìm thấy khảo sát' }, 404)
    }

    const questionIds = cluster.surveyQuestion.map((q) => q.id)

    const statsRaw = await Promise.all(
        cluster.surveys.map(async (survey) => {
            return getSurveyStats(prisma, survey, cluster.surveyQuestion, cluster.surveyChoice)
        })
    )

    const buffer = await getTemplateBuffer(prisma, 'THONG_KE_KHAO_SAT_CUM')
    const template = new XlsxTemplate(buffer)

    const data = {
        choices: cluster.surveyChoice,
        choicesAnswer: cluster.surveyChoice.map((c) => c.answer),
        choicesDesc: cluster.surveyChoice.map((c) => c.description),
        data: statsRaw,
    }

    template.substitute(1, data)

    const result = await template.generate({ type: 'arraybuffer' })

    const fileName = `thong_ke_khao_sat_${cluster.name}.xlsx`
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': disposition,
    })
})

export default app
