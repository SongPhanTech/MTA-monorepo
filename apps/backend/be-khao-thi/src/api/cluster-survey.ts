import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { models } from '@workspace/db/zod'
import { getTemplateBuffer } from '@workspace/libs/server'
import XlsxTemplate from 'xlsx-template'
import { prisma } from '..'
import {
    getLecturerSurveyStats,
    getOrganizationsSurveyStats,
    getSurveyStats,
    LecturerSurveyStatsSchema,
    OrgazationsSurveyStatsSchema,
    SurveyStatsSchema,
} from '../services/survey.service'

const app = new OpenAPIHono({ strict: false })

const createClusterSurvey = createRoute({
    operationId: 'create-cluster-survey',
    path: '/cluster-survey',
    tags: ['ClusterSurvey'],
    summary: 'Tạo cụm khảo sát',
    description: 'Tạo cụm khảo sát',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            name: z.string(),
                            additionalSuggestion: z.boolean(),
                            startDate: z.coerce.date(),
                            endDate: z.coerce.date().optional(),
                            isPublic: z.boolean().default(false),
                            anonymous: z.boolean().default(false),
                            surveyTopicId: z.string(),
                            surveyObjectTypeIds: z.array(z.string()).optional().default([]),
                            lecturerIds: z.array(z.string()).nonempty(),
                            surveyQuestionIds: z.array(z.string()).nonempty(),
                            semesterId: z.string(),
                            surveyChoices: z
                                .array(
                                    z.object({
                                        answer: z.string(),
                                        description: z.string(),
                                        requireExplanation: z.boolean(),
                                    })
                                )
                                .nonempty(),
                        })
                        .openapi('create-cluster-survey-request'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Success',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
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

app.openapi(createClusterSurvey, async (c) => {
    const {
        surveyQuestionIds,
        surveyChoices,
        surveyObjectTypeIds,
        lecturerIds,
        surveyTopicId,
        semesterId,
        ...payload
    } = c.req.valid('json')

    await prisma.$transaction(async (tx) => {
        const cluster = await tx.clusterSurvey.create({
            data: {
                ...payload,
                surveyTopic: {
                    connect: { id: surveyTopicId },
                },
                surveyQuestion: {
                    connect: surveyQuestionIds.map((id) => ({ id })),
                },
                surveyChoice: {
                    create: surveyChoices,
                },
                surveyObjectType: {
                    connect: surveyObjectTypeIds.map((id) => ({ id })),
                },
                lecturers: {
                    connect: lecturerIds.map((id) => ({ id })),
                },
            },
            include: {
                surveyChoice: true,
            },
        })

        // const lecturers = await tx.lecturer.findMany({
        //     where: {
        //         id: {
        //             in: lecturerIds,
        //         },
        //         mainSubjectClasses: {
        //             some: {
        //                 semester: {
        //                     id: semesterId,
        //                 },
        //             },
        //         },
        //     },
        //     include: {
        //         mainSubjectClasses: {
        //             where: {
        //                 semester: {
        //                     id: semesterId,
        //                 },
        //             },
        //         },
        //     },
        // })
        const subjectClasses = await prisma.subjectClass.findMany({
            where: {
                semesterId,
                mainLecturer: {
                    id: {
                        in: lecturerIds,
                    },
                },
            },
            include: {
                mainLecturer: true,
            },
        })

        const surveys = await tx.survey.createManyAndReturn({
            data: subjectClasses.map((cls) => ({
                ...payload,
                clusterSurveyId: cluster.id,
                subjectClassId: cls.id,
                surveyTopicId,
                lectureId: cls.lecturerId,
                semesterId
            })),
        })

        for (const survey of surveys) {
            await tx.survey.update({
                where: { id: survey.id },
                data: {
                    surveyQuestion: {
                        connect: surveyQuestionIds.map((id) => ({ id })),
                    },
                    surveyChoice: {
                        connect: cluster.surveyChoice.map((choice) => ({
                            id: choice.id,
                        })),
                    },
                    surveyObjectType: {
                        connect: surveyObjectTypeIds.map((id) => ({ id })),
                    },
                },
            })
        }
    })

    return c.json({ message: 'Success' })
})

const getClusterSurveyStatistics = createRoute({
    operationId: 'get-cluster-survey-statistics',
    path: '/{id}/statistics',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê câu trả lời cho từng câu hỏi trong một cụm khảo sát',
    request: {
        params: z.object({ id: z.string() }),
        query: z.object({
            organizations: z.string().array().optional(),
            lectureId: z.string().optional(),
        }),
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
    const { organizations, lectureId, ...q } = c.req.valid('query')
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
                where: {
                    lecture: {
                        id: lectureId,
                        organizationId: {
                            in: organizations,
                        },
                    },
                },
                include: {
                    subjectClass: true,
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

const getLectureSurveyStatistics = createRoute({
    operationId: 'get-lecture-survey-statistics',
    path: '/{id}/lecture-statistics',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê câu trả lời theo giảng viên trong một cụm khảo sát',
    request: {
        params: z.object({ id: z.string() }),
        query: z.object({
            organizations: z.string().optional(),
        }),
    },
    responses: {
        200: {
            description: 'Get thành công',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(LecturerSurveyStatsSchema),
                        choices: z.array(models.SurveyChoiceSchema),
                        choicesAnswer: z.array(z.string()),
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

app.openapi(getLectureSurveyStatistics, async (c) => {
    const { id } = c.req.valid('param')
    const { organizations, ...q } = c.req.valid('query')
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
                where: {
                    ...(!!organizations && {
                        lecture: {
                            organizationId: {
                                in: organizations.split(','),
                            },
                        },
                    }),
                },
                include: {
                    subjectClass: true,
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
    const lecturer = await prisma.lecturer.findMany({
        where: {
            survey: {
                some: {
                    clusterSurveyId: id,
                },
            },
            ...(!!organizations && {
                organizationId: {
                    in: organizations.split(','),
                },
            }),
        },
        include: {
            userProfile: true,
            survey: {
                where: {
                    clusterSurveyId: id,
                },
                include: {
                    surveySessions: true,
                    subjectClass: true,
                    clusterSurvey: {
                        include: {
                            surveyQuestion: {
                                where: {
                                    type: 'SINGLE_CHOICE',
                                },
                            },
                            surveyChoice: true,
                        },
                    },
                },
            },
        },
    })

    if (!lecturer) {
        return c.json({ message: 'Không tìm thấy giảng viên' }, 404)
    }

    const statsRaw = await Promise.all(
        lecturer.map(async (lecture) => {
            return getLecturerSurveyStats(
                prisma,
                lecture,
                cluster?.surveyQuestion,
                cluster.surveyChoice,
                id
            )
        })
    )
    const data = {
        choices: cluster.surveyChoice,
        choicesAnswer: cluster.surveyChoice.map((c) => c.answer),
        data: statsRaw,
    }

    return c.json(data, 200)
})

const getOrganizationSurveyStatistics = createRoute({
    operationId: 'get-organization-survey-statistics',
    path: '/{id}/organization-statistics',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê theo đơn vị',
    request: {
        params: z.object({ id: z.string() }),
        query: z.object({
            organizations: z.string().optional(),
        }),
    },
    responses: {
        200: {
            description: 'Get thành công',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(OrgazationsSurveyStatsSchema),
                        choices: z.array(models.SurveyChoiceSchema),
                        choicesAnswer: z.array(z.string()),
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
        400: {
            description: 'Không tìm thấy khảo sát.',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
        },
    },
})

app.openapi(getOrganizationSurveyStatistics, async (c) => {
    const { id } = c.req.valid('param')
    const { organizations, ...q } = c.req.valid('query')
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
                    subjectClass: true,
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
    const organization = await prisma.dM_DonVi.findMany({
        where: {
            ...(organizations && {
                Id: {
                    in: organizations.split(','),
                },
            }),
            lecturers: {
                some: {
                    survey: {
                        some: {
                            clusterSurveyId: id,
                        },
                    },
                },
            },
        },
        include: {
            lecturers: {
                where: {
                    survey: {
                        some: {
                            clusterSurveyId: id,
                            surveySessions: {
                                some: {},
                            },
                        },
                    },
                },
                include: {
                    userProfile: true,
                    survey: {
                        where: {
                            clusterSurveyId: id,
                            surveySessions: {
                                some: {},
                            },
                        },
                        include: {
                            surveySessions: {
                                where: {
                                    survey: {
                                        clusterSurveyId: id,
                                    },
                                },
                                include: {
                                    survey: true,
                                },
                            },
                            subjectClass: true,
                            clusterSurvey: {
                                include: {
                                    surveyQuestion: {
                                        where: {
                                            type: 'SINGLE_CHOICE',
                                        },
                                    },
                                    surveyChoice: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!organization) {
        return c.json({ message: 'Không tìm thấy giảng viên' }, 404)
    }

    const statsRaw = await Promise.all(
        organization.map(async (orga) => {
            return getOrganizationsSurveyStats(
                prisma,
                orga,
                cluster?.surveyQuestion,
                cluster.surveyChoice,
                id
            )
        })
    )
    const data = {
        choices: cluster.surveyChoice,
        choicesAnswer: cluster.surveyChoice.map((c) => c.answer),
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
        query: z.object({
            organizations: z.string().array().optional(),
        }),
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
                    subjectClass: true,
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

    // const questionIds = cluster.surveyQuestion.map((q) => q.id)

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
