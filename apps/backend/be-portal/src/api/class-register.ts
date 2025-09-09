import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { models } from '@workspace/db/zod'
import { prisma } from '..'
import { findClassRegisterSession } from '../services/register'

const app = new OpenAPIHono({ strict: false })

const getClassRegisterSession = createRoute({
    operationId: 'get-class-register-session',
    path: '/get-class-register-session',
    tags: ['ClassRegister'],
    summary: 'Lấy thống tin đợt đăng ký học',
    description: 'Lấy thống tin đợt đăng ký học',
    method: 'get',
    responses: {
        200: {
            description: 'Thông tin đợt đăng ký',
            content: {
                'application/json': {
                    schema: z.array(
                        models.ClassRegisterSessionScalarSchema.openapi('class-register-session')
                    ),
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

app.openapi(getClassRegisterSession, async (c) => {
    const session = c.get('user')
    const registerSessions = await findClassRegisterSession(session.id)
    return c.json(registerSessions, 200)
})

const GetClassesInfoResponseSchema = z.array(
    models.SubjectVersionScalarSchema.extend({
        subjectClass: z.array(
            models.SubjectClassScalarSchema.extend({
                prerequisiteSubject: z
                    .array(models.SubjectVersionScalarSchema.pick({ code: true, name: true }))
                    .nullish(),
                classSchedules: z.array(models.ClassScheduleScalarSchema),
                mainLecturer: z
                    .object({
                        userProfile: models.UserProfileScalarSchema.extend({
                            level: models.DM_ChucDanhScalarSchema.pick({
                                sMa: true,
                                sTen: true,
                            }).nullish(),
                            academicRankType: models.DM_HocHamScalarSchema.pick({
                                sMa: true,
                                sTen: true,
                            }).nullish(),
                            academicDegreeType: models.DM_HocViScalarSchema.pick({
                                sMa: true,
                                sTen: true,
                            }).nullish(),
                        }),
                    })
                    .nullish(),
                room: models.RoomScalarSchema.pick({ name: true })
                    .extend({
                        building: models.BuildingScalarSchema.pick({ name: true })
                            .extend({
                                trainingLocation: models.TrainingLocationScalarSchema.pick({
                                    name: true,
                                }).nullish(),
                            })
                            .nullish(),
                    })
                    .nullish(),
            })
        ),
        type: models.TrainingBlockSubjectScalarSchema.shape.type.optional(),
    })
)

const getClassesInfo = createRoute({
    operationId: 'get-classes-info',
    path: '/get-classes-info',
    tags: ['ClassRegister'],
    summary: 'Lấy thống tin lớp học',
    description: 'Lấy thống tin lớp học',
    method: 'get',
    request: {
        params: z.object({
            sessionId: z.string().openapi({ description: 'ID đợt đăng ký lớp học' }),
            curriculumVersionId: z.string(),
            byCurriculum: z.boolean().default(true),
        }),
    },
    responses: {
        200: {
            description: 'Thông tin lớp học',
            content: {
                'application/json': {
                    schema: GetClassesInfoResponseSchema,
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

app.openapi(getClassesInfo, async (c) => {
    const session = c.get('user')
    const profile = await prisma.userProfile.findUniqueOrThrow({
        where: { id: session.id },
        include: {
            educationAndTraining: {
                include: {
                    curriculumVersion: {
                        include: {
                            trainingBlocks: {
                                include: {
                                    subjects: {
                                        include: {
                                            subject: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    fixedClass: {
                        include: {
                            trainingCourse: true,
                            curriculumVersion: {
                                include: {
                                    trainingBlocks: {
                                        include: {
                                            subjects: {
                                                include: {
                                                    subject: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    const { sessionId, curriculumVersionId, byCurriculum } = c.req.valid('param')

    const now = new Date()
    const registerSession = await prisma.classRegisterSession.findUniqueOrThrow({
        where: {
            id: sessionId,
            startDate: { lte: now },
            endDate: { gte: now },
            trainingCourses: {
                some: {
                    id: {
                        in: profile.educationAndTraining.map(
                            (item) => item.fixedClass?.trainingCourse.id || ''
                        ),
                    },
                },
            },
        },
    })

    const curriculumVersion = await prisma.curriculumVersion.findUniqueOrThrow({
        where: { id: curriculumVersionId },
        include: { trainingBlocks: { include: { subjects: { include: { subject: true } } } } },
    })

    const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap((block) => block.subjects)

    const subjectVersions = await prisma.subjectVersion.findMany({
        where: {
            ...(byCurriculum
                ? { id: { in: curriculumSubjects.map((item) => item.subjectId) } }
                : {}),
            subjectClass: { some: { semesterId: registerSession.semesterId } },
        },
        include: {
            prerequisiteSubject: {
                select: {
                    code: true,
                    name: true,
                },
            },
            subjectClass: {
                include: {
                    classSchedules: { take: 1, orderBy: { classDate: 'asc' } },
                    mainLecturer: {
                        select: {
                            userProfile: {
                                select: {
                                    fullname: true,
                                    level: { select: { sMa: true, sTen: true } },
                                    academicRankType: { select: { sMa: true, sTen: true } },
                                    academicDegreeType: { select: { sMa: true, sTen: true } },
                                },
                            },
                        },
                    },
                    room: {
                        select: {
                            name: true,
                            building: {
                                select: {
                                    name: true,
                                    trainingLocation: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    const data = subjectVersions.map((version) => {
        const subjectVersion = curriculumSubjects.find((item) => item.subjectId === version.id)

        return { ...version, type: subjectVersion?.type }
    })

    return c.json(data, 200)
})

const classRegister = createRoute({
    operationId: 'class-register',
    path: '/class-register',
    tags: ['ClassRegister'],
    summary: 'Đăng ký lớp học',
    description: 'Đăng ký lớp học',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        sessionId: z.string().openapi({ description: 'ID đợt đăng ký lớp học' }),
                        subjectVersionIds: z
                            .array(z.string())
                            .openapi({ description: 'Danh sách ID lớp học' }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Đăng ký thành công',
            content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        },
        400: {
            description: 'Bad request',
            content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        },
        404: {
            description: 'Not found',
            content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        },
    },
})

app.openapi(classRegister, async (c) => {
    const session = c.get('user')
    const { sessionId, subjectVersionIds } = c.req.valid('json')

    return c.json({ message: 'success' }, 200)
})

export default app
