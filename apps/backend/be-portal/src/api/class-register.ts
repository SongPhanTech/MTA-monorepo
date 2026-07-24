import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { models } from "@workspace/db/zod"
import { prisma } from ".."
import { findClassRegisterSession } from "../services/register"
import {
  CACHE_TTL,
  RATE_LIMIT,
  cacheGet,
  cacheSet,
  classRegisterCache,
  rateLimitConsume,
  rateLimitKey,
} from "../services/redis-cache"
import { $Enums, AcademicRankingBaseType, Prisma } from "@workspace/db"

const app = new OpenAPIHono({ strict: false })

const getClassRegisterSession = createRoute({
  operationId: "get-class-register-session",
  path: "/get-class-register-session",
  tags: ["ClassRegister"],
  summary: "Lấy thống tin đợt đăng ký học",
  description: "Lấy thống tin đợt đăng ký học",
  method: "get",
  responses: {
    200: {
      description: "Thông tin đợt đăng ký",
      content: {
        "application/json": {
          schema: z.array(
            models.ClassRegisterSessionScalarSchema.extend({
              semester: models.SemesterScalarSchema.extend({
                schoolYear: models.SchoolYearScalarSchema,
              }),
              trainingCourses: z.array(z.object({ id: z.string() })),
              curriculumVersions: z.array(models.CurriculumVersionScalarSchema.nullish()),
              creditLimit: z.array(models.ClassRegisterSessionCreditSchema),
            })
          ),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(getClassRegisterSession, async (c) => {
  const session = c.get("user")
  const registerSessions = await findClassRegisterSession(session.id)
  return c.json(registerSessions, 200)
})

const GetClassesInfoResponseSchema = z.array(
  models.SubjectVersionScalarSchema.extend({
    subjectClass: z.array(
      models.SubjectClassScalarSchema.extend({
        prerequisiteSubject: z
          .array(models.SubjectVersionScalarSchema.pick({ code: true, name: true }))
          .nullish(),
        mainLecturer: z
          .object({
            userProfile: models.UserProfileScalarSchema.pick({
              fullname: true,
            }).extend({
              level: models.DM_ChucDanhScalarSchema.pick({
                sMa: true,
                sTen: true,
              }).nullish(),
              academicRankType: models.DM_HocHamScalarSchema.pick({
                sMa: true,
                sTen: true,
              }).nullish(),
              academicDegreeType: models.DM_HocViScalarSchema.pick({
                sMa: true,
                sTen: true,
              }).nullish(),
            }),
          })
          .nullish(),
        extraLecturer: z
          .object({
            userProfile: models.UserProfileScalarSchema.pick({
              fullname: true,
            }).extend({
              level: models.DM_ChucDanhScalarSchema.pick({
                sMa: true,
                sTen: true,
              }).nullish(),
              academicRankType: models.DM_HocHamScalarSchema.pick({
                sMa: true,
                sTen: true,
              }).nullish(),
              academicDegreeType: models.DM_HocViScalarSchema.pick({
                sMa: true,
                sTen: true,
              }).nullish(),
            }),
          })
          .nullish(),
        room: models.RoomScalarSchema.pick({ name: true })
          .extend({
            building: models.BuildingScalarSchema.pick({ name: true })
              .extend({
                trainingLocation: models.TrainingLocationScalarSchema.pick({
                  name: true,
                }).nullish(),
              })
              .nullish(),
          })
          .nullish(),
        credit: z.number().optional(),
        _count: z.object({
          subjectClassStudent: z.number(),
        }),
        classRegisterLogs: z.array(
          z.object({
            student: z.object({
              userProfileId: z.string().optional(),
            }),
          })
        ),
        subjectClassTimes: z.array(
          z.object({
            dayOfWeek: z.number().optional(),
            startPeriod: z.number().optional(),
            endPeriod: z.number().optional(),
          })
        ),
        type: models.TrainingBlockSubjectScalarSchema.shape.type.optional(),
      })
    ),
  })
)

const getClassesInfo = createRoute({
  operationId: "get-classes-info",
  path: "/get-classes-info",
  tags: ["ClassRegister"],
  summary: "Lấy thông tin lớp học",
  description: "Lấy thông tin lớp học",
  method: "get",
  request: {
    query: z.object({
      sessionId: z.string().openapi({ description: "ID đợt đăng ký lớp học" }),
      curriculumVersionId: z.string(),
      byCurriculum: z.string().default("true"),
      isRegistered: z.string().default("false"),
    }),
  },
  responses: {
    200: {
      description: "Thông tin lớp học",
      content: {
        "application/json": {
          schema: GetClassesInfoResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    429: {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            retryAfterSec: z.number().optional(),
          }),
        },
      },
    },
  },
})

app.openapi(getClassesInfo, async (c) => {
  const session = c.get("user")
  const { sessionId, curriculumVersionId, byCurriculum, isRegistered } = c.req.valid("query")

  const rl = await rateLimitConsume(
    rateLimitKey("read", session.id),
    RATE_LIMIT.read.max,
    RATE_LIMIT.read.windowSec
  )
  if (!rl.allowed) {
    c.header("Retry-After", String(rl.retryAfterSec))
    return c.json(
      {
        message: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
        retryAfterSec: rl.retryAfterSec,
      },
      429
    )
  }

  const byCurriculumBool = `${byCurriculum}`.toLowerCase() === "true"
  const isRegisteredBool = `${isRegistered}`.toLowerCase() === "true"

  const cacheKey = await classRegisterCache.classesInfoKey(
    session.id,
    sessionId,
    curriculumVersionId,
    byCurriculumBool,
    isRegisteredBool
  )
  const cached = await cacheGet<unknown>(cacheKey)
  if (cached) {
    return c.json(cached, 200)
  }

  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { id: session.id },
    include: {
      educationAndTraining: {
        include: {
          fixedClass: {
            include: {
              trainingCourse: {
                include: {
                  semesterStart: true,
                },
              },
            },
          },
          studentSemesterResult: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const tcNoToiThieuLamDoAn = await prisma.trainingCourseRegulation.findFirst({
    where: {
      code: "TC_NO_TOI_THIEU_LAM_DO_AN",
      trainingCourseId: profile.educationAndTraining[0]?.fixedClass?.trainingCourseId,
    },
  })

  const now = new Date()
  const registerSession = await prisma.classRegisterSession.findUniqueOrThrow({
    where: {
      id: sessionId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      semester: true,
      trainingCourses: {
        select: {
          id: true,
          trainingObjectTypeId: true,
        },
        where: {
          id: {
            in: profile.educationAndTraining.map(
              (item) => item.fixedClass?.trainingCourse.id || ""
            ),
          },
        },
      },
    },
  })

  const curriculumVersion = await prisma.curriculumVersion.findUniqueOrThrow({
    where: { id: curriculumVersionId },
    include: { trainingBlocks: { include: { subjects: { include: { subject: true } } } } },
  })

  const studentInfo = profile.educationAndTraining[0]
  const currentSemesterIndex = await prisma.semester.count({
    where: {
      startDate: {
        gte: studentInfo?.fixedClass?.trainingCourse?.semesterStart?.startDate,
        lte: registerSession.semester?.startDate,
      },
      semesterType: { in: [$Enums.SemesterType.FIRST, $Enums.SemesterType.SECOND] },
      deletedAt: null,
    },
  })

  const curriculumSubjects = curriculumVersion.trainingBlocks
    .flatMap((block) => block.subjects)
    .filter((item) => item.semester === currentSemesterIndex)

  const studentTrainingObjectTypeId =
    registerSession.trainingCourses.find((tc) => tc.trainingObjectTypeId)?.trainingObjectTypeId ??
    undefined

  const subjectVersions = await prisma.subjectVersion.findMany({
    where: {
      ...(byCurriculumBool
        ? { id: { in: curriculumSubjects.map((item) => item.subjectId) } }
        : {
            trainingObjectTypeId: studentTrainingObjectTypeId,
          }),
      subjectClass: {
        some: {
          semesterId: registerSession.semesterId,
          ...(studentTrainingObjectTypeId && !byCurriculumBool
            ? { trainingObjectTypeId: studentTrainingObjectTypeId }
            : {}),
          ...(isRegisteredBool
            ? {
                OR: [
                  {
                    classRegisterLogs: {
                      some: {
                        student: {
                          userProfileId: session.id,
                        },
                      },
                    },
                  },
                  {
                    subjectClassStudent: {
                      some: {
                        student: {
                          userProfileId: session.id,
                        },
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      },
    },
    include: {
      prerequisiteSubject: {
        select: {
          code: true,
          name: true,
        },
      },
      coRequisiteSubject: {
        select: {
          code: true,
          name: true,
        },
      },
      equivalencyGroups: {
        include: {
          equivalencyGroup: {
            include: {
              subjects: {
                include: {
                  subject: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
        },
      },
      subjectClass: {
        where: {
          active: true,
          deletedAt: null,
          cancelled: false,
          semesterId: registerSession.semesterId,
          ...(studentTrainingObjectTypeId && !byCurriculumBool
            ? { trainingObjectTypeId: studentTrainingObjectTypeId }
            : {}),
          ...(isRegisteredBool
            ? {
                OR: [
                  {
                    classRegisterLogs: {
                      some: {
                        student: {
                          userProfileId: session.id,
                        },
                      },
                    },
                  },
                  {
                    subjectClassStudent: {
                      some: {
                        student: {
                          userProfileId: session.id,
                        },
                      },
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          _count: {
            select: {
              subjectClassStudent: true,
            },
          },
          classRegisterLogs: {
            select: {
              student: {
                select: {
                  userProfileId: true,
                },
              },
            },
            where: {
              student: {
                userProfileId: session.id,
              },
            },
          },
          subjectClassTimes: {
            select: {
              dayOfWeek: true,
              startPeriod: true,
              endPeriod: true,
            },
          },
          mainLecturer: {
            select: {
              userProfile: {
                select: {
                  fullname: true,
                  level: { select: { sMa: true, sTen: true } },
                  academicRankType: { select: { sMa: true, sTen: true } },
                  academicDegreeType: { select: { sMa: true, sTen: true } },
                },
              },
            },
          },
          extraLecturer: {
            select: {
              userProfile: {
                select: {
                  fullname: true,
                  level: { select: { sMa: true, sTen: true } },
                  academicRankType: { select: { sMa: true, sTen: true } },
                  academicDegreeType: { select: { sMa: true, sTen: true } },
                },
              },
            },
          },
          room: {
            select: {
              name: true,
              building: {
                select: {
                  name: true,
                  trainingLocation: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const data = subjectVersions
    .map((version) => {
      const subjectVersion = curriculumSubjects.find((item) => item.subjectId === version.id)

      return {
        ...version,
        subjectClass: version.subjectClass.map((subjectClass) => ({
          ...subjectClass,
          credit: version.credit ?? 0,
          type: subjectVersion?.type,
          prerequisiteSubject: version.prerequisiteSubject,
          coRequisiteSubject: version.coRequisiteSubject,
          equivalencyGroups: version.equivalencyGroups,
        })),
      }
    })
    .filter((version) => {
      if (version.type === "Project" || version.type === "Thesis") {
        return (
          !!tcNoToiThieuLamDoAn?.value &&
          (profile?.educationAndTraining?.[0]?.studentSemesterResult?.[0]?.totalFailedCredits ||
            0) <= tcNoToiThieuLamDoAn?.value
        )
      }
      return true
    })

  await cacheSet(cacheKey, data, CACHE_TTL.classesInfo)
  return c.json(data, 200)
})

const classRegister = createRoute({
  operationId: "class-register",
  path: "/class-register",
  tags: ["ClassRegister"],
  summary: "Đăng ký lớp học",
  description: "Đăng ký lớp học",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().openapi({ description: "ID đợt đăng ký lớp học" }),
            subjectClassIds: z.array(z.string()).openapi({ description: "Danh sách ID lớp học" }),
            curriculumVersionId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Đăng ký thành công",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    429: {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            retryAfterSec: z.number().optional(),
          }),
        },
      },
    },
  },
})

app.openapi(classRegister, async (c) => {
  const session = c.get("user")
  const { sessionId, subjectClassIds, curriculumVersionId } = c.req.valid("json")

  const rl = await rateLimitConsume(
    rateLimitKey("register", session.id),
    RATE_LIMIT.register.max,
    RATE_LIMIT.register.windowSec
  )
  if (!rl.allowed) {
    c.header("Retry-After", String(rl.retryAfterSec))
    return c.json(
      {
        message: "Bạn thao tác đăng ký quá nhanh. Vui lòng thử lại sau.",
        retryAfterSec: rl.retryAfterSec,
      },
      429
    )
  }

  const registerSession = await prisma.classRegisterSession.findUniqueOrThrow({
    where: { id: sessionId },
  })

  if (
    !registerSession.active ||
    registerSession.startDate > new Date() ||
    registerSession.endDate < new Date()
  ) {
    return c.json({ message: "Đợt đăng ký đã đóng" }, 404)
  }

  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { id: session.id },
    include: {
      educationAndTraining: {
        include: {
          fixedClass: {
            include: {
              trainingCourse: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (profile.educationAndTraining.length === 0) {
    return c.json({ message: "Bạn không có thông tin học vụ" }, 404)
  }

  const studentId =
    profile.educationAndTraining.find(
      (item) => curriculumVersionId && item.curriculumVersionId === curriculumVersionId
    )?.id ?? (profile.educationAndTraining[0]?.id as string)

  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: registerSession.semesterId },
    select: { startDate: true },
  })

  const nearestSemesterResult = await prisma.studentSemesterResult.findFirst({
    select: {
      gpaBase10: true,
      gpaBase4: true,
    },
    where: {
      studentId,
      semesterId: registerSession.semesterId,
      semester: { startDate: { lt: semester.startDate } },
    },
    orderBy: { semester: { startDate: "desc" } },
  })
  // TODO: check session => student trainingCourse

  const subjectClasses = await prisma.subjectClass.findMany({
    where: { id: { in: subjectClassIds } },
    include: {
      subject: {
        include: {
          prerequisiteSubject: true,
          coRequisiteSubject: true,
        },
      },
    },
  })

  const allPrerequisiteIds = [
    ...new Set(subjectClasses.flatMap((sc) => sc.subject.prerequisiteSubject.map((p) => p.id))),
  ]
  const allCoRequisiteIds = [
    ...new Set(subjectClasses.flatMap((sc) => sc.subject.coRequisiteSubject.map((p) => p.id))),
  ]

  if (allPrerequisiteIds.length > 0 || allCoRequisiteIds.length > 0) {
    const passedPrerequisites = await prisma.studentSubjectScore.findMany({
      where: {
        studentId,
        subjectVersionId: { in: allPrerequisiteIds },
        finalScore: { gt: 4.0 },
      },
      select: { subjectVersionId: true },
    })
    const passedPrerequisiteIds = new Set(passedPrerequisites.map((h) => h.subjectVersionId))

    const registeredCoRequisites = await prisma.classRegisterLogs.findMany({
      where: {
        studentId,
        subjectClass: {
          subjectId: { in: allCoRequisiteIds },
        },
      },
      select: { subjectClass: { select: { subjectId: true } } },
    })
    const enrolledCoRequisites = await prisma.studentSubjectScore.findMany({
      where: {
        studentId,
        subjectVersionId: { in: allCoRequisiteIds },
      },
      select: { subjectVersionId: true },
    })

    const registeredCoRequisiteSubjectIds = new Set([
      ...registeredCoRequisites.map((r) => r.subjectClass.subjectId).filter(Boolean),
      ...enrolledCoRequisites.map((r) => r.subjectVersionId),
      ...subjectClasses.map((sc) => sc.subjectId),
    ])

    for (const sc of subjectClasses) {
      const missingPrerequisites = sc.subject.prerequisiteSubject.filter(
        (p) => !passedPrerequisiteIds.has(p.id)
      )

      const missingCoRequisites = sc.subject.coRequisiteSubject.filter(
        (p) => !registeredCoRequisiteSubjectIds.has(p.id)
      )

      if (missingPrerequisites.length > 0) {
        return c.json(
          {
            message: `Bạn chưa hoàn thành môn tiên quyết của môn ${sc.subject.name}: ${missingPrerequisites.map((p) => p.name).join(", ")}`,
          },
          400
        )
      }

      if (missingCoRequisites.length > 0) {
        return c.json(
          {
            message: `Bạn chưa đăng ký môn trước của môn ${sc.subject.name}: ${missingCoRequisites.map((p) => p.name).join(", ")}`,
          },
          400
        )
      }
    }
  }

  if (nearestSemesterResult) {
    const creditLimits = await prisma.classRegisterSessionCredit.findMany({
      where: { classRegisterSessionId: sessionId },
    })

    if (creditLimits.length > 0) {
      const creditLimit = creditLimits.find((item) => {
        const gpa = (
          item.baseScore === AcademicRankingBaseType.Base10
            ? nearestSemesterResult.gpaBase10
            : nearestSemesterResult.gpaBase4
        ).toNumber()
        const minGpa =
          (item.baseScore === AcademicRankingBaseType.Base10 ? item.base10Min : item.base4Min) || 0
        const maxGpa =
          (item.baseScore === AcademicRankingBaseType.Base10 ? item.base10Max : item.base4Max) || 10
        return gpa >= minGpa && gpa <= maxGpa
      })

      if (creditLimit) {
        const registeredScores = await prisma.studentSubjectScore.findMany({
          where: {
            studentId,
            subjectClass: { semesterId: registerSession.semesterId },
          },
          select: { subjectVersion: { select: { credit: true } } },
        })

        const registeredCredit = registeredScores.reduce(
          (acc, curr) => acc + (curr.subjectVersion?.credit ?? 0),
          0
        )

        const newClasses = await prisma.subjectClass.findMany({
          where: { id: { in: subjectClassIds } },
          select: { subject: { select: { credit: true } } },
        })

        const newTotalCredit =
          registeredCredit + newClasses.reduce((acc, curr) => acc + (curr.subject?.credit ?? 0), 0)

        if (creditLimit.maxCredit && newTotalCredit > creditLimit.maxCredit) {
          throw new Error(`Số tín chỉ tối đa là ${creditLimit.maxCredit}`)
        }
      }
    }
  }

  const subjectClassLookup = new Map(subjectClasses.map((sc) => [sc.id, sc]))
  const sortedClassIds = [...subjectClassIds].sort()

  await prisma.$transaction(async (tx) => {
    // Lock SubjectClass rows (sorted order prevents deadlocks)
    await tx.$queryRaw`
      SELECT id FROM "ql-dao-tao"."SubjectClass"
      WHERE id IN (${Prisma.join(sortedClassIds)})
      ORDER BY id
      FOR UPDATE
    `

    const existingScores = await tx.studentSubjectScore.findMany({
      where: { studentId, subjectClassId: { in: subjectClassIds } },
      select: { subjectClassId: true },
    })
    if (existingScores.length > 0) {
      const dupName = subjectClassLookup.get(existingScores[0]!.subjectClassId!)?.subject?.name
      throw new Error(`Bạn đã đăng ký học phần ${dupName ?? "này"}`)
    }

    for (const subjectClassId of subjectClassIds) {
      const sc = subjectClassLookup.get(subjectClassId)
      if (!sc) throw new Error("Không tìm thấy lớp học phần")

      const currentEnrolled = await tx.studentSubjectScore.count({ where: { subjectClassId } })
      if ((sc.maxStudent || 0) <= currentEnrolled) {
        throw new Error(`Lớp ${sc.subject.name} đã đủ số lượng sinh viên`)
      }

      await tx.studentSubjectScore.create({
        data: { subjectClassId, studentId, subjectVersionId: sc.subjectId },
      })
    }

    await tx.classRegisterLogs.createMany({
      data: subjectClassIds.map((subjectClassId) => ({
        classRegisterSessionId: sessionId,
        studentId,
        subjectClassId,
      })),
    })
  })

  await classRegisterCache.invalidateUser(session.id, sessionId)

  return c.json({ message: "success" }, 200)
})

const classUnregister = createRoute({
  operationId: "class-unregister",
  path: "/class-unregister",
  tags: ["ClassRegister"],
  summary: "Hủy đăng ký lớp học",
  description: "Hủy đăng ký lớp học",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().openapi({ description: "ID đợt đăng ký lớp học" }),
            subjectClassIds: z.array(z.string()).openapi({ description: "Danh sách ID lớp học" }),
            curriculumVersionId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Hủy đăng ký thành công",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    429: {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            retryAfterSec: z.number().optional(),
          }),
        },
      },
    },
  },
})

app.openapi(classUnregister, async (c) => {
  const session = c.get("user")
  const { sessionId, subjectClassIds, curriculumVersionId } = c.req.valid("json")

  const rl = await rateLimitConsume(
    rateLimitKey("unregister", session.id),
    RATE_LIMIT.unregister.max,
    RATE_LIMIT.unregister.windowSec
  )
  if (!rl.allowed) {
    c.header("Retry-After", String(rl.retryAfterSec))
    return c.json(
      {
        message: "Bạn thao tác hủy đăng ký quá nhanh. Vui lòng thử lại sau.",
        retryAfterSec: rl.retryAfterSec,
      },
      429
    )
  }

  const registerSession = await prisma.classRegisterSession.findUniqueOrThrow({
    where: { id: sessionId },
  })

  if (
    !registerSession.active ||
    registerSession.startDate > new Date() ||
    registerSession.endDate < new Date()
  ) {
    return c.json({ message: "Đợt đăng ký đã đóng" }, 404)
  }

  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { id: session.id },
    include: {
      educationAndTraining: {
        include: {
          fixedClass: {
            include: {
              trainingCourse: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (profile.educationAndTraining.length === 0) {
    return c.json({ message: "Bạn không có thông tin học vụ" }, 404)
  }

  const studentIds = profile.educationAndTraining.map((item) => item.id)

  const studentSubjectScores = await prisma.studentSubjectScore.findMany({
    where: {
      studentId: { in: studentIds },
      subjectClassId: { in: subjectClassIds },
      OR: [
        { attendanceScore: { not: null } },
        { midtermScore: { not: null } },
        { finalScore: { not: null } },
        { examScore: { not: null } },
        { manualFinalScore: { not: null } },
        { examPaper: { isNot: null } },
        { studentResearchTopic: { isNot: null } },
        { studentInternship: { isNot: null } },
        {
          subjectClass: {
            subjectClassAttendances: {
              some: {
                subjectClassAttendanceStudent: {
                  some: {
                    studentId: { in: studentIds },
                  },
                },
              },
            },
          },
        },
      ],
    },
  })
  if (studentSubjectScores.length > 0) {
    return c.json(
      {
        message: "Học phần đã phát sinh dữ liệu (điểm/điểm danh/thi), không thể hủy đăng ký.",
      },
      400
    )
  }
  await prisma.$transaction(async (tx) => {
    await tx.classRegisterLogs.deleteMany({
      where: {
        studentId: { in: studentIds },
        subjectClassId: {
          in: subjectClassIds,
        },
      },
    })

    for (const subjectClassId of subjectClassIds) {
      await tx.studentSubjectScoreHistory.deleteMany({
        where: {
          studentSubjectScore: {
            subjectClassId,
            studentId: { in: studentIds },
          },
        },
      })
      await tx.subjectClassAttendanceStudent.deleteMany({
        where: {
          studentId: { in: studentIds },
          subjectClassAttendance: {
            subjectClassId,
          },
        },
      })
      await tx.studentSubjectScore.deleteMany({
        where: { subjectClassId, studentId: { in: studentIds } },
      })
    }
  })

  await classRegisterCache.invalidateUser(session.id, sessionId)

  return c.json({ message: "success" }, 200)
})
const getStudentInfo = createRoute({
  operationId: "get-student-info",
  path: "/get-student-info",
  tags: ["ClassRegister"],
  summary: "Lấy thông tin sinh viên cho đăng ký học",
  description: "Lấy thông tin sinh viên cho đăng ký học",
  method: "get",
  request: {
    query: z.object({
      sessionId: z.string().optional().openapi({ description: "ID đợt đăng ký lớp học" }),
    }),
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.object({
            userProfile: models.UserProfileScalarSchema.nullish(),
            student: models.StudentScalarSchema.nullish(),
            latestSemesterResult: z
              .object({
                rank: z
                  .object({
                    classification: z.string().nullish(),
                  })
                  .nullish(),
                baseScore: z.string().nullish(),
                cumulativeGpaBase4: z.union([z.number(), z.string()]).nullish(),
                cumulativeGpaBase10: z.union([z.number(), z.string()]).nullish(),
              })
              .nullish(),
            creditLimit: z
              .object({
                maxCredit: z.number().nullish(),
              })
              .nullish(),
          }),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
  },
})

app.openapi(getStudentInfo, async (c) => {
  const session = c.get("user")
  const { sessionId } = c.req.valid("query")

  const cacheKey = classRegisterCache.studentKey(session.id, sessionId || "_")
  const cached = await cacheGet<{
    userProfile: unknown
    student: unknown
    latestSemesterResult: unknown
    creditLimit: { maxCredit: number } | null
  }>(cacheKey)
  if (cached) {
    return c.json(cached, 200)
  }

  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { id: session.id },
    include: {
      educationAndTraining: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  const studentId = profile.educationAndTraining[0]?.id
  if (!studentId) {
    return c.json({ message: "Không tìm thấy thông tin học vụ" }, 404)
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  })

  const latestSemesterResult = await prisma.studentSemesterResult.findFirst({
    where: { studentId },
    orderBy: { semesterIndexInCourse: "desc" },
    select: {
      rank: {
        select: {
          classification: true,
        },
      },
      baseScore: true,
      cumulativeGpaBase4: true,
      cumulativeGpaBase10: true,
    },
  })

  let maxCredit = null

  if (sessionId && latestSemesterResult) {
    const maxCreditsSetting = await prisma.classRegisterSessionCredit.findMany({
      where: { classRegisterSessionId: sessionId },
    })

    if (maxCreditsSetting.length > 0) {
      const matchedLimit = maxCreditsSetting.find((limit) => {
        if (limit.baseScore !== latestSemesterResult.baseScore) return false

        if (limit.baseScore === AcademicRankingBaseType.Base10) {
          const gpaBase10 = Number(latestSemesterResult.cumulativeGpaBase10) || 0
          return (
            (limit.base10Min == null || gpaBase10 >= limit.base10Min) &&
            (limit.base10Max == null || gpaBase10 <= limit.base10Max)
          )
        }

        const gpaBase4 = Number(latestSemesterResult.cumulativeGpaBase4) || 0
        return (
          (limit.base4Min == null || gpaBase4 >= limit.base4Min) &&
          (limit.base4Max == null || gpaBase4 <= limit.base4Max)
        )
      })

      if (matchedLimit && matchedLimit.maxCredit != null) {
        maxCredit = matchedLimit.maxCredit
      }
    }
  }

  const payload = {
    userProfile: profile,
    student: student,
    latestSemesterResult: latestSemesterResult
      ? {
          rank: latestSemesterResult.rank,
          baseScore: latestSemesterResult.baseScore,
          cumulativeGpaBase4: latestSemesterResult.cumulativeGpaBase4
            ? Number(latestSemesterResult.cumulativeGpaBase4)
            : null,
          cumulativeGpaBase10: latestSemesterResult.cumulativeGpaBase10
            ? Number(latestSemesterResult.cumulativeGpaBase10)
            : null,
        }
      : null,
    creditLimit: maxCredit != null ? { maxCredit } : null,
  }

  await cacheSet(cacheKey, payload, CACHE_TTL.student)
  return c.json(payload, 200)
})

export default app
