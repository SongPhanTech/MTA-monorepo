import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createId, Prisma } from '@workspace/db'
import { getRandomQuestionIDs } from '@workspace/db/sql'
import { questionTypeLabels } from '@workspace/libs/constants'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const genRandomExamQuestionByRule = createRoute({
    operationId: 'gen-exam-bank',
    path: '/random-exam-question-by-rule',
    tags: ['Exam'],
    summary: 'Sinh đề thi theo cấu trúc đề thi',
    description: 'Lấy theo testStructureRule đã được tạo',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            examId: z.string().openapi('examId', {
                                description: 'ID của đề thi',
                            }),
                            nOfnExamBank: z.number().openapi('nOfnExamBank', {
                                description: 'Số lượng đề thi',
                            }),
                            replace: z.boolean().default(false).openapi('replace', {
                                description: 'Xoá đề thi cũ nếu có',
                            }),
                        })
                        .openapi('gen-exam-bank'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Generate Exam bank result',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('gen-exam-bank-result'),
                },
            },
        },
        400: {
            description: 'Not enough questions',
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

app.openapi(genRandomExamQuestionByRule, async (c) => {
    const { examId, nOfnExamBank, replace } = c.req.valid('json')

    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
            testStructureRules: {
                include: {
                    knowledgeBlock: true,
                    exam: {
                        include: { questionBank: true },
                    },
                },
            },
        },
    })
    if (!exam) {
        return c.json({ message: 'Kỳ thi không tồn tại' }, 404)
    }

    if (!exam.testStructureRules.length) {
        return c.json({ message: 'Cấu trúc đề thi không tồn tại' }, 404)
    }

    if (replace) {
        await prisma.examBank.deleteMany({
            where: { examId: examId },
        })
    }

    const existsExamBankCodes = (
        await prisma.examBank.findMany({
            where: { examId: examId },
            select: { examCode: true },
        })
    ).map(({ examCode }) => examCode)

    const maxLength = (existsExamBankCodes.length + nOfnExamBank).toString().length

    const examBankCodes = Array.from(
        { length: existsExamBankCodes.length + nOfnExamBank },
        (_, i) => {
            return (i + 1).toString().padStart(maxLength, '0')
        }
    ).filter((value) => !existsExamBankCodes.includes(value))

    const examBanks = Array.from({ length: nOfnExamBank }, (_, i) => {
        const id = createId()
        const questions: Prisma.ExamBankQuestionCreateManyInput[] = []
        return { id, examId, questions, examCode: examBankCodes[i] || '' }
    })

    for (const examBank of examBanks) {
        for (const rule of exam.testStructureRules) {
            if (!rule.exam.questionBankId) {
                continue
            }
            const questionIds = await prisma.$queryRawTyped(
                getRandomQuestionIDs(
                    rule.exam.questionBankId,
                    rule.questionType,
                    rule.questionPoint,
                    rule.knowledgeBlockId,
                    rule.count
                )
            )

            if (questionIds.length < rule.count) {
                const ruleInfo = [
                    rule.knowledgeBlock.name,
                    questionTypeLabels[rule.questionType],
                    rule.questionPoint,
                ]
                    .filter(Boolean)
                    .join(' - ')

                return c.json({ message: `Không đủ câu hỏi cho ${ruleInfo} điểm` }, 400)
            }
            examBank.questions.push(
                ...questionIds.map(({ id }, idx) => ({
                    examBankId: examBank.id,
                    questionId: id,
                    order: examBank.questions.length + idx + 1,
                }))
            )
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.examBank.createMany({
            data: examBanks.map(({ questions, ...examBank }) => examBank),
        })
        await tx.examBankQuestion.createMany({
            data: examBanks.flatMap((examBank) => examBank.questions),
        })
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

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
