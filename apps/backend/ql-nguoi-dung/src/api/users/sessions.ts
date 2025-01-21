import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import {
    type Session,
    getSessionsByUserId,
    terminateSessionBySessionId,
} from '../../wso2is-apis/generated/sessions'
import { getSessionsByUserIdResponse } from '../../wso2is-apis/generated/zod/sessions'

const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'getSessionsByUserId',
        method: 'get',
        request: { params: z.object({ userId: z.string() }) },
        path: '/{userId}/sessions',
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: getSessionsByUserIdResponse.openapi(
                            'SessionsByUserId'
                        ),
                    },
                },
                description: 'Retrieve one user',
            },
            500: {
                content: {
                    'application/json': {
                        schema: z.object({}),
                    },
                },
                description: 'Internal Server Error',
            },
        },
    }),
    async (c) => {
        const { userId } = c.req.valid('param')
        const { status, data } = await getSessionsByUserId(userId)

        if (status !== 200 && 'message' in data) {
            return c.json(data, 500)
        }
        return c.json(data as Session, 200)
    }
)

export default app
