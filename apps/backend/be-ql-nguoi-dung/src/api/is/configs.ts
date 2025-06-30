import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getConfigs, patchConfigs } from '../../wso2is-apis/generated/config'
import { getConfigsResponse } from '../../wso2is-apis/generated/zod/config'

const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'getConfigs',
        method: 'get',
        path: '/configs',
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: getConfigsResponse.openapi('Configs'),
                    },
                },
                description: 'Get configs',
            },
            500: {
                content: {
                    'application/json': {
                        schema: z.object({}),
                    },
                },
                description: 'Internal Server Error',
            },
        },
    }),

    async (c) => {
        const { data } = await getConfigs()

        if (data && 'idleSessionTimeoutPeriod' in data) {
            return c.json(data, 200)
        }

        if (data && 'message' in data) {
            return c.json(data, 500)
        }

        return c.json({ message: 'Internal Server Error' }, 500)
    }
).openapi(
    createRoute({
        operationId: 'updateConfigs',
        method: 'put',
        path: '/configs',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z
                            .object({
                                idleSessionTimeoutPeriod: z.string(),
                                rememberMePeriod: z.string(),
                            })
                            .partial(),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.object({ message: z.string() }),
                    },
                },
                description: 'Update configs',
            },
            500: {
                content: {
                    'application/json': {
                        schema: z.object({}),
                    },
                },
                description: 'Internal Server Error',
            },
        },
    }),

    async (c) => {
        const body = c.req.valid('json')

        const { data } = await patchConfigs(
            Object.entries(body).map(([key, value]) => ({
                operation: 'REPLACE',
                path: `/${key}`,
                value,
            }))
        )

        if (data && 'message' in data) {
            return c.json(data, 500)
        }

        return c.json({ message: 'Success' }, 200)
    }
)

export default app
