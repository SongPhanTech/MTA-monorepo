import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { Prisma } from '@workspace/db'
import { calcFinalScore } from '@workspace/libs/utils'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const genExamListCode = createRoute({
    operationId: 'gen-exam-list-code',
    path: '/gen-exam-list-code',
    tags: ['Exam'],
    summary: 'Sinh phách cho danh sách thi',
    description: 'Sinh phách cho danh sách thi',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            examListId: z.string().openapi('examListId', {
                                description: 'ID danh sách thi',
                            }),
                        })
                        .openapi('gen-exam-room-code'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Generate Exam List code result',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('gen-exam-list-code-result'),
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

app.openapi(genExamListCode, async (c) => {
    const { examListId } = c.req.valid('json')
    const examList = await prisma.examList.findUnique({
        where: { id: examListId },
        include: {
            examPapers: {
                include: { studentSubjectScore: true },
            },
        },
    })
    if (!examList) {
        return c.json({ message: 'Kỳ thi không tồn tại' }, 404)
    }

    if (examList.lockExamCode) {
        return c.json({ message: 'Phách đã khoá' }, 400)
    }

    if (!examList.examPapers.length) {
        return c.json({ message: 'Không có thí sinh' }, 404)
    }

    const hasScore = examList.examPapers.some((s) => s.studentSubjectScore.examScore !== null)

    if (hasScore) {
        return c.json({ message: 'Phách đã được nhập điểm' }, 400)
    }

    const padding = examList.examPapers.length.toString().length
    const examCodes = Array.from({ length: examList.examPapers.length }, (_, i) =>
        String(i + 1).padStart(padding, '0')
    ).sort((a, b) => Math.random() - 0.5)

    const examPaperUpdates = examList.examPapers.map((s, i) => ({
        id: s.id,
        examCode: examCodes[i],
    }))

    const examCodesCases = examPaperUpdates.map(
        (u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.examCode}`
    )

    const ids = examPaperUpdates.map((u) => u.id)

    await prisma.$transaction(async (tx) => {
        await tx.examPaper.updateMany({
            where: { id: { in: ids } },
            data: { examCode: null },
        })
        await tx.$executeRaw`
            UPDATE "khao-thi"."ExamPaper"
            SET
                "examCode" = CASE ${Prisma.join(examCodesCases, ' ')} END
            WHERE
                "id" IN (${Prisma.join(ids)})
            `
        await tx.examList.update({
            where: { id: examListId },
            data: { lockExamCode: true },
        })
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
    const payload = c.req.valid('json')
    const map = new Map(payload.map((u) => [u.id, u.score]))

    const examPapers = await prisma.examPaper.findMany({
        where: {
            id: { in: payload.map((u) => u.id) },
        },
        select: {
            id: true,
            studentSubjectScore: {
                select: {
                    certificates: {
                        select: {
                            archivedCertificate: {
                                select: {
                                    finalScore: true,
                                },
                            },
                        },
                    },
                    awards: {
                        select: {
                            archivedAward: {
                                select: {
                                    bonusScore: true,
                                },
                            },
                        },
                    },
                    attendanceScore: true,
                    midtermScore: true,
                    examScore: true,
                    student: {
                        select: {
                            fixedClass: {
                                select: {
                                    trainingCourse: {
                                        select: {
                                            coef_1: true,
                                            coef_2: true,
                                            coef_3: true,
                                            scoreToPass: true,
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

    const defaultCoef = {
        coef_1: 0.1,
        coef_2: 0.3,
        coef_3: 0.6,
        scoreToPass: 4,
    }

    const updates = examPapers.map((p) => {
        const examScore = map.get(p.id) || null

        const finalScore = calcFinalScore(
            p.studentSubjectScore.student.fixedClass?.trainingCourse || defaultCoef,
            { ...p.studentSubjectScore, examScore }
        )

        return {
            examPaperId: p.id,
            examScore,
            finalScore,
        }
    })

    await prisma.$executeRawUnsafe(`
        UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
        SET
            "examScore" = data."examScore",
            "finalScore" = data."finalScore",
            "updatedAt" = NOW()
        FROM (
            VALUES
            ${updates
                .map(
                    (u) => `(
                        '${u.examPaperId}',
                        ${u.examScore === null ? 'NULL::double precision' : u.examScore},
                        ${u.finalScore === null ? 'NULL::double precision' : u.finalScore}
                    )`
                )
                .join(',\n')}
        ) AS data("examPaperId", "examScore", "finalScore")
        JOIN "khao-thi"."ExamPaper" AS es
            ON es."id" = data."examPaperId"
        WHERE sss."id" = es."studentSubjectScoreId";
        `)

    return c.json({ success: true, message: 'Success' }, 200)
})

export default app
