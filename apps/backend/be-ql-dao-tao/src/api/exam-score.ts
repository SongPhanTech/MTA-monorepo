import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { Prisma } from '@workspace/db'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const genExamCode = createRoute({
    operationId: 'gen-exam-code',
    path: '/gex-exam-code',
    tags: ['Exam'],
    summary: 'Sinh phách cho kỳ thi',
    description: 'Sinh phách cho kỳ thi',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            examId: z.string().openapi('examId', {
                                description: 'ID của kì thi',
                            }),
                        })
                        .openapi('gen-exam-code'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Generate Exam code result',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('gen-exam-code-result'),
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

app.openapi(genExamCode, async (c) => {
    const { examId } = c.req.valid('json')
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
            studentSubjectScore: true,
            examRooms: {
                include: {
                    examSessions: {
                        include: { studentSubjectScore: true },
                    },
                },
            },
        },
    })
    if (!exam) {
        return c.json({ message: 'Kỳ thi không tồn tại' }, 404)
    }

    if (exam.lockExamCode) {
        return c.json({ message: 'Phách đã khoá' }, 400)
    }

    const examSessions = exam.examRooms.flatMap((r) => r.examSessions)
    if (exam.studentSubjectScore.length !== examSessions.length) {
        return c.json({ message: 'Thí sinh chưa được phân phòng thi' }, 404)
    }

    const hasScore = exam.examRooms.some((r) =>
        r.examSessions.some((s) => s.studentSubjectScore.finalScore !== null)
    )

    if (hasScore) {
        return c.json({ message: 'Phách đã được nhập điểm' }, 400)
    }

    const padding = examSessions.length.toString().length
    const examCodes = Array.from({ length: examSessions.length }, (_, i) =>
        String(i + 1).padStart(padding, '0')
    ).sort((a, b) => Math.random() - 0.5)

    const examSessionUpdates = examSessions.map((s, i) => ({
        id: s.id,
        examCode: examCodes[i],
    }))

    const examCodesCases = examSessionUpdates.map(
        (u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.examCode}`
    )

    const ids = examSessionUpdates.map((u) => u.id)

    await prisma.$transaction(async (tx) => {
        await tx.examSession.updateMany({
            where: { id: { in: ids } },
            data: { examCode: null },
        })
        await tx.$executeRaw`
            UPDATE "khao-thi"."ExamSession"
            SET
                "examCode" = CASE ${Prisma.join(examCodesCases, ' ')} END
            WHERE
                "id" IN (${Prisma.join(ids)})
            `
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

const genExamRoomCode = createRoute({
    operationId: 'gen-exam-room-code',
    path: '/gex-exam-room-code',
    tags: ['Exam'],
    summary: 'Sinh phách cho phòng thi',
    description: 'Sinh phách cho phòng thi',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            examRoomId: z.string().openapi('examRoomId', {
                                description: 'ID phòng thi',
                            }),
                        })
                        .openapi('gen-exam-room-code'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Generate Exam Room code result',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('gen-exam-room-code-result'),
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

app.openapi(genExamRoomCode, async (c) => {
    const { examRoomId } = c.req.valid('json')
    const examRoom = await prisma.examRoom.findUnique({
        where: { id: examRoomId },
        include: {
            examSessions: {
                include: { studentSubjectScore: true },
            },
        },
    })
    if (!examRoom) {
        return c.json({ message: 'Kỳ thi không tồn tại' }, 404)
    }

    if (examRoom.lockExamCode) {
        return c.json({ message: 'Phách đã khoá' }, 400)
    }

    if (!examRoom.examSessions.length) {
        return c.json({ message: 'Không có thí sinh' }, 404)
    }

    const hasScore = examRoom.examSessions.some((s) => s.studentSubjectScore.finalScore !== null)

    if (hasScore) {
        return c.json({ message: 'Phách đã được nhập điểm' }, 400)
    }

    const padding = examRoom.examSessions.length
    const examCodes = Array.from({ length: examRoom.examSessions.length }, (_, i) =>
        String(i + 1).padStart(padding, '0')
    ).sort((a, b) => Math.random() - 0.5)

    const examSessionUpdates = examRoom.examSessions.map((s, i) => ({
        id: s.id,
        examCode: examCodes[i],
    }))

    const examCodesCases = examSessionUpdates.map(
        (u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.examCode}`
    )

    const ids = examSessionUpdates.map((u) => u.id)

    await prisma.$transaction(async (tx) => {
        await tx.examSession.updateMany({
            where: { id: { in: ids } },
            data: { examCode: null },
        })
        await tx.$executeRaw`
            UPDATE "khao-thi"."ExamSession"
            SET
                "examCode" = CASE ${Prisma.join(examCodesCases, ' ')} END
            WHERE
                "id" IN (${Prisma.join(ids)})
            `
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

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
