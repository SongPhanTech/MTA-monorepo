import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
const app: OpenAPIHono = new OpenAPIHono({ strict: false })
const StatBaseSchema = z.object({
    summary: z.record(z.string(), z.any()),
    count: z.number(),
    preview: z.boolean().default(false),
    labels: z.array(z.string()).optional(),
})

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

        let data: {
            id: string
            name: string
            quota: number
            registered: number
            admitted: number
        }[] = []

        const labels = ['ID Ngành', 'Ngành', 'Chỉ tiêu', 'Hồ sơ đăng ký', 'Trúng tuyển']

        if (preview) {
            data = Array.from({ length: 10 }, (_, i) => ({
                id: `major-${i + 1}`,
                name: `Ngành ${i + 1}`,
                quota: 200 + i * 50,
                registered: 400 + i * 100,
                admitted: 180 + i * 45,
            }))

            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: !!preview,
                labels,
            })
        }

        // dữ liệu thật sẽ xử lý sau
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
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
                count: 2,
                summary: {},
                preview: true,
                labels: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}/${month}`),
            })
        }

        return c.json({
            data: [],
            count: 0,
            summary: {},
            preview: false,
            labels: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}/${month}`),
        })
    }
)
app.openapi(
    createRoute({
        method: 'post',
        path: '/Admission-statistics',
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
                description: 'Tổng quan kỳ tuyển sinh',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    organizationId: z.string(),
                                    total_quota: z.number(),
                                    total_registered: z.number(),
                                    total_eligible: z.number(),
                                    total_admitted: z.number(),
                                    actual_enrollment_count: z.number(),
                                    achievement_rate: z.number(),
                                    difference_percent: z.number(),
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

        let data: {
            organizationId: string
            total_quota: number
            total_registered: number
            total_eligible: number
            total_admitted: number
            actual_enrollment_count: number
            achievement_rate: number
            difference_percent: number
        }[] = []

        const labels = [
            'ID Đơn vị',
            'Tổng chỉ tiêu',
            'Hồ sơ đăng ký',
            'Hồ sơ đủ điều kiện',
            'Trúng tuyển',
            'Nhập học thực tế',
            'Tỷ lệ đạt chỉ tiêu (%)',
            'Chênh lệch so với cùng kỳ (%)',
        ]

        if (preview) {
            data = [
                {
                    organizationId: 'org-2025',
                    total_quota: 1000,
                    total_registered: 1350,
                    total_eligible: 1100,
                    total_admitted: 950,
                    actual_enrollment_count: 920,
                    achievement_rate: 92,
                    difference_percent: 5.5,
                },
            ]

            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: !!preview,
                labels,
            })
        }

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels,
        })
    }
)

export default app
