import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { models } from '@workspace/db/zod'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const getPublicSurveys = createRoute({
    operationId: 'get-public-surveys',
    path: '/get-public-surveys',
    tags: ['Survey'],
    summary: 'Danh sách đợt khảo sát công khai',
    description: 'Danh sách đợt khảo sát công khai',
    method: 'get',
    responses: {
        200: {
            description: 'Get Survey result',
            content: {
                'application/json': {
                    schema: z.array(models.SurveyScalarSchema).openapi('get-public-surveys-result'),
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

app.openapi(getPublicSurveys, async (c) => {
    const surveys = await prisma.survey.findMany({
        where: { deletedAt: null, active: true, isPublic: true },
    })

    return c.json(surveys, 200)
})

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
                                        specificChoice: models.SpecificChoiceScalarSchema.array(),
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
                            subjectClass: models.SubjectClassScalarSchema.nullable(),
                            semester: models.SemesterScalarSchema.nullable(),
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
                    specificChoice: true,
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
            subjectClass: true,
            semester: true,
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
                            studentCode: z.string().optional(),
                            surveyObjectTypeId: z.string().nullish(),
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
    let { surveyId, profileId, studentId, studentCode, surveyObjectTypeId, startedAt, responses } =
        c.req.valid('json')
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId, deletedAt: null, active: true },
        include: { surveyChoice: true },
    })
    if (!survey) {
        return c.json({ message: 'Đợt khảo sát không tồn tại' }, 404)
    }
    if (survey.isPublic) {
        if (!survey.anonymous) {
            if (!studentCode) {
                return c.json({ message: 'Vui lý nhập mã SV' }, 400)
            }

            const student = await prisma.student.findFirst({
                where: { code: studentCode, deletedAt: null },
            })
            if (!student) {
                return c.json({ message: 'Mã SV không tồn tại' }, 404)
            }

            studentId = student.id
            profileId = student.userProfileId
        }
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
            ...(profileId && { profile: { connect: { id: profileId } } }),
            ...(studentId && { student: { connect: { id: studentId } } }),
            ...(surveyObjectTypeId && {
                surveyObjectType: { connect: { id: surveyObjectTypeId } },
            }),
            startedAt,
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

const validateUserSurvey = createRoute({
    operationId: 'validate-user-survey',
    path: '/validate-user-survey',
    tags: ['Survey'],
    summary: 'Kiểm tra mã sinh viên có trong cơ sở dữ liệu',
    description: 'Kiểm tra mã sinh viên có trong cơ sở dữ liệu',
    method: 'get',
    request: {
        query: z.object({
            studentCode: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Get Survey result',
            content: {
                'application/json': {
                    schema: z.object({
                        studentCode: z.string(),
                        exists: z.boolean(),
                    }),
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

app.openapi(validateUserSurvey, async (c) => {
    const { studentCode } = c.req.valid('query')

    if (!studentCode) {
        return c.json({ message: 'Vui lý nhập mã SV' }, 400)
    }

    const student = await prisma.student.findFirst({
        where: { code: studentCode, deletedAt: null },
    })
    if (!student) {
        return c.json({ message: 'Mã SV không tồn tại' }, 404)
    }

    return c.json({ studentCode, exists: true }, 200)
})

export default app
