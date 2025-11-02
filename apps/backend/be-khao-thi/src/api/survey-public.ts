import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { models } from '@workspace/db/zod'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const getPublicSurvey = createRoute({
    operationId: 'get-public-survey',
    path: '/get-public-survey/{id}',
    tags: ['Survey'],
    summary: 'Thông tin đợt khảo sát công khai',
    description: 'Lấy thông tin đợt khảo sát công khai',
    method: 'get',
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'ID của khảo sát.' }),
        }),
    },
    responses: {
        200: {
            description: 'Get Survey result',
            content: {
                'application/json': {
                    schema: models.SurveyScalarSchema.merge(
                        z.object({
                            surveyQuestion: z.array(
                                models.SurveyQuestionScalarSchema.merge(
                                    z.object({
                                        surveyQuestionGroup:
                                            models.SurveyQuestionGroupScalarSchema.nullable(),
                                    })
                                )
                            ),
                            surveyChoice: models.SurveyChoiceScalarSchema.array(),
                            lectureInfo: z
                                .object({
                                    firstName: z.string(),
                                    lastName: z.string(),
                                    academicDegree: z.string().nullish(),
                                    academicRank: z.string().nullish(),
                                    organization: z.string().nullable(),
                                })
                                .nullable(),
                        })
                    ).openapi('get-survey-result'),
                },
            },
        },
        400: {
            description: 'Bad request',
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

app.openapi(getPublicSurvey, async (c) => {
    const { id } = c.req.valid('param')

    const survey = await prisma.survey.findUnique({
        where: { id, deletedAt: null, active: true },
        include: {
            surveyQuestion: {
                include: {
                    surveyQuestionGroup: true,
                },
            },
            surveyChoice: true,
            lecture: {
                select: {
                    userProfile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            academicDegreeType: {
                                select: { sTen: true },
                            },
                            academicRankType: {
                                select: { sTen: true },
                            },
                        },
                    },
                    organization: {
                        select: {
                            sTen: true,
                        },
                    },
                },
            },
        },
    })
    if (!survey) {
        return c.json({ message: 'Đợt khảo sát không tồn tại' }, 404)
    }

    if (survey.startDate > new Date()) {
        return c.json({ message: 'Khảo sát chưa mở' }, 400)
    }

    if (survey.endDate && survey.endDate < new Date()) {
        return c.json({ message: 'Khảo sát đã đóng' }, 400)
    }

    const { lecture, ...data } = survey

    const lectureInfo = lecture
        ? {
              firstName: lecture.userProfile.firstName,
              lastName: lecture.userProfile.lastName,
              academicDegree: lecture.userProfile.academicDegreeType?.sTen,
              academicRank: lecture.userProfile.academicRankType?.sTen,
              organization: lecture.organization.sTen,
          }
        : null

    return c.json({ ...data, lectureInfo }, 200)
})

const savePublicSurvey = createRoute({
    operationId: 'save-public-survey',
    path: '/save-public-survey',
    tags: ['Survey'],
    summary: 'Lưu kết quả khảo sát công khai',
    description: 'Lưu kết quả khảo sát công khai',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            surveyId: z.string(),
                            profileId: z.string().optional(),
                            studentId: z.string().optional(),
                            surveyObjectTypeId: z.string().nullish(),
                            additionalSuggestion: z.string(),
                            startedAt: z.string().datetime().optional(),
                            responses: z.array(
                                z.object({
                                    surveyQuestionId: z.string(),
                                    answerText: z.string().nullish(),
                                    explanation: z.string().nullish(),
                                    surveyChoiceId: z.string().nullish(),
                                    answeredAt: z.date().optional(),
                                })
                            ),
                        })
                        .openapi('save-survey-request'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Save survey result',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('save-survey-result'),
                },
            },
        },
        400: {
            description: 'failed',
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

app.openapi(savePublicSurvey, async (c) => {
    const {
        surveyId,
        profileId,
        studentId,
        surveyObjectTypeId,
        additionalSuggestion,
        startedAt,
        responses,
    } = c.req.valid('json')
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId, deletedAt: null, active: true },
        include: { surveyChoice: true },
    })
    if (!survey) {
        return c.json({ message: 'Đợt khảo sát không tồn tại' }, 404)
    }

    if (survey.startDate > new Date()) {
        return c.json({ message: 'Khảo sát chưa mở' }, 400)
    }

    if (survey.endDate && survey.endDate < new Date()) {
        return c.json({ message: 'Khảo sát đã đóng' }, 400)
    }

    const responseChoiceIDs = new Set(responses.map((r) => r.surveyChoiceId).filter(Boolean))
    for (const id of responseChoiceIDs) {
        if (!survey.surveyChoice.find((c) => c.id === id)) {
            return c.json({ message: 'Lựa chọn không thoả mãn' }, 404)
        }
    }

    await prisma.surveySession.create({
        data: {
            survey: { connect: { id: surveyId } },
            profile: { connect: { id: profileId } },
            student: { connect: { id: studentId } },
            surveyObjectType: { connect: { id: surveyObjectTypeId || undefined } },
            startedAt,
            additionalSuggestion,
            completedAt: new Date(),
            isCompleted: true,
            responses: {
                createMany: {
                    data: responses,
                },
            },
        },
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

export default app
