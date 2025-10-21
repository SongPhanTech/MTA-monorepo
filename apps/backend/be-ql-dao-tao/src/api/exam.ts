import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createId } from '@workspace/db'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const createNewExamList = createRoute({
    operationId: 'create-new-exam-list',
    tags: ['Exam'],
    path: '',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            isGroupBySubject: z.boolean(),
                            trainingObjectTypeId: z.string(),
                            semesterId: z.string(),
                        })
                        .openapi('create-new-exam-list'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Lên danh sách thi thành công',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('create-new-exam-list-result'),
                },
            },
        },
        400: {
            description: 'Lên danh sách thi thất bại',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            message: z.string(),
                        })
                        .openapi('create-new-exam-list-result'),
                },
            },
        },
    },
})

app.openapi(createNewExamList, async (c) => {
    const { isGroupBySubject, trainingObjectTypeId, semesterId } = c.req.valid('json')

    const subjectClass = await prisma.subjectClass.findMany({
        where: {
            trainingObjectTypeId,
            semesterId,
            cancelled: false,
            deletedAt: null,
            enteredScore: true,
        },
        include: {
            subjectClassStudent: {
                where: {
                    examBanned: false,
                    withdrew: false,
                    exempted: false,
                },
            },
        },
    })

    const examId = createId()

    if (isGroupBySubject) {
        const subjectClassMerge = subjectClass.reduce(
            (acc, subjectClass) => {
                acc.subjectClassIds.push(subjectClass.id)

                const studentScoreIds = subjectClass.subjectClassStudent.map((scs) => scs.id)
                acc.studentSubjectScores.push(...studentScoreIds)

                return acc
            },
            { subjectClassIds: [], studentSubjectScores: [] } as {
                subjectClassIds: string[]
                studentSubjectScores: string[]
            }
        )
    }

    return c.json({ success: true, message: 'Lên danh sách thi thành công' })
})

export default app
