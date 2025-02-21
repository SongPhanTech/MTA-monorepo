import {
    type Span,
    SpanKind,
    SpanStatusCode,
    context,
    propagation,
    trace,
} from '@opentelemetry/api'
import { getConnInfo } from 'hono/bun'
import { createMiddleware } from 'hono/factory'

declare module 'hono' {
    interface ContextVariableMap {
        rootSpan: Span
    }
}

export const tracingMiddleware = createMiddleware(async (c, next) => {
    const tracer = trace.getTracer('ql-nguoi-dung-backend')
    const traceParent = c.req.header('traceparent')
    const carrier = traceParent ? { traceparent: traceParent } : {}
    const extractedContext = propagation.extract(context.active(), carrier)

    await context.with(extractedContext, async () => {
        const span = tracer.startSpan(c.req.path, {
            root: true,
            attributes: {
                'http.route': c.req.path,
                'http.method': c.req.method,
                'http.url': c.req.url,
                'http.schema': new URL(c.req.raw.url).protocol,
                'http.referrer': c.req.raw.referrer,
                'http.client_ip': getConnInfo(c).remote.address ?? '',
                'http.user_agent': c.req.header('User-Agent') ?? '',
                'http.request_content_length':
                    c.req.header('Content-Length') ?? '',
                'http.request_content_type': c.req.header('Content-Type') ?? '',
                type: 'server',
                is_root: true,
            },
            kind: SpanKind.SERVER,
        })

        c.set('rootSpan', span) // set span to context

        if (traceParent) {
            const parts = traceParent.split('-')
            if (parts.length === 4) {
                span.setAttribute('trace.parent_id', parts[2] ?? '')
                span.setAttribute('trace.trace_id', parts[1] ?? '')
            }
        }

        await context.with(trace.setSpan(extractedContext, span), async () => {
            await next()
            span.setAttribute('http.status_code', c.res.status)
            span.setAttribute('status_code', c.res.status)
            span.setAttribute(
                'http.response_content_length',
                c.res.headers.get('Content-Length') ?? ''
            )
            span.setAttribute(
                'http.response_content_type',
                c.res.headers.get('Content-Type') ?? ''
            )

            if (c.res.status >= 400) {
                span.setAttribute('error', true)
                span.setAttribute('error.message', c.res.statusText)
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: c.res.statusText,
                })
            }

            span.end()
        })
    })
})
