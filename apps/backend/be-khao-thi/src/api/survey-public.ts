import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  ErrorMessageResponseSchema,
  SuccessBooleanResponseSchema,
} from "../dto/common-response.dto"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { models } from "@workspace/db/zod"
import { prisma } from ".."
import {
  findExistingSurveySession,
  isProfileInSurveyAudience,
  resolveSurveyUserByCode,
} from "../lib/survey-audience"

const app = new OpenAPIHono({ strict: false })

const getPublicSurveys = createRoute({
  operationId: "get-public-surveys",
  path: "/get-public-surveys",
  tags: ["Khảo sát công khai"],
  summary: "Danh sách đợt khảo sát công khai",
  description: "Danh sách đợt khảo sát công khai",
  method: "get",
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Get Survey result",
      content: {
        "application/json": {
          schema: z.array(models.SurveyScalarSchema).openapi("get-public-surveys-result"),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(getPublicSurveys, async (c) => {
  const surveys = await prisma.survey.findMany({
    where: { deletedAt: null, active: true, isPublic: true },
  })

  return c.json(surveys, 200)
})

const getPublicSurvey = createRoute({
  operationId: "get-public-survey",
  path: "/get-public-survey/{id}",
  tags: ["Khảo sát công khai"],
  summary: "Thông tin đợt khảo sát công khai",
  description: "Lấy thông tin đợt khảo sát công khai",
  method: "get",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của khảo sát." }),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Get Survey result",
      content: {
        "application/json": {
          schema: models.SurveyScalarSchema.merge(
            z.object({
              surveyQuestion: z.array(
                models.SurveyQuestionScalarSchema.merge(
                  z.object({
                    surveyQuestionGroup: models.SurveyQuestionGroupScalarSchema.nullable(),
                    specificChoice: models.SpecificChoiceScalarSchema.array(),
                  })
                )
              ),
              surveyChoice: models.SurveyChoiceScalarSchema.array(),
              lectureInfo: z
                .object({
                  firstName: z.string(),
                  lastName: z.string(),
                  academicDegree: z.string().nullish(),
                  academicRank: z.string().nullish(),
                  organization: z.string().nullable(),
                })
                .nullable(),
              subjectClass: models.SubjectClassScalarSchema.nullable(),
              semester: models.SemesterScalarSchema.nullable(),
            })
          ).openapi("get-survey-result"),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(getPublicSurvey, async (c) => {
  const { id } = c.req.valid("param")

  const survey = await prisma.survey.findUnique({
    where: { id, deletedAt: null, active: true },
    include: {
      surveyQuestion: {
        include: {
          surveyQuestionGroup: true,
          specificChoice: true,
        },
      },
      surveyChoice: true,
      lecture: {
        select: {
          userProfile: {
            select: {
              firstName: true,
              lastName: true,
              academicDegreeType: {
                select: { sTen: true },
              },
              academicRankType: {
                select: { sTen: true },
              },
            },
          },
          organization: {
            select: {
              sTen: true,
            },
          },
        },
      },
      subjectClass: true,
      semester: true,
    },
  })
  if (!survey) {
    return c.json({ message: "Đợt khảo sát không tồn tại" }, 404)
  }

  if (survey.startDate > new Date()) {
    return c.json({ message: "Khảo sát chưa mở" }, 400)
  }

  if (survey.endDate && survey.endDate < new Date()) {
    return c.json({ message: "Khảo sát đã đóng" }, 400)
  }

  const { lecture, ...data } = survey

  const lectureInfo = lecture
    ? {
        firstName: lecture.userProfile.firstName ?? "",
        lastName: lecture.userProfile.lastName ?? "",
        academicDegree: lecture.userProfile.academicDegreeType?.sTen,
        academicRank: lecture.userProfile.academicRankType?.sTen,
        organization: lecture.organization?.sTen ?? null,
      }
    : null

  return c.json({ ...data, lectureInfo }, 200)
})

const savePublicSurvey = createRoute({
  operationId: "save-public-survey",
  path: "/save-public-survey",
  tags: ["Khảo sát công khai"],
  summary: "Lưu kết quả khảo sát công khai",
  description: "Lưu kết quả khảo sát công khai",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              surveyId: z.string(),
              profileId: z.string().optional(),
              studentId: z.string().optional(),
              studentCode: z.string().optional(),
              surveyObjectTypeId: z.string().nullish(),
              startedAt: z.string().datetime().optional(),
              responses: z.array(
                z.object({
                  surveyQuestionId: z.string(),
                  answerText: z.string().nullish(),
                  explanation: z.string().nullish(),
                  surveyChoiceId: z.string().nullish(),
                  answeredAt: z.date().optional(),
                })
              ),
            })
            .openapi("save-survey-request"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Save survey result",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema,
        },
      },
    },
    400: {
      description: "failed",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(savePublicSurvey, async (c) => {
  let { surveyId, profileId, studentId, studentCode, surveyObjectTypeId, startedAt, responses } =
    c.req.valid("json")
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId, deletedAt: null, active: true },
    include: { surveyChoice: true },
  })
  if (!survey) {
    return c.json({ message: "Đợt khảo sát không tồn tại" }, 404)
  }
  if (survey.isPublic) {
    if (!survey.anonymous) {
      if (!studentCode) {
        return c.json({ message: "Vui lòng nhập mã" }, 400)
      }

      const resolvedUser = await resolveSurveyUserByCode(studentCode)
      if (!resolvedUser) {
        return c.json({ message: "Mã không tồn tại" }, 404)
      }

      const inAudience = await isProfileInSurveyAudience(prisma, resolvedUser.profileId, surveyId)
      if (!inAudience) {
        return c.json({ message: "Mã không có trong danh sách đối tượng làm khảo sát" }, 400)
      }

      studentId = resolvedUser.studentId
      profileId = resolvedUser.profileId

      const existingSession = await findExistingSurveySession(prisma, surveyId, resolvedUser)

      if (existingSession) {
        return c.json({ message: "Bạn đã hoàn thành bài khảo sát này" }, 400)
      }
    }
  }

  if (survey.startDate > new Date()) {
    return c.json({ message: "Khảo sát chưa mở" }, 400)
  }

  if (survey.endDate && survey.endDate < new Date()) {
    return c.json({ message: "Khảo sát đã đóng" }, 400)
  }

  const responseChoiceIDs = new Set(responses.map((r) => r.surveyChoiceId).filter(Boolean))
  for (const id of responseChoiceIDs) {
    if (!survey.surveyChoice.find((c) => c.id === id)) {
      return c.json({ message: "Lựa chọn không thoả mãn" }, 404)
    }
  }

  await prisma.surveySession.create({
    data: {
      survey: { connect: { id: surveyId } },
      ...(profileId && { profile: { connect: { id: profileId } } }),
      ...(studentId && { student: { connect: { id: studentId } } }),
      ...(surveyObjectTypeId && {
        surveyObjectType: { connect: { id: surveyObjectTypeId } },
      }),
      startedAt,
      completedAt: new Date(),
      isCompleted: true,
      responses: {
        createMany: {
          data: responses,
        },
      },
    },
  })

  return c.json({ success: true, message: "Success" }, 200)
})

const validateUserSurvey = createRoute({
  operationId: "validate-user-survey",
  path: "/validate-user-survey",
  tags: ["Khảo sát công khai"],
  summary: "Kiểm tra mã người làm khảo sát có trong danh sách đối tượng",
  description:
    "Kiểm tra mã học viên, giảng viên hoặc cán bộ có trong danh sách đối tượng làm khảo sát",
  method: "get",
  request: {
    query: z.object({
      studentCode: z.string(),
      surveyId: z.string().optional(),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Get Survey result",
      content: {
        "application/json": {
          schema: z.object({
            studentCode: z.string(),
            exists: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(validateUserSurvey, async (c) => {
  const { studentCode, surveyId } = c.req.valid("query")

  if (!studentCode) {
    return c.json({ message: "Vui lòng nhập mã" }, 400)
  }

  const resolvedUser = await resolveSurveyUserByCode(studentCode)
  if (!resolvedUser) {
    return c.json({ message: "Mã không tồn tại" }, 404)
  }

  if (surveyId) {
    const inAudience = await isProfileInSurveyAudience(prisma, resolvedUser.profileId, surveyId)
    if (!inAudience) {
      return c.json({ message: "Mã không có trong danh sách đối tượng làm khảo sát" }, 400)
    }

    const existingSession = await findExistingSurveySession(prisma, surveyId, resolvedUser)

    if (existingSession) {
      return c.json({ message: "Bạn đã hoàn thành bài khảo sát này" }, 400)
    }
  }

  return c.json({ studentCode, exists: true }, 200)
})

//danh sách khảo sát công khai
const getPublicSurveysV2 = createRoute({
  operationId: "get-public-surveys-v2",
  path: "/get-public-surveys-v2",
  tags: ["Khảo sát công khai"],
  summary: "Danh sách đợt khảo sát công khai (v2)",
  description: "Danh sách đợt khảo sát công khai, lọc theo học kỳ và loại đối tượng đào tạo",
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string().optional().openapi({ description: "ID học kỳ" }),
      trainingObjectTypeId: z
        .string()
        .optional()
        .openapi({ description: "ID loại đối tượng đào tạo" }),
      take: z.coerce.number().optional().default(10).openapi({ description: "Số lượng bản ghi" }),
      skip: z.coerce.number().optional().default(0).openapi({ description: "Bỏ qua số bản ghi" }),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Get Survey result",
      content: {
        "application/json": {
          schema: z
            .object({
              data: z.array(
                models.SurveyScalarSchema.merge(
                  z.object({
                    surveyObjectType: z.array(models.SurveyObjectTypeScalarSchema).optional(),
                    surveyTopic: models.SurveyTopicScalarSchema.nullable().optional(),
                    surveyQuestion: z.array(models.SurveyQuestionScalarSchema).optional(),
                    surveySessions: z.array(models.SurveySessionScalarSchema).optional(),
                    semester: models.SemesterScalarSchema.nullable().optional(),
                  })
                )
              ),
              total: z.number(),
            })
            .openapi("get-public-surveys-v2-result"),
        },
      },
    },
  },
})

app.openapi(getPublicSurveysV2, async (c) => {
  const { semesterId, trainingObjectTypeId, take, skip } = c.req.valid("query")

  const where = {
    deletedAt: null,
    clusterSurveyId: null,
    ...(semesterId ? { semesterId } : {}),
    ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.survey.findMany({
      where,
      include: {
        surveyObjectType: true,
        surveyTopic: true,
        surveyQuestion: true,
        surveySessions: true,
        semester: true,
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.survey.count({ where }),
  ])

  return c.json({ data, total }, 200)
})

export default app
