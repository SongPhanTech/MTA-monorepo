import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { QuestionType } from '@workspace/db'
import { getRandomQuestionIDs } from '@workspace/db/sql'
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
            nOfnExamBank: z.coerce.number().default(1).openapi('nOfnExamBank', {
                description: 'Số lượng đề thi',
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
    const { examId, nOfnExamBank } = c.req.query()

    const examExists = await prisma.exam.findUnique({
        where: {
            id: examId,
        },
    })
    if (!examExists) {
        return c.json({ message: 'Exam not found' }, 404)
    }

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

    const listQuestionExam = await prisma.question.findMany({
        where: {
            questionBankId: examExists.questionBankId,
        },
    })

    if (!listQuestionExam || listQuestionExam.length === 0) {
        return c.json({ message: 'No questions found in the question bank' }, 404)
    }

    const examBlock: any[] = []

    const nExamBanks = Number(nOfnExamBank) || 1

    for (let i = 0; i < nExamBanks; i++) {
        const selectedQuestionIds = new Set()
        const listQuestion: any[] = []
        for (const rule of testStructureRule) {
            const questionType = rule.questionType
            const count = rule.count || 1
            console.log(
                'Processing rule:',
                rule.exam.questionBankId,
                questionType,
                rule.questionPoint,
                rule.knowledgeBlockId,
                count
            )
            const questions = await prisma.$queryRawTyped<{ id: string }[]>(
                getRandomQuestionIDs(
                    rule.exam.questionBankId,
                    questionType,
                    rule.questionPoint,
                    rule.knowledgeBlockId,
                    count
                ) as any
            )
            console.log('Fetched questions:', questions)

            if (questions.length) {
                for (let i = 0; i < questions.length; i++) {
                    const question = questions[i]
                    const questionDetails = question
                        ? listQuestionExam.find((q) => q.id === question.id)
                        : undefined
                    if (question && !selectedQuestionIds.has(question.id)) {
                        selectedQuestionIds.add(question.id)
                        listQuestion.push({
                            ...questionDetails,
                            questionType: rule.questionType as QuestionType,
                            knowledgeBlockId: rule.knowledgeBlockId,
                            examId: examId,
                        })
                    }
                }
            } else {
                console.warn(`No questions found for rule: ${rule.id}`)
            }
        }
        examBlock.push({
            examBank: i + 1,
            examName: `Đề thi ${i + 1}`,
            examId: examId,
            questions: listQuestion,
        })
    }
    return c.json(examBlock, 200)
})

export default app
