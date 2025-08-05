import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createId, type Prisma } from '@workspace/db'
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

const getRandomExamQuestionByRule = createRoute({
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

app.openapi(getRandomExamQuestionByRule, async (c) => {
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

    const examBanks = Array.from({ length: nOfnExamBank }, () => {
        const id = createId()
        const questions: Prisma.ExamBankQuestionCreateManyInput[] = []
        return { id, examId, questions }
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
            data: examBanks.map(({ id, examId }) => ({ id, examId })),
        })
        await tx.examBankQuestion.createMany({
            data: examBanks.flatMap((examBank) => examBank.questions),
        })
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

export default app
