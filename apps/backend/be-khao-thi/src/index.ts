import { OpenAPIHono } from '@hono/zod-openapi'
import { context, SpanKind, trace } from '@opentelemetry/api'
import { enhance, Prisma, PrismaClient } from '@workspace/db'
import { createHonoHandler } from '@workspace/db/hono'
import type { Context } from 'hono'
import { contextStorage, getContext } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { showRoutes } from 'hono/dev'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { Registry } from 'prom-client'
import clusterSurveyApp from './api/cluster-survey'
import examApp from './api/exam'
import surveyApp from './api/survey'
import surveyPublicApp from './api/survey-public'
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

const originEnv = process.env.ORIGIN || ''
const originList = originEnv.split(',').map((item) => item.trim())

app.use(
    '*',
    cors({
        origin: [
            'http://localhost:3000',
            'https://user.mta.swantech.vn',
            'https://mta.swantech.vn',
            'https://daotao.mta.swantech.vn',
            'https://am.swantech.vn',
            'https://api.am.swantech.vn',
            'https://*.swantech.vn',
            ...originList,
            '*',
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
app.use(contextStorage())
app.use(tracingMiddleware)
app.use('*', checkIp)

const issuer = `${config.keycloak.url}/realms/${config.keycloak.realm}`
const jwksUri = `${issuer}/protocol/openid-connect/certs`
const audience = config.keycloak.clientId

// public
app.route('/api/survey', surveyPublicApp)

// TODO!: uncomment
// app.use('/api/*', jwtAuth('ems'))

setupOpenApi(app)

app.route('/api/exam', examApp)
app.route('/api/survey', surveyApp)
app.route('/api/cluster-survey', clusterSurveyApp)

const nv = await prisma.userProfile.findFirstOrThrow()

app.use(
    '/api/model/*',
    createHonoHandler({
        getPrisma: async (ctx: Context) => {
            return enhance(prisma, { user: nv })
            // return enhance(prisma, { user: ctx.get('user') })
        },
    })
)

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ message: err.message }, err.status)
    }

    const tracer = trace.getTracer('InternalError')
    const parentSpan = getContext().var.rootSpan

    const subSpan = tracer.startSpan(
        'internal-error',
        {
            attributes: { 'error.message': err.message },
            kind: SpanKind.INTERNAL,
        },
        parentSpan ? trace.setSpan(context.active(), parentSpan) : context.active()
    )

    subSpan.recordException(err)
    subSpan.end()

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
