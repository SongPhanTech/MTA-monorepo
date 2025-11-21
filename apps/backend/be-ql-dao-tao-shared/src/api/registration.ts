import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { prisma } from '..'
import { ErrorCode, FailedResponseSchema } from '../dto/base'
import { RegistrationRequest, RegistrationResponse, TYPE_RES } from '../dto/registration.dto'

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const registration = createRoute({
    operationId: 'registration',
    path: '/registration',
    tags: ['Registration'],
    summary: '2.3 2.4. Đăng ký/Huỷ đăng ký học phần',
    description: '2.3 2.4. Đăng ký/Huỷ đăng ký học phần',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: RegistrationRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: RegistrationResponse,
                },
            },
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: FailedResponseSchema,
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: FailedResponseSchema,
                },
            },
        },
    },
})

app.openapi(registration, async (c) => {
    const { students_code, class_data, type_res } = c.req.valid('json')
    const student = await prisma.student.findUnique({
        where: { code: students_code },
        include: {
            fixedClass: {
                include: {
                    trainingCourse: true,
                },
            },
        },
    })

    if (!student) {
        return c.json(
            { result_code: ErrorCode.STUDENT_NOT_FOUND, result_desc: 'sinh viên không tồn tại' },
            404
        )
    }

    if (!student?.fixedClass) {
        return c.json(
            { result_code: ErrorCode.STUDENT_NO_CLASS, result_desc: 'sinh viên không có lớp' },
            404
        )
    }

    const now = new Date()
    const registerSession = await prisma.classRegisterSession.findMany({
        where: {
            active: true,
            deletedAt: null,
            startDate: { lte: now },
            endDate: { gte: now },
            trainingCourses: {
                some: { id: student.fixedClass.trainingCourseId },
            },
        },
    })

    if (!registerSession.length) {
        return c.json(
            {
                result_code: ErrorCode.SESSION_NOT_FOUND,
                result_desc: 'không có đợt đăng ký',
            },
            404
        )
    }

    const semesterIds = registerSession.map((item) => item.semesterId)

    const results = await Promise.allSettled(
        class_data.map(async (cls) => {
            const subjectClass = await prisma.subjectClass.findUnique({
                where: { id: cls, semesterId: { in: semesterIds } },
                include: {
                    subject: true,
                    subjectClassStudent: {
                        select: { student: { select: { code: true } } },
                    },
                    mainLecturer: {
                        select: {
                            userProfile: {
                                select: {
                                    fullname: true,
                                    level: { select: { sMa: true, sTen: true } },
                                    academicRankType: { select: { sMa: true, sTen: true } },
                                    academicDegreeType: {
                                        select: { sMa: true, sTen: true },
                                    },
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
                                    academicDegreeType: {
                                        select: { sMa: true, sTen: true },
                                    },
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            subjectClassStudent: true,
                        },
                    },
                },
            })

            if (!subjectClass) {
                throw new Error(`Lớp học ${cls} không hợp lệ`)
            }

            if (type_res === TYPE_RES.REGISTER) {
                if (subjectClass._count.subjectClassStudent >= subjectClass.maxStudent) {
                    throw new Error(
                        `Lớp ${subjectClass.subject.name} ${cls} đã quá số lượng đăng ký`
                    )
                }
                if (
                    subjectClass.subjectClassStudent.some(
                        (item) => item.student.code === student.code
                    )
                ) {
                    throw new Error(`Lớp ${subjectClass.subject.name} ${cls} không hợp lệ`)
                }

                try {
                    await prisma.studentSubjectScore.create({
                        data: {
                            studentId: student.id,
                            subjectClassId: subjectClass.id,
                            subjectVersionId: subjectClass.subjectId,
                        },
                    })
                } catch (error) {
                    console.error(error)
                    throw new Error(`Lớp ${subjectClass.subject.name} ${cls} không hợp lệ`)
                }
            }

            if (type_res === TYPE_RES.CANCEL) {
                if (
                    !subjectClass.subjectClassStudent.some(
                        (item) => item.student.code === student.code
                    )
                ) {
                    throw new Error(`Lớp ${subjectClass.subject.name} ${cls} không hợp lệ`)
                }

                try {
                    await prisma.studentSubjectScore.delete({
                        where: {
                            subjectClassId_studentId: {
                                studentId: student.id,
                                subjectClassId: subjectClass.id,
                            },
                        },
                    })
                } catch (error) {
                    console.error(error)
                    throw new Error(`Lớp ${subjectClass.subject.name} ${cls} không hợp lệ`)
                }
            }

            return cls
        })
    )

    const class_valid: string[] = []
    const class_invalid: string[] = []
    const descriptions: string[] = []
    for (const [idx, result] of results.entries()) {
        if (result.status === 'fulfilled') {
            class_valid.push(result.value)
        } else {
            const reason = result.reason as Error
            class_invalid.push(class_data[idx] as string)
            descriptions.push(reason.message)
        }
    }

    return c.json(
        {
            result_code: '000',
            result_desc: 'success',
            students_code,
            class_valid,
            class_invalid,
            invalid_desc: descriptions.join(', '),
        },
        200
    )
})

export default app
