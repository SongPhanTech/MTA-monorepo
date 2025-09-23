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
    })
    if (!exam) {
        return c.json({ message: 'Kỳ thi không tồn tại' }, 404)
    }

    const testStructureRules = await prisma.testStructureRule.findMany({
        where: { examId: examId },
        include: {
            knowledgeBlock: true,
            exam: {
                include: { questionBank: true },
            },
        },
    })

    if (!testStructureRules.length) {
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
        for (const rule of testStructureRules) {
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

const genExamFax = createRoute({
    operationId: 'gen-exam-fax',
    path: '/gex-exam-fax',
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
                                description: 'ID của đề thi',
                            }),
                            start: z.number().openapi('start', {
                                description: 'Số bắt đầu',
                            }),
                            count: z.number().openapi('count', {
                                description: 'Số lượng',
                            }),
                            step: z.number().default(1).openapi('step', {
                                description: 'Bước nhảy',
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

app.openapi(genExamFax, async (c) => {
    const { examId, start, count, step } = c.req.valid('json')
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
            subjectClass: {
                select: {
                    _count: {
                        select: {
                            subjectClassStudent: {
                                where: {
                                    examBanned: false,
                                },
                            },
                        },
                    },
                },
                where: {
                    cancelled: false,
                },
            },
            examFax: { include: { examSession: { select: { id: true } } } },
        },
    })
    if (!exam) {
        return c.json({ message: 'Kỳ thi không tồn tại' }, 404)
    }

    const hasScore = exam.examFax.some((f) => f.score)
    if (hasScore) {
        return c.json({ message: 'Fax đã được nhập điểm' }, 400)
    }

    const hasSession = exam.examFax.some((f) => f.examSession?.id)
    if (hasSession) {
        return c.json({ message: 'Fax đã được gán kết quả' }, 400)
    }

    const totalCandidate = exam.subjectClass.reduce(
        (total, subjectClass) => total + subjectClass._count.subjectClassStudent,
        0
    )

    if (count < totalCandidate) {
        return c.json({ message: 'Số lượng phách không đủ cho thí sinh' }, 400)
    }

    const faxes = Array.from({ length: count }, (_, i) => start + i * step)
    await prisma.$transaction(async (tx) => {
        await tx.examFax.deleteMany({
            where: { examId },
        })
        await tx.examFax.createMany({
            data: faxes.map((f) => ({ examId, fax: `${f}` })),
        })
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

const saveExamFaxes = createRoute({
    operationId: 'save-exam-faxes',
    path: '/save-exam-faxes',
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
                                fax: z.string().nullish(),
                                score: z.number().nullish(),
                            })
                        )
                        .openapi('ExamFaxes'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Save exam faxes result',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('SaveExamFaxesResult'),
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

app.openapi(saveExamFaxes, async (c) => {
    const updates = c.req.valid('json')
    const fax = updates.map((u) => u.fax).filter(Boolean)
    const faxSet = new Set(fax)
    if (faxSet.size !== fax.length) {
        const duplicatedFax = fax.filter((item, index) => fax.indexOf(item) !== index)
        return c.json({ success: false, message: `Fax trùng nhau: ${duplicatedFax}` }, 400)
    }

    const ids = updates.map((u) => u.id)

    const faxCases = updates
        .filter((u) => u.fax !== undefined)
        .map((u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.fax}`)
    const faxCaseSql =
        faxCases.length > 0
            ? Prisma.sql`CASE ${Prisma.join(faxCases, ' ')} ELSE "fax" END`
            : Prisma.sql`"fax"`

    const scoreCases = updates
        .filter((u) => u.score !== undefined)
        .map((u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.score}`)
    const scoreCaseSql =
        scoreCases.length > 0
            ? Prisma.sql`CASE ${Prisma.join(scoreCases, ' ')} ELSE "score" END`
            : Prisma.sql`"score"`

    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
            UPDATE "khao-thi"."ExamFax"
            SET
                "fax" = ${faxCaseSql},
                "score" = ${scoreCaseSql}
            WHERE
                "id" IN (${Prisma.join(ids)})
            `
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

const saveExamSessions = createRoute({
    operationId: 'save-exam-sessions',
    path: '/save-exam-sessions',
    tags: ['Exam'],
    summary: 'Lưu kết quả thi',
    description: 'Lưu phách và điểm thi',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .array(
                            z.object({
                                id: z.string(),
                                examFaxId: z.string().nullish(),
                            })
                        )
                        .openapi('ExamSessions'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Save exam sessions result',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('SaveExamSessionsResult'),
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

app.openapi(saveExamSessions, async (c) => {
    const updates = c.req.valid('json')
    const examFaxIds = updates.map((u) => u.examFaxId).filter(Boolean)
    const faxSet = new Set(examFaxIds)
    if (faxSet.size !== examFaxIds.length) {
        const duplicatedFax = examFaxIds.filter(
            (item, index) => examFaxIds.indexOf(item) !== index
        ) as string[]
        const faxes = await prisma.examFax.findMany({
            where: { id: { in: duplicatedFax } },
            select: { fax: true },
        })
        return c.json(
            { success: false, message: `Phách trùng nhau: ${faxes.map((f) => f.fax)}` },
            400
        )
    }

    const ids = updates.map((u) => u.id)

    const faxCases = updates
        .filter((u) => u.examFaxId !== undefined)
        .map((u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.examFaxId}`)
    const faxCaseSql =
        faxCases.length > 0
            ? Prisma.sql`CASE ${Prisma.join(faxCases, ' ')} ELSE "examFaxId" END`
            : Prisma.sql`"examFaxId"`

    await prisma.$transaction(async (tx) => {
        await tx.examSession.updateMany({
            where: { id: { in: updates.filter((u) => u.examFaxId).map((u) => u.id) } },
            data: { examFaxId: null },
        })
        await tx.$executeRaw`
            UPDATE "khao-thi"."ExamSession"
            SET
                "examFaxId" = ${faxCaseSql}
            WHERE
                "id" IN (${Prisma.join(ids)})
            `
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

export default app
