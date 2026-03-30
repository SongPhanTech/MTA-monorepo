import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."

const app: OpenAPIHono = new OpenAPIHono({ strict: false })
const ErrorResponse = z.object({
  result_code: z.string(),
  result_desc: z.string(),
})
const getRegistration = createRoute({
  operationId: "get-registration",
  tags: ["Get Registration"],
  path: "get-registration",
  summary: "2.5 Lấy danh sách học phần đã đăng kí",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              class_terms: z.string(),
              students_code: z.string(),
            })
            .openapi("GetRegistrationRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z
            .object({
              result_code: z.string(),
              result_desc: z.string(),
              students_code: z.string(),
              class_reg: z.array(z.string()),
            })
            .openapi("GetRegistrationResponse"),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: ErrorResponse,
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
      result_code: "000",
      result_desc: "success",
      students_code,
      class_reg: logs.map((l) => l.subjectClass.code),
    },
    200
  )
})

export default app
