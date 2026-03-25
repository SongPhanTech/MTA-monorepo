import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getOrganizationAndAllChildren } from '@workspace/db'
import { models } from '@workspace/db/zod'
import { getTemplateBuffer } from '@workspace/libs/server'
import XlsxTemplate from 'xlsx-template'
import { prisma } from '..'
import {
    getLecturerSurveyStats,
    getOrganizationsSurveyStats,
    getSurveyStats,
    getSurveyStatsforDonVi,
    getSurveyStatsforQuestion,
    LecturerSurveyStatsSchema,
    OrgazationsSurveyStatsSchema,
    SurveyStatsLecSchema,
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
                            trainingObjectTypeId: z.string().nonempty(),
                            startDate: z.coerce.date(),
                            endDate: z.coerce.date().optional(),
                            isPublic: z.boolean().default(false),
                            anonymous: z.boolean().default(false),
                            surveyTopicId: z.string(),
                            surveyObjectTypeIds: z.array(z.string()).optional().default([]),
                            subjectClassIds: z.array(z.string()).nonempty(),
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
        subjectClassIds,
        surveyTopicId,
        semesterId,
        trainingObjectTypeId,
        ...payload
    } = c.req.valid('json')

    const lecturerIds = await prisma.lecturer.findMany({
        where: {
            mainSubjectClasses: {
                some: {
                    semesterId,
                    id: { in: subjectClassIds },
                },
            },
        },
        include: {
            mainSubjectClasses: true,
        },
    })

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
                    connect: lecturerIds.map((i) => ({ id: i?.id })),
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
                id: { in: subjectClassIds },
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
                semesterId,
                trainingObjectTypeId,
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
            organizationId: z.string(),
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
    const { organizationId, ...q } = c.req.valid('query')
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
            sParentId: organizationId,
            OR: [
                {
                   sMa:'HD'
                },
                {
                    iLoaiDonVi: {
                        in: [5, 6, 7],
                    },
                },
            ],
            // lecturers: {
            //     some: {
            //         survey: {
            //             some: {
            //                 clusterSurveyId: id,
            //             },
            //         },
            //     },
            // },
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

const getClusterSurveyStatisticsForLecturer = createRoute({
    operationId: 'get-cluster-survey-statistics-for-lecturer',
    path: '/{id}/statistics-for-lecturer',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê câu trả lời cho từng câu hỏi trong một cụm khảo sát cuar từng giáo viên',
    request: {
        params: z.object({ id: z.string() }),
        query: z.object({
            organizations: z.string().array().optional(),
            lectureId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: models.ClusterSurveySchema.extend({
                        data: SurveyStatsLecSchema,
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

app.openapi(getClusterSurveyStatisticsForLecturer, async (c) => {
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

    const listData = await getSurveyStatsforQuestion(
        prisma,
        id,
        lectureId,
        cluster.surveyQuestion,
        cluster.surveyChoice
    )

    const data = {
        ...cluster,
        data: listData,
    }

    return c.json(data, 200)
})

const getClusterSurveyStatisticsForDonVi = createRoute({
    operationId: 'get-cluster-survey-statistics-for-organization',
    path: '/{id}/statistics-for-organization',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê câu trả lời cho từng câu hỏi trong một cụm khảo sát của từng đơn vị',
    request: {
        params: z.object({ id: z.string() }),
        query: z.object({
            organizationId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: models.ClusterSurveySchema.extend({
                        data: SurveyStatsLecSchema,
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

app.openapi(getClusterSurveyStatisticsForDonVi, async (c) => {
    const { id } = c.req.valid('param')
    const { organizationId, ...q } = c.req.valid('query')
    const organizations = await getOrganizationAndAllChildren(prisma, organizationId)
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
                        organizationId: {
                            in: organizations?.length
                                ? organizations.map((i: any) => i.Id)
                                : [organizationId],
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

    const listData = await getSurveyStatsforDonVi(
        prisma,
        id,
        organizations?.length > 0 ? organizations.map((i: any) => i.Id) : [organizationId],
        cluster.surveyQuestion,
        cluster.surveyChoice
    )

    const data = {
        ...cluster,
        data: listData,
    }

    return c.json(data, 200)
})

const getClusterSurveyStatisticsForHocVien = createRoute({
    operationId: 'get-cluster-survey-statistics-for-all',
    path: '/{id}/statistics-for-all',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê câu trả lời cho từng câu hỏi trong một cụm khảo sát của từng đơn vị',
    request: {
        params: z.object({ id: z.string() }),
        query: z.object({
            organizationId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: models.ClusterSurveySchema.extend({
                        data: SurveyStatsLecSchema,
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

app.openapi(getClusterSurveyStatisticsForHocVien, async (c) => {
    const { id } = c.req.valid('param')
    const { organizationId, ...q } = c.req.valid('query')
    const organizations = await prisma.dM_DonVi.findMany({
        where: {
            sParentId: organizationId,
        },
    })

    if (organizations?.length <= 0) {
        return c.json({ message: 'Không tìm thấy khảo sát' }, 404)
    }

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
                        organizationId: {
                            in: organizations?.length
                                ? [...organizations.map((i) => i.Id), organizationId]
                                : [organizationId],
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

    const listData = await getSurveyStatsforDonVi(
        prisma,
        id,
        organizations?.length > 0
            ? [...organizations.map((i) => i.Id), organizationId]
            : [organizationId],
        cluster.surveyQuestion,
        cluster.surveyChoice
    )

    const data = {
        ...cluster,
        data: listData,
    }

    return c.json(data, 200)
})

const getClusterSurveyInfo = createRoute({
    operationId: 'get-cluster-survey-info',
    path: '/{id}/get-cluster-survey-info',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê khảo sát cụm thông tin chung',
    request: {
        params: z.object({ id: z.string() }),
        query: z.object({
            organizationId: z.string(),
            semesterId: z.string(),
            trainingObjectTypeId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: z.object({
                        surveyCount: z.number(),
                        completedSurveyCount: z.number(),
                        listStudentCount: z.number(),
                        studentCompletedSurveyCount: z.number(),
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

app.openapi(getClusterSurveyInfo, async (c) => {
    const { id } = c.req.valid('param')
    const { semesterId, trainingObjectTypeId, ...q } = c.req.valid('query')

    const survey = await prisma.survey.findMany({
        where: { clusterSurveyId: id },
        include: {
            surveySessions: true,
        },
    })

    if (!survey?.length) {
        return c.json({ message: 'Không tìm thấy khảo sát' }, 404)
    }

    const completedSurveyCount = await prisma.survey.count({
        where: {
            clusterSurveyId: id,
            surveySessions: {
                some: {},
            },
        },
    })
    let listStudentCount = 0

    const listSUbsjecClass = await prisma.subjectClass.findMany({
        where: {
            survey: {
                some: {
                    clusterSurveyId: id,
                },
            },
        },
        include: {
            mainLecturer: true,
            subjectClassStudent: true,
        },
    })
    listSUbsjecClass.forEach((i) => {
        listStudentCount += i?.subjectClassStudent?.length
    })

    const studentCompletedSurvey = await prisma.surveySession.count({
        where: {
            survey: {
                clusterSurveyId: id,
            },
        },
        // include:{
        //     survey:{
        //         include:{
        //             clusterSurvey:true
        //         }
        //     }
        // }
    })

    const data = {
        surveyCount: survey?.length || 0,
        completedSurveyCount,
        listStudentCount,
        studentCompletedSurveyCount: studentCompletedSurvey || 0,
    }

    return c.json(data, 200)
})

const getClusterSurveyInfoDepartment = createRoute({
    operationId: 'get-cluster-survey-info-department',
    path: '/{id}/get-cluster-survey-info-department',
    method: 'get',
    tags: ['ClusterSurvey'],
    summary: 'Thống kê khảo sát cụm thông tin chung theo khoa',
    request: {
        params: z.object({ id: z.string() }),
        query: z.object({
            organizationId: z.string(),
            semesterId: z.string(),
            trainingObjectTypeId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.any(),
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
app.openapi(getClusterSurveyInfoDepartment, async (c) => {
    const { id } = c.req.valid('param')
    const { semesterId, trainingObjectTypeId, organizationId, ...q } = c.req.valid('query')

    const survey = await prisma.survey.findMany({
        where: { clusterSurveyId: id, lecture: { organizationId } },
        include: {
            surveySessions: true,
        },
    })

    if (!survey?.length) {
        return c.json({ message: 'Không tìm thấy khảo sát' }, 404)
    }

    const completedSurveyCount = await prisma.survey.count({
        where: {
            clusterSurveyId: id,
            surveySessions: {
                some: {},
            },
            lecture: { organizationId },
        },
    })
    let listStudentCount = 0

    const listSUbsjecClass = await prisma.subjectClass.findMany({
        where: {
            survey: {
                some: {
                    clusterSurveyId: id,
                    lecture: { organizationId },
                },
            },
        },
        include: {
            mainLecturer: true,
            subjectClassStudent: true,
        },
    })
    listSUbsjecClass.forEach((i) => {
        listStudentCount += i?.subjectClassStudent?.length
    })

    const studentCompletedSurvey = await prisma.surveySession.count({
        where: {
            survey: {
                clusterSurveyId: id,
                lecture: { organizationId },
            },
        },
        // include:{
        //     survey:{
        //         include:{
        //             clusterSurvey:true
        //         }
        //     }
        // }
    })

    const data = {
        data: {
            surveyCount: survey?.length || 0,
            completedSurveyCount,
            listStudentCount,
            studentCompletedSurveyCount: studentCompletedSurvey || 0,
        },
    }

    return c.json(data, 200)
})

export default app
