import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from ".."
import {
  GetRegistrationErrorResponse,
  GetRegistrationRequest,
  GetRegistrationResponse,
} from "../dto/get-registration.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getRegistration = createRoute({
  operationId: "get-registration",
  tags: ["Lịch sử đăng ký"],
  path: "get-registration",
  summary: "2.5 Lấy danh sách học phần đã đăng kí",
  description: `Trả về mã các lớp học phần sinh viên đã đăng ký trong một học kỳ.

**Bảng dữ liệu nguồn:** Student, ClassRegisterSession, Semester, ClassRegisterLogs, SubjectClass.

**Tham số:** class_terms (tên học kỳ), students_code (mã SV).`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetRegistrationRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: GetRegistrationResponse,
        },
      },
    },
    404: {
      description: "Không tìm thấy sinh viên hoặc đợt đăng ký",
      content: {
        "application/json": {
          schema: GetRegistrationErrorResponse,
        },
      },
    },
  },
})
app.openapi(getRegistration, async (c) => {
  const { class_terms, students_code } = c.req.valid("json")
  const student = await prisma.student.findUnique({
    where: { code: students_code },
  })

  if (!student) {
    return c.json(
      {
        result_code: "STUDENT_NOT_FOUND",
        result_desc: "Sinh viên không tồn tại",
      },
      404
    )
  }
  const sessions = await prisma.classRegisterSession.findMany({
    where: {
      active: true,
      deletedAt: null,
      semester: {
        name: {
          contains: class_terms.trim(),
          mode: "insensitive",
        },
      },
    },
    select: { id: true },
  })

  if (!sessions.length) {
    return c.json(
      {
        result_code: "SESSION_NOT_FOUND",
        result_desc: "Không có kỳ đăng ký phù hợp",
      },
      404
    )
  }

  const sessionIds = sessions.map((s) => s.id)
  const logs = await prisma.classRegisterLogs.findMany({
    where: {
      studentId: student.id,
      classRegisterSessionId: { in: sessionIds },
    },
    include: {
      subjectClass: {
        select: { code: true },
      },
    },
  })

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      students_code,
      class_reg: logs.map((l) => l.subjectClass.code),
    },
    200
  )
})

export default app
