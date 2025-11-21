import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { PrismaClient as MysqlPrismaClient } from '@workspace/db/mysql'

const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'applications',
        path: '/applications',
        method: 'get',
        request: {
            query: z.object({
                search: z.string().optional(),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                Database: z.string(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { search } = c.req.valid('query')
        const mysqlPrisma = new MysqlPrismaClient({
            datasourceUrl: process.env.WSO2AM_DB,
        })
        const res = await mysqlPrisma.$queryRaw`select *
                    from WSO2AM_DB.AM_APPLICATION
                    where NAME like ${`%${search || ''}%`}`
        return c.json(res, 200)
    }
)

export default app
