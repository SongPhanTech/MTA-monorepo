import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { auth } from '@workspace/auth/server'
import { getCookie } from 'hono/cookie'
import { sessionSchema } from '../dto/auth'

const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'get-session',
        path: '/get-session',
        method: 'get',
        responses: {
            200: {
                content: { 'application/json': { schema: sessionSchema } },
                description: 'Get session successfully',
            },
            401: {
                content: {
                    'application/json': {
                        schema: z.object({ error: z.string() }).openapi('Unauthorized'),
                    },
                },
                description: 'Unauthorized',
            },
        },
    }),
    async (c) => {
        const xToken = getCookie(c, 'x-token')
        const cookie = c.req.header('Cookie')

        console.log('[get-session].xToken', xToken)
        if (!xToken || !cookie) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const session = await auth(xToken, cookie)
        if (!session) {
            return c.json({ error: 'Unauthorized' }, 401)
        }
        return c.json(session, 200)
    }
)

export default app
