import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const teachingAssignment = createRoute({
    operationId: 'lecturerAssignment',
    path: '/teaching-assignment',
    method: 'put',
    description: 'Phân công giảng dạy',
    tags: ['SubjectClass'],
    summary: 'Phân công giảng dạy',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.array(
                        z
                            .object({
                                subjectClassId: z.string(),
                                lecturerId: z.string(),
                                extraLecturerId: z.string(),
                                enterGradeLecturerId: z.string(),
                            })
                            .openapi('teachingAssignmentRequest')
                    ),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(
                        z
                            .object({
                                subjectClassId: z
                                    .string()
                                    .openapi('subjectClassId', {
                                        description: 'ID của lớp môn học',
                                    }),
                                userProfileId: z
                                    .string()
                                    .openapi('userProfileId', {
                                        description: 'ID của giảng viên',
                                    }),
                            })
                            .openapi('teachingAssignmentResponse')
                    ),
                },
            },
            description: 'Danh sách phân công giảng dạy thành công',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

app.openapi(teachingAssignment, async (c) => {
    const data = c.req.valid('json')
    const result = await Promise.allSettled(
        data.map(async ({ subjectClassId, ...lecturers }) =>
            prisma.subjectClass.update({
                where: { id: subjectClassId },
                data: lecturers,
            })
        )
    )

    const resultSuccess = result
        .filter((item) => item.status === 'fulfilled')
        .map((item) => item.value)

    const resultError = result.filter((item) => item.status === 'rejected')

    return c.json(
        {
            data: resultSuccess,
            success: resultSuccess.length,
            errors: resultError.map((item) => item.reason),
            count: result.length,
        },
        200
    )
})

export default app
