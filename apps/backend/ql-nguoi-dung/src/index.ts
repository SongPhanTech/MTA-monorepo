import { OpenAPIHono } from '@hono/zod-openapi'
import { Prisma, PrismaClient, enhance } from '@workspace/db'
import { createHonoHandler } from '@workspace/db/hono'
import type { Context } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import GroupApp from './api/group'
import ISConfig from './api/is/configs'
import UserApp from './api/user'
import { setupAuth } from './middlewares/auth'
import { checkIp } from './middlewares/check-ip'
import { setupOpenApi } from './utils/openapi'

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

app.use('*', checkIp)

setupOpenApi(app)

setupAuth(app)

app.route('/api/user', UserApp)
app.route('/api/group', GroupApp)
app.route('/api/is', ISConfig)

app.use(
    '/api/model/*',
    createHonoHandler({
        getPrisma: async (ctx: Context) => {
            return enhance(prisma, { user: ctx.get('user') })
        },
    })
)

app.onError((err, c) => {
    console.log(err)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let status: ContentfulStatusCode = 500
        if (err.code === 'P2025') status = 404
        if (err.code === 'P2002') status = 409
        if (err.code === 'P2003') status = 400

        if (status === 500) {
            return c.json({ message: 'Internal Server Error' }, status)
        }

        return c.json({ message: err.message }, status)
    }

    return c.json({ message: err.message }, 500)
})

export default {
    fetch: app.fetch,
    hostname: '0.0.0.0',
    port: process.env.PORT || 3000,
}

process.on('SIGINT', () => {
    process.exit()
})
