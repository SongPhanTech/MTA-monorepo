import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '..'

const teachingAssignment = createRoute({
    operationId: 'teachingAssignment',
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
                        z.object({
                            subjectClassId: z
                                .string()
                                .openapi('subjectClassId', {
                                    description: 'ID của lớp môn học',
                                }),
                            lectureId: z.string().openapi('lectureId', {
                                description: 'ID của giảng viên',
                            }),
                            extraLectureId: z
                                .string()
                                .openapi('extraLectureId', {
                                    description: 'ID của giảng viên phụ trách',
                                }),
                            enterGradeLecturerId: z
                                .string()
                                .openapi('enterGradeLecturerId', {
                                    description: 'ID của giảng viên nhập điểm',
                                }),
                        })
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
                        z.object({
                            subjectClassId: z
                                .string()
                                .openapi('subjectClassId', {
                                    description: 'ID của lớp môn học',
                                }),
                            userProfileId: z.string().openapi('userProfileId', {
                                description: 'ID của giảng viên',
                            }),
                        })
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

const app = new OpenAPIHono({ strict: false })

app.openapi(teachingAssignment, async (c) => {
    const data = c.req.valid('json')
    const result = await Promise.allSettled(
        data.map(async (item) => {
            const {
                subjectClassId,
                lectureId,
                extraLectureId,
                // TODO: Thêm trường enterGradeLecturerId trong db
                enterGradeLecturerId,
            } = item

            // Kiểm tra xem lớp môn học có tồn tại không
            const subjectClass = await prisma.subjectClass.update({
                where: { id: subjectClassId },
                data: {
                    extraLecturerId: extraLectureId,
                    lecturerId: lectureId,
                },
            })
            // Cập nhật phân công giảng dạy
            return subjectClass
        })
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
