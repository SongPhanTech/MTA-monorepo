import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { PrismaClient } from '@workspace/db'

const prismaApimLogs = new PrismaClient({
    datasourceUrl: process.env.APIM_LOGS_DATABASE_URL,
})

const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'get-config-logs',
        path: '/config-logs',
        method: 'get',
        request: {
            query: z.object({
                apiId: z.string(),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.boolean(),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { apiId } = c.req.valid('query')
        try {
            const res = await fetch(
                `https://am.swantech.vn/api/am/devops/v0/tenant-logs/carbon.super/apis/${apiId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Basic YWRtaW46YWRtaW4=',
                    },
                }
            )
            const data = await res.json()
            const apis = data?.apis || []
            return c.json(
                apis.every((e: any) => e?.logLevel?.toUpperCase() === 'FULL'),
                200
            )
        } catch (error) {
            console.log('[ERROR][config-logs]', {
                message: error instanceof Error ? error.message : String(error)
            })
            return c.json(false, 200)
        }
    }
)

app.openapi(
    createRoute({
        operationId: 'update-config-logs',
        path: '/config-logs',
        method: 'post',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            apiId: z.string(),
                            enabled: z.boolean(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.any(),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { apiId, enabled } = c.req.valid('json')
        const res = await fetch(
            `https://am.swantech.vn/api/am/devops/v0/tenant-logs/carbon.super/apis/${apiId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Basic YWRtaW46YWRtaW4=',
                },
            }
        )
        const data = await res.json()
        const apis = data?.apis || []
        const results = await Promise.all(
            apis.map((api: any) =>
                fetch(
                    `https://am.swantech.vn/api/am/devops/v0/tenant-logs/carbon.super/apis/${apiId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: 'Basic YWRtaW46YWRtaW4=',
                        },
                        body: JSON.stringify({
                            logLevel: enabled ? 'full' : 'off',
                            resourceMethod: api?.resourceMethod,
                            resourcePath: api?.resourcePath,
                        }),
                    }
                )
            )
        )
        const allJson = await Promise.all(results.map((res) => res.json()))
        return c.json(allJson, 200)
    }
)

app.openapi(
    createRoute({
        operationId: 'access-requests',
        path: '/access-requests',
        method: 'get',
        request: {
            query: z.object({
                service: z.string(),
                from: z.date({
                    coerce: true,
                }),
                to: z.date({
                    coerce: true,
                }),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                tag: z.string(),
                                flow: z.string(),
                                time: z.number(),
                                verb: z.string(),
                                apiTo: z.string(),
                                level: z.string(),
                                headers: z.array(z.string()),
                                payload: z.any(),
                                service: z.string(),
                                statusCode: z.number(),
                                correlationId: z.string(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { from, service, to } = c.req.valid('query')
        try {
            const res = await prismaApimLogs.$queryRaw<
                {
                    data: Record<string, any>
                }[]
            >`SELECT data
                FROM apim_logs
                WHERE data ->> 'service' = ${service}
                AND (time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
                AND (data ->> 'flow' = 'RESPONSE_OUT' or data ->> 'flow' = 'REQUEST_OUT')
                ORDER BY time DESC limit 1000;`
            return c.json(
                res.map(
                    ({ data }) =>
                        ({
                            ...data,
                        }) as any
                ),
                200
            )
        } catch (error) {
            console.log('[ERROR][access-requests]', error)
            return c.json([], 200)
        }
    }
)

app.openapi(
    createRoute({
        operationId: 'count-requests',
        path: '/count-requests',
        method: 'get',
        request: {
            query: z.object({
                service: z.string(),
                from: z.date({
                    coerce: true,
                }),
                to: z.date({
                    coerce: true,
                }),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                api: z.string(),
                                total_requests: z.number(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { from, service, to } = c.req.valid('query')
        try {
            const res = await prismaApimLogs.$queryRaw<
                {
                    api: string
                    total_requests: bigint
                }[]
            >`SELECT
            data->>'apiTo' AS api,
            COUNT(*) AS total_requests
        FROM apim_logs
        WHERE data->>'service' = ${service}
        AND (data ->> 'flow' = 'REQUEST_OUT')
        AND (time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
        GROUP BY data->>'apiTo'
        ORDER BY total_requests DESC limit 1000;`

            return c.json(
                res.map(({ api, total_requests }) => ({
                    api,
                    total_requests: Number(total_requests),
                })),
                200
            )
        } catch (error) {
            console.log('[ERROR][count-requests]', error)
            return c.json([], 200)
        }
    }
)

app.openapi(
    createRoute({
        operationId: 'latency-average',
        path: '/latency-average',
        method: 'get',
        request: {
            query: z.object({
                service: z.string(),
                from: z.date({
                    coerce: true,
                }),
                to: z.date({
                    coerce: true,
                }),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                api: z.string(),
                                avg_latency: z.number(),
                                min_latency: z.number(),
                                max_latency: z.number(),
                                p95_latency: z.number(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { from, service, to } = c.req.valid('query')
        try {
            const res = await prismaApimLogs.$queryRaw<
                {
                    api: string
                    avg_ms: bigint
                    min_ms: bigint
                    max_ms: bigint
                    p95_ms: bigint
                }[]
            >`
        WITH resp AS (SELECT req.data ->> 'apiTo'                              AS api,
                     EXTRACT(EPOCH FROM (resp.time - req.time)) * 1000 AS response_time_ms
              FROM apim_logs req
                       JOIN apim_logs resp
                            ON req.data ->> 'correlationId' = resp.data ->> 'correlationId'
              WHERE req.data ->> 'flow' = 'REQUEST_IN'
                AND resp.data ->> 'flow' = 'RESPONSE_OUT'
                AND resp.data ->> 'service' = ${service}
        AND (resp.time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
              )
        SELECT api,
            AVG(response_time_ms)                                          AS avg_ms,
            MIN(response_time_ms)                                          AS min_ms,
            MAX(response_time_ms)                                          AS max_ms,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95_ms
        FROM resp
        GROUP BY api limit 1000;`

            return c.json(
                res.map(({ api, avg_ms, min_ms, max_ms, p95_ms }) => ({
                    api,
                    avg_latency: Number(avg_ms),
                    min_latency: Number(min_ms),
                    max_latency: Number(max_ms),
                    p95_latency: Number(p95_ms),
                })),
                200
            )
        } catch (error) {
            console.log('[ERROR][latency-average]', error)
            return c.json([], 200)
        }
    }
)

app.openapi(
    createRoute({
        operationId: 'error-rate',
        path: '/error-rate',
        method: 'get',
        request: {
            query: z.object({
                service: z.string(),
                from: z.date({
                    coerce: true,
                }),
                to: z.date({
                    coerce: true,
                }),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                api: z.string(),
                                error_count: z.number(),
                                total_count: z.number(),
                                error_rate: z.number(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { from, service, to } = c.req.valid('query')
        try {
            const res = await prismaApimLogs.$queryRaw<
                {
                    api: string
                    error_count: bigint
                    total_count: bigint
                    error_rate: number
                }[]
            >`
       SELECT
    data->>'apiTo' AS api,
    COUNT(*) FILTER (WHERE (data->>'statusCode')::int >= 400) AS error_count,
    COUNT(*) AS total_count,
    ROUND(
        COUNT(*) FILTER (WHERE (data->>'statusCode')::int >= 400) * 100.0
        / NULLIF(COUNT(*),0),
    2) AS error_rate
    FROM apim_logs
    WHERE data->>'service' = ${service}
    AND (time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
    GROUP BY data->>'apiTo'
    ORDER BY error_rate DESC limit 1000;`

            return c.json(
                res.map(({ api, error_count, total_count, error_rate }) => ({
                    api,
                    error_count: Number(error_count),
                    total_count: Number(total_count),
                    error_rate: Number(error_rate),
                })),
                200
            )
        } catch (error) {
            console.log('[ERROR][count-requests]', error)
            return c.json([], 200)
        }
    }
)

app.openapi(
    createRoute({
        operationId: 'throughput',
        path: '/throughput',
        method: 'get',
        request: {
            query: z.object({
                service: z.string(),
                from: z.date({
                    coerce: true,
                }),
                to: z.date({
                    coerce: true,
                }),
                type: z.enum(['minute', 'hour', 'day']).default('minute'),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                time: z.string(),
                                request_count: z.number(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { from, service, to, type } = c.req.valid('query')
        try {
            const res = await prismaApimLogs.$queryRaw<
                {
                    time: Date
                    request_count: bigint
                }[]
            >`
        with RC as (SELECT date_trunc(${type}, time) AS time,
                   COUNT(*)                 AS request_count
            FROM apim_logs
            WHERE data ->> 'service' = ${service}
              AND (time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
            GROUP BY time)
        select time, sum(request_count) as request_count
        from RC
        group by time
        ORDER BY time DESC limit 1000;`

            return c.json(
                res.map(({ time, request_count }) => ({
                    time,
                    request_count: Number(request_count),
                })),
                200
            )
        } catch (error) {
            console.log('[ERROR][throughput]', error)
            return c.json([], 200)
        }
    }
)

export default app
