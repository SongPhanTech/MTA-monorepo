import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { prisma } from '..'
import { FailedResponseSchema } from '../dto/base'
import { StudentScheduleRequest, StudentScheduleResponse } from '../dto/student-schedule'

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const postStudentSchedule = createRoute({
    operationId: 'schedules',
    path: '/schedules',
    tags: ['Schedules'],
    summary: '2.6. Thời khóa biểu',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: StudentScheduleRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: StudentScheduleResponse,
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

app.openapi(postStudentSchedule, async (c) => {
    const { class_terms, students_code } = c.req.valid('json')

    const student = await prisma.classSchedule.findMany({
        where: {
            subjectClass: {
                subjectClassStudent: {
                    some: {
                        student: {
                            code: students_code,
                        },
                    },
                },
                semester: {
                    name: class_terms,
                },
            },
        },

        select: {
            room: {
                select: {
                    name: true,
                    code: true,
                },
            },
            subjectClass: {
                select: {
                    subjectClassTimes: {
                        select: {
                            dayOfWeek: true,
                            startPeriod: true,
                            endPeriod: true,
                        },
                    },
                    code: true,
                    subject: {
                        select: {
                            name: true,
                            code: true,
                            credit: true,
                        },
                    },
                },
            },
            userProfiles: {
                select: {
                    educationAndTraining: {
                        select: {
                            code: true,
                        },
                    },
                },
            },
        },
    })

    const studentScheduleList = student.map((item) => {
        const subjectClass = item.subjectClass

        const class_time = subjectClass?.subjectClassTimes
            .map((t) => `T${t.dayOfWeek}(${t.startPeriod}-${t.endPeriod})`)
            .join(', ')

        return {
            courses_code: subjectClass?.subject.code ?? '',
            courses_name: subjectClass?.subject.name ?? '',
            class_credit_hour: subjectClass?.subject.credit ?? 0,
            class_id: subjectClass?.code ?? '',
            class_time: class_time ?? '',
            class_classroom: item.room?.name ?? '',
        }
    })

    return c.json(
        {
            result_code: '000',
            result_desc: 'success' as const,
            class_terms: class_terms ?? '',
            students_code: students_code ?? '',
            students_schedules: studentScheduleList,
        },
        200
    )
})

export default app
