import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createId, Prisma } from '@workspace/db'
import { getRandomQuestionIDs } from '@workspace/db/sql'
import { questionTypeLabels } from '@workspace/libs/constants'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

// const getRandomExamQuestion = createRoute({
//     operationId: 'getRandomExamQuestion',
//     path: '/random-exam-question',
//     tags: ['Exam'],
//     summary: 'Sinh đề thi mặc định',
//     description: 'Lấy theo hàm getRandomQuestionIDs',
//     method: 'get',
//     request: {
//         query: z.object({
//             questionBankId: z.string().openapi('questionBankId', {
//                 description: 'ID của ngân hàng câu hỏi',
//             }),
//             questionType: z.string().openapi('questionType', {
//                 description: 'Loại câu hỏi ',
//             }),
//             point: z.number().openapi('point', {
//                 description: 'Điểm của câu hỏi',
//             }),
//             knowledgeBlockId: z.string().openapi('knowledgeBlockId', {
//                 description: 'ID của khối kiến thức',
//             }),
//             limit: z.number().openapi('limit', {
//                 description: 'Số lượng câu hỏi cần lấy',
//                 default: 1,
//             }),
//         }),
//     },
//     responses: {
//         200: {
//             description: 'Export list of questions',
//             content: {
//                 'application/json': {
//                     schema: z.array(z.any()), // You can replace z.any() with a more specific schema if available
//                 },
//             },
//         },
//         404: {
//             description: 'Not found',
//             content: {
//                 'application/json': {
//                     schema: z.object({
//                         message: z.string(),
//                     }),
//                 },
//             },
//         },
//     },
// })

// app.openapi(getRandomExamQuestion, async (c) => {
//     const { questionBankId, questionType, point, knowledgeBlockId, limit } = c.req.query()

//     // Simulate fetching random questions from a database or service
//     const res = await prisma.$queryRawTyped<{
//         data: any[]
//     }>(
//         getRandomQuestionIDs(
//             questionBankId,
//             questionType,
//             point,
//             knowledgeBlockId,
//             limit
//         ) as any
//     )

//     return c.json(res[0]?.data ?? [], 200)
// })

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

const saveExamSessions = createRoute({
    operationId: 'save-exam-sessions',
    path: '/save-exam-sessions',
    tags: ['Exam'],
    summary: 'Lưu kết quả thi',
    description: 'Lưu fax và điểm thi',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .array(
                            z.object({
                                id: z.string(),
                                fax: z.string().nullable(),
                                score: z.number().nullable(),
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
    const fax = updates.map((u) => u.fax).filter(Boolean)
    const faxSet = new Set(fax)
    if (faxSet.size !== fax.length) {
        const duplicatedFax = fax.filter((item, index) => fax.indexOf(item) !== index)
        return c.json({ success: false, message: `Fax trùng nhau: ${duplicatedFax}` }, 400)
    }

    const ids = updates.map((u) => u.id)

    const faxCases = updates.map((u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.fax}`)
    const faxCaseSql = Prisma.sql`CASE ${Prisma.join(faxCases, ' ')} END`

    const scoreCases = updates.map(
        (u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.score}::DECIMAL(5, 2)`
    )
    const scoreCaseSql = Prisma.sql`CASE ${Prisma.join(scoreCases, ' ')} END`

    // We update rows where a score is being set.
    const isGradedCases = updates
        .filter((u) => u.score !== null && u.score !== undefined)
        .map((u) => Prisma.sql`WHEN "id" = ${u.id} THEN TRUE`)

    // Only add the 'isGraded' update if there are relevant changes.
    // The 'ELSE "isGraded"' part is crucial to prevent setting the value to NULL for other updated rows.
    const isGradedCaseSql =
        isGradedCases.length > 0
            ? Prisma.sql`, "isGraded" = CASE ${Prisma.join(isGradedCases, ' ')} ELSE "isGraded" END`
            : Prisma.empty

    await prisma.$transaction(async (tx) => {
        await tx.examSession.updateMany({
            where: { id: { in: ids } },
            data: { fax: null },
        })
        await tx.$executeRaw`
            UPDATE "khao-thi"."ExamSession"
            SET
                "fax" = ${faxCaseSql},
                "score" = ${scoreCaseSql}
                ${isGradedCaseSql}
            WHERE
                "id" IN (${Prisma.join(ids)})
            `
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

export default app
