import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
    type Session,
    getSessionsByUserId,
    terminateSessionBySessionId,
    terminateSessionsByUserId,
} from '../../wso2is-apis/generated/sessions'
import { getSessionsByUserIdResponse } from '../../wso2is-apis/generated/zod/sessions'

const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'getSessionsByUserId',
        method: 'get',
        request: { params: z.object({ ssoId: z.string() }) },
        path: '/{ssoId}/sessions',
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
        const { ssoId: userId } = c.req.valid('param')
        const { status, data } = await getSessionsByUserId(userId)

        if (status !== 200 && 'message' in data) {
            return c.json(data, 500)
        }
        return c.json(data as Session, 200)
    }
)

app.openapi(
    createRoute({
        operationId: 'terminateSessionsByUserId',
        method: 'delete',
        request: {
            params: z.object({ ssoId: z.string() }),
        },
        path: '/{ssoId}/sessions',
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z
                            .object({})
                            .openapi('TerminateSessionsByUserId'),
                    },
                },
                description: 'Terminate one session',
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
        const { ssoId: userId } = c.req.valid('param')
        const { status, data } = await terminateSessionsByUserId(userId)

        if (status !== 200 && 'message' in data) {
            return c.json(data, 500)
        }
        return c.json(data, 200)
    }
)

app.openapi(
    createRoute({
        operationId: 'terminateSessionBySessionId',
        method: 'delete',
        request: {
            params: z.object({ ssoId: z.string(), sessionId: z.string() }),
        },
        path: '/{ssoId}/sessions/{sessionId}',
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z
                            .object({})
                            .openapi('TerminateSessionBySessionId'),
                    },
                },
                description: 'Terminate one session',
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
        const { ssoId: userId, sessionId } = c.req.valid('param')
        const { status, data } = await terminateSessionBySessionId(
            userId,
            sessionId
        )

        if (status !== 200 && 'message' in data) {
            return c.json(data, 500)
        }
        return c.json(data, 200)
    }
)

export default app
