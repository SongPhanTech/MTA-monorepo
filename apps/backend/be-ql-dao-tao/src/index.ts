import { OpenAPIHono } from '@hono/zod-openapi'
import { SpanKind, context, trace } from '@opentelemetry/api'
import { Prisma, PrismaClient, enhance } from '@workspace/db'
import { createHonoHandler } from '@workspace/db/hono'
import type { Context } from 'hono'
import { contextStorage, getContext } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { Registry, collectDefaultMetrics } from 'prom-client'

import API from './api/index'

import { setupAuth } from './middlewares/auth'
import { checkIp } from './middlewares/check-ip'
import { tracingMiddleware } from './middlewares/tracing'
import { setupOpenApi } from './utils/openapi'

import './otel'

export const prisma = new PrismaClient()
const app = new OpenAPIHono({ strict: false })
const register = new Registry()

// collectDefaultMetrics({ register })

app.get('/metrics', async (c) => {
    c.header('Content-Type', register.contentType)
    return c.text(await register.metrics())
})

app.use(
    '*',
    cors({
        origin: [
            'http://localhost:3000',
            'https://user.mta.swantech.vn',
            'https://*.swantech.vn',
        ],
        credentials: true,
    })
)

app.use(csrf())
app.use(contextStorage())
app.use(tracingMiddleware)
app.use('*', checkIp)

setupOpenApi(app)

// TODO:
// Update: Bật lại khi release
// setupAuth(app)

app.route('/api', API)

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

    const tracer = trace.getTracer('InternalError')
    const parentSpan = getContext().var.rootSpan

    const subSpan = tracer.startSpan(
        'internal-error',
        {
            attributes: { 'error.message': err.message },
            kind: SpanKind.INTERNAL,
        },
        parentSpan
            ? trace.setSpan(context.active(), parentSpan)
            : context.active()
    )

    subSpan.recordException(err)
    subSpan.end()

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let status: ContentfulStatusCode = 500
        if (err.code === 'P2025') status = 404
        if (err.code === 'P2002') status = 409
        if (err.code === 'P2003') status = 400

        if (status === 500) {
            return c.json({ message: 'Internal Server Error' }, status)
        }

        return c.json({ message: err.meta?.cause }, status)
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
