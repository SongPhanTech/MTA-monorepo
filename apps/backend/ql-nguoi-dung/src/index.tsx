import { OpenAPIHono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { Prisma, PrismaClient, enhance } from '@workspace/db'
import { createHonoHandler } from '@workspace/db/hono'
import type { Context } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import GroupApp from './api/group'
import UserApp from './api/user'
import { setupAuth } from './auth'

export const prisma = new PrismaClient()
const app = new OpenAPIHono({ strict: false })

app.use(
    '*',
    cors({
        origin: ['http://localhost:3000', 'https://*.swantech.vn'],
        credentials: true,
    })
)

app.use(csrf())
app.use(logger())

setupOpenApi(app)

setupAuth(app)

app.route('/api/user', UserApp)
app.route('/api/group', GroupApp)

app.use(
    '/api/model/*',
    createHonoHandler({
        getPrisma: async (ctx: Context) => {
            return enhance(prisma, { user: ctx.get('user') })
        },
    })
)

app.onError((err, c) => {
    console.log(err.message)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let status: ContentfulStatusCode = 500
        if (err.code === 'P2025') status = 404
        if (err.code === 'P2002') status = 409
        if (err.code === 'P2003') status = 400

        return c.json({ message: err.message }, status)
    }

    return c.json({ message: err.message }, 500)
})

export default app

process.on('SIGINT', () => {
    process.exit()
})

function setupOpenApi(app: OpenAPIHono) {
    app.doc('/openapi', (c) => ({
        openapi: '3.0.0',
        info: { version: '1.0.0', title: 'My API' },
        servers: [
            {
                url: new URL(c.req.url).origin,
                description: 'Current environment',
            },
        ],
    }))

    app.get(
        '/reference',
        apiReference({
            theme: 'purple',
            spec: { url: '/openapi' },
        })
    )

    app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    })
}
