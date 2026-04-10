import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { models } from "@workspace/db/zod"
import { prisma } from ".."
import { findClassRegisterSession } from "../services/register"
import { $Enums, AcademicRankingBaseType } from "@workspace/db"

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
  },
})

app.openapi(getClassesInfo, async (c) => {
  const session = c.get("user")
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

  const { sessionId, curriculumVersionId, byCurriculum, isRegistered } = c.req.valid("query")

  const byCurriculumBool = `${byCurriculum}`.toLowerCase() === "true"
  const isRegisteredBool = `${isRegistered}`.toLowerCase() === "true"

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

  const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap((block) => block.subjects)

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
                // classRegisterLogs: {
                subjectClassStudent: {
                  some: {
                    student: {
                      userProfileId: session.id,
                    },
                  },
                },
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
                // classRegisterLogs: {
                subjectClassStudent: {
                  some: {
                    student: {
                      userProfileId: session.id,
                    },
                  },
                },
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
  },
})

app.openapi(classRegister, async (c) => {
  const session = c.get("user")
  const { sessionId, subjectClassIds, curriculumVersionId } = c.req.valid("json")

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

  // TODO: check subjectVersionIds, prerequisiteSubjectIds, coRequisiteSubjectIds

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

  await prisma.$transaction(async (tx) => {
    await tx.classRegisterLogs.createMany({
      data: subjectClassIds.map((subjectClassId) => ({
        classRegisterSessionId: sessionId,
        studentId,
        subjectClassId,
      })),
    })

    for (const subjectClassId of subjectClassIds) {
      const isExist = await tx.studentSubjectScore.findFirst({
        where: { studentId, subjectClassId },
      })
      if (isExist) throw new Error("Bạn đã đăng ký học phần này")

      const currentEnrolled = await tx.studentSubjectScore.count({ where: { subjectClassId } })
      const subjectClass = await tx.subjectClass.findUniqueOrThrow({
        where: { id: subjectClassId },
        include: { subject: true },
      })
      if ((subjectClass.maxStudent || 0) <= currentEnrolled) {
        throw new Error("Lớp học đã đủ số lượng sinh viên")
      }

      await tx.studentSubjectScore.create({
        data: { subjectClassId, studentId, subjectVersionId: subjectClass.subjectId },
      })
    }
  })

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
  },
})

app.openapi(classUnregister, async (c) => {
  const session = c.get("user")
  const { sessionId, subjectClassIds, curriculumVersionId } = c.req.valid("json")

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

  const studentSubjectScores = await prisma.studentSubjectScore.findMany({
    where: {
      studentId,
      subjectClassId: { in: subjectClassIds },
      attendanceScore: { not: null },
      midtermScore: { not: null },
      finalScore: { not: null },
      examPaper: {},
      studentResearchTopic: {},
      studentInternship: {},
    },
    include: { studentSubjectScoreHistory: true },
  })

  if (studentSubjectScores.length > 0) {
    return c.json({ message: "Bạn không thể hủy đăng ký lớp học đã có điểm" }, 400)
  }

  await prisma.$transaction(async (tx) => {
    await tx.classRegisterLogs.deleteMany({
      where: {
        classRegisterSessionId: sessionId,
        studentId,
        subjectClassId: {
          in: subjectClassIds,
        },
      },
    })

    for (const subjectClassId of subjectClassIds) {
      await tx.studentSubjectScoreHistory.deleteMany({
        where: {
          studentSubjectScore: { subjectClassId, studentId },
        },
      })

      await tx.studentSubjectScore.deleteMany({
        where: { subjectClassId, studentId },
      })
    }
  })

  return c.json({ message: "success" }, 200)
})

const getStudentInfo = createRoute({
  operationId: "get-student-info",
  path: "/get-student-info",
  tags: ["ClassRegister"],
  summary: "Lấy thông tin sinh viên",
  description: "Lấy thông tin sinh viên gồm GPA, xếp loại, tín chỉ tối đa",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().openapi({ description: "ID đợt đăng ký lớp học" }),
            curriculumVersionId: z
              .string()
              .openapi({ description: "ID phiên bản chương trình học" })
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thông tin sinh viên",
      content: {
        "application/json": {
          schema: z.object({
            studentId: z.string(),
            userProfile: models.UserProfileScalarSchema.pick({
              fullname: true,
            }),
            gpaBase10: z.number().nullable(),
            gpaBase4: z.number().nullable(),
            classification: z.string().nullable(),
            maxCredit: z.number().nullable(),
          }),
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

app.openapi(getStudentInfo, async (c) => {
  const session = c.get("user")
  const { sessionId, curriculumVersionId } = c.req.valid("json")

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

  const registerSession = await prisma.classRegisterSession.findUniqueOrThrow({
    where: { id: sessionId },
  })

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

  return c.json(
    {
      studentId,
      userProfile: {
        fullname: profile.fullname,
      },
      gpaBase10: nearestSemesterResult?.gpaBase10?.toNumber() ?? null,
      gpaBase4: nearestSemesterResult?.gpaBase4?.toNumber() ?? null,
      classification,
      maxCredit,
    },
    200
  )
})

export default app
