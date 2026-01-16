import { Faker, vi } from '@faker-js/faker'

const faker = new Faker({
    locale: [vi],
})

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { $Enums, type AcademicActionType, Prisma } from '@workspace/db'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const StatBaseSchema = z.object({
    summary: z.record(z.string(), z.any()),
    count: z.number(),
    preview: z.boolean().default(false),
    labels: z.array(z.string()).optional(),
})

// Ban Giám đốc (BGĐ)
app.openapi(
    createRoute({
        method: 'post',
        path: '/student-distribution-by-training-object-type',
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
                description: 'Phân bổ theo Hệ đào tạo',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingObjectTypeId: z.string(),
                                    name: z.string(),
                                    count: z.number(),
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
        if (preview) {
            return c.json({
                data: Array.from({ length: 10 }, (_, i) => ({
                    trainingObjectTypeId: i.toString(),
                    name: `Hệ đào tạo ${i}`,
                    count: Math.round(Math.random() * 100),
                })),
                count: 10,
                summary: {},
                preview: true,
                labels: ['ID Hệ đào tạo', 'Tên hệ đào tạo', 'Số lượng'],
            })
        }

        const data = await prisma.$queryRaw<
            Array<{ trainingObjectTypeId: string; name: string; count: number }>
        >`
            SELECT
                "TOT"."id" AS "trainingObjectTypeId",
                "TOT"."name" AS "name",
                CAST(COUNT("S"."id") AS INTEGER) AS "count"
            FROM
                "ql-dao-tao"."TrainingObjectType" AS "TOT"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "TOT"."id" = "S"."trainingObjectTypeId"
            WHERE
                "S"."trainingObjectTypeId" IS NOT NULL
            GROUP BY
                "TOT"."id", "TOT"."name"
            ORDER BY
                "TOT"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Hệ đào tạo', 'Tên hệ đào tạo', 'Số lượng'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/student-distribution-by-training-level',
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
                description: 'Phân bổ theo Bậc đào tạo',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingLevelId: z.string(),
                                    name: z.string(),
                                    count: z.number(),
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
        if (preview) {
            return c.json({
                data: [
                    {
                        trainingLevelId: '1',
                        name: 'Đại học',
                        count: Math.round(Math.random() * 100),
                    },
                    {
                        trainingLevelId: '2',
                        name: 'Thạc sĩ',
                        count: Math.round(Math.random() * 100),
                    },
                    {
                        trainingLevelId: '2',
                        name: 'Tiến sĩ',
                        count: Math.round(Math.random() * 100),
                    },
                ],
                count: 3,
                summary: {},
                preview: true,
                labels: ['ID Bậc đào tạo', 'Tên bậc đào tạo', 'Số lượng'],
            })
        }

        const data = await prisma.$queryRaw<
            Array<{ trainingLevelId: string; name: string; count: number }>
        >`
            SELECT
                "TL"."id" AS "trainingLevelId",
                "TL"."name" AS "name",
                CAST(COUNT("S"."id") AS INTEGER) AS "count"
            FROM
                "ql-dao-tao"."TrainingLevel" AS "TL"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "TL"."id" = "S"."trainingLevelId"
            WHERE
                "S"."trainingLevelId" IS NOT NULL
            GROUP BY
                "TL"."id", "TL"."name"
            ORDER BY
                "TL"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Bậc đào tạo', 'Tên bậc đào tạo', 'Số lượng'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/student-distribution-by-training-course',
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
                description: 'Phân bổ theo Khoá học',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingCourseId: z.string(),
                                    name: z.string(),
                                    count: z.number(),
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
        if (preview) {
            return c.json({
                data: Array.from({ length: 10 }, (_, i) => ({
                    trainingCourseId: i.toString(),
                    name: `Khoá học ${i}`,
                    count: Math.round(Math.random() * 100),
                })),
                count: 10,
                summary: {},
                preview: true,
                labels: ['ID Khoá học', 'Tên khoá học', 'Số lượng'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ trainingCourseId: string; name: string; count: number }>
        >`
            SELECT
                "T"."id" AS "trainingCourseId",
                "T"."name" AS "name",
                CAST(COUNT("S"."id") AS INTEGER) AS "count"
            FROM
                "ql-dao-tao"."TrainingCourse" AS "T"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "T"."id" = "FC"."trainingCourseId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "FC"."id" = "S"."fixedClassId"
            GROUP BY
                "T"."id", "T"."name"
            ORDER BY
                "T"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Khoá học', 'Tên khoá học', 'Số lượng'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/average-entry-score-by-course',
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
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Điểm trúng tuyển trung bình qua các Khoá',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingCourseId: z.string(),
                                    name: z.string(),
                                    avgEntryScore: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                trainingCourseId: faker.string.uuid(),
                name: `Khoá ${faker.number.int({ min: 50, max: 60 })}`,
                avgEntryScore: faker.number.float({ min: 20, max: 30, fractionDigits: 2 }),
            }))

            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Khoá học', 'Tên khoá học', 'Điểm đầu vào'],
            })
        }

        const data = await prisma.$queryRaw<
            Array<{ trainingCourseId: string; name: string; avgEntryScore: number }>
        >`
            SELECT
                "TC"."id" AS "trainingCourseId",
                "TC"."name" AS "name",
                COALESCE(AVG("S"."entryScore"), 0) AS "avgEntryScore"
            FROM
                "ql-dao-tao"."TrainingCourse" AS "TC"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "TC"."id" = "FC"."trainingCourseId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "FC"."id" = "S"."fixedClassId"
            WHERE
                "S"."entryScore" IS NOT NULL
            GROUP BY
                "TC"."id", "TC"."name"
            ORDER BY
                "TC"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Khoá học', 'Tên khoá học', 'Điểm đầu vào'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/average-gpa-by-course',
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
                description: 'Điểm GPA tích lũy trung bình của sinh viên tốt nghiệp qua các Khoá',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingCourseId: z.string(),
                                    name: z.string(),
                                    avgGpa: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                trainingCourseId: faker.string.uuid(),
                name: `Khoá ${faker.number.int({ min: 50, max: 60 })}`,
                avgGpa: faker.number.float({ min: 2, max: 4, fractionDigits: 2 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Khoá học', 'Tên khoá học', 'GPA trung bình'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ trainingCourseId: string; name: string; avgGpa: number }>
        >`
            SELECT
                "TC"."id" AS "trainingCourseId",
                "TC"."name" AS "name",
                COALESCE(AVG("SSR"."cumulativeGpaBase10"), 0) AS "avgGpa"
            FROM
                "ql-dao-tao"."TrainingCourse" AS "TC"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "TC"."id" = "FC"."trainingCourseId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "FC"."id" = "S"."fixedClassId"
            JOIN
                "ql-dao-tao"."StudentSemesterResult" AS "SSR" ON "S"."id" = "SSR"."studentId"
            WHERE
                "S"."status" = 'GRADUATED' AND "SSR"."cumulativeGpaBase10" IS NOT NULL
            GROUP BY
                "TC"."id", "TC"."name"
            ORDER BY
                "TC"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Khoá học', 'Tên khoá học', 'GPA trung bình'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/graduation-rate-by-course',
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
                description: 'Tỷ lệ tốt nghiệp',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingCourseId: z.string(),
                                    name: z.string(),
                                    graduationRate: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                trainingCourseId: faker.string.uuid(),
                name: `Khoá ${faker.number.int({ min: 50, max: 60 })}`,
                graduationRate: faker.number.int({ min: 80, max: 100 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Khoá học', 'Tên khoá học', 'Tỉ lệ tốt nghiệp'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ trainingCourseId: string; name: string; graduationRate: number }>
        >`
            SELECT
                "TC"."id" AS "trainingCourseId",
                "TC"."name" AS "name",
                CAST(COALESCE(SUM(CASE WHEN "S"."status" = 'GRADUATED' THEN 1 ELSE 0 END) * 100.0 / COUNT("S"."id"), 0) AS INTEGER) AS "graduationRate"
            FROM
                "ql-dao-tao"."TrainingCourse" AS "TC"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "TC"."id" = "FC"."trainingCourseId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "FC"."id" = "S"."fixedClassId"
            GROUP BY
                "TC"."id", "TC"."name"
            ORDER BY
                "TC"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Khoá học', 'Tên khoá học', 'Tỉ lệ tốt nghiệp'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/academic-performance-by-year',
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
                description: 'Thống kê kết quả rèn luyện toàn Học viện',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    schoolYearId: z.string(),
                                    name: z.string(),
                                    excellent: z.number(),
                                    good: z.number(),
                                    fair: z.number(),
                                    average: z.number(),
                                    weak: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return {
                    schoolYearId: faker.string.uuid(),
                    name: `Năm học ${year - 1}-${year}`,
                    excellent: faker.number.int({ min: 100, max: 500 }),
                    good: faker.number.int({ min: 500, max: 1000 }),
                    fair: faker.number.int({ min: 200, max: 500 }),
                    average: faker.number.int({ min: 50, max: 100 }),
                    weak: faker.number.int({ min: 10, max: 50 }),
                }
            })
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: [
                    'ID Năm học',
                    'Tên năm học',
                    'Xuất sắc',
                    'Giỏi',
                    'Khá',
                    'Trung bình',
                    'Yếu',
                ],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{
                schoolYearId: string
                name: string
                excellent: number
                good: number
                fair: number
                average: number
                weak: number
            }>
        >`
            SELECT
                "SY"."id" AS "schoolYearId",
                "SY"."name" AS "name",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'EXCELLENT' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "excellent",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'GOOD' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "good",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'FAIR' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "fair",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'AVERAGE' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "average",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'POOR' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "weak"
            FROM
                "ql-dao-tao"."SchoolYear" AS "SY"
            LEFT JOIN
                "ql-dao-tao"."StudentYearResult" AS "SSR" ON "SY"."id" = "SSR"."schoolYearId"
            GROUP BY
                "SY"."id", "SY"."name"
            ORDER BY
                "SY"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Năm học', 'Tên năm học', 'Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/kpi-cards',
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
                description: 'Các con số tổng quan',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    totalStudents: z.number(),
                                    totalLecturers: z.number(),
                                    studentLecturerRatio: z.number(),
                                    activeCurricula: z.number(),
                                    academicWarningRate: z.number(),
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
        if (preview) {
            return c.json({
                data: [
                    {
                        totalStudents: Math.round(Math.random() * 100),
                        totalLecturers: Math.round(Math.random() * 100),
                        studentLecturerRatio: Math.round(Math.random() * 100),
                        activeCurricula: Math.round(Math.random() * 100),
                        academicWarningRate: Math.round(Math.random() * 100),
                    },
                ],
                count: 1,
                summary: {},
                preview: true,
                labels: ['Tổng HV SV', 'Tổng GV', 'Tỉ lệ HV/GV', 'CTĐT hoạt động', 'Tỉ lệ CCHT'],
            })
        }

        const result = await prisma.$queryRaw<
            Array<{
                totalStudents: bigint
                totalLecturers: bigint
                activeCurricula: bigint
                academicWarningStudents: bigint
            }>
        >`
            SELECT
                (SELECT COUNT(*) FROM "ql-dao-tao"."Student" WHERE "status" = 'ENROLLED') AS "totalStudents",
                (SELECT COUNT(*) FROM "ql-dao-tao"."Lecturer") AS "totalLecturers",
                (SELECT COUNT(*) FROM "ql-dao-tao"."Curriculum" WHERE "active" = true) AS "activeCurricula",
                (SELECT COUNT(*) FROM "ql-dao-tao"."Student" WHERE "academicWarningLevel" > 0) AS "academicWarningStudents"
        `

        const stats = result[0]
        if (!stats) {
            throw new HTTPException(404, { message: 'Không tìm thấy thống kê' })
        }
        const totalStudents = Number(stats.totalStudents)
        const totalLecturers = Number(stats.totalLecturers)
        const activeCurricula = Number(stats.activeCurricula)
        const academicWarningStudents = Number(stats.academicWarningStudents)

        return c.json({
            data: [
                {
                    totalStudents,
                    totalLecturers,
                    studentLecturerRatio: totalLecturers > 0 ? totalStudents / totalLecturers : 0,
                    activeCurricula,
                    academicWarningRate:
                        totalStudents > 0 ? (academicWarningStudents / totalStudents) * 100 : 0,
                },
            ],
            count: 1,
            summary: {},
            preview: false,
            labels: ['Tổng HV SV', 'Tổng GV', 'Tỉ lệ HV/GV', 'CTĐT hoạt động', 'Tỉ lệ CCHT'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/student-distribution-by-province',
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
                description: 'Phân bổ địa lý của sinh viên',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    provinceId: z.string(),
                                    name: z.string(),
                                    count: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 63 }, () => ({
                provinceId: faker.string.uuid(),
                name: faker.location.state(),
                count: faker.number.int({ min: 10, max: 200 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Tỉnh thành', 'Tên tỉnh thành', 'Số lượng'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ provinceId: string; name: string; count: number }>
        >`
            SELECT
                "P"."Id" AS "provinceId",
                "P"."sTen" AS "name",
                CAST(COUNT("UP"."id") AS INTEGER) AS "count"
            FROM
                "ql-dao-tao"."Student" AS "S"
            JOIN
                "ql-nguoi-dung"."UserProfile" AS "UP" ON "S"."userProfileId" = "UP"."id"
            JOIN
                "mta"."DM_Tinh" AS "P" ON "UP"."provinceHometownId" = "P"."Id"
            WHERE
                "UP"."provinceHometownId" IS NOT NULL
            GROUP BY
                "P"."Id", "P"."sTen"
            ORDER BY
                "P"."sTen";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Tỉnh thành', 'Tên tỉnh thành', 'Số lượng'],
        })
    }
)

// Trưởng phòng Đào tạo
app.openapi(
    createRoute({
        method: 'post',
        path: '/student-distribution-by-training-object-type-filtered',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            managementOrganizationId: z
                                .string()
                                .uuid()
                                .describe('DM_DonVi.Id - ID đơn vị quản lý'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Phân bổ theo Hệ đào tạo (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingObjectTypeId: z.string(),
                                    name: z.string(),
                                    count: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, managementOrganizationId } = c.req.valid('json')

        if (preview) {
            const data = Array.from({ length: 10 }, (_, i) => ({
                trainingObjectTypeId: i.toString(),
                name: `Hệ đào tạo ${i}`,
                count: Math.round(Math.random() * 100),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Hệ đào tạo', 'Tên hệ đào tạo', 'Số lượng'],
            })
        }

        const [{ all_ids }] = await prisma.$queryRaw<[{ all_ids: string[] }]>`
            WITH RECURSIVE org_tree AS (
                SELECT "Id", "sParentId"
                FROM mta."DM_DonVi"
                WHERE "Id" = ${managementOrganizationId}::UUID

                UNION ALL

                SELECT child."Id", child."sParentId"
                FROM mta."DM_DonVi" child
                INNER JOIN org_tree parent ON child."sParentId" = parent."Id"
            )
            SELECT ARRAY_AGG("Id") AS all_ids FROM org_tree;
            `

        const data = await prisma.$queryRaw<
            Array<{ trainingObjectTypeId: string; name: string; count: number }>
        >`
            SELECT
                "TOT"."id" AS "trainingObjectTypeId",
                "TOT"."name" AS "name",
                CAST(COUNT("S"."id") AS INTEGER) AS "count"
            FROM
                "ql-dao-tao"."TrainingObjectType" AS "TOT"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "TOT"."id" = "S"."trainingObjectTypeId"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "S"."fixedClassId" = "FC"."id"
            WHERE
                "S"."trainingObjectTypeId" IS NOT NULL
                AND "FC"."managementOrganizationId" = ANY(${all_ids}::uuid[])
            GROUP BY
                "TOT"."id", "TOT"."name"
            ORDER BY
                "TOT"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Hệ đào tạo', 'Tên hệ đào tạo', 'Số lượng'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/student-distribution-by-training-level-filtered',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            managementOrganizationId: z
                                .string()
                                .uuid()
                                .describe('DM_DonVi.Id - ID đơn vị quản lý'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Phân bổ theo Bậc đào tạo (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingLevelId: z.string(),
                                    name: z.string(),
                                    count: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, managementOrganizationId } = c.req.valid('json')
        if (preview) {
            const data = [
                {
                    trainingLevelId: '1',
                    name: 'Đại học',
                    count: Math.round(Math.random() * 100),
                },
                {
                    trainingLevelId: '2',
                    name: 'Thạc sĩ',
                    count: Math.round(Math.random() * 100),
                },
                {
                    trainingLevelId: '2',
                    name: 'Tiến sĩ',
                    count: Math.round(Math.random() * 100),
                },
            ]
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Bậc đào tạo', 'Tên bậc đào tạo', 'Số lượng'],
            })
        }

        const [{ all_ids }] = await prisma.$queryRaw<[{ all_ids: string[] }]>`
            WITH RECURSIVE org_tree AS (
                SELECT "Id", "sParentId"
                FROM mta."DM_DonVi"
                WHERE "Id" = ${managementOrganizationId}::UUID

                UNION ALL

                SELECT child."Id", child."sParentId"
                FROM mta."DM_DonVi" child
                INNER JOIN org_tree parent ON child."sParentId" = parent."Id"
            )
            SELECT ARRAY_AGG("Id") AS all_ids FROM org_tree;
            `

        const data = await prisma.$queryRaw<
            Array<{ trainingLevelId: string; name: string; count: number }>
        >`
            SELECT
                "TL"."id" AS "trainingLevelId",
                "TL"."name" AS "name",
                CAST(COUNT("S"."id") AS INTEGER) AS "count"
            FROM
                "ql-dao-tao"."TrainingLevel" AS "TL"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "TL"."id" = "S"."trainingLevelId"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "S"."fixedClassId" = "FC"."id"
            WHERE
                "S"."trainingLevelId" IS NOT NULL
                AND "FC"."managementOrganizationId" = ANY(${all_ids}::uuid[])
            GROUP BY
                "TL"."id", "TL"."name"
            ORDER BY
                "TL"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Bậc đào tạo', 'Tên bậc đào tạo', 'Số lượng'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/student-distribution-by-training-course-filtered',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            managementOrganizationId: z
                                .string()
                                .uuid()
                                .describe('DM_DonVi.Id - ID đơn vị quản lý'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Phân bổ theo Khoá học (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingCourseId: z.string(),
                                    name: z.string(),
                                    count: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, managementOrganizationId } = c.req.valid('json')
        if (preview) {
            const data = Array.from({ length: 10 }, (_, i) => ({
                trainingCourseId: i.toString(),
                name: `Khoá học ${i}`,
                count: Math.round(Math.random() * 100),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Khoá học', 'Tên khoá học', 'Số lượng'],
            })
        }

        const [{ all_ids }] = await prisma.$queryRaw<[{ all_ids: string[] }]>`
            WITH RECURSIVE org_tree AS (
                SELECT "Id", "sParentId"
                FROM mta."DM_DonVi"
                WHERE "Id" = ${managementOrganizationId}::UUID

                UNION ALL

                SELECT child."Id", child."sParentId"
                FROM mta."DM_DonVi" child
                INNER JOIN org_tree parent ON child."sParentId" = parent."Id"
            )
            SELECT ARRAY_AGG("Id") AS all_ids FROM org_tree;
            `

        const data = await prisma.$queryRaw<
            Array<{ trainingCourseId: string; name: string; count: number }>
        >`
            SELECT
                "TC"."id" AS "trainingCourseId",
                "TC"."name" AS "name",
                CAST(COUNT("S"."id") AS INTEGER) AS "count"
            FROM
                "ql-dao-tao"."TrainingCourse" AS "TC"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "TC"."id" = "FC"."trainingCourseId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "FC"."id" = "S"."fixedClassId"
            WHERE "FC"."managementOrganizationId" = ANY(${all_ids}::uuid[])
            GROUP BY
                "TC"."id", "TC"."name"
            ORDER BY
                "TC"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Khoá học', 'Tên khoá học', 'Số lượng'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/average-entry-score-by-course-filtered',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            managementOrganizationId: z
                                .string()
                                .uuid()
                                .describe('DM_DonVi.Id - ID đơn vị quản lý'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Điểm trúng tuyển trung bình qua các Khoá (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingCourseId: z.string(),
                                    name: z.string(),
                                    avgEntryScore: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, managementOrganizationId } = c.req.valid('json')
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                trainingCourseId: faker.string.uuid(),
                name: `Khoá ${faker.number.int({ min: 50, max: 60 })}`,
                avgEntryScore: faker.number.float({ min: 20, max: 30, fractionDigits: 2 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Khoá học', 'Tên khoá học', 'Điểm đầu vào'],
            })
        }

        const [{ all_ids }] = await prisma.$queryRaw<[{ all_ids: string[] }]>`
            WITH RECURSIVE org_tree AS (
                SELECT "Id", "sParentId"
                FROM mta."DM_DonVi"
                WHERE "Id" = ${managementOrganizationId}::UUID

                UNION ALL

                SELECT child."Id", child."sParentId"
                FROM mta."DM_DonVi" child
                INNER JOIN org_tree parent ON child."sParentId" = parent."Id"
            )
            SELECT ARRAY_AGG("Id") AS all_ids FROM org_tree;
            `

        const data = await prisma.$queryRaw<
            Array<{ trainingCourseId: string; name: string; avgEntryScore: number }>
        >`
            SELECT
                "TC"."id" AS "trainingCourseId",
                "TC"."name" AS "name",
                COALESCE(AVG("S"."entryScore"), 0) AS "avgEntryScore"
            FROM
                "ql-dao-tao"."TrainingCourse" AS "TC"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "TC"."id" = "FC"."trainingCourseId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "FC"."id" = "S"."fixedClassId"
            WHERE
                "S"."entryScore" IS NOT NULL
                AND "FC"."managementOrganizationId" = ANY(${all_ids}::uuid[])
            GROUP BY
                "TC"."id", "TC"."name"
            ORDER BY
                "TC"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Khoá học', 'Tên khoá học', 'Điểm đầu vào'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/average-gpa-by-course-filtered',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            managementOrganizationId: z
                                .string()
                                .uuid()
                                .describe('DM_DonVi.Id - ID đơn vị quản lý'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description:
                    'Điểm GPA tích lũy trung bình của sinh viên tốt nghiệp qua các Khoá (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingCourseId: z.string(),
                                    name: z.string(),
                                    avgGpa: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, managementOrganizationId } = c.req.valid('json')
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                trainingCourseId: faker.string.uuid(),
                name: `Khoá ${faker.number.int({ min: 50, max: 60 })}`,
                avgGpa: faker.number.float({ min: 2, max: 4, fractionDigits: 2 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Khoá học', 'Tên khoá học', 'GPA trung bình'],
            })
        }

        const [{ all_ids }] = await prisma.$queryRaw<[{ all_ids: string[] }]>`
            WITH RECURSIVE org_tree AS (
                SELECT "Id", "sParentId"
                FROM mta."DM_DonVi"
                WHERE "Id" = ${managementOrganizationId}::UUID

                UNION ALL

                SELECT child."Id", child."sParentId"
                FROM mta."DM_DonVi" child
                INNER JOIN org_tree parent ON child."sParentId" = parent."Id"
            )
            SELECT ARRAY_AGG("Id") AS all_ids FROM org_tree;
            `

        const data = await prisma.$queryRaw<
            Array<{ trainingCourseId: string; name: string; avgGpa: number }>
        >`
            SELECT
                "TC"."id" AS "trainingCourseId",
                "TC"."name" AS "name",
                COALESCE(AVG("SSR"."cumulativeGpaBase10"), 0) AS "avgGpa"
            FROM
                "ql-dao-tao"."TrainingCourse" AS "TC"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "TC"."id" = "FC"."trainingCourseId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "FC"."id" = "S"."fixedClassId"
            JOIN
                "ql-dao-tao"."StudentSemesterResult" AS "SSR" ON "S"."id" = "SSR"."studentId"
            WHERE
                "S"."status" = 'GRADUATED'
                AND "SSR"."cumulativeGpaBase10" IS NOT NULL
                AND "FC"."managementOrganizationId" = ANY(${all_ids}::uuid[])
            GROUP BY
                "TC"."id", "TC"."name"
            ORDER BY
                "TC"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Khoá học', 'Tên khoá học', 'GPA trung bình'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/graduation-rate-by-course-filtered',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            managementOrganizationId: z
                                .string()
                                .uuid()
                                .describe('DM_DonVi.Id - ID đơn vị quản lý'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Tỷ lệ tốt nghiệp (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingCourseId: z.string(),
                                    name: z.string(),
                                    graduationRate: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, managementOrganizationId } = c.req.valid('json')
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                trainingCourseId: faker.string.uuid(),
                name: `Khoá ${faker.number.int({ min: 50, max: 60 })}`,
                graduationRate: faker.number.int({ min: 80, max: 100 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Khoá học', 'Tên khoá học', 'Tỉ lệ tốt nghiệp'],
            })
        }

        const [{ all_ids }] = await prisma.$queryRaw<[{ all_ids: string[] }]>`
            WITH RECURSIVE org_tree AS (
                SELECT "Id", "sParentId"
                FROM mta."DM_DonVi"
                WHERE "Id" = ${managementOrganizationId}::UUID

                UNION ALL

                SELECT child."Id", child."sParentId"
                FROM mta."DM_DonVi" child
                INNER JOIN org_tree parent ON child."sParentId" = parent."Id"
            )
            SELECT ARRAY_AGG("Id") AS all_ids FROM org_tree;
            `

        const data = await prisma.$queryRaw<
            Array<{ trainingCourseId: string; name: string; graduationRate: number }>
        >`
            SELECT
                "TC"."id" AS "trainingCourseId",
                "TC"."name" AS "name",
                CAST(COALESCE(SUM(CASE WHEN "S"."status" = 'GRADUATED' THEN 1 ELSE 0 END) * 100.0 / COUNT("S"."id"), 0) AS INTEGER) AS "graduationRate"
            FROM
                "ql-dao-tao"."TrainingCourse" AS "TC"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "TC"."id" = "FC"."trainingCourseId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "FC"."id" = "S"."fixedClassId"
            WHERE "FC"."managementOrganizationId" = ANY(${all_ids}::uuid[])
            GROUP BY
                "TC"."id", "TC"."name"
            ORDER BY
                "TC"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Khoá học', 'Tên khoá học', 'Tỉ lệ tốt nghiệp'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/academic-performance-by-year-filtered',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            managementOrganizationId: z
                                .string()
                                .uuid()
                                .describe('DM_DonVi.Id - ID đơn vị quản lý'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Thống kê kết quả học tập toàn Học viện (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    schoolYearId: z.string(),
                                    name: z.string(),
                                    excellent: z.number(),
                                    good: z.number(),
                                    fair: z.number(),
                                    average: z.number(),
                                    weak: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, managementOrganizationId } = c.req.valid('json')
        if (preview) {
            const data = Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return {
                    schoolYearId: faker.string.uuid(),
                    name: `Năm học ${year - 1}-${year}`,
                    excellent: faker.number.int({ min: 100, max: 500 }),
                    good: faker.number.int({ min: 500, max: 1000 }),
                    fair: faker.number.int({ min: 200, max: 500 }),
                    average: faker.number.int({ min: 50, max: 100 }),
                    weak: faker.number.int({ min: 10, max: 50 }),
                }
            })
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: [
                    'ID Năm học',
                    'Tên năm học',
                    'Xuất sắc',
                    'Giỏi',
                    'Khá',
                    'Trung bình',
                    'Yếu',
                ],
            })
        }

        const [{ all_ids }] = await prisma.$queryRaw<[{ all_ids: string[] }]>`
            WITH RECURSIVE org_tree AS (
                SELECT "Id", "sParentId"
                FROM mta."DM_DonVi"
                WHERE "Id" = ${managementOrganizationId}::UUID

                UNION ALL

                SELECT child."Id", child."sParentId"
                FROM mta."DM_DonVi" child
                INNER JOIN org_tree parent ON child."sParentId" = parent."Id"
            )
            SELECT ARRAY_AGG("Id") AS all_ids FROM org_tree;
            `

        const data = await prisma.$queryRaw<
            Array<{
                schoolYearId: string
                name: string
                excellent: number
                good: number
                fair: number
                average: number
                weak: number
            }>
        >`
            SELECT
                "SY"."id" AS "schoolYearId",
                "SY"."name" AS "name",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'EXCELLENT' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "excellent",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'GOOD' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "good",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'FAIR' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "fair",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'AVERAGE' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "average",
                CAST(COUNT(CASE WHEN "SSR"."studentTrainingType" = 'POOR' THEN "SSR"."id" ELSE NULL END) AS INTEGER) AS "weak"
            FROM
                "ql-dao-tao"."SchoolYear" AS "SY"
            LEFT JOIN
                "ql-dao-tao"."StudentYearResult" AS "SSR" ON "SY"."id" = "SSR"."schoolYearId"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "SSR"."studentId" = "S"."id"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "S"."fixedClassId" = "FC"."id"
            WHERE "FC"."managementOrganizationId" = ANY(${all_ids}::uuid[])
            GROUP BY
                "SY"."id", "SY"."name"
            ORDER BY
                "SY"."name";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Năm học', 'Tên năm học', 'Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/student-distribution-by-province-filtered',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            managementOrganizationId: z
                                .string()
                                .uuid()
                                .describe('DM_DonVi.Id - ID đơn vị quản lý'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Phân bổ địa lý của sinh viên (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    provinceId: z.string(),
                                    name: z.string(),
                                    count: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, managementOrganizationId } = c.req.valid('json')
        if (preview) {
            const data = Array.from({ length: 63 }, () => ({
                provinceId: faker.string.uuid(),
                name: faker.location.state(),
                count: faker.number.int({ min: 10, max: 200 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Tỉnh thành', 'Tên tỉnh thành', 'Số lượng'],
            })
        }

        const [{ all_ids }] = await prisma.$queryRaw<[{ all_ids: string[] }]>`
            WITH RECURSIVE org_tree AS (
                SELECT "Id", "sParentId"
                FROM mta."DM_DonVi"
                WHERE "Id" = ${managementOrganizationId}::UUID

                UNION ALL

                SELECT child."Id", child."sParentId"
                FROM mta."DM_DonVi" child
                INNER JOIN org_tree parent ON child."sParentId" = parent."Id"
            )
            SELECT ARRAY_AGG("Id") AS all_ids FROM org_tree;
            `

        const data = await prisma.$queryRaw<
            Array<{ provinceId: string; name: string; count: number }>
        >`
            SELECT
                "P"."Id" AS "provinceId",
                "P"."sTen" AS "name",
                CAST(COUNT("UP"."id") AS INTEGER) AS "count"
            FROM
                "ql-nguoi-dung"."UserProfile" AS "UP"
            JOIN
                "ql-dao-tao"."Student" AS "S" ON "UP"."id" = "S"."userProfileId"
            JOIN
                "ql-dao-tao"."FixedClass" AS "FC" ON "S"."fixedClassId" = "FC"."id"
            JOIN
                "mta"."DM_Tinh" AS "P" ON "UP"."provinceHometownId" = "P"."Id"
            WHERE
                "UP"."provinceHometownId" IS NOT NULL
                AND "FC"."managementOrganizationId" = ANY(${all_ids}::uuid[])
            GROUP BY
                "P"."Id", "P"."sTen"
            ORDER BY
                "P"."sTen";
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Tỉnh thành', 'Tên tỉnh thành', 'Số lượng'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/students-of-interest',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            warningLevel: z.string().optional(),
                            debtCredits: z.string().optional(),
                            gpaThreshold: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Danh sách SV cần quan tâm',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    id: z.string(),
                                    name: z.string(),
                                    academicWarningLevel: z.number(),
                                    cumulativeDebtCredits: z.number(),
                                    gpa: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, warningLevel, debtCredits, gpaThreshold } = c.req.valid('json')
        if (preview) {
            const data = Array.from({ length: 20 }, () => ({
                id: faker.string.uuid(),
                name: faker.person.fullName(),
                academicWarningLevel: faker.number.int({ min: 1, max: 3 }),
                cumulativeDebtCredits: faker.number.int({ min: 1, max: 20 }),
                gpa: faker.number.float({ min: 1, max: 3, fractionDigits: 2 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID', 'Tên', 'CCHT', 'TC trượt', 'GPA'],
            })
        }

        const conditions = []
        if (warningLevel) {
            conditions.push(
                Prisma.sql`"S"."academicWarningLevel" > ${Number.parseInt(warningLevel, 10)}`
            )
        }
        if (debtCredits) {
            conditions.push(
                Prisma.sql`"SSR"."cumulativeDebtCredits" > ${Number.parseInt(debtCredits, 10)}`
            )
        }
        if (gpaThreshold) {
            conditions.push(
                Prisma.sql`"SSR"."cumulativeGpaBase10" < ${Number.parseFloat(gpaThreshold)}`
            )
        }

        if (conditions.length === 0) {
            return c.json({
                data: [],
                count: 0,
                summary: {},
                preview: false,
                labels: ['ID', 'Tên', 'CCHT', 'TC trượt', 'GPA'],
            })
        }

        const where = Prisma.join(conditions, ' OR ')

        const data = await prisma.$queryRaw<
            Array<{
                id: string
                name: string
                academicWarningLevel: number
                cumulativeDebtCredits: number
                gpa: number
            }>
        >`
            SELECT
                "S"."id",
                "UP"."fullname" as "name",
                "S"."academicWarningLevel",
                "SSR"."cumulativeDebtCredits",
                "SSR"."cumulativeGpaBase10" as "gpa"
            FROM
                "ql-dao-tao"."Student" AS "S"
            JOIN
                "ql-nguoi-dung"."UserProfile" AS "UP" ON "S"."userProfileId" = "UP"."id"
            LEFT JOIN
                "ql-dao-tao"."StudentSemesterResult" AS "SSR" ON "S"."id" = "SSR"."studentId"
            WHERE ${where}
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID', 'Tên', 'CCHT', 'TC trượt', 'GPA'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/average-gpa-by-fixed-class',
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
                description: 'Điểm GPA trung bình theo Lớp niên chế',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    fixedClassId: z.string(),
                                    name: z.string(),
                                    avgGpa: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 20 }, () => ({
                fixedClassId: faker.string.uuid(),
                name: `Lớp ${faker.lorem.word()}${faker.number.int({ min: 1, max: 10 })}`,
                avgGpa: faker.number.float({ min: 2, max: 4, fractionDigits: 2 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Lớp', 'Tên lớp', 'GPA trung bình'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ fixedClassId: string; name: string; avgGpa: number }>
        >`
            SELECT
                "FC"."id" as "fixedClassId",
                "FC"."name" as "name",
                CAST(AVG("SSR"."gpaBase10") AS REAL) as "avgGpa"
            FROM "ql-dao-tao"."StudentSemesterResult" "SSR"
            JOIN "ql-dao-tao"."Student" "S" ON "S"."id" = "SSR"."studentId"
            JOIN "ql-dao-tao"."FixedClass" "FC" ON "FC"."id" = "S"."fixedClassId"
            GROUP BY "FC"."id", "FC"."name"
        `

        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Lớp', 'Tên lớp', 'GPA trung bình'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/average-gpa-by-training-major',
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
                description: 'Điểm GPA trung bình theo Ngành',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    trainingMajorId: z.string(),
                                    name: z.string(),
                                    avgGpa: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                trainingMajorId: faker.string.uuid(),
                name: faker.commerce.department(),
                avgGpa: faker.number.float({ min: 2, max: 4, fractionDigits: 2 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Ngành', 'Tên ngành', 'GPA trung bình'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ trainingMajorId: string; name: string; avgGpa: number }>
        >`
            SELECT
                "TM"."id" as "trainingMajorId",
                "TM"."name" as "name",
                CAST(AVG("SSR"."gpaBase10") AS REAL) as "avgGpa"
            FROM "ql-dao-tao"."StudentSemesterResult" "SSR"
            JOIN "ql-dao-tao"."Student" "S" ON "S"."id" = "SSR"."studentId"
            JOIN "ql-dao-tao"."CurriculumVersion" "CV" ON "CV"."id" = "S"."curriculumVersionId"
            JOIN "ql-dao-tao"."Curriculum" "C" ON "C"."id" = "CV"."curriculumId"
            JOIN "ql-dao-tao"."TrainingMajor" "TM" ON "TM"."id" = "C"."trainingMajorId"
            GROUP BY "TM"."id", "TM"."name"
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Ngành', 'Tên ngành', 'GPA trung bình'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/subject-pass-fail-rate',
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
                description: 'Tỷ lệ % sinh viên qua môn/rớt môn của các học phần',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    subjectVersionId: z.string(),
                                    name: z.string(),
                                    passed: z.number(),
                                    failed: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 30 }, () => ({
                subjectVersionId: faker.string.uuid(),
                name: faker.lorem.words({ min: 3, max: 7 }),
                passed: faker.number.int({ min: 50, max: 200 }),
                failed: faker.number.int({ min: 5, max: 30 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Học phần', 'Tên học phần', 'Qua', 'Trượt'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ subjectVersionId: string; name: string; passed: number; failed: number }>
        >`
            SELECT
                "SV"."id" as "subjectVersionId",
                "SV"."name" as "name",
                CAST(SUM(CASE WHEN "SSS"."finalScore" >= 5 THEN 1 ELSE 0 END) AS INTEGER) as "passed",
                CAST(SUM(CASE WHEN "SSS"."finalScore" < 5 THEN 1 ELSE 0 END) AS INTEGER) as "failed"
            FROM "ql-dao-tao"."StudentSubjectScore" "SSS"
            JOIN "ql-dao-tao"."SubjectVersion" "SV" ON "SV"."id" = "SSS"."subjectVersionId"
            GROUP BY "SV"."id", "SV"."name"
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Học phần', 'Tên học phần', 'Qua', 'Trượt'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/curriculum-statistics',
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
                description: 'Thống kê CTĐT',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    activeCurricula: z.number(),
                                    activeCurriculumVersions: z.number(),
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
        if (preview) {
            return c.json({
                data: [
                    {
                        activeCurricula: Math.round(Math.random() * 100),
                        activeCurriculumVersions: Math.round(Math.random() * 100),
                    },
                ],
                count: 1,
                summary: {},
                preview: true,
                labels: ['CTĐT hoạt động', 'Phiên bản CTĐT hoạt động'],
            })
        }
        const result = await prisma.$queryRaw<
            Array<{ activeCurricula: bigint; activeCurriculumVersions: bigint }>
        >`
            SELECT
                (SELECT COUNT(*) FROM "ql-dao-tao"."Curriculum" WHERE "active" = true) AS "activeCurricula",
                (SELECT COUNT(*) FROM "ql-dao-tao"."CurriculumVersion" WHERE "active" = true) AS "activeCurriculumVersions"
        `
        const { activeCurricula, activeCurriculumVersions } = result[0]!

        return c.json({
            data: [{ activeCurricula, activeCurriculumVersions }],
            count: 1,
            summary: {},
            preview: false,
            labels: ['CTĐT hoạt động', 'Phiên bản CTĐT hoạt động'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/subject-class-statistics',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            semesterId: z.string().describe('Semester.id - ID học kỳ'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Thống kê Lớp học phần',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    totalClasses: z.number(),
                                    classes: z.array(
                                        z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            fillRate: z.number(),
                                            failureRate: z.number(),
                                        })
                                    ),
                                    labels: z.array(z.string()),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, semesterId } = c.req.valid('json')
        if (preview) {
            const classes = Array.from({ length: 50 }, () => ({
                id: faker.string.uuid(),
                name: `Lớp ${faker.lorem.words(2)}`,
                fillRate: faker.number.float({ min: 70, max: 100, fractionDigits: 2 }),
                failureRate: faker.number.float({ min: 5, max: 20, fractionDigits: 2 }),
            }))
            return c.json({
                data: [
                    {
                        totalClasses: classes.length,
                        classes,
                        labels: ['ID', 'Tên', 'Tỉ lệ lấp', 'Tỉ lệ trượt'],
                    },
                ],
                count: 1,
                summary: {},
                preview: false,
            })
        }

        const classes = await prisma.$queryRaw<
            Array<{
                id: string
                name: string
                fillRate: number
                failureRate: number
            }>
        >`
            SELECT
                "SC"."id",
                "SC"."name",
                CASE
                    WHEN "SC"."maxStudent" > 0 THEN (CAST(COUNT("SCS"."id") AS REAL) / "SC"."maxStudent") * 100
                    ELSE 0
                END AS "fillRate",
                CASE
                    WHEN COUNT("SCS"."id") > 0 THEN (CAST(SUM(CASE WHEN "SCS"."finalScore" < 5 THEN 1 ELSE 0 END) AS REAL) / COUNT("SCS"."id")) * 100
                    ELSE 0
                END AS "failureRate"
            FROM "ql-dao-tao"."SubjectClass" "SC"
            LEFT JOIN "ql-dao-tao"."StudentSubjectScore" "SCS" ON "SCS"."subjectClassId" = "SC"."id"
            WHERE "SC"."semesterId" = ${semesterId}
            GROUP BY "SC"."id", "SC"."name", "SC"."maxStudent"
        `

        return c.json({
            data: [
                {
                    totalClasses: classes.length,
                    classes,
                    labels: ['ID', 'Tên', 'Tỉ lệ lấp', 'Tỉ lệ trượt'],
                },
            ],
            count: 1,
            summary: {},
            preview: false,
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/lecturer-workload',
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
                description: 'Tải giảng dạy của Giảng viên',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    lecturerId: z.string(),
                                    name: z.string(),
                                    classCount: z.number(),
                                    totalPeriods: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 40 }, () => ({
                lecturerId: faker.string.uuid(),
                name: faker.person.fullName(),
                classCount: faker.number.int({ min: 1, max: 5 }),
                totalPeriods: faker.number.int({ min: 10, max: 60 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Giảng viên', 'Tên giảng viên', 'Số lớp', 'Số tiết'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ lecturerId: string; name: string; classCount: number; totalPeriods: number }>
        >`
            SELECT
                "L"."id" as "lecturerId",
                "UP"."fullname" as "name",
                CAST(COUNT("SC"."id") AS INTEGER) as "classCount",
                CAST(COALESCE(SUM("SV"."period"), 0) AS INTEGER) as "totalPeriods"
            FROM "ql-dao-tao"."Lecturer" "L"
            JOIN "ql-nguoi-dung"."UserProfile" "UP" ON "UP"."id" = "L"."userProfileId"
            LEFT JOIN "ql-dao-tao"."SubjectClass" "SC" ON "SC"."lecturerId" = "L"."id" OR "SC"."extraLecturerId" = "L"."id"
            LEFT JOIN "ql-dao-tao"."SubjectVersion" "SV" ON "SV"."id" = "SC"."subjectId"
            GROUP BY "L"."id", "UP"."fullname"
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Giảng viên', 'Tên giảng viên', 'Số lớp', 'Số tiết'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/graduation-ranking-statistics',
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
                description: 'Thống kê xếp hạng tốt nghiệp',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    ranking: z.string(),
                                    count: z.number(),
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
        if (preview) {
            const data = [
                { ranking: 'Xuất sắc', count: faker.number.int({ min: 10, max: 50 }) },
                { ranking: 'Giỏi', count: faker.number.int({ min: 100, max: 300 }) },
                { ranking: 'Khá', count: faker.number.int({ min: 200, max: 500 }) },
                { ranking: 'Trung bình', count: faker.number.int({ min: 50, max: 100 }) },
            ]
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['Xếp loại', 'Số lượng'],
            })
        }
        const data = await prisma.$queryRaw<Array<{ ranking: string; count: number }>>`
            SELECT
                "AR"."classification" as "ranking",
                CAST(COUNT("S"."id") AS INTEGER) as "count"
            FROM "ql-dao-tao"."Student" "S"
            JOIN "ql-dao-tao"."GraduationDecision" "GD" ON "GD"."studentId" = "S"."id"
            JOIN "ql-dao-tao"."AcademicRankingConvert" "AR" ON "AR"."id" = "GD"."finalRankingId"
            GROUP BY "AR"."classification"
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['Xếp loại', 'Số lượng'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/students-for-academic-action',
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
                description: 'Danh sách SV bị đề nghị xử lý',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    studentId: z.string(),
                                    studentName: z.string(),
                                    actionType: z.nativeEnum($Enums.AcademicActionType),
                                    reason: z.string(),
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
        if (preview) {
            const data = Array.from({ length: 15 }, () => ({
                studentId: faker.string.uuid(),
                studentName: faker.person.fullName(),
                actionType: faker.helpers.arrayElement(Object.values($Enums.AcademicActionType)),
                reason: faker.lorem.sentence(),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Sinh viên', 'Tên sinh viên', 'Hành động', 'Lý do'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{
                studentId: string
                studentName: string
                actionType: AcademicActionType
                reason: string
            }>
        >`
            SELECT
                "S"."id" as "studentId",
                "UP"."fullname" as "studentName",
                "SAD"."actionTaken",
                "SAD"."reason"
            FROM "ql-dao-tao"."StudentAcademicDecision" "SAD"
            JOIN "ql-dao-tao"."Student" "S" ON "S"."id" = "SAD"."studentId"
            JOIN "ql-nguoi-dung"."UserProfile" "UP" ON "UP"."id" = "S"."userProfileId"
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Sinh viên', 'Tên sinh viên', 'Hành động', 'Lý do'],
        })
    }
)

// Trưởng phòng Khảo thí
app.openapi(
    createRoute({
        method: 'post',
        path: '/exam-participants-by-semester',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().default(false),
                            semesterId: z.string().describe('Semester.id - ID học kỳ'),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Tổng số lượt sinh viên dự thi trong học kỳ',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    totalParticipants: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { preview, semesterId } = c.req.valid('json')
        if (preview) {
            return c.json({
                data: [
                    {
                        totalParticipants: faker.number.int({ min: 5000, max: 10000 }),
                    },
                ],
                count: 1,
                summary: {},
                preview: true,
                labels: ['Số thí sinh'],
            })
        }

        const result = await prisma.$queryRaw<Array<{ totalParticipants: bigint }>>`
            SELECT COUNT("ES"."id") as "totalParticipants"
            FROM "khao-thi"."ExamSession" "ES"
            JOIN "khao-thi"."Exam" "E" ON "E"."id" = "ES"."examId"
            JOIN "ql-dao-tao"."SubjectClass" "SC" ON "SC"."examId" = "E"."id"
            WHERE "SC"."semesterId" = ${semesterId}
        `
        const totalParticipants = Number(result[0]?.totalParticipants)
        return c.json({
            data: [{ totalParticipants }],
            count: 1,
            summary: {},
            preview: false,
            labels: ['Số thí sinh'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/average-exam-score-trend',
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
                description: 'Điểm thi trung bình của các học phần qua các học kỳ',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    semesterId: z.string(),
                                    semesterName: z.string(),
                                    subjectVersionId: z.string(),
                                    subjectName: z.string(),
                                    averageScore: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 20 }, () => ({
                semesterId: faker.string.uuid(),
                semesterName: `Học kỳ ${faker.number.int({ min: 1, max: 3 })} Năm học ${
                    new Date().getFullYear() - 1
                }-${new Date().getFullYear()}`,
                subjectVersionId: faker.string.uuid(),
                subjectName: faker.lorem.words({ min: 3, max: 7 }),
                averageScore: faker.number.float({ min: 5, max: 10, fractionDigits: 2 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Học kỳ', 'Tên học kỳ', 'ID Học phần', 'Tên học phần', 'Điểm TB'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{
                semesterId: string
                semesterName: string
                subjectVersionId: string
                subjectName: string
                averageScore: number
            }>
        >`
            SELECT
                "SEM"."id" as "semesterId",
                "SEM"."name" as "semesterName",
                "SV"."id" as "subjectVersionId",
                "SV"."name" as "subjectName",
                AVG("SSS"."examScore") as "averageScore"
            FROM "ql-dao-tao"."StudentSubjectScore" "SSS"
            JOIN "ql-dao-tao"."SubjectClass" "SC" ON "SC"."id" = "SSS"."subjectClassId"
            JOIN "ql-dao-tao"."Semester" "SEM" ON "SEM"."id" = "SC"."semesterId"
            JOIN "ql-dao-tao"."SubjectVersion" "SV" ON "SV"."id" = "SSS"."subjectVersionId"
            WHERE "SSS"."examScore" IS NOT NULL
            GROUP BY "SEM"."id", "SEM"."name", "SV"."id", "SV"."name"
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Học kỳ', 'Tên học kỳ', 'ID Học phần', 'Tên học phần', 'Điểm TB'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/question-statistics',
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
                description: 'Thống kê câu hỏi',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    totalQuestions: z.number(),
                                    byQuestionBank: z.array(
                                        z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            count: z.number(),
                                        })
                                    ),
                                    bySubjectVersion: z.array(
                                        z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            count: z.number(),
                                        })
                                    ),
                                    byDifficulty: z.array(
                                        z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            count: z.number(),
                                        })
                                    ),
                                    byKnowledgeBlock: z.array(
                                        z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            count: z.number(),
                                        })
                                    ),
                                    byQuestionBankLabels: z.array(z.string()),
                                    bySubjectVersionLabels: z.array(z.string()),
                                    byDifficultyLabels: z.array(z.string()),
                                    byKnowledgeBlockLabels: z.array(z.string()),
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
        if (preview) {
            const byQuestionBank = Array.from({ length: 10 }, () => ({
                id: faker.string.uuid(),
                name: `Ngân hàng ${faker.lorem.words(2)}`,
                count: faker.number.int({ min: 50, max: 200 }),
            }))
            const bySubjectVersion = Array.from({ length: 15 }, () => ({
                id: faker.string.uuid(),
                name: faker.lorem.words({ min: 3, max: 7 }),
                count: faker.number.int({ min: 100, max: 400 }),
            }))
            const byDifficulty = [
                { id: '1', name: 'Dễ', count: faker.number.int({ min: 1000, max: 2000 }) },
                { id: '2', name: 'Trung bình', count: faker.number.int({ min: 2000, max: 5000 }) },
                { id: '3', name: 'Khó', count: faker.number.int({ min: 500, max: 1000 }) },
            ]
            const byKnowledgeBlock = Array.from({ length: 20 }, () => ({
                id: faker.string.uuid(),
                name: `Khối kiến thức ${faker.lorem.word()}`,
                count: faker.number.int({ min: 20, max: 100 }),
            }))
            const totalQuestions = byQuestionBank.reduce((acc, item) => acc + item.count, 0)

            return c.json({
                data: [
                    {
                        totalQuestions,
                        byQuestionBank,
                        bySubjectVersion,
                        byDifficulty,
                        byKnowledgeBlock,
                        byQuestionBankLabels: ['ID', 'Tên', 'Số lượng'],
                        bySubjectVersionLabels: ['ID', 'Tên', 'Số lượng'],
                        byDifficultyLabels: ['ID', 'Tên', 'Số lượng'],
                        byKnowledgeBlockLabels: ['ID', 'Tên', 'Số lượng'],
                    },
                ],
                count: 1,
                summary: {},
                preview: true,
            })
        }
        const totalQuestions = await prisma.question.count()

        const byQuestionBank = await prisma.$queryRaw<
            Array<{ id: string; name: string; count: number }>
        >`
            SELECT "QB"."id", "QB"."name", CAST(COUNT("Q"."id") AS INTEGER) as "count"
            FROM "khao-thi"."QuestionBank" "QB"
            JOIN "khao-thi"."Question" "Q" ON "Q"."questionBankId" = "QB"."id"
            GROUP BY "QB"."id", "QB"."name"
        `

        const bySubjectVersion = await prisma.$queryRaw<
            Array<{ id: string; name: string; count: number }>
        >`
            SELECT "SV"."id", "SV"."name", CAST(COUNT("Q"."id") AS INTEGER) as "count"
            FROM "ql-dao-tao"."SubjectVersion" "SV"
            JOIN "khao-thi"."QuestionBank" "QB" ON "QB"."subjectVersionId" = "SV"."id"
            JOIN "khao-thi"."Question" "Q" ON "Q"."questionBankId" = "QB"."id"
            GROUP BY "SV"."id", "SV"."name"
        `

        const byDifficulty = await prisma.$queryRaw<
            Array<{ id: string; name: string; count: number }>
        >`
            SELECT "D"."id", "D"."name", CAST(COUNT("Q"."id") AS INTEGER) as "count"
            FROM "khao-thi"."Difficulty" "D"
            JOIN "khao-thi"."Question" "Q" ON "Q"."difficultyId" = "D"."id"
            GROUP BY "D"."id", "D"."name"
        `

        const byKnowledgeBlock = await prisma.$queryRaw<
            Array<{ id: string; name: string; count: number }>
        >`
            SELECT "KB"."id", "KB"."name", CAST(COUNT("Q"."id") AS INTEGER) as "count"
            FROM "khao-thi"."KnowledgeBlock" "KB"
            JOIN "khao-thi"."Question" "Q" ON "Q"."knowledgeBlockId" = "KB"."id"
            GROUP BY "KB"."id", "KB"."name"
        `

        return c.json({
            data: [
                {
                    totalQuestions,
                    byQuestionBank,
                    bySubjectVersion,
                    byDifficulty,
                    byKnowledgeBlock,
                    byQuestionBankLabels: ['ID', 'Tên', 'Số lượng'],
                    bySubjectVersionLabels: ['ID', 'Tên', 'Số lượng'],
                    byDifficultyLabels: ['ID', 'Tên', 'Số lượng'],
                    byKnowledgeBlockLabels: ['ID', 'Tên', 'Số lượng'],
                },
            ],
            count: 1,
            summary: {},
            preview: false,
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/highest-incorrect-answer-rate-questions',
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
                description: 'Danh sách câu hỏi có tỷ lệ trả lời sai cao nhất',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    questionId: z.string(),
                                    content: z.string(),
                                    incorrectRate: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                questionId: faker.string.uuid(),
                content: faker.lorem.sentence(),
                incorrectRate: faker.number.float({ min: 50, max: 100, fractionDigits: 2 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Câu hỏi', 'Nội dung', 'Tỉ lệ sai'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ questionId: string; content: string; incorrectRate: number }>
        >`
            SELECT
                "Q"."id" as "questionId",
                "Q"."content",
                (CAST(SUM(CASE WHEN "A"."isCorrect" = false THEN 1 ELSE 0 END) AS REAL) / COUNT("A"."id")) * 100 as "incorrectRate"
            FROM "khao-thi"."Question" "Q"
            JOIN "khao-thi"."Answer" "A" ON "A"."questionId" = "Q"."id"
            GROUP BY "Q"."id", "Q"."content"
            ORDER BY "incorrectRate" DESC
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Câu hỏi', 'Nội dung', 'Tỉ lệ sai'],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/most-used-questions',
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
                description: 'Danh sách câu hỏi được sử dụng nhiều nhất trong các kỳ thi',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    questionId: z.string(),
                                    content: z.string(),
                                    usageCount: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 10 }, () => ({
                questionId: faker.string.uuid(),
                content: faker.lorem.sentence(),
                usageCount: faker.number.int({ min: 5, max: 20 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Câu hỏi', 'Nội dung', 'Lần sử dụng'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{ questionId: string; content: string; usageCount: number }>
        >`
            SELECT
                "Q"."id" as "questionId",
                "Q"."content",
                CAST(COUNT("EBQ"."id") AS INTEGER) as "usageCount"
            FROM "khao-thi"."Question" "Q"
            JOIN "khao-thi"."ExamBankQuestion" "EBQ" ON "EBQ"."questionId" = "Q"."id"
            GROUP BY "Q"."id", "Q"."content"
            ORDER BY "usageCount" DESC
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['ID Câu hỏi', 'Nội dung', 'Lần sử dụng'],
        })
    }
)

// Trưởng phòng Hồ sơ
app.openapi(
    createRoute({
        method: 'post',
        path: '/demographics',
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
                description: 'Phân bổ HV/SV',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    byGender: z.array(
                                        z.object({ name: z.string(), count: z.number() })
                                    ),
                                    byEthnicity: z.array(
                                        z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            count: z.number(),
                                        })
                                    ),
                                    byReligion: z.array(
                                        z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            count: z.number(),
                                        })
                                    ),
                                    byProvince: z.array(
                                        z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            count: z.number(),
                                        })
                                    ),
                                    byGenderLabels: z.array(z.string()),
                                    byEthnicityLabels: z.array(z.string()),
                                    byReligionLabels: z.array(z.string()),
                                    byProvinceLabels: z.array(z.string()),
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
        if (preview) {
            const byGender = [
                { name: 'Nam', count: faker.number.int({ min: 4000, max: 6000 }) },
                { name: 'Nữ', count: faker.number.int({ min: 3000, max: 5000 }) },
            ]
            const byEthnicity = Array.from({ length: 10 }, () => ({
                id: faker.string.uuid(),
                name: faker.person.bio(),
                count: faker.number.int({ min: 10, max: 500 }),
            }))
            const byReligion = Array.from({ length: 5 }, () => ({
                id: faker.string.uuid(),
                name: faker.person.bio(),
                count: faker.number.int({ min: 100, max: 2000 }),
            }))
            const byProvince = Array.from({ length: 63 }, () => ({
                id: faker.string.uuid(),
                name: faker.location.state(),
                count: faker.number.int({ min: 10, max: 200 }),
            }))
            return c.json({
                data: [
                    {
                        byGender,
                        byEthnicity,
                        byReligion,
                        byProvince,
                        byGenderLabels: ['Tên', 'Số lượng'],
                        byEthnicityLabels: ['ID', 'Tên', 'Số lượng'],
                        byReligionLabels: ['ID', 'Tên', 'Số lượng'],
                        byProvinceLabels: ['ID', 'Tên', 'Số lượng'],
                    },
                ],
                count: 1,
                summary: {},
                preview: true,
            })
        }
        const byGender = await prisma.$queryRaw<Array<{ name: string; count: number }>>`
            SELECT "sTen" as "name", CAST(COUNT("S"."id") AS INTEGER) as "count"
            FROM "mta"."DM_GioiTinh" "G"
            JOIN "ql-nguoi-dung"."UserProfile" "UP" ON "G"."Id" = "UP"."genderId"
            JOIN "ql-dao-tao"."Student" "S" ON "UP"."id" = "S"."userProfileId"
            GROUP BY "G"."sTen"
        `

        const byEthnicity = await prisma.$queryRaw<
            Array<{ id: string; name: string; count: number }>
        >`
            SELECT "D"."Id" as "id", "D"."sTen" as "name", CAST(COUNT("UP"."id") AS INTEGER) as "count"
            FROM "ql-nguoi-dung"."UserProfile" "UP"
            JOIN "mta"."DM_DanToc" "D" ON "D"."Id" = "UP"."ethnicityId"
            WHERE "UP"."ethnicityId" IS NOT NULL
            GROUP BY "D"."Id", "D"."sTen"
        `

        const byReligion = await prisma.$queryRaw<
            Array<{ id: string; name: string; count: number }>
        >`
            SELECT "R"."Id" as "id", "R"."sTen" as "name", CAST(COUNT("UP"."id") AS INTEGER) as "count"
            FROM "ql-nguoi-dung"."UserProfile" "UP"
            JOIN "mta"."DM_TonGiao" "R" ON "R"."Id" = "UP"."religionId"
            WHERE "UP"."religionId" IS NOT NULL
            GROUP BY "R"."Id", "R"."sTen"
        `

        const byProvince = await prisma.$queryRaw<
            Array<{ id: string; name: string; count: number }>
        >`
            SELECT "P"."Id" as "id", "P"."sTen" as "name", CAST(COUNT("UP"."id") AS INTEGER) as "count"
            FROM "ql-nguoi-dung"."UserProfile" "UP"
            JOIN "mta"."DM_Tinh" "P" ON "P"."Id" = "UP"."provinceHometownId"
            WHERE "UP"."provinceHometownId" IS NOT NULL
            GROUP BY "P"."Id", "P"."sTen"
        `

        return c.json({
            data: [
                {
                    byGender,
                    byEthnicity,
                    byReligion,
                    byProvince,
                    byGenderLabels: ['Tên', 'Số lượng'],
                    byEthnicityLabels: ['ID', 'Tên', 'Số lượng'],
                    byReligionLabels: ['ID', 'Tên', 'Số lượng'],
                    byProvinceLabels: ['ID', 'Tên', 'Số lượng'],
                },
            ],
            count: 1,
            summary: {},
            preview: false,
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/enrollment-trend',
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
                description: 'Xu hướng tuyển sinh',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    year: z.number(),
                                    majorId: z.string(),
                                    majorName: z.string(),
                                    courseId: z.string(),
                                    courseName: z.string(),
                                    count: z.number(),
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
        if (preview) {
            const data = Array.from({ length: 20 }, () => ({
                year: faker.number.int({ min: 2020, max: 2024 }),
                majorId: faker.string.uuid(),
                majorName: faker.commerce.department(),
                courseId: faker.string.uuid(),
                courseName: `Khoá ${faker.number.int({ min: 50, max: 60 })}`,
                count: faker.number.int({ min: 100, max: 500 }),
            }))
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['Năm', 'ID Ngành', 'Tên ngành', 'ID Khoá', 'Tên khoá', 'Số lượng'],
            })
        }
        const data = await prisma.$queryRaw<
            Array<{
                year: number
                majorId: string
                majorName: string
                courseId: string
                courseName: string
                count: number
            }>
        >`
            SELECT
                EXTRACT(YEAR FROM "S"."createdAt") as "year",
                "TM"."id" as "majorId",
                "TM"."name" as "majorName",
                "TC"."id" as "courseId",
                "TC"."name" as "courseName",
                CAST(COUNT("S"."id") AS INTEGER) as "count"
            FROM "ql-dao-tao"."Student" "S"
            JOIN "ql-dao-tao"."FixedClass" "FC" ON "FC"."id" = "S"."fixedClassId"
            JOIN "ql-dao-tao"."TrainingCourse" "TC" ON "TC"."id" = "FC"."trainingCourseId"
            JOIN "ql-dao-tao"."CurriculumVersion" "CV" ON "CV"."id" = "FC"."curriculumVersionId"
            JOIN "ql-dao-tao"."TrainingMajor" "TM" ON "TM"."id" = "CV"."trainingMajorId"
            WHERE "S"."createdAt" IS NOT NULL
            GROUP BY "year", "majorId", "majorName", "courseId", "courseName"
            ORDER BY "year" DESC
        `
        return c.json({
            data,
            count: data.length,
            summary: {},
            preview: false,
            labels: ['Năm', 'ID Ngành', 'Tên ngành', 'ID Khoá', 'Tên khoá', 'Số lượng'],
        })
    }
)

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

app.openapi(
    createRoute({
        method: 'post',
        path: '/science-technology-overview',
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
                description: 'Tổng quan KHCN',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
                                    count: z.number(),
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
        const data = [
            { name: 'Tổng số bài báo', count: 450 },
            { name: 'Tổng số đề tài', count: 45 },
            { name: 'Sáng kiến cải tiến kỹ thuật', count: 250 },
            { name: 'Hợp đồng dịch vụ KHCN', count: 20 },
        ]
        if (preview) {
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['Danh mục', 'Số lượng'],
            })
        }

        return c.json(
            {
                data,
                count: data.length,
                summary: {},
                preview,
                labels: ['Danh mục', 'Số lượng'],
            },
            200
        )
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/contract-statistics-by-year',
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
                description: 'Thống kê hợp đồng dịch vụ KHCN theo năm',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    id: z.string(),
                                    name: z.string(),
                                    count: z.number(),
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

        const startYear = 2020
        const currentYear = new Date().getFullYear()

        const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i)

        const data = years.map((year) => ({
            id: year.toString(),
            name: `Năm ${year}`,
            count: Math.round(Math.random() * 100),
        }))
        if (preview) {
            return c.json(
                {
                    data,
                    count: data.length,
                    summary: {},
                    preview: true,
                    labels: ['ID Năm', 'Năm', 'Số lượng'],
                },
                200
            )
        }
        return c.json(
            {
                data,
                count: data.length,
                summary: {},
                preview,
                labels: ['ID Năm', 'Năm', 'Số lượng'],
            },
            200
        )
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/project-statistics-by-year',
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
                description: 'Thống kê đề tài theo năm',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    id: z.string(),
                                    name: z.string(),
                                    count: z.number(),
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

        const startYear = 2020
        const currentYear = new Date().getFullYear()

        const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i)

        const data = years.map((year) => ({
            id: year.toString(),
            name: `Năm ${year}`,
            count: Math.round(Math.random() * 100),
        }))
        if (preview) {
            return c.json(
                {
                    data,
                    count: data.length,
                    summary: {},
                    preview: true,
                    labels: ['ID Năm', 'Năm', 'Số lượng'],
                },
                200
            )
        }
        return c.json(
            {
                data,
                count: data.length,
                summary: {},
                preview,
                labels: ['ID Năm', 'Năm', 'Số lượng'],
            },
            200
        )
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/innovations-statistics-by-year',
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
                description: 'Thống kê sáng kiến theo năm',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    id: z.string(),
                                    name: z.string(),
                                    count: z.number(),
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

        const startYear = 2020
        const currentYear = new Date().getFullYear()

        const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i)

        const data = years.map((year) => ({
            id: year.toString(),
            name: `Năm ${year}`,
            count: Math.round(Math.random() * 100),
        }))
        if (preview) {
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Năm', 'Năm', 'Số lượng'],
            })
        }
        return c.json(
            {
                data,
                count: data.length,
                summary: {},
                preview,
                labels: ['ID Năm', 'Năm', 'Số lượng'],
            },
            200
        )
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/articles-statistics-by-year',
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
                description: 'Thống kê các bài báo theo năm',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    id: z.string(),
                                    name: z.string(),
                                    count: z.number(),
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

        const startYear = 2020
        const currentYear = new Date().getFullYear()

        const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i)

        const data = years.map((year) => ({
            id: year.toString(),
            name: `Năm ${year}`,
            count: Math.round(Math.random() * 100),
        }))
        if (preview) {
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['ID Năm', 'Năm', 'Số lượng'],
            })
        }
        return c.json(
            {
                data,
                count: data.length,
                summary: {},
                preview,
                labels: ['ID Năm', 'Năm', 'Số lượng'],
            },
            200
        )
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/final-exam-info',
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
                description: 'Thông tin tổ chức thi kết thúc học phần',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
                                    count: z.number(),
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
        const data = [
            { name: 'Đề thi đã duyệt', count: 120 },
            { name: 'Học viên tham dự', count: 750 },
            { name: 'Nhập điểm', count: 350 },
        ]
        if (preview) {
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['Danh mục', 'Số lượng'],
            })
        }
        return c.json(
            { data, count: data.length, summary: {}, preview, labels: ['Danh mục', 'Số lượng'] },
            200
        )
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/exam-info-by-day',
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
                description: 'Thông tin thi theo ngày',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
                                    count: z.number(),
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
        const data = [
            { name: 'Ca thi', count: 120 },
            { name: 'Học phần', count: 450 },
            { name: 'Học viên', count: 600 },
            { name: 'Phòng thi', count: 300 },
            { name: 'Giám thị', count: 300 },
        ]
        if (preview) {
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['Danh mục', 'Số lượng'],
            })
        }
        return c.json(
            { data, count: data.length, summary: {}, preview, labels: ['Danh mục', 'Số lượng'] },
            200
        )
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/final-exam-result',
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
                description: 'Tổng quan kết quả thi kết thúc học phần của học viện',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
                                    count: z.number(),
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
        const data = [
            { name: 'Lượt thi', count: 21234 },
            { name: 'Học phần', count: 150 },
            { name: 'Tiến độ nhập điểm', count: 100 },
            { name: 'Tỷ lệ vắng thi', count: 10 },
            { name: 'Vi phạm quy chế', count: 6300 },
            { name: 'Phúc khảo', count: 52 },
        ]
        if (preview) {
            return c.json({
                data,
                count: data.length,
                summary: {},
                preview: true,
                labels: ['Danh mục', 'Số lượng'],
            })
        }
        return c.json(
            { data, count: data.length, summary: {}, preview, labels: ['Danh mục', 'Số lượng'] },
            200
        )
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/trends-in-academic-results-by-year',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().optional().default(false),
                            year: z.number().min(2000).max(new Date().getFullYear()).optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Xu hướng kết quả học tập theo năm',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
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
        const { preview } = c.req.valid('json')
        if (preview) {
            const labels = ['2021-2022', '2022-2023', '2023-2024', '2024-2025']
            const rawData = [
                { name: 'Giỏi', data: [120, 135, 140, 150] },
                { name: 'Khá', data: [200, 210, 220, 230] },
                { name: 'Trung bình', data: [150, 160, 170, 180] },
                { name: 'Không đạt', data: [30, 25, 20, 15] },
            ]
            const totals = labels.map((_, yearIndex) =>
                rawData.reduce((sum, category) => sum + (category?.data?.[yearIndex] ?? 0), 0)
            )
            const data = rawData.map((category) => ({
                name: category.name,
                data: (category.data ?? []).map((value, yearIndex) => {
                    const total = totals[yearIndex]
                    if (!total || total === 0) return 0

                    return Math.round((value / total) * 100 * 100) / 100
                }),
            }))
            const summary = { totalYears: labels.length, totalCategories: data.length }
            const count = rawData.reduce(
                (sum, item) => sum + item.data.reduce((a, b) => a + b, 0),
                0
            )
            return c.json({
                summary,
                count,
                preview: true,
                labels,
                data,
            })
        }

        return c.json({
            summary: {},
            count: 0,
            preview:false,
            labels: [],
            data: [],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/student-count-by-academic-results',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().optional().default(false),
                            year: z.number().min(2000).max(new Date().getFullYear()).optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Thống kê số lượng học viên/sinh viên theo kết quả học phần',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
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
        const { preview } = c.req.valid('json')
        if (preview) {
            const labels = ['HK1-2023', 'HK2-2023', 'HK1-2024', 'HK2-2024']
            const rawData = [
                { name: 'Giỏi', data: [100, 110, 120, 130] },
                { name: 'Khá', data: [200, 210, 220, 230] },
                { name: 'TB', data: [150, 160, 170, 180] },
                { name: 'Không đạt', data: [50, 40, 30, 25] },
            ]
            const data = rawData
            const summary = { totalSemesters: labels.length, totalCategories: data.length }
            const count = rawData.reduce(
                (sum, item) => sum + item.data.reduce((a, b) => a + b, 0),
                0
            )
            return c.json({
                summary,
                count,
                preview: true,
                labels,
                data,
            })
        }
        return c.json({
            summary: {},
            count: 0,
            preview: false,
            labels: [],
            data: [],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/subject-pass-fail-rates',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().optional().default(false),
                            limit: z.number().min(1).max(50).optional().default(10),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Tỷ lệ % sinh viên qua môn/rớt môn của các học phần',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
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
        const { preview, limit } = c.req.valid('json')
        if (preview) {
            const subjects = [
                { name: 'Toán Cao Cấp', passRate: 85, failRate: 15 },
                { name: 'Lập Trình Java', passRate: 80, failRate: 20 },
                { name: 'Cơ Sở Dữ Liệu', passRate: 78, failRate: 22 },
                { name: 'Mạng Máy Tính', passRate: 75, failRate: 25 },
                { name: 'Hệ Điều Hành', passRate: 72, failRate: 28 },
                { name: 'Công Nghệ Web', passRate: 70, failRate: 30 },
                { name: 'An Toàn Thông Tin', passRate: 68, failRate: 32 },
                { name: 'Trí Tuệ Nhân Tạo', passRate: 65, failRate: 35 },
                { name: 'Phân Tích Thiết Kế', passRate: 60, failRate: 40 },
                { name: 'Kỹ Thuật Phần Mềm', passRate: 55, failRate: 45 },
                { name: 'Đồ Họa Máy Tính', passRate: 50, failRate: 50 },
                { name: 'Lý Thuyết Thông Tin', passRate: 45, failRate: 55 },
            ]
            const sortedSubjects = subjects.sort((a, b) => b.passRate - a.passRate).slice(0, limit)
            const labels = sortedSubjects.map((s) => s.name)
            const data = [
                { name: 'Qua môn (%)', data: sortedSubjects.map((s) => s.passRate) },
                { name: 'Trượt môn (%)', data: sortedSubjects.map((s) => s.failRate) },
            ]
            const summary = { totalSubjects: sortedSubjects.length, limit }
            const count = sortedSubjects.reduce((sum, s) => sum + s.passRate + s.failRate, 0) / 2

            return c.json({
                summary,
                count,
                preview: true,
                labels,
                data,
            })
        }

        return c.json({
            summary: {},
            count: 0,
            preview: false,
            labels: [],
            data: [],
        })
    }
)

app.openapi(
    createRoute({
        method: 'post',
        path: '/subjects-high-fail-rates',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().optional().default(false),
                            limit: z.number().min(1).max(50).optional().default(10),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Danh sách học phần có tỉ lệ trượt cao',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
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
        const { preview, limit } = c.req.valid('json')
        if (preview) {
            const subjects = [
                { name: 'Lý Thuyết Thông Tin', failRate: 55 },
                { name: 'Đồ Họa Máy Tính', failRate: 50 },
                { name: 'Kỹ Thuật Phần Mềm', failRate: 45 },
                { name: 'Phân Tích Thiết Kế', failRate: 40 },
                { name: 'Trí Tuệ Nhân Tạo', failRate: 35 },
                { name: 'An Toàn Thông Tin', failRate: 32 },
                { name: 'Công Nghệ Web', failRate: 30 },
                { name: 'Hệ Điều Hành', failRate: 28 },
                { name: 'Mạng Máy Tính', failRate: 25 },
                { name: 'Cơ Sở Dữ Liệu', failRate: 22 },
                { name: 'Lập Trình Java', failRate: 20 },
                { name: 'Toán Cao Cấp', failRate: 15 },
            ]
            const sortedSubjects = subjects.sort((a, b) => b.failRate - a.failRate).slice(0, limit)
            const labels = sortedSubjects.map((s) => s.name)
            const data = [{ name: 'Trượt môn (%)', data: sortedSubjects.map((s) => s.failRate) }]
            const summary = { totalSubjects: sortedSubjects.length, limit }
            const count = sortedSubjects.reduce((sum, s) => sum + s.failRate, 0)

            return c.json({
                summary,
                count,
                preview: true,
                labels,
                data,
            })
        }

        return c.json({
            summary: {},
            count: 0,
            preview: false,
            labels: [],
            data: [],
        })
    }
)
app.openapi(
    createRoute({
        method: 'post',
        path: '/subjects-high-absent-students',
        tags: ['Stats'],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            preview: z.boolean().optional().default(false),
                            limit: z.number().min(1).max(50).optional().default(10),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Học phần có sinh viên vắng thi cao',
                content: {
                    'application/json': {
                        schema: StatBaseSchema.extend({
                            data: z.array(
                                z.object({
                                    name: z.string(),
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
        const { preview, limit } = c.req.valid('json')
        if (preview) {
            const subjects = [
                { name: 'Trí Tuệ Nhân Tạo', absentCount: 140, totalStudents: 200 },
                { name: 'Hệ Điều Hành', absentCount: 120, totalStudents: 180 },
                { name: 'Lý Thuyết Thông Tin', absentCount: 100, totalStudents: 150 },
                { name: 'Mạng Máy Tính', absentCount: 90, totalStudents: 140 },
                { name: 'Lập Trình Java', absentCount: 80, totalStudents: 130 },
                { name: 'Kỹ Thuật Phần Mềm', absentCount: 70, totalStudents: 120 },
                { name: 'Cơ Sở Dữ Liệu', absentCount: 60, totalStudents: 110 },
                { name: 'An Toàn Thông Tin', absentCount: 50, totalStudents: 100 },
                { name: 'Đồ Họa Máy Tính', absentCount: 40, totalStudents: 90 },
                { name: 'Toán Cao Cấp', absentCount: 30, totalStudents: 80 },
                { name: 'Công Nghệ Web', absentCount: 20, totalStudents: 70 },
                { name: 'Phân Tích Thiết Kế', absentCount: 10, totalStudents: 60 },
            ]
            const sortedSubjects = subjects.sort((a, b) => b.absentCount - a.absentCount).slice(0, limit)
            const labels = sortedSubjects.map(s => s.name)
            const countData = sortedSubjects.map(s => s.absentCount)
            const percentData = sortedSubjects.map(s => Math.round((s.absentCount / s.totalStudents) * 100 * 100) / 100)
            const data = [
                { name: 'Vắng thi (số lượng)', data: countData },
                { name: 'Vắng thi (%)', data: percentData },
            ]
            const summary = { totalSubjects: sortedSubjects.length, limit }
            const count = sortedSubjects.reduce((sum, s) => sum + s.absentCount, 0)
      
            return c.json({
                summary,
                count,
                preview: true,
                labels,
                data,
            })
        }

        return c.json({
            summary: {},
            count: 0,
            preview: false,
            labels: [],
            data: [],
        })
    }
)
export default app
