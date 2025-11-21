import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })
const getRegistration = createRoute({
    operationId: 'get-registration',
    tags: ['Registration'],
    path: 'get-registration',
    summary: '2.5 Lấy danh sách học phần đã đăng kí',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            class_terms: z.string(),
                            students_code: z.string(),
                        })
                        .openapi('GetRegistrationRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            result_code: z.string(),
                            result_desc: z.string(),
                            students_code: z.string(),
                            class_reg: z.array(z.string()),
                        })
                        .openapi('GetRegistrationResponse'),
                },
            },
        },
    },
})

app.openapi(getRegistration, async (c) => {
    const { class_terms, students_code } = c.req.valid('json')

    const logs = await prisma.classRegisterLogs.findMany({
        where: {
            classRegisterSession: {
                name: class_terms,
            },
            student: {
                code: students_code,
            },
        },
        select: {
            subjectClass: {
                select: {
                    code: true,
                },
            },
        },
    })
    const class_reg = logs.map((l) => l.subjectClass.code)

    return c.json({
        result_code: '000',
        result_desc: 'success',
        students_code,
        class_reg,
    })
})
export default app
