import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { QuestionType } from '@workspace/db'
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
    operationId: 'getRandomExamQuestionByRule',
    path: '/random-exam-question-by-rule',
    tags: ['Exam'],
    summary: 'Sinh đề thi theo cấu trúc đề thi',
    description: 'Lấy theo testStructureRule đã được tạo',
    method: 'get',
    request: {
        query: z.object({
            examId: z.string().openapi('examId', {
                description: 'ID của đề thi',
            }),
            questionType: z.enum(['ESSAY', 'ORAL']).optional().openapi('questionType', {
                description: 'Loại câu hỏi',
                default: 'ESSAY', // Default to ESSAY
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of questions',
            content: {
                'application/json': {
                    schema: z.array(z.any()), // You can replace z.any() with a more specific schema if available
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
    const { examId, questionType } = c.req.query()
    const typedQuestionType = questionType as QuestionType

    const testStructureRule = await prisma.testStructureRule.findMany({
        where: {
            examId: examId,
        },
        include: {
            knowledgeBlock: true,
            exam: {
                include: {
                    questionBank: true,
                },
            },
        },
    })

    if (!testStructureRule) {
        return c.json({ message: 'Test structure rule not found' }, 404)
    }

    const selectedQuestionIds = new Set()
    const listQuestion: any[] = []

    for (const rule of testStructureRule) {
        console.log('Processing rule:', rule)
        const count = rule.count || 1
        const questions = await prisma.question.findMany({
            where: {
                questionBankId: rule.exam.questionBankId,
                knowledgeBlockId: rule.knowledgeBlockId,
                type: typedQuestionType,

                // Exclude questions that have already been selected
                id: { notIn: Array.from(selectedQuestionIds) as string[] },
            },
            take: count,
        })

        // Add a check for insufficient questions
        if (questions.length < count) {
            console.warn(
                `Warning: Rule for knowledge block "${rule.knowledgeBlockId}" requires ${count} questions, but only ${questions.length} were available.`
            )
        }

        // Add new questions to the list and their IDs to the set for tracking
        questions.forEach((q) => {
            listQuestion.push(q)
            selectedQuestionIds.add(q.id)
        })
    }
    return c.json(listQuestion, 200)
})

export default app
