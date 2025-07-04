import { OpenAPIHono } from '@hono/zod-openapi'
import { jwtAuth } from '@workspace/auth/hono'
import { enhance, Prisma, PrismaClient } from '@workspace/db'
import { createHonoHandler } from '@workspace/db/hono'
import type { Context } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { showRoutes } from 'hono/dev'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import AuthApp from './api/auth'
import MinIOApp from './api/minio'
import { checkIp } from './middlewares/check-ip'
import { setupOpenApi } from './utils/openapi'

export const prisma = new PrismaClient()
const app = new OpenAPIHono({ strict: false })
app.use(
    '*',
    cors({
        origin: [
            'http://localhost:3001',
            'http://localhost:3000',
            'https://mta.swantech.vn',
            'https://user.mta.swantech.vn',
            'https://daotao.mta.swantech.vn',
            'https://chatbot.mta.swantech.vn',
            'https://khaothi.mta.swantech.vn',
            'https://danhmuc.mta.swantech.vn',
            'https://*.swantech.vn',
        ],
        credentials: true,
    })
)

const config = {
    keycloak: {
        url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
        realm: process.env.KEYCLOAK_REALM || 'swantech',
        clientId: process.env.KEYCLOAK_CLIENT_ID || 'fe-test-local',
    },
}
const issuer = `${config.keycloak.url}/realms/${config.keycloak.realm}`
const jwksUri = `${issuer}/protocol/openid-connect/certs`
const audience = config.keycloak.clientId
console.log('[be-model] Keycloak Config:', {
    issuer,
    jwksUri,
    audience,
})
app.use(contextStorage())
app.use('*', checkIp)

// public route
setupOpenApi(app)
app.route('/api/auth', AuthApp)

app.use('/api/*', jwtAuth(jwksUri, audience, issuer, prisma))
// setupAuth(app)

// private route
app.route('/api/minio', MinIOApp)

app.use(
    '/api/model/*',
    createHonoHandler({
        getPrisma: async (ctx: Context) => {
            return enhance(prisma, { user: ctx.get('user') })
        },
    })
)

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse()
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let status: ContentfulStatusCode = 500
        if (err.code === 'P2025') status = 404
        if (err.code === 'P2002') status = 409
        if (err.code === 'P2003') status = 400

        if (status === 500) {
            console.log(err)
            return c.json({ message: 'Internal Server Error' }, status)
        }

        return c.json({ message: err.meta?.cause }, status)
    }

    console.log(err)
    return c.json({ message: err.message }, 500)
})

showRoutes(app, { verbose: true })

export default {
    fetch: app.fetch,
    hostname: '0.0.0.0',
    port: process.env.PORT || 3000,
}

process.on('SIGINT', () => {
    process.exit()
})
