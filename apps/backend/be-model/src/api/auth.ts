import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { sessionSchema } from '../dto/auth'

const app = new OpenAPIHono({ strict: false })

const hardPayload = {
    exp: Math.floor(Date.now() / 1000) + 86400, // expires in 1 hour
    iat: Math.floor(Date.now() / 86400),
    auth_time: Math.floor(Date.now() / 86400),
    jti: 'example-jti',
    iss: 'https://your-issuer.com',
    aud: ['your-client-id'],
    sub: 'user-id-123',
    typ: 'Bearer',
    azp: 'your-client-id',
    sid: 'session-id-123',
    acr: '1',
    'allowed-origins': ['http://localhost:3000'],
    realm_access: {
        roles: ['user', 'admin'],
    },
    resource_access: {
        'fe-test-local': {
            roles: ['viewer'],
        },
        'realm-management': {
            roles: ['manage-users'],
        },
        'fe-system-local': {
            roles: ['editor'],
        },
        broker: {
            roles: ['read'],
        },
        account: {
            roles: ['manage-account'],
        },
    },
    scope: 'openid profile email',
    sDM_NhanVienId: 'nhanvien-001',
    email_verified: true,
    sDM_DonViId: 'donvi-123',
    name: 'John Doe',
    preferred_username: 'johndoe',
    given_name: 'John',
    family_name: 'Doe',
    email: 'john.doe@example.com',
    access_token: 'access-token-placeholder',
}

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
        return c.json(hardPayload, 200)
        // const xToken = getCookie(c, 'x-token')
        // console.log('[get-session].xToken', xToken)
        // if (!xToken) {
        //     return c.json({ error: 'Unauthorized' }, 401)
        // }
        // const session = await auth(xToken)
        // if (!session) {
        //     return c.json({ error: 'Unauthorized' }, 401)
        // }
        // return c.json(session, 200)
    }
)

export default app
