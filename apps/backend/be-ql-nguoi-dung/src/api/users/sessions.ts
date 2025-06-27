import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { prisma } from '../..'
import {
    getSessionsByUserId,
    type Session,
    terminateSessionBySessionId,
    terminateSessionsByUserId,
} from '../../wso2is-apis/generated/sessions'
import { getSessionsByUserIdResponse } from '../../wso2is-apis/generated/zod/sessions'

const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'getSessionsByUserId',
        method: 'get',
        request: { params: z.object({ id: z.string() }) },
        path: '/{id}/sessions',
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: getSessionsByUserIdResponse.openapi('SessionsByUserId'),
                    },
                },
                description: 'Retrieve one user',
            },
            400: {
                content: {
                    'application/json': {
                        schema: z.object({ message: z.string() }),
                    },
                },
                description: 'Bad Request',
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
        const { id } = c.req.valid('param')
        const user = await prisma.user.findUniqueOrThrow({
            where: { id },
        })
        if (!user.ssoId) {
            return c.json({ message: 'User has no ssoId' }, 400)
        }

        const { status, data } = await getSessionsByUserId(user.ssoId)

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
            params: z.object({ id: z.string() }),
        },
        path: '/{id}/sessions',
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.object({}).openapi('TerminateSessionsByUserId'),
                    },
                },
                description: 'Terminate one session',
            },
            400: {
                content: {
                    'application/json': {
                        schema: z.object({ message: z.string() }),
                    },
                },
                description: 'Bad Request',
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
        const { id } = c.req.valid('param')
        const user = await prisma.user.findUniqueOrThrow({
            where: { id },
        })
        if (!user.ssoId) {
            return c.json({ message: 'User has no ssoId' }, 400)
        }

        const { status, data } = await terminateSessionsByUserId(user.ssoId)

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
            params: z.object({ id: z.string(), sessionId: z.string() }),
        },
        path: '/{id}/sessions/{sessionId}',
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.object({}).openapi('TerminateSessionBySessionId'),
                    },
                },
                description: 'Terminate one session',
            },
            400: {
                content: {
                    'application/json': {
                        schema: z.object({ message: z.string() }),
                    },
                },
                description: 'Bad Request',
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
        const { id, sessionId } = c.req.valid('param')
        const user = await prisma.user.findUniqueOrThrow({
            where: { id },
        })
        if (!user.ssoId) {
            return c.json({ message: 'User has no ssoId' }, 400)
        }
        const { status, data } = await terminateSessionBySessionId(user.ssoId, sessionId)

        if (status !== 200 && 'message' in data) {
            return c.json(data, 500)
        }
        return c.json(data, 200)
    }
)

export default app
