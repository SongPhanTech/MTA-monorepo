import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { prisma } from '..'
import { TrainingCourseScalar } from '../dto/scalar'

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getTrainingCourse = createRoute({
    operationId: 'getTrainingCourse',
    tags: ['TrainingCourse'],
    path: '/get-training-course',
    summary: 'DS khoá đào tạo',
    method: 'get',
    request: {},
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: z.array(TrainingCourseScalar),
                },
            },
        },
    },
})

app.openapi(getTrainingCourse, async (c) => {
    const data = await prisma.trainingCourse.findMany({
        where: { deletedAt: null },
        orderBy: {
            semesterStart: {
                startDate: 'desc',
            },
        },
    })

    return c.json(data, 200)
})

export default app
