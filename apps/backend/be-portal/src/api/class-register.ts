import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { models } from "@workspace/db/zod"
import { prisma } from "../prisma"
import { findClassRegisterSession } from "../services/register"
import {
  CACHE_TTL,
  RATE_LIMIT,
  cacheGet,
  cacheSet,
  classRegisterCache,
  rateLimitConsume,
  rateLimitKey,
  seatCache,
} from "../services/redis-cache"
import { $Enums, AcademicRankingBaseType, Prisma } from "@workspace/db"
import { toRegistrationError } from "../services/class-registration"
import { getJobStatus, setJobStatus } from "../services/class-registration/job-store"
import { KAFKA_ENABLED, enqueueRegistration } from "../services/class-registration/kafka-queue"
import { processRegistration } from "../services/class-registration/process"
import { matchCreditLimitByCourseBaseScore } from "../services/class-registration/credit-limit"
import { recordRegistrationFailure } from "../services/class-registration/record-failure"
import { getRegistrationStats } from "../services/class-registration/registration-stats"

const app = new OpenAPIHono({ strict: false })

/** Cấu trúc tối thiểu của payload get-classes-info cần cho overlay sĩ số */
type ClassesInfoPayload = Array<{
  subjectClass: Array<{
    id: string
    enrolledCount?: number
    _count: { subjectClassStudent: number }
  }>
}>

/**
 * Ghi đè sĩ số realtime từ Redis hash lên payload (cache hit).
 * seatCache lỗi/miss → giữ nguyên số từ payload (fallback DB, không chặn response).
 */
async function overlaySeats<T extends ClassesInfoPayload>(sessionId: string, data: T): Promise<T> {
  const seats = await seatCache.getAll(sessionId)
  if (!seats) return data
  for (const version of data) {
    for (const subjectClass of version.subjectClass) {
      const enrolled = seats.get(subjectClass.id)
      if (enrolled != null) {
        subjectClass._count.subjectClassStudent = enrolled
        if (typeof subjectClass.enrolledCount === "number") {
          subjectClass.enrolledCount = enrolled
        }
      }
    }
  }
  return data
}

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
  console.log(
    `[class-register] get-class-register-session user=${session?.userName} id=${session?.id}`
  )
  const registerSessions = await findClassRegisterSession(session.id)
  console.log(
    `[class-register] get-class-register-session ok id=${session?.id} sessions=${registerSessions?.length ?? 0}`
  )
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

  if (!sessionId?.trim() || !curriculumVersionId?.trim()) {
    return c.json({ message: "Thiếu sessionId hoặc curriculumVersionId" }, 400)
  }

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
  // CACHE-ASIDE: kiểm tra Redis trước — hit thì overlay sĩ số realtime rồi trả ngay,
  // miss (hoặc Redis lỗi / payload lệch shape → cacheGet trả null) thì rơi xuống query DB
  const cached = await cacheGet<unknown>(cacheKey)
  if (Array.isArray(cached)) {
    await overlaySeats(sessionId, cached as ClassesInfoPayload)
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
          studentSemesterResult: {
            take: 1,
            orderBy: { semesterIndexInCourse: "desc" },
            select: { totalFailedCredits: true },
          },
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

  // byCurriculum=false: chỉ lọc theo SubjectClass.trainingObjectTypeId
  // (không lọc SubjectVersion.trainingObjectTypeId — học phần gốc có thể lệch TOT với lớp mở)
  const subjectVersions = await prisma.subjectVersion.findMany({
    where: {
      ...(byCurriculumBool ? { id: { in: curriculumSubjects.map((item) => item.subjectId) } } : {}),
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

  // Cache miss: lưu payload (TTL 3 phút) + seed hash sĩ số từ số liệu DB (nguồn chuẩn)
  await cacheSet(cacheKey, data, CACHE_TTL.classesInfo)
  await seatCache.seed(
    sessionId,
    data.flatMap((version) =>
      version.subjectClass.map((sc) => ({
        subjectClassId: sc.id,
        enrolled: sc._count.subjectClassStudent,
      }))
    )
  )
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
      description: "Đăng ký thành công (xử lý đồng bộ — fallback khi queue không khả dụng)",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    202: {
      description: "Yêu cầu đã vào hàng đợi — FE poll /registration-status/{jobId} để lấy kết quả",
      content: {
        "application/json": {
          schema: z.object({ message: z.string(), jobId: z.string() }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    409: {
      description: "Conflict (đã đăng ký / xung đột phiên bản dữ liệu)",
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
    503: {
      description: "Service overloaded",
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

  if (subjectClassIds.length === 0) {
    return c.json({ message: "Danh sách lớp đăng ký trống" }, 400)
  }

  // ===== PRODUCER: không ghi DB trực tiếp — đẩy vào Kafka rồi trả 202 ngay =====
  // Điều kiện trả 202: lưu được job status vào Redis (để FE poll) VÀ produce Kafka thành công.
  // Thiếu một trong hai → fallback xử lý đồng bộ bên dưới (hệ thống không sập vì queue lỗi).
  if (KAFKA_ENABLED) {
    const jobId = crypto.randomUUID()
    const statusStored = await setJobStatus({
      jobId,
      userId: session.id,
      status: "pending",
      message: "Yêu cầu đã được tiếp nhận và đang xử lý",
      attempts: 0,
      updatedAt: new Date().toISOString(),
    })

    if (statusStored) {
      const enqueued = await enqueueRegistration({
        jobId,
        userId: session.id,
        sessionId,
        subjectClassIds,
        curriculumVersionId,
        timestamp: new Date().toISOString(),
        attempts: 0,
      })

      if (enqueued) {
        return c.json({ message: "Yêu cầu đã được tiếp nhận và đang xử lý", jobId }, 202)
      }
    }
    console.warn("[class-register] queue không khả dụng → fallback xử lý đồng bộ")
  }

  // ===== FALLBACK SYNC: chạy pipeline đăng ký trực tiếp (có DB Locking) =====
  try {
    await processRegistration(prisma, {
      userId: session.id,
      sessionId,
      subjectClassIds,
      curriculumVersionId,
    })
  } catch (err) {
    const regErr = toRegistrationError(err)
    if (regErr) {
      console.warn(
        `[class-register] register rejected user=${session.id} code=${regErr.code} status=${regErr.status}`
      )
      await recordRegistrationFailure(prisma, {
        userId: session.id,
        sessionId,
        subjectClassIds,
        code: regErr.code,
        message: regErr.message,
        attempts: 0,
      })
      return c.json({ message: regErr.message }, regErr.status)
    }
    throw err
  }

  return c.json({ message: "success" }, 200)
})

// ===== API POLLING: FE gọi mỗi 2 giây tới khi nhận success/failed =====
const registrationStatus = createRoute({
  operationId: "get-registration-status",
  path: "/registration-status/{jobId}",
  tags: ["ClassRegister"],
  summary: "Tra cứu kết quả đăng ký theo jobId",
  description: "Đọc trạng thái job đăng ký từ Redis (pending | processing | success | failed)",
  method: "get",
  request: {
    params: z.object({
      jobId: z.string().openapi({ description: "jobId nhận được từ response 202" }),
    }),
  },
  responses: {
    200: {
      description: "Trạng thái job",
      content: {
        "application/json": {
          schema: z.object({
            jobId: z.string(),
            status: z.enum(["pending", "processing", "success", "failed"]),
            message: z.string(),
            attempts: z.number(),
          }),
        },
      },
    },
    404: {
      description: "Không tìm thấy job (sai id, hết hạn, hoặc của người khác)",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
  },
})

app.openapi(registrationStatus, async (c) => {
  const session = c.get("user")
  const { jobId } = c.req.valid("param")

  const job = await getJobStatus(jobId)
  // Chỉ chủ job xem được kết quả
  if (!job || job.userId !== session.id) {
    return c.json({ message: "Không tìm thấy yêu cầu đăng ký" }, 404)
  }

  return c.json(
    {
      jobId: job.jobId,
      status: job.status,
      message: job.message,
      attempts: job.attempts,
    },
    200
  )
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
  const seatDeltas: Array<{ subjectClassId: string; delta: number }> = []

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
      const removed = await tx.studentSubjectScore.deleteMany({
        where: { subjectClassId, studentId: { in: studentIds } },
      })

      // Trả chỗ: giảm sĩ số denormalized + tăng version (đồng bộ với luồng đăng ký)
      if (removed.count > 0) {
        await tx.$executeRaw`
          UPDATE "ql-dao-tao"."SubjectClass"
          SET "enrolledCount" = GREATEST("enrolledCount" - ${removed.count}, 0),
              "version" = "version" + 1
          WHERE id = ${subjectClassId}
        `
        seatDeltas.push({ subjectClassId, delta: -removed.count })
      }
    }
  })

  await classRegisterCache.invalidateUser(session.id, sessionId)

  // Trả chỗ trống realtime trên Redis (HINCRBY âm) sau khi DB xóa thành công
  await seatCache.adjust(sessionId, seatDeltas)

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
            userProfile: z
              .object({
                id: z.string(),
                code: z.string().nullish(),
                fullname: z.string().nullish(),
              })
              .nullish(),
            student: z
              .object({
                id: z.string(),
                code: z.string().nullish(),
                status: z.string().nullish(),
              })
              .nullish(),
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

  // Lấy updatedAt đợt sớm để bust cache khi admin sửa creditLimit / ngày mở đóng
  let sessionUpdatedAtMs = 0
  let registerSessionSemesterStart: Date | null = null
  if (sessionId) {
    const registerSessionMeta = await prisma.classRegisterSession.findUnique({
      where: { id: sessionId },
      select: {
        updatedAt: true,
        semester: { select: { startDate: true } },
      },
    })
    sessionUpdatedAtMs = registerSessionMeta?.updatedAt?.getTime() ?? 0
    registerSessionSemesterStart = registerSessionMeta?.semester?.startDate ?? null
  }

  const cacheKey = classRegisterCache.studentKey(
    session.id,
    sessionId || "_",
    sessionUpdatedAtMs || undefined
  )
  const cached = await cacheGet<{
    userProfile: unknown
    student: unknown
    latestSemesterResult: unknown
    creditLimit: { maxCredit: number } | null
  }>(cacheKey)
  if (cached && typeof cached === "object" && cached.userProfile) {
    return c.json(cached, 200)
  }

  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { id: session.id },
    select: {
      id: true,
      code: true,
      fullname: true,
      educationAndTraining: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true },
      },
    },
  })

  const studentId = profile.educationAndTraining[0]?.id
  if (!studentId) {
    return c.json({ message: "Không tìm thấy thông tin học vụ" }, 404)
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      fixedClass: {
        select: {
          trainingCourse: {
            select: { baseScore: true },
          },
        },
      },
    },
  })

  const courseBaseScore =
    student?.fixedClass?.trainingCourse?.baseScore ?? AcademicRankingBaseType.Base10

  let latestSemesterResult: {
    rank: { classification: string | null } | null
    baseScore: AcademicRankingBaseType | null
    gpaBase4: Prisma.Decimal | null
    gpaBase10: Prisma.Decimal | null
    cumulativeGpaBase4: Prisma.Decimal | null
    cumulativeGpaBase10: Prisma.Decimal | null
  } | null = null

  if (sessionId && registerSessionSemesterStart) {
    // Lấy đúng kỳ gần nhất đã hoàn thành trước kỳ đăng ký.
    // Credit limit phải dựa trên GPA kỳ gần nhất (theo màn kết quả học tập),
    // không dùng điểm tích lũy toàn khóa.
    latestSemesterResult = await prisma.studentSemesterResult.findFirst({
      where: {
        studentId,
        semester: { startDate: { lt: registerSessionSemesterStart } },
      },
      orderBy: { semester: { startDate: "desc" } },
      select: {
        rank: {
          select: {
            classification: true,
          },
        },
        baseScore: true,
        gpaBase4: true,
        gpaBase10: true,
        cumulativeGpaBase4: true,
        cumulativeGpaBase10: true,
      },
    })
  }

  if (!latestSemesterResult) {
    latestSemesterResult = await prisma.studentSemesterResult.findFirst({
      where: { studentId },
      orderBy: { semesterIndexInCourse: "desc" },
      select: {
        rank: {
          select: {
            classification: true,
          },
        },
        baseScore: true,
        gpaBase4: true,
        gpaBase10: true,
        cumulativeGpaBase4: true,
        cumulativeGpaBase10: true,
      },
    })
  }

  let maxCredit = null

  if (sessionId && latestSemesterResult) {
    const maxCreditsSetting = await prisma.classRegisterSessionCredit.findMany({
      where: { classRegisterSessionId: sessionId, deletedAt: null },
      orderBy: [{ base10Min: "asc" }, { base4Min: "asc" }],
    })

    if (maxCreditsSetting.length > 0) {
      const matchedLimit = matchCreditLimitByCourseBaseScore(
        maxCreditsSetting,
        courseBaseScore,
        Number(latestSemesterResult.gpaBase4 ?? latestSemesterResult.cumulativeGpaBase4) || 0,
        Number(latestSemesterResult.gpaBase10 ?? latestSemesterResult.cumulativeGpaBase10) || 0
      )

      if (matchedLimit && matchedLimit.maxCredit != null) {
        maxCredit = matchedLimit.maxCredit
      }
    }
  }

  const payload = {
    userProfile: {
      id: profile.id,
      code: profile.code,
      fullname: profile.fullname,
    },
    student: student
      ? {
          id: student.id,
          code: profile.code,
          status: student.status,
        }
      : null,
    latestSemesterResult: latestSemesterResult
      ? {
          rank: latestSemesterResult.rank,
          baseScore: latestSemesterResult.baseScore,
          // Giữ shape cũ cho FE, nhưng trả về GPA kỳ gần nhất.
          cumulativeGpaBase4:
            latestSemesterResult.gpaBase4 != null
              ? Number(latestSemesterResult.gpaBase4)
              : latestSemesterResult.cumulativeGpaBase4 != null
                ? Number(latestSemesterResult.cumulativeGpaBase4)
                : null,
          cumulativeGpaBase10:
            latestSemesterResult.gpaBase10 != null
              ? Number(latestSemesterResult.gpaBase10)
              : latestSemesterResult.cumulativeGpaBase10 != null
                ? Number(latestSemesterResult.cumulativeGpaBase10)
                : null,
        }
      : null,
    creditLimit: maxCredit != null ? { maxCredit } : null,
  }

  await cacheSet(cacheKey, payload, CACHE_TTL.student)
  return c.json(payload, 200)
})

const registrationStats = createRoute({
  operationId: "registration-stats",
  path: "/registration-stats",
  tags: ["ClassRegister"],
  summary: "Thống kê đăng ký học theo đợt và khoảng thời gian",
  description:
    "Trả về số SV đã đăng ký / chưa đăng ký / lỗi, kèm danh sách chi tiết lần đăng ký lỗi (SV, lớp môn, thời gian).",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            classRegisterSessionId: z.string(),
            from: z.string().min(1),
            to: z.string().min(1),
            page: z.number().int().min(1).optional(),
            pageSize: z.number().int().min(1).max(100).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thống kê đăng ký",
      content: {
        "application/json": {
          schema: z.object({
            summary: z.object({
              eligibleCount: z.number(),
              registeredCount: z.number(),
              notRegisteredCount: z.number(),
              failedCount: z.number(),
            }),
            failures: z.object({
              total: z.number(),
              page: z.number(),
              pageSize: z.number(),
              items: z.array(
                z.object({
                  id: z.string(),
                  occurredAt: z.string(),
                  code: z.string().nullable(),
                  message: z.string(),
                  student: z.object({
                    id: z.string().nullable(),
                    studentCode: z.string().nullable(),
                    fullName: z.string().nullable(),
                    fixedClassName: z.string().nullable(),
                  }),
                  subjectClasses: z.array(
                    z.object({
                      id: z.string(),
                      classCode: z.string(),
                      subjectName: z.string(),
                    })
                  ),
                })
              ),
            }),
            from: z.string(),
            to: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(registrationStats, async (c) => {
  const body = c.req.valid("json")
  const from = new Date(body.from)
  const to = new Date(body.to)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return c.json({ message: "from/to không hợp lệ" }, 400)
  }
  if (from > to) {
    return c.json({ message: "from phải nhỏ hơn hoặc bằng to" }, 400)
  }

  try {
    const result = await getRegistrationStats(prisma, {
      classRegisterSessionId: body.classRegisterSessionId,
      from,
      to,
      page: body.page,
      pageSize: body.pageSize,
    })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lấy thống kê thất bại"
    if (message.includes("Không tìm thấy")) {
      return c.json({ message }, 404)
    }
    return c.json({ message }, 400)
  }
})

const invalidateRegistrationCache = createRoute({
  operationId: "invalidate-registration-cache",
  path: "/invalidate-cache",
  tags: ["ClassRegister"],
  summary: "Xóa cache đăng ký học theo đợt",
  description:
    "Gọi sau khi admin sửa/đóng đợt đăng ký để SV thấy ngay ngày mở/đóng, khóa, creditLimit mới.",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            classRegisterSessionId: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Đã xóa cache",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            deleted: z.number(),
          }),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(invalidateRegistrationCache, async (c) => {
  const { classRegisterSessionId } = c.req.valid("json")
  if (!classRegisterSessionId) {
    return c.json({ message: "Thiếu classRegisterSessionId" }, 400)
  }
  const { deleted } = await classRegisterCache.invalidateSession(classRegisterSessionId)
  return c.json({ message: "Đã reset cache đăng ký học", deleted }, 200)
})

export default app
