import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ClassRegisterStatus } from '@workspace/db'
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
                        models.ClassRegisterSessionScalarSchema.extend({
                            semester: models.SemesterScalarSchema.extend({
                                schoolYear: models.SchoolYearScalarSchema,
                            }),
                            trainingCourses: z.array(z.object({ id: z.string() })),
                            curriculumVersions: z.array(
                                models.CurriculumVersionScalarSchema.nullish()
                            ),
                        })
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
        query: z.object({
            sessionId: z.string().openapi({ description: 'ID đợt đăng ký lớp học' }),
            curriculumVersionId: z.string(),
            byCurriculum: z.string().default('true'),
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

    const { sessionId, curriculumVersionId, byCurriculum } = c.req.valid('query')

    const byCurriculumBool = `${byCurriculum}`.toLowerCase() === 'true'

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
            ...(byCurriculumBool
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
                where: {
                    active: true,
                    deletedAt: null,
                    cancelled: false,
                },
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
                    extraLecturer: {
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
                    _count: {
                        select: {
                            classRegisterLogs: true,
                        },
                    },
                },
            },
        },
    })

    const data = subjectVersions.map((version) => {
        const subjectVersion = curriculumSubjects.find((item) => item.subjectId === version.id)

        return {
            ...version,
            type: subjectVersion?.type,
            subjectClass: version.subjectClass.map((subjectClass) => ({
                ...subjectClass,
                credit: version.credit ?? 0,
            })),
        }
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
                        subjectClassIds: z
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
    const { sessionId, subjectClassIds } = c.req.valid('json')

    const registerSession = await prisma.classRegisterSession.findUniqueOrThrow({
        where: { id: sessionId },
    })

    if (
        !registerSession.active ||
        registerSession.startDate > new Date() ||
        registerSession.endDate < new Date()
    ) {
        return c.json({ message: 'Đợt đăng ký đã đóng' }, 404)
    }

    const profile = await prisma.userProfile.findUniqueOrThrow({
        where: { id: session.id },
        include: {
            educationAndTraining: {
                include: {
                    fixedClass: {
                        include: {
                            trainingCourse: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (profile.educationAndTraining.length === 0) {
        return c.json({ message: 'Bạn không có thông tin học vụ' }, 404)
    }

    // TODO: maybe allow user select student profile
    const studentId = profile.educationAndTraining[0]?.id as string

    // TODO: check session => student trainingCourse

    // TODO: check subjectVersionIds, prerequisiteSubjectIds, coRequisiteSubjectIds

    // save the register log
    const registerLogs = await prisma.classRegisterLogs.createManyAndReturn({
        data: subjectClassIds.map((subjectClassId) => ({
            classRegisterSessionId: sessionId,
            studentId,
            subjectClassId,
        })),
        include: { subjectClass: true },
    })

    // now directly register here, need to implement a job queue
    for (const registerLog of registerLogs) {
        try {
            await prisma.$transaction(async (tx) => {
                await tx.studentSubjectScore.create({
                    data: {
                        subjectClassId: registerLog.subjectClassId,
                        studentId,
                        subjectVersionId: registerLog.subjectClass.subjectId,
                    },
                })

                await tx.classRegisterLogs.update({
                    where: { id: registerLog.id },
                    data: { status: ClassRegisterStatus.SUCCESS },
                })
            })
        } catch (error) {
            await prisma.classRegisterLogs.update({
                where: { id: registerLog.id },
                data: { status: ClassRegisterStatus.FAILED },
            })
        }
    }

    return c.json({ message: 'success' }, 200)
})

export default app
