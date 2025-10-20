import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const saveExamScore = createRoute({
    operationId: 'save-exam-score',
    path: '/save-exam-score',
    tags: ['Exam'],
    summary: 'Lưu điểm theo phách',
    description: 'Lưu điểm theo phách',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .array(
                            z.object({
                                id: z.string(),
                                score: z.number().nullish(),
                            })
                        )
                        .openapi('ExamCodes'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Save exam codes result',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('SaveExamCodesResult'),
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
    },
})

app.openapi(saveExamScore, async (c) => {
    const updates = c.req.valid('json')

    await prisma.$executeRawUnsafe(`
        UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
        SET "examScore" = data."score"
        FROM (
            VALUES
            ${updates.map((u) => `('${u.id}', ${u.score})`).join(',\n')}
        ) AS data("examSessionId", "score")
        JOIN "khao-thi"."ExamSession" AS es
            ON es."id" = data."examSessionId"
        WHERE sss."id" = es."studentSubjectScoreId";
        `)

    return c.json({ success: true, message: 'Success' }, 200)
})

export default app
