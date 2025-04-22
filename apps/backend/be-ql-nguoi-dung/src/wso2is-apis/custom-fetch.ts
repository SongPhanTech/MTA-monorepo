import {
    SpanKind,
    SpanStatusCode,
    context,
    propagation,
    trace,
} from '@opentelemetry/api'
import { getContext } from 'hono/context-storage'

export async function userFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    return customFetch<T>('users', path, options)
}

export async function serverFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    return customFetch<T>('server', path, options)
}

export async function customFetch<T>(
    type: 'users' | 'server' | 'scim2',
    path: string,
    options?: RequestInit
): Promise<T> {
    const baseUrl = process.env.OIDC_BASE_URL
    const username = process.env.OIDC_ADMIN_USERNAME
    const password = process.env.OIDC_ADMIN_PASSWORD

    // const username = process.env.OIDC_CLIENT_ID
    // const password = process.env.OIDC_CLIENT_SECRET

    const credentials = Buffer.from(`${username}:${password}`).toString(
        'base64'
    )

    const url =
        type === 'scim2'
            ? `${baseUrl}/${type}${path}`
            : `${baseUrl}/api/${type}/v1${path}`

    const tracer = trace.getTracer('external_request')
    const parentSpan = getContext().var.rootSpan

    const subSpan = tracer.startSpan(
        'call-external-service',
        {
            attributes: {
                'http.url': url,
                'http.method': options?.method,
            },
            kind: SpanKind.CLIENT,
        },
        parentSpan
            ? trace.setSpan(context.active(), parentSpan)
            : context.active()
    )

    try {
        propagation.inject(context.active(), options?.headers)

        const response = await fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
                Authorization: `Basic ${credentials}`,
            },
        })

        subSpan.setAttribute('http.status_code', response.status)
        subSpan.setAttribute(
            'http.response_content_type',
            response.headers.get('Content-Type') ?? ''
        )

        const data = await response.json()

        if (response.status >= 400) {
            subSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: `HTTP ${response.status}`,
            })
            subSpan.recordException(data.detail)
            subSpan.setAttribute('error', true)
        }

        return {
            status: response.status,
            data,
            headers: response.headers,
        } as T
    } catch (error) {
        subSpan.recordException(error as Error)
        subSpan.setAttribute('error', true)

        throw error
    } finally {
        subSpan.end()
    }
}
