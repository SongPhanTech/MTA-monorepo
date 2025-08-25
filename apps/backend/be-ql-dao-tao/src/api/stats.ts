import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
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
        const totalStudents = await prisma.student.count({
            where: {
                status: 'ENROLLED',
            },
        })

        const totalLecturers = await prisma.lecturer.count()

        const activeCurricula = await prisma.curriculum.count({
            where: {
                active: true,
            },
        })

        const academicWarningStudents = await prisma.student.count({
            where: {
                academicWarningLevel: {
                    gt: 0,
                },
            },
        })

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
        const result = await prisma.userProfile.groupBy({
            by: ['provinceHometownId'],
            _count: {
                id: true,
            },
            where: {
                provinceHometownId: {
                    not: null,
                },
            },
        })

        const provinceHometownIds = result
            .map((item) => item.provinceHometownId)
            .filter(Boolean) as string[]

        const provinces = await prisma.dM_Tinh.findMany({
            where: {
                Id: {
                    in: provinceHometownIds,
                },
            },
        })

        return c.json(
            result.map((item) => ({
                provinceId: item.provinceHometownId || '',
                name: provinces.find((p) => p.Id === item.provinceHometownId)?.sTen || '',
                count: item._count.id,
            }))
        )
    }
)

// Trưởng phòng Đào tạo
app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-object-type-filtered',
        tags: ['Stats'],
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.student.groupBy({
            by: ['trainingObjectTypeId'],
            _count: {
                id: true,
            },
            where: {
                trainingObjectTypeId: {
                    not: null,
                },
                fixedClass: {
                    managementOrganizationId: managementOrganizationId,
                },
            },
        })

        const trainingObjectTypeIds = result
            .map((item) => item.trainingObjectTypeId)
            .filter(Boolean) as string[]

        const trainingObjectTypes = await prisma.trainingObjectType.findMany({
            where: {
                id: {
                    in: trainingObjectTypeIds,
                },
            },
        })

        return c.json(
            result.map((item) => ({
                trainingObjectTypeId: item.trainingObjectTypeId || '',
                name:
                    trainingObjectTypes.find((t) => t.id === item.trainingObjectTypeId)?.name || '',
                count: item._count.id,
            }))
        )
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-level-filtered',
        tags: ['Stats'],
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.student.groupBy({
            by: ['trainingLevelId'],
            _count: {
                id: true,
            },
            where: {
                trainingLevelId: {
                    not: null,
                },
                fixedClass: {
                    managementOrganizationId: managementOrganizationId,
                },
            },
        })

        const trainingLevelIds = result
            .map((item) => item.trainingLevelId)
            .filter(Boolean) as string[]

        const trainingLevels = await prisma.trainingLevel.findMany({
            where: {
                id: {
                    in: trainingLevelIds,
                },
            },
        })

        return c.json(
            result.map((item) => ({
                trainingLevelId: item.trainingLevelId || '',
                name: trainingLevels.find((t) => t.id === item.trainingLevelId)?.name || '',
                count: item._count.id,
            }))
        )
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-training-course-filtered',
        tags: ['Stats'],
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.fixedClass.groupBy({
            by: ['trainingCourseId'],
            _count: {
                id: true,
            },
            where: {
                trainingCourseId: {
                    not: null,
                },
                managementOrganizationId: managementOrganizationId,
            },
        })

        const trainingCourseIds = result
            .map((item) => item.trainingCourseId)
            .filter(Boolean) as string[]

        const trainingCourses = await prisma.trainingCourse.findMany({
            where: {
                id: {
                    in: trainingCourseIds,
                },
            },
        })

        return c.json(
            result.map((item) => ({
                trainingCourseId: item.trainingCourseId || '',
                name: trainingCourses.find((t) => t.id === item.trainingCourseId)?.name || '',
                count: item._count.id,
            }))
        )
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-entry-score-by-course-filtered',
        tags: ['Stats'],
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.student.groupBy({
            by: ['fixedClassId'],
            _avg: {
                entryScore: true,
            },
            where: {
                fixedClassId: {
                    not: null,
                },
                fixedClass: {
                    managementOrganizationId: managementOrganizationId,
                },
            },
        })

        const fixedClassIds = result.map((item) => item.fixedClassId).filter(Boolean) as string[]

        const fixedClasses = await prisma.fixedClass.findMany({
            where: {
                id: {
                    in: fixedClassIds,
                },
            },
            include: {
                trainingCourse: true,
            },
        })

        const data = result.map((item) => {
            const fixedClass = fixedClasses.find((fc) => fc.id === item.fixedClassId)
            return {
                trainingCourseId: fixedClass?.trainingCourse.id || '',
                name: fixedClass?.trainingCourse.name || '',
                avgEntryScore: item._avg.entryScore || 0,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-gpa-by-course-filtered',
        tags: ['Stats'],
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.studentSemesterResult.groupBy({
            by: ['studentId'],
            _avg: {
                cumulativeGpaBase10: true,
            },
            where: {
                student: {
                    status: 'GRADUATED',
                    fixedClass: {
                        managementOrganizationId: managementOrganizationId,
                    },
                },
            },
        })

        const studentIds = result.map((item) => item.studentId).filter(Boolean) as string[]

        const students = await prisma.student.findMany({
            where: {
                id: {
                    in: studentIds,
                },
            },
            include: {
                fixedClass: {
                    include: {
                        trainingCourse: true,
                    },
                },
            },
        })

        const data = result.map((item) => {
            const student = students.find((s) => s.id === item.studentId)
            return {
                trainingCourseId: student?.fixedClass?.trainingCourse.id || '',
                name: student?.fixedClass?.trainingCourse.name || '',
                avgGpa: Number(item._avg.cumulativeGpaBase10) || 0,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/graduation-rate-by-course-filtered',
        tags: ['Stats'],
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
        const { managementOrganizationId } = c.req.query()
        const graduatedCounts = await prisma.student.groupBy({
            by: ['fixedClassId'],
            _count: {
                id: true,
            },
            where: {
                status: 'GRADUATED',
                fixedClassId: {
                    not: null,
                },
                fixedClass: {
                    managementOrganizationId: managementOrganizationId,
                },
            },
        })

        const totalCounts = await prisma.student.groupBy({
            by: ['fixedClassId'],
            _count: {
                id: true,
            },
            where: {
                fixedClassId: {
                    not: null,
                },
                fixedClass: {
                    managementOrganizationId: managementOrganizationId,
                },
            },
        })

        const fixedClassIds = totalCounts
            .map((item) => item.fixedClassId)
            .filter(Boolean) as string[]

        const fixedClasses = await prisma.fixedClass.findMany({
            where: {
                id: {
                    in: fixedClassIds,
                },
            },
            include: {
                trainingCourse: true,
            },
        })

        const data = totalCounts.map((total) => {
            const graduated = graduatedCounts.find((g) => g.fixedClassId === total.fixedClassId)
            const fixedClass = fixedClasses.find((fc) => fc.id === total.fixedClassId)
            return {
                trainingCourseId: fixedClass?.trainingCourse.id || '',
                name: fixedClass?.trainingCourse.name || '',
                graduationRate: ((graduated?._count.id || 0) / (total._count.id || 1)) * 100,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/academic-performance-by-year-filtered',
        tags: ['Stats'],
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.studentYearResult.groupBy({
            by: ['schoolYearId', 'studentTrainingType'],
            _count: {
                id: true,
            },
            where: {
                student: {
                    fixedClass: {
                        managementOrganizationId: managementOrganizationId,
                    },
                },
            },
        })

        const schoolYearIds = result.map((item) => item.schoolYearId).filter(Boolean) as string[]

        const schoolYears = await prisma.schoolYear.findMany({
            where: {
                id: {
                    in: schoolYearIds,
                },
            },
        })

        const data = schoolYears.map((sy) => {
            const yearResults = result.filter((r) => r.schoolYearId === sy.id)
            return {
                schoolYearId: sy.id,
                name: sy.name,
                excellent:
                    yearResults.find((r) => r.studentTrainingType === 'EXCELLENT')?._count.id || 0,
                good: yearResults.find((r) => r.studentTrainingType === 'GOOD')?._count.id || 0,
                fair: yearResults.find((r) => r.studentTrainingType === 'FAIR')?._count.id || 0,
                average:
                    yearResults.find((r) => r.studentTrainingType === 'AVERAGE')?._count.id || 0,
                weak: yearResults.find((r) => r.studentTrainingType === 'POOR')?._count.id || 0,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/student-distribution-by-province-filtered',
        tags: ['Stats'],
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.userProfile.groupBy({
            by: ['provinceHometownId'],
            _count: {
                id: true,
            },
            where: {
                provinceHometownId: {
                    not: null,
                },
                student: {
                    fixedClass: {
                        managementOrganizationId: managementOrganizationId,
                    },
                },
            },
        })

        const provinceHometownIds = result
            .map((item) => item.provinceHometownId)
            .filter(Boolean) as string[]

        const provinces = await prisma.dM_Tinh.findMany({
            where: {
                Id: {
                    in: provinceHometownIds,
                },
            },
        })

        return c.json(
            result.map((item) => ({
                provinceId: item.provinceHometownId || '',
                name: provinces.find((p) => p.Id === item.provinceHometownId)?.sTen || '',
                count: item._count.id,
            }))
        )
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/students-of-interest',
        tags: ['Stats'],
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
        const { warningLevel, debtCredits, gpaThreshold } = c.req.query()

        const where: any = {
            OR: [],
        }

        if (warningLevel) {
            where.OR.push({ academicWarningLevel: { gt: Number.parseInt(warningLevel) } })
        }

        if (debtCredits) {
            // This requires a join with StudentSemesterResult, which is not straightforward in a single query.
            // For now, we will filter by academicWarningLevel and gpa, and leave debtCredits for a more complex query if needed.
        }

        if (gpaThreshold) {
            // This also requires a join with StudentSemesterResult.
        }

        const students = await prisma.student.findMany({
            where,
            select: {
                id: true,
                userProfile: {
                    select: {
                        fullname: true,
                    },
                },
                academicWarningLevel: true,
                // cumulativeDebtCredits and gpa need to be fetched from StudentSemesterResult
            },
        })

        // This is a simplified version. A more complete implementation would require a more complex query
        // to fetch cumulativeDebtCredits and gpa from the latest StudentSemesterResult for each student.
        const data = students.map((s) => ({
            id: s.id,
            name: s.userProfile.fullname || '',
            academicWarningLevel: s.academicWarningLevel,
            cumulativeDebtCredits: 0, // Placeholder
            gpa: 0, // Placeholder
        }))

        return c.json(data)
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
        const result = await prisma.studentSemesterResult.groupBy({
            by: ['studentId'],
            _avg: {
                gpaBase10: true,
            },
        })

        const studentIds = result.map((item) => item.studentId).filter(Boolean) as string[]

        const students = await prisma.student.findMany({
            where: {
                id: {
                    in: studentIds,
                },
            },
            include: {
                fixedClass: true,
            },
        })

        const data = result.map((item) => {
            const student = students.find((s) => s.id === item.studentId)
            return {
                fixedClassId: student?.fixedClass?.id || '',
                name: student?.fixedClass?.name || '',
                avgGpa: Number(item._avg.gpaBase10) || 0,
            }
        })

        return c.json(data)
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
        const result = await prisma.studentSemesterResult.groupBy({
            by: ['studentId'],
            _avg: {
                gpaBase10: true,
            },
        })

        const studentIds = result.map((item) => item.studentId).filter(Boolean) as string[]

        const students = await prisma.student.findMany({
            where: {
                id: {
                    in: studentIds,
                },
            },
            include: {
                curriculumVersion: {
                    include: {
                        trainingMajor: true,
                    },
                },
            },
        })

        const data = result.map((item) => {
            const student = students.find((s) => s.id === item.studentId)
            return {
                trainingMajorId: student?.curriculumVersion?.trainingMajor.id || '',
                name: student?.curriculumVersion?.trainingMajor.name || '',
                avgGpa: Number(item._avg.gpaBase10) || 0,
            }
        })

        return c.json(data)
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
        const passedCounts = await prisma.studentSubjectScore.groupBy({
            by: ['subjectVersionId'],
            _count: {
                id: true,
            },
            where: {
                finalScore: {
                    gte: 5,
                },
            },
        })

        const failedCounts = await prisma.studentSubjectScore.groupBy({
            by: ['subjectVersionId'],
            _count: {
                id: true,
            },
            where: {
                finalScore: {
                    lt: 5,
                },
            },
        })

        const subjectVersionIds = [
            ...passedCounts.map((p) => p.subjectVersionId),
            ...failedCounts.map((f) => f.subjectVersionId),
        ].filter(Boolean) as string[]

        const subjectVersions = await prisma.subjectVersion.findMany({
            where: {
                id: {
                    in: subjectVersionIds,
                },
            },
        })

        const data = subjectVersions.map((sv) => {
            const passed = passedCounts.find((p) => p.subjectVersionId === sv.id)?._count.id || 0
            const failed = failedCounts.find((f) => f.subjectVersionId === sv.id)?._count.id || 0
            return {
                subjectVersionId: sv.id,
                name: sv.name,
                passed,
                failed,
            }
        })

        return c.json(data)
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
        const activeCurricula = await prisma.curriculum.count({
            where: {
                active: true,
            },
        })

        const activeCurriculumVersions = await prisma.curriculumVersion.count({
            where: {
                active: true,
            },
        })

        return c.json({
            activeCurricula,
            activeCurriculumVersions,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/subject-class-statistics',
        tags: ['Stats'],
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
        const { semesterId } = c.req.query()

        const subjectClasses = await prisma.subjectClass.findMany({
            where: {
                semesterId: semesterId,
            },
            include: {
                subjectClassStudent: true,
            },
        })

        const totalClasses = subjectClasses.length

        const classes = subjectClasses.map((sc) => {
            const fillRate =
                sc.maxStudent > 0 ? (sc.subjectClassStudent.length / sc.maxStudent) * 100 : 0
            const failedStudents = sc.subjectClassStudent.filter(
                (s) => s.finalScore && s.finalScore < 5
            ).length
            const failureRate =
                sc.subjectClassStudent.length > 0
                    ? (failedStudents / sc.subjectClassStudent.length) * 100
                    : 0
            return {
                id: sc.id,
                name: sc.name,
                fillRate: fillRate,
                failureRate: failureRate,
            }
        })

        return c.json({
            totalClasses,
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
                                totalHours: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const lecturers = await prisma.lecturer.findMany({
            include: {
                mainLecturerClasses: {
                    include: {
                        subject: true,
                    },
                },
                extraLecturerClasses: {
                    include: {
                        subject: true,
                    },
                },
                userProfile: true,
            },
        })

        const data = lecturers.map((l) => {
            const classCount = l.mainLecturerClasses.length + l.extraLecturerClasses.length
            const mainHours = l.mainLecturerClasses.reduce(
                (acc, sc) => acc + (sc.subject.period || 0),
                0
            )
            const extraHours = l.extraLecturerClasses.reduce(
                (acc, sc) => acc + (sc.subject.period || 0),
                0
            )
            const totalHours = mainHours + extraHours

            return {
                lecturerId: l.id,
                name: l.userProfile.fullname || '',
                classCount,
                totalHours,
            }
        })

        return c.json(data)
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
        const result = await prisma.student.groupBy({
            by: ['graduationDecisionId'],
            _count: {
                id: true,
            },
            where: {
                graduationDecisionId: {
                    not: null,
                },
            },
        })

        const graduationDecisionIds = result
            .map((item) => item.graduationDecisionId)
            .filter(Boolean) as string[]

        const graduationDecisions = await prisma.graduationDecision.findMany({
            where: {
                id: {
                    in: graduationDecisionIds,
                },
            },
            include: {
                academicRanking: true,
            },
        })

        const data = result.map((item) => {
            const decision = graduationDecisions.find((d) => d.id === item.graduationDecisionId)
            return {
                ranking: decision?.academicRanking?.classification || 'N/A',
                count: item._count.id,
            }
        })

        return c.json(data)
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
                                actionType: z.string(),
                                reason: z.string(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.studentAcademicDecision.findMany({
            include: {
                student: {
                    include: {
                        userProfile: true,
                    },
                },
            },
        })

        const data = result.map((item) => ({
            studentId: item.student.id,
            studentName: item.student.userProfile.fullname || '',
            actionType: item.actionType,
            reason: item.reason || '',
        }))

        return c.json(data)
    }
)

// Trưởng phòng Khảo thí
app.openapi(
    createRoute({
        method: 'get',
        path: '/exam-participants-by-semester',
        tags: ['Stats'],
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
        const { semesterId } = c.req.query()

        const totalParticipants = await prisma.examSession.count({
            where: {
                exam: {
                    subjectClass: {
                        some: {
                            semesterId: semesterId,
                        },
                    },
                },
            },
        })

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
        const result = await prisma.studentSubjectScore.groupBy({
            by: ['subjectVersionId', 'subjectClassId'],
            _avg: {
                examScore: true,
            },
            where: {
                examScore: {
                    not: null,
                },
            },
        })

        const subjectClassIds = result
            .map((item) => item.subjectClassId)
            .filter(Boolean) as string[]

        const subjectClasses = await prisma.subjectClass.findMany({
            where: {
                id: {
                    in: subjectClassIds,
                },
            },
            include: {
                semester: true,
                subject: true,
            },
        })

        const data = result.map((item) => {
            const sc = subjectClasses.find((sc) => sc.id === item.subjectClassId)
            return {
                semesterId: sc?.semester.id || '',
                semesterName: sc?.semester.name || '',
                subjectVersionId: item.subjectVersionId,
                subjectName: sc?.subject.name || '',
                averageScore: item._avg.examScore || 0,
            }
        })

        return c.json(data)
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

        const byQuestionBank = await prisma.question.groupBy({
            by: ['questionBankId'],
            _count: { id: true },
            where: { questionBankId: { not: null } },
        })
        const questionBankIds = byQuestionBank
            .map((i) => i.questionBankId)
            .filter(Boolean) as string[]
        const questionBanks = await prisma.questionBank.findMany({
            where: { id: { in: questionBankIds } },
        })

        const bySubjectVersion = await prisma.questionBank.groupBy({
            by: ['subjectVersionId'],
            _count: { _all: true },
            where: { subjectVersionId: { not: null } },
        })
        const subjectVersionIds = bySubjectVersion
            .map((i) => i.subjectVersionId)
            .filter(Boolean) as string[]
        const subjectVersions = await prisma.subjectVersion.findMany({
            where: { id: { in: subjectVersionIds } },
        })

        const byDifficulty = await prisma.question.groupBy({
            by: ['difficultyId'],
            _count: { id: true },
            where: { difficultyId: { not: null } },
        })
        const difficultyIds = byDifficulty.map((i) => i.difficultyId).filter(Boolean) as string[]
        const difficulties = await prisma.difficulty.findMany({
            where: { id: { in: difficultyIds } },
        })

        const byKnowledgeBlock = await prisma.question.groupBy({
            by: ['knowledgeBlockId'],
            _count: { id: true },
            where: { knowledgeBlockId: { not: null } },
        })
        const knowledgeBlockIds = byKnowledgeBlock
            .map((i) => i.knowledgeBlockId)
            .filter(Boolean) as string[]
        const knowledgeBlocks = await prisma.knowledgeBlock.findMany({
            where: { id: { in: knowledgeBlockIds } },
        })

        return c.json({
            totalQuestions,
            byQuestionBank: byQuestionBank.map((i) => ({
                id: i.questionBankId || '',
                name: questionBanks.find((qb) => qb.id === i.questionBankId)?.name || '',
                count: i._count.id,
            })),
            bySubjectVersion: bySubjectVersion.map((i) => ({
                id: i.subjectVersionId,
                name: subjectVersions.find((sv) => sv.id === i.subjectVersionId)?.name || '',
                count: i._count._all,
            })),
            byDifficulty: byDifficulty.map((i) => ({
                id: i.difficultyId || '',
                name: difficulties.find((d) => d.id === i.difficultyId)?.name || '',
                count: i._count.id,
            })),
            byKnowledgeBlock: byKnowledgeBlock.map((i) => ({
                id: i.knowledgeBlockId || '',
                name: knowledgeBlocks.find((kb) => kb.id === i.knowledgeBlockId)?.name || '',
                count: i._count.id,
            })),
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
        const incorrectAnswers = await prisma.answer.groupBy({
            by: ['questionId'],
            _count: { id: true },
            where: { isCorrect: false },
        })

        const totalAnswers = await prisma.answer.groupBy({
            by: ['questionId'],
            _count: { id: true },
        })

        const questionIds = totalAnswers.map((a) => a.questionId).filter(Boolean) as string[]
        const questions = await prisma.question.findMany({
            where: {
                id: {
                    in: questionIds,
                },
            },
        })

        const data = totalAnswers.map((total) => {
            const incorrect = incorrectAnswers.find((i) => i.questionId === total.questionId)
            const question = questions.find((q) => q.id === total.questionId)
            return {
                questionId: total.questionId,
                content: question?.content || '',
                incorrectRate:
                    total._count.id > 0 ? ((incorrect?._count.id || 0) / total._count.id) * 100 : 0,
            }
        })

        return c.json(data.sort((a, b) => b.incorrectRate - a.incorrectRate))
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
        const result = await prisma.examBankQuestion.groupBy({
            by: ['questionId'],
            _count: {
                id: true,
            },
        })

        const questionIds = result.map((q) => q.questionId).filter(Boolean) as string[]
        const questions = await prisma.question.findMany({
            where: {
                id: {
                    in: questionIds,
                },
            },
        })

        const data = result.map((item) => {
            const question = questions.find((q) => q.id === item.questionId)
            return {
                questionId: item.questionId,
                content: question?.content || '',
                usageCount: item._count.id,
            }
        })

        return c.json(data.sort((a, b) => b.usageCount - a.usageCount))
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
        const byGender = await prisma.userProfile.groupBy({
            by: ['iGioiTinh'],
            _count: { id: true },
            where: { iGioiTinh: { not: null } },
        })

        const byEthnicity = await prisma.userProfile.groupBy({
            by: ['sDanToc'],
            _count: { id: true },
            where: { sDanToc: { not: null } },
        })
        const ethnicityIds = byEthnicity.map((i) => i.sDanToc).filter(Boolean) as string[]
        // @ts-ignore
        const ethnicities = await prisma.dM_DanToc.findMany({ where: { Id: { in: ethnicityIds } } })

        const byReligion = await prisma.userProfile.groupBy({
            by: ['sTonGiao'],
            _count: { id: true },
            where: { sTonGiao: { not: null } },
        })
        const religionIds = byReligion.map((i) => i.sTonGiao).filter(Boolean) as string[]
        // @ts-ignore
        const religions = await prisma.dM_TonGiao.findMany({ where: { Id: { in: religionIds } } })

        const byProvince = await prisma.userProfile.groupBy({
            by: ['provinceHometownId'],
            _count: { id: true },
            where: { provinceHometownId: { not: null } },
        })
        const provinceHometownIds = byProvince
            .map((i) => i.provinceHometownId)
            .filter(Boolean) as string[]
        const provinces = await prisma.dM_Tinh.findMany({
            where: { Id: { in: provinceHometownIds } },
        })

        return c.json({
            byGender: byGender.map((i) => ({ gender: i.iGioiTinh || 0, count: i._count.id })),
            byEthnicity: byEthnicity.map((i) => ({
                id: i.sDanToc || '',
                name: ethnicities.find((e) => e.Id === i.sDanToc)?.sTen || '',
                count: i._count.id,
            })),
            byReligion: byReligion.map((i) => ({
                id: i.sTonGiao || '',
                name: religions.find((r) => r.Id === i.sTonGiao)?.sTen || '',
                count: i._count.id,
            })),
            byProvince: byProvince.map((i) => ({
                id: i.provinceHometownId || '',
                name: provinces.find((p) => p.Id === i.provinceHometownId)?.sTen || '',
                count: i._count.id,
            })),
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
        const result = await prisma.student.groupBy({
            by: ['fixedClassId'],
            _count: { id: true },
            where: {
                createdAt: {
                    not: null,
                },
            },
        })

        const fixedClassIds = result.map((i) => i.fixedClassId).filter(Boolean) as string[]
        const fixedClasses = await prisma.fixedClass.findMany({
            where: {
                id: {
                    in: fixedClassIds,
                },
            },
            include: {
                trainingCourse: true,
                curriculumVersion: {
                    include: {
                        trainingMajor: true,
                    },
                },
            },
        })

        const data = result.map((item) => {
            const fc = fixedClasses.find((fc) => fc.id === item.fixedClassId)
            return {
                year: fc?.createdAt ? new Date(fc.createdAt).getFullYear() : 0,
                majorId: fc?.curriculumVersion?.trainingMajor.id || '',
                majorName: fc?.curriculumVersion?.trainingMajor.name || '',
                courseId: fc?.trainingCourse.id || '',
                courseName: fc?.trainingCourse.name || '',
                count: item._count.id,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/profile-completeness',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Tình trạng hoàn thiện hồ sơ',
                content: {
                    'application/json': {
                        schema: z.object({
                            completenessPercentage: z.number(),
                            incompleteProfiles: z.array(
                                z.object({
                                    id: z.string(),
                                    name: z.string(),
                                    missingFields: z.array(z.string()),
                                })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const userProfiles = await prisma.userProfile.findMany()
        const totalProfiles = userProfiles.length
        let completeProfiles = 0
        const incompleteProfiles: any[] = []

        for (const profile of userProfiles) {
            const missingFields: string[] = []
            if (!profile.sSoDienThoai) missingFields.push('sSoDienThoai')
            if (!profile.sEmail) missingFields.push('sEmail')
            // Add other important fields here

            if (missingFields.length === 0) {
                completeProfiles++
            } else {
                incompleteProfiles.push({
                    id: profile.id,
                    name: profile.fullname || '',
                    missingFields,
                })
            }
        }

        return c.json({
            completenessPercentage:
                totalProfiles > 0 ? (completeProfiles / totalProfiles) * 100 : 0,
            incompleteProfiles,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/diploma-certificate-statistics',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Thống kê các loại văn bằng, chứng chỉ được cấp',
                content: {
                    'application/json': {
                        schema: z.object({
                            byDiplomaType: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                            byCertificateType: z.array(
                                z.object({ id: z.string(), name: z.string(), count: z.number() })
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const byDiplomaType = await prisma.graduationDecision.groupBy({
            by: ['diplomaTypeId'],
            _count: { id: true },
            where: { diplomaTypeId: { not: null } },
        })
        const diplomaTypeIds = byDiplomaType.map((i) => i.diplomaTypeId).filter(Boolean) as string[]
        const diplomaTypes = await prisma.diplomaType.findMany({
            where: { id: { in: diplomaTypeIds } },
        })

        const byCertificateType = await prisma.archivedCertificateOnStudentSubjectScore.groupBy({
            by: ['archivedCertificateId'],
            _count: { id: true },
        })
        const certificateTypeIds = byCertificateType
            .map((i) => i.archivedCertificateId)
            .filter(Boolean) as string[]
        const certificateTypes = await prisma.archivedCertificate.findMany({
            where: { id: { in: certificateTypeIds } },
        })

        return c.json({
            byDiplomaType: byDiplomaType.map((i) => ({
                id: i.diplomaTypeId || '',
                name: diplomaTypes.find((d) => d.id === i.diplomaTypeId)?.name || '',
                count: i._count.id,
            })),
            byCertificateType: byCertificateType.map((i) => ({
                id: i.archivedCertificateId,
                name: certificateTypes.find((c) => c.id === i.archivedCertificateId)?.name || '',
                count: i._count.id,
            })),
        })
    }
)

// Admin Hệ thống
app.openapi(
    createRoute({
        method: 'get',
        path: '/user-statistics',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Tổng số người dùng',
                content: {
                    'application/json': {
                        schema: z.object({
                            totalUsers: z.number(),
                            byUserType: z.array(z.object({ type: z.string(), count: z.number() })),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const totalUsers = await prisma.userProfile.count()

        const byUserType = await prisma.userProfile.groupBy({
            by: ['userType'],
            _count: { id: true },
            where: { userType: { not: null } },
        })

        return c.json({
            totalUsers,
            byUserType: byUserType.map((i) => ({ type: i.userType || '', count: i._count.id })),
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/new-user-trend',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Số lượng người dùng mới được tạo theo thời gian',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                date: z.string(),
                                count: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const result = await prisma.userProfile.groupBy({
            by: ['dNgayTao'],
            _count: { id: true },
            where: {
                dNgayTao: {
                    not: null,
                },
            },
            orderBy: {
                dNgayTao: 'asc',
            },
        })

        const data = result.map((item) => ({
            date: item.dNgayTao ? item.dNgayTao.toISOString().split('T')[0] : '',
            count: item._count.id,
        }))

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/authorization-statistics',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Tổng số Nhóm, Vai trò, Quyền',
                content: {
                    'application/json': {
                        schema: z.object({
                            totalGroups: z.number(),
                            totalRoles: z.number(),
                            totalPermissions: z.number(),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const totalGroups = await prisma.group.count()
        const totalRoles = await prisma.role.count()
        const totalPermissions = await prisma.permission.count()

        return c.json({
            totalGroups,
            totalRoles,
            totalPermissions,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/roles-and-users',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Danh sách các vai trò và số lượng người dùng trong mỗi vai trò',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                roleId: z.string(),
                                roleName: z.string(),
                                userCount: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const roles = await prisma.role.findMany({
            include: {
                users: true,
            },
        })

        const data = roles.map((role) => ({
            roleId: role.id,
            roleName: role.name,
            userCount: role.users.length,
        }))

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/students-of-interest-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Danh sách SV cần quan tâm (lọc theo đơn vị quản lý)',
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
        const { managementOrganizationId, warningLevel, debtCredits, gpaThreshold } = c.req.query()

        const where: any = {
            fixedClass: {
                managementOrganizationId: managementOrganizationId,
            },
            OR: [],
        }

        if (warningLevel) {
            where.OR.push({ academicWarningLevel: { gt: Number.parseInt(warningLevel) } })
        }

        if (debtCredits) {
            // This requires a join with StudentSemesterResult, which is not straightforward in a single query.
        }

        if (gpaThreshold) {
            // This also requires a join with StudentSemesterResult.
        }

        const students = await prisma.student.findMany({
            where,
            select: {
                id: true,
                userProfile: {
                    select: {
                        fullname: true,
                    },
                },
                academicWarningLevel: true,
            },
        })

        const data = students.map((s) => ({
            id: s.id,
            name: s.userProfile.fullname || '',
            academicWarningLevel: s.academicWarningLevel,
            cumulativeDebtCredits: 0, // Placeholder
            gpa: 0, // Placeholder
        }))

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-gpa-by-fixed-class-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Điểm GPA trung bình theo Lớp niên chế (lọc theo đơn vị quản lý)',
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.studentSemesterResult.groupBy({
            by: ['studentId'],
            _avg: {
                gpaBase10: true,
            },
            where: {
                student: {
                    fixedClass: {
                        managementOrganizationId: managementOrganizationId,
                    },
                },
            },
        })

        const studentIds = result.map((item) => item.studentId).filter(Boolean) as string[]

        const students = await prisma.student.findMany({
            where: {
                id: {
                    in: studentIds,
                },
            },
            include: {
                fixedClass: true,
            },
        })

        const data = result.map((item) => {
            const student = students.find((s) => s.id === item.studentId)
            return {
                fixedClassId: student?.fixedClass?.id || '',
                name: student?.fixedClass?.name || '',
                avgGpa: Number(item._avg.gpaBase10) || 0,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/average-gpa-by-training-major-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Điểm GPA trung bình theo Ngành (lọc theo đơn vị quản lý)',
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.studentSemesterResult.groupBy({
            by: ['studentId'],
            _avg: {
                gpaBase10: true,
            },
            where: {
                student: {
                    fixedClass: {
                        managementOrganizationId: managementOrganizationId,
                    },
                },
            },
        })

        const studentIds = result.map((item) => item.studentId).filter(Boolean) as string[]

        const students = await prisma.student.findMany({
            where: {
                id: {
                    in: studentIds,
                },
            },
            include: {
                curriculumVersion: {
                    include: {
                        trainingMajor: true,
                    },
                },
            },
        })

        const data = result.map((item) => {
            const student = students.find((s) => s.id === item.studentId)
            return {
                trainingMajorId: student?.curriculumVersion?.trainingMajor.id || '',
                name: student?.curriculumVersion?.trainingMajor.name || '',
                avgGpa: Number(item._avg.gpaBase10) || 0,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/subject-pass-fail-rate-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description:
                    'Tỷ lệ % sinh viên qua môn/rớt môn của các học phần (lọc theo đơn vị quản lý)',
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
        const { managementOrganizationId } = c.req.query()
        const passedCounts = await prisma.studentSubjectScore.groupBy({
            by: ['subjectVersionId'],
            _count: {
                id: true,
            },
            where: {
                finalScore: {
                    gte: 5,
                },
                subjectClass: {
                    fixedClasses: {
                        some: {
                            managementOrganizationId: managementOrganizationId,
                        },
                    },
                },
            },
        })

        const failedCounts = await prisma.studentSubjectScore.groupBy({
            by: ['subjectVersionId'],
            _count: {
                id: true,
            },
            where: {
                finalScore: {
                    lt: 5,
                },
                subjectClass: {
                    fixedClasses: {
                        some: {
                            managementOrganizationId: managementOrganizationId,
                        },
                    },
                },
            },
        })

        const subjectVersionIds = [
            ...passedCounts.map((p) => p.subjectVersionId),
            ...failedCounts.map((f) => f.subjectVersionId),
        ].filter(Boolean) as string[]

        const subjectVersions = await prisma.subjectVersion.findMany({
            where: {
                id: {
                    in: subjectVersionIds,
                },
            },
        })

        const data = subjectVersions.map((sv) => {
            const passed = passedCounts.find((p) => p.subjectVersionId === sv.id)?._count.id || 0
            const failed = failedCounts.find((f) => f.subjectVersionId === sv.id)?._count.id || 0
            return {
                subjectVersionId: sv.id,
                name: sv.name,
                passed,
                failed,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/curriculum-statistics-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Thống kê CTĐT (lọc theo đơn vị quản lý)',
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
        const { managementOrganizationId } = c.req.query()
        const activeCurricula = await prisma.curriculum.count({
            where: {
                active: true,
                managementOrganizationId: managementOrganizationId,
            },
        })

        const activeCurriculumVersions = await prisma.curriculumVersion.count({
            where: {
                active: true,
                curriculum: {
                    managementOrganizationId: managementOrganizationId,
                },
            },
        })

        return c.json({
            activeCurricula,
            activeCurriculumVersions,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/subject-class-statistics-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Thống kê Lớp học phần (lọc theo đơn vị quản lý)',
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
        const { semesterId, managementOrganizationId } = c.req.query()

        const subjectClasses = await prisma.subjectClass.findMany({
            where: {
                semesterId: semesterId,
                fixedClasses: {
                    some: {
                        managementOrganizationId: managementOrganizationId,
                    },
                },
            },
            include: {
                subjectClassStudent: true,
            },
        })

        const totalClasses = subjectClasses.length

        const classes = subjectClasses.map((sc) => {
            const fillRate =
                sc.maxStudent > 0 ? (sc.subjectClassStudent.length / sc.maxStudent) * 100 : 0
            const failedStudents = sc.subjectClassStudent.filter(
                (s) => s.finalScore && s.finalScore < 5
            ).length
            const failureRate =
                sc.subjectClassStudent.length > 0
                    ? (failedStudents / sc.subjectClassStudent.length) * 100
                    : 0
            return {
                id: sc.id,
                name: sc.name,
                fillRate: fillRate,
                failureRate: failureRate,
            }
        })

        return c.json({
            totalClasses,
            classes,
        })
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/lecturer-workload-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Tải giảng dạy của Giảng viên (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                lecturerId: z.string(),
                                name: z.string(),
                                classCount: z.number(),
                                totalHours: z.number(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.query()
        const lecturers = await prisma.lecturer.findMany({
            where: {
                userProfile: {
                    sIdDonVi: managementOrganizationId,
                },
            },
            include: {
                mainLecturerClasses: {
                    include: {
                        subject: true,
                    },
                },
                extraLecturerClasses: {
                    include: {
                        subject: true,
                    },
                },
                userProfile: true,
            },
        })

        const data = lecturers.map((l) => {
            const classCount = l.mainLecturerClasses.length + l.extraLecturerClasses.length
            const mainHours = l.mainLecturerClasses.reduce(
                (acc, sc) => acc + (sc.subject.period || 0),
                0
            )
            const extraHours = l.extraLecturerClasses.reduce(
                (acc, sc) => acc + (sc.subject.period || 0),
                0
            )
            const totalHours = mainHours + extraHours

            return {
                lecturerId: l.id,
                name: l.userProfile.fullname || '',
                classCount,
                totalHours,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/graduation-ranking-statistics-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Thống kê xếp hạng tốt nghiệp (lọc theo đơn vị quản lý)',
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
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.student.groupBy({
            by: ['graduationDecisionId'],
            _count: {
                id: true,
            },
            where: {
                graduationDecisionId: {
                    not: null,
                },
                fixedClass: {
                    managementOrganizationId: managementOrganizationId,
                },
            },
        })

        const graduationDecisionIds = result
            .map((item) => item.graduationDecisionId)
            .filter(Boolean) as string[]

        const graduationDecisions = await prisma.graduationDecision.findMany({
            where: {
                id: {
                    in: graduationDecisionIds,
                },
            },
            include: {
                academicRanking: true,
            },
        })

        const data = result.map((item) => {
            const decision = graduationDecisions.find((d) => d.id === item.graduationDecisionId)
            return {
                ranking: decision?.academicRanking?.classification || 'N/A',
                count: item._count.id,
            }
        })

        return c.json(data)
    }
)

app.openapi(
    createRoute({
        method: 'get',
        path: '/students-for-academic-action-filtered',
        tags: ['Stats'],
        responses: {
            200: {
                description: 'Danh sách SV bị đề nghị xử lý (lọc theo đơn vị quản lý)',
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                studentId: z.string(),
                                studentName: z.string(),
                                actionType: z.string(),
                                reason: z.string(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { managementOrganizationId } = c.req.query()
        const result = await prisma.studentAcademicDecision.findMany({
            where: {
                student: {
                    fixedClass: {
                        managementOrganizationId: managementOrganizationId,
                    },
                },
            },
            include: {
                student: {
                    include: {
                        userProfile: true,
                    },
                },
            },
        })

        const data = result.map((item) => ({
            studentId: item.student.id,
            studentName: item.student.userProfile.fullname || '',
            actionType: item.actionType,
            reason: item.reason || '',
        }))

        return c.json(data)
    }
)

export default app
