import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { AcademicRankingBaseType } from "@workspace/db"
import { prisma } from ".."
import { ErrorCode, FailedResponseSchema } from "../dto/base"
import {
  RegistrationSessionDetailRequest,
  RegistrationSessionDetailResponse,
  RegistrationSessionRequest,
  RegistrationSessionResponse,
  SESSION_STATUS,
  type SessionInfo,
} from "../dto/registration-session.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getListSessionRegistration = createRoute({
  operationId: "getListSessionRegistration",
  path: "/get-list-session-registration",
  tags: ["Đợt đăng ký"],
  summary: "2.8. Lấy đợt đăng ký học",
  description: `Danh sách đợt đăng ký học phần (theo từ khóa và trạng thái mở/đóng).

**Bảng dữ liệu nguồn:** ClassRegisterSession.

**Tham số:** key_word, session_status (1=mở, 2=đóng).`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegistrationSessionRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: RegistrationSessionResponse,
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: FailedResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: FailedResponseSchema,
        },
      },
    },
  },
})

app.openapi(getListSessionRegistration, async (c) => {
  const { key_word, session_status } = c.req.valid("json")

  const now = new Date()
  const sessions = await prisma.classRegisterSession.findMany({
    where: {
      ...(key_word
        ? {
            name: {
              contains: key_word,
              mode: "insensitive",
            },
          }
        : {}),
      deletedAt: null,
      active: true,

      ...(session_status === SESSION_STATUS.OPENING
        ? {
            startDate: { lte: now },
            endDate: { gte: now },
          }
        : {}),

      ...(session_status === SESSION_STATUS.CLOSED
        ? {
            OR: [
              {
                startDate: { gte: now },
              },
              {
                endDate: { lte: now },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const data: SessionInfo[] = sessions.map((session) => {
    const session_status =
      session.startDate <= now && now <= session.endDate
        ? SESSION_STATUS.OPENING
        : SESSION_STATUS.CLOSED
    return {
      session_code: session.code,
      session_name: session.name,
      session_start: session.startDate,
      session_end: session.endDate,
      session_status,
    }
  })

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      data,
    },
    200
  )
})

const getDetailSessionRegistration = createRoute({
  operationId: "getDetailSessionRegistration",
  path: "/get-detail-session-registration",
  tags: ["Đợt đăng ký"],
  summary: "2.9. Lấy chi tiết đợt đăng ký học",
  description: `Chi tiết đợt đăng ký: thời gian, học phí/tín chỉ, khóa được phép, hạn mức tín chỉ theo điểm.

**Bảng dữ liệu nguồn:** ClassRegisterSession, TrainingCourse, CreditLimit.

**Tham số:** session_code — mã đợt.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegistrationSessionDetailRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: RegistrationSessionDetailResponse,
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: FailedResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: FailedResponseSchema,
        },
      },
    },
  },
})

app.openapi(getDetailSessionRegistration, async (c) => {
  const { session_code } = c.req.valid("json")
  const session = await prisma.classRegisterSession.findUnique({
    where: {
      code: session_code,
      deletedAt: null,
      active: true,
    },
    include: {
      trainingCourses: {
        select: { name: true },
      },
      creditLimit: true,
    },
  })

  if (!session) {
    return c.json(
      {
        result_code: ErrorCode.SESSION_NOT_FOUND,
        result_desc: "không có đợt đăng ký",
      },
      404
    )
  }

  const now = new Date()
  const session_status =
    session.startDate <= now && now <= session.endDate
      ? SESSION_STATUS.OPENING
      : SESSION_STATUS.CLOSED

  const credit_registration_detail = session.creditLimit.map((creditLimit) => {
    const score_start =
      creditLimit.baseScore === AcademicRankingBaseType.Base10
        ? creditLimit.base10Min
        : creditLimit.base4Min
    const score_end =
      creditLimit.baseScore === AcademicRankingBaseType.Base10
        ? creditLimit.base10Max
        : creditLimit.base4Max
    return {
      score_start: score_start || 0,
      score_end: score_end || 10,
      min_credit: creditLimit.minCredit,
      max_credit: creditLimit.maxCredit,
    }
  })

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      session_code,
      session_name: session.name,
      session_start: session.startDate,
      session_end: session.endDate,
      session_status,
      money: session.tuitionPerCredit,
      list_scholastic_code: session.trainingCourses.map((course) => course.name),
      credit_registration_detail,
    },
    200
  )
})

export default app
