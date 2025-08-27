import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { $Enums, type AcademicActionType, Prisma } from '@workspace/db'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

// Ban Giám đốc (BGĐ)
app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-object-type',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Phân bổ theo Hệ đào tạo',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingObjectTypeId: z.string(),
                                name: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-level',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Phân bổ theo Trình độ đào tạo',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingLevelId: z.string(),
                                name: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-course',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Phân bổ theo Khoá học',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingCourseId: z.string(),
                                name: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-entry-score-by-course',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Điểm trúng tuyển trung bình qua các Khoá',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingCourseId: z.string(),
                                name: z.string(),
                                avgEntryScore: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-gpa-by-course',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Điểm GPA tích lũy trung bình của sinh viên tốt nghiệp qua các Khoá',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingCourseId: z.string(),
                                name: z.string(),
                                avgGpa: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/graduation-rate-by-course',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Tỷ lệ tốt nghiệp',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingCourseId: z.string(),
                                name: z.string(),
                                graduationRate: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/academic-performance-by-year',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Thống kê kết quả học tập toàn Học viện',
                content: {
                    'application/json': {
                        schema: z.array(
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
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/kpi-cards',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Các con số tổng quan',
                content: {
                    'application/json': {
                        schema: z.object({
                            totalStudents: z.number(),
                            totalLecturers: z.number(),
                            studentLecturerRatio: z.number(),
                            activeCurricula: z.number(),
                            academicWarningRate: z.number(),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
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
            totalStudents,
            totalLecturers,
            studentLecturerRatio: totalLecturers > 0 ? totalStudents / totalLecturers : 0,
            activeCurricula,
            academicWarningRate:
                totalStudents > 0 ? (academicWarningStudents / totalStudents) * 100 : 0,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-province',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Phân bổ địa lý của sinh viên',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                provinceId: z.string(),
                                name: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

// Trưởng phòng Đào tạo
app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-object-type-filtered',
        tags: ['Stats'],
        request: {
            query: z.object({
                managementOrganizationId: z
                    .string()
                    .uuid()
                    .describe('DM_DonVi.Id - ID đơn vị quản lý'),
            }),
        },
        responses: {
            200: {
                description: 'Phân bổ theo Hệ đào tạo (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingObjectTypeId: z.string(),
                                name: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.valid('query')

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

        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-level-filtered',
        tags: ['Stats'],
        request: {
            query: z.object({
                managementOrganizationId: z
                    .string()
                    .uuid()
                    .describe('DM_DonVi.Id - ID đơn vị quản lý'),
            }),
        },
        responses: {
            200: {
                description: 'Phân bổ theo Trình độ đào tạo (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingLevelId: z.string(),
                                name: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.valid('query')

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

        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-course-filtered',
        tags: ['Stats'],
        request: {
            query: z.object({
                managementOrganizationId: z
                    .string()
                    .uuid()
                    .describe('DM_DonVi.Id - ID đơn vị quản lý'),
            }),
        },
        responses: {
            200: {
                description: 'Phân bổ theo Khoá học (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingCourseId: z.string(),
                                name: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.valid('query')

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

        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-entry-score-by-course-filtered',
        tags: ['Stats'],
        request: {
            query: z.object({
                managementOrganizationId: z
                    .string()
                    .uuid()
                    .describe('DM_DonVi.Id - ID đơn vị quản lý'),
            }),
        },
        responses: {
            200: {
                description: 'Điểm trúng tuyển trung bình qua các Khoá (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingCourseId: z.string(),
                                name: z.string(),
                                avgEntryScore: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.valid('query')

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

        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-gpa-by-course-filtered',
        tags: ['Stats'],
        request: {
            query: z.object({
                managementOrganizationId: z
                    .string()
                    .uuid()
                    .describe('DM_DonVi.Id - ID đơn vị quản lý'),
            }),
        },
        responses: {
            200: {
                description:
                    'Điểm GPA tích lũy trung bình của sinh viên tốt nghiệp qua các Khoá (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingCourseId: z.string(),
                                name: z.string(),
                                avgGpa: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.valid('query')

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

        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/graduation-rate-by-course-filtered',
        tags: ['Stats'],
        request: {
            query: z.object({
                managementOrganizationId: z
                    .string()
                    .uuid()
                    .describe('DM_DonVi.Id - ID đơn vị quản lý'),
            }),
        },
        responses: {
            200: {
                description: 'Tỷ lệ tốt nghiệp (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingCourseId: z.string(),
                                name: z.string(),
                                graduationRate: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.valid('query')

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

        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/academic-performance-by-year-filtered',
        tags: ['Stats'],
        request: {
            query: z.object({
                managementOrganizationId: z
                    .string()
                    .uuid()
                    .describe('DM_DonVi.Id - ID đơn vị quản lý'),
            }),
        },
        responses: {
            200: {
                description: 'Thống kê kết quả học tập toàn Học viện (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
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
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.valid('query')

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

        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-province-filtered',
        tags: ['Stats'],
        request: {
            query: z.object({
                managementOrganizationId: z
                    .string()
                    .uuid()
                    .describe('DM_DonVi.Id - ID đơn vị quản lý'),
            }),
        },
        responses: {
            200: {
                description: 'Phân bổ địa lý của sinh viên (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                provinceId: z.string(),
                                name: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.valid('query')

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

        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/students-of-interest',
        tags: ['Stats'],
        request: {
            query: z.object({
                warningLevel: z.string().optional(),
                debtCredits: z.string().optional(),
                gpaThreshold: z.string().optional(),
            }),
        },
        responses: {
            200: {
                description: 'Danh sách SV cần quan tâm',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                id: z.string(),
                                name: z.string(),
                                academicWarningLevel: z.number(),
                                cumulativeDebtCredits: z.number(),
                                gpa: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { warningLevel, debtCredits, gpaThreshold } = c.req.valid('query')

        const conditions = []
        if (warningLevel) {
            conditions.push(
                Prisma.sql`"S"."academicWarningLevel" > ${Number.parseInt(warningLevel)}`
            )
        }
        if (debtCredits) {
            conditions.push(
                Prisma.sql`"SSR"."cumulativeDebtCredits" > ${Number.parseInt(debtCredits)}`
            )
        }
        if (gpaThreshold) {
            conditions.push(
                Prisma.sql`"SSR"."cumulativeGpaBase10" < ${Number.parseFloat(gpaThreshold)}`
            )
        }

        if (conditions.length === 0) {
            return c.json([])
        }

        const where = Prisma.join(conditions, ' OR ')

        const students = await prisma.$queryRaw<
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

        return c.json(students)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-gpa-by-fixed-class',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Điểm GPA trung bình theo Lớp niên chế',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                fixedClassId: z.string(),
                                name: z.string(),
                                avgGpa: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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

        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-gpa-by-training-major',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Điểm GPA trung bình theo Ngành',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                trainingMajorId: z.string(),
                                name: z.string(),
                                avgGpa: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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
        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/subject-pass-fail-rate',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Tỷ lệ % sinh viên qua môn/rớt môn của các học phần',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                subjectVersionId: z.string(),
                                name: z.string(),
                                passed: z.number(),
                                failed: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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
        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/curriculum-statistics',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Thống kê CTĐT',
                content: {
                    'application/json': {
                        schema: z.object({
                            activeCurricula: z.number(),
                            activeCurriculumVersions: z.number(),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
            Array<{ activeCurricula: bigint; activeCurriculumVersions: bigint }>
        >`
            SELECT
                (SELECT COUNT(*) FROM "ql-dao-tao"."Curriculum" WHERE "active" = true) AS "activeCurricula",
                (SELECT COUNT(*) FROM "ql-dao-tao"."CurriculumVersion" WHERE "active" = true) AS "activeCurriculumVersions"
        `
        const { activeCurricula, activeCurriculumVersions } = result[0]!
        return c.json({
            activeCurricula: Number(activeCurricula),
            activeCurriculumVersions: Number(activeCurriculumVersions),
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/subject-class-statistics',
        tags: ['Stats'],
        request: {
            query: z.object({
                semesterId: z.string().describe('Semester.id - ID học kỳ'),
            }),
        },
        responses: {
            200: {
                description: 'Thống kê Lớp học phần',
                content: {
                    'application/json': {
                        schema: z.object({
                            totalClasses: z.number(),
                            classes: z.array(
                                z.object({
                                    id: z.string(),
                                    name: z.string(),
                                    fillRate: z.number(),
                                    failureRate: z.number(),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { semesterId } = c.req.valid('query')

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
            totalClasses: classes.length,
            classes,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/lecturer-workload',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Tải giảng dạy của Giảng viên',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                lecturerId: z.string(),
                                name: z.string(),
                                classCount: z.number(),
                                totalPeriods: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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
        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/graduation-ranking-statistics',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Thống kê xếp hạng tốt nghiệp',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                ranking: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<Array<{ ranking: string; count: number }>>`
            SELECT
                "AR"."classification" as "ranking",
                CAST(COUNT("S"."id") AS INTEGER) as "count"
            FROM "ql-dao-tao"."Student" "S"
            JOIN "ql-dao-tao"."GraduationDecision" "GD" ON "GD"."studentId" = "S"."id"
            JOIN "ql-dao-tao"."AcademicRankingConvert" "AR" ON "AR"."id" = "GD"."finalRankingId"
            GROUP BY "AR"."classification"
        `
        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/students-for-academic-action',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Danh sách SV bị đề nghị xử lý',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                studentId: z.string(),
                                studentName: z.string(),
                                actionType: z.nativeEnum($Enums.AcademicActionType),
                                reason: z.string(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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
        return c.json(result)
    }
)

// Trưởng phòng Khảo thí
app.openapi(
    createRoute({
        method: 'get',
        path: '/exam-participants-by-semester',
        tags: ['Stats'],
        request: {
            query: z.object({
                semesterId: z.string().describe('Semester.id - ID học kỳ'),
            }),
        },
        responses: {
            200: {
                description: 'Tổng số lượt sinh viên dự thi trong học kỳ',
                content: {
                    'application/json': {
                        schema: z.object({
                            totalParticipants: z.number(),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { semesterId } = c.req.valid('query')

        const result = await prisma.$queryRaw<Array<{ totalParticipants: bigint }>>`
            SELECT COUNT("ES"."id") as "totalParticipants"
            FROM "khao-thi"."ExamSession" "ES"
            JOIN "khao-thi"."Exam" "E" ON "E"."id" = "ES"."examId"
            JOIN "ql-dao-tao"."SubjectClass" "SC" ON "SC"."examId" = "E"."id"
            WHERE "SC"."semesterId" = ${semesterId}
        `
        const totalParticipants = Number(result[0]?.totalParticipants)
        return c.json({ totalParticipants })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-exam-score-trend',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Điểm thi trung bình của các học phần qua các học kỳ',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                semesterId: z.string(),
                                semesterName: z.string(),
                                subjectVersionId: z.string(),
                                subjectName: z.string(),
                                averageScore: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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
        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/question-statistics',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Thống kê câu hỏi',
                content: {
                    'application/json': {
                        schema: z.object({
                            totalQuestions: z.number(),
                            byQuestionBank: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                            bySubjectVersion: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                            byDifficulty: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                            byKnowledgeBlock: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
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
            totalQuestions,
            byQuestionBank,
            bySubjectVersion,
            byDifficulty,
            byKnowledgeBlock,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/highest-incorrect-answer-rate-questions',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Danh sách câu hỏi có tỷ lệ trả lời sai cao nhất',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                questionId: z.string(),
                                content: z.string(),
                                incorrectRate: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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
        return c.json(result)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/most-used-questions',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Danh sách câu hỏi được sử dụng nhiều nhất trong các kỳ thi',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                questionId: z.string(),
                                content: z.string(),
                                usageCount: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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
        return c.json(result)
    }
)

// Trưởng phòng Hồ sơ
app.openapi(
    createRoute({
        method: 'get',
        path: '/demographics',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Phân bổ HV/SV',
                content: {
                    'application/json': {
                        schema: z.object({
                            byGender: z.array(z.object({ gender: z.number(), count: z.number() })),
                            byEthnicity: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                            byReligion: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                            byProvince: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const byGender = await prisma.$queryRaw<Array<{ gender: number; count: number }>>`
            SELECT "sTen" as "gender", CAST(COUNT("S"."id") AS INTEGER) as "count"
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
            byGender,
            byEthnicity,
            byReligion,
            byProvince,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/enrollment-trend',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Xu hướng tuyển sinh',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                year: z.number(),
                                majorId: z.string(),
                                majorName: z.string(),
                                courseId: z.string(),
                                courseName: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.$queryRaw<
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
        return c.json(result)
    }
)

export default app
