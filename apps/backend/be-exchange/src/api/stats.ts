import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

const app = new OpenAPIHono({ strict: false })

const StatBaseSchema = z.object({
    summary: z.record(z.string(), z.any()),
    count: z.number(),
    preview: z.boolean().default(false),
    labels: z.array(z.string()).optional(),
})
type StudentDistribution = {
    id: string
    name: string
    quota: number
    registered: number
    admitted: number
}

app.openapi(
    createRoute({
        method: 'post',
        path: '/Admission-statistics-by-major',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Thống kê tuyển sinh theo Ngành đào tạo',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    id: z.string(),
                                    name: z.string(),
                                    quota: z.number(),
                                    registered: z.number(),
                                    admitted: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),

    async (c) => {
        const { preview } = c.req.valid('json')
        let data: StudentDistribution[] = []
        let labels: string[] | undefined = undefined

        if (preview) {
            data = Array.from({ length: 10 }, (_, i) => ({
                id: `major-${i + 1}`,
                name: `Ngành ${i + 1}`,
                quota: 200 + i * 50,
                registered: 400 + i * 100,
                admitted: 180 + i * 45,
            }))
            labels = ['ID Ngành', 'Ngành', 'Chỉ tiêu', 'Hồ sơ đăng ký', 'Trúng tuyển']
        }
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: !!preview,
            labels,
        })
    }
)
app.openapi(
    createRoute({
        method: 'post',
        path: '/statistics-of-records-by-date',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            month: z.number().min(1).max(12).optional(),
                            year: z.number().min(2000).max(3000).optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Thống kê hồ sơ theo ngày/tháng',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    organizationId: z.string(),
                                    label: z.string(),
                                    data: z.array(z.number()),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const {
            preview,
            month = new Date().getMonth() + 1,
            year = new Date().getFullYear(),
        } = c.req.valid('json')

        const daysInMonth = new Date(year, month, 0).getDate()
        const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}/${month}`)

        if (preview) {
            return c.json({
                data: [
                    {
                        organizationId: '1',
                        label: 'Hồ sơ tiếp nhận',
                        data: Array.from({ length: daysInMonth }, () =>
                            Math.floor(Math.random() * 100)
                        ),
                    },
                    {
                        organizationId: '1',
                        label: 'Hồ sơ đã duyệt',
                        data: Array.from({ length: daysInMonth }, () =>
                            Math.floor(Math.random() * 100)
                        ),
                    },
                ],
                count: 1,
                summary: {},
                labels,
                preview: true,
            })
        }
        return c.json({
            data: [],
            count: 0,
            summary: {},
            labels,
            preview: false,
        })
    }
)

export default app
