import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { Prisma } from "@workspace/db"
import { prisma } from ".."
import { ErrorCode, FailedResponseSchema } from "../dto/base"
import { RegistrationRequest, RegistrationResponse, TYPE_RES } from "../dto/registration.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const registration = createRoute({
  operationId: "registration",
  path: "/registration",
  tags: ["Đăng ký học phần"],
  summary: "2.3 2.4. Đăng ký/Huỷ đăng ký học phần",
  description: `Đăng ký hoặc hủy đăng ký một hoặc nhiều lớp học phần trong đợt đang mở.

**Bảng dữ liệu nguồn:** Student, ClassRegisterSession, SubjectClass, ClassRegisterLogs.

**Tham số:** students_code, class_data (danh sách SubjectClass.id), type_res (R=đăng ký, C=hủy).`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegistrationRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: RegistrationResponse,
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

app.openapi(registration, async (c) => {
  const { students_code, class_data, type_res } = c.req.valid("json")
  const student = await prisma.student.findUnique({
    where: { code: students_code },
    include: {
      fixedClass: {
        include: {
          trainingCourse: true,
        },
      },
    },
  })

  if (!student) {
    return c.json(
      { result_code: ErrorCode.STUDENT_NOT_FOUND, result_desc: "sinh viên không tồn tại" },
      404
    )
  }

  if (!student?.fixedClass) {
    return c.json(
      { result_code: ErrorCode.STUDENT_NO_CLASS, result_desc: "sinh viên không có lớp" },
      404
    )
  }

  const now = new Date()
  const registerSession = await prisma.classRegisterSession.findMany({
    where: {
      active: true,
      deletedAt: null,
      startDate: { lte: now },
      endDate: { gte: now },
      trainingCourses: {
        some: { id: student.fixedClass.trainingCourseId },
      },
    },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      semesterId: true,
    },
  })

  if (!registerSession.length) {
    return c.json(
      {
        result_code: ErrorCode.SESSION_NOT_FOUND,
        result_desc: "không có đợt đăng ký",
      },
      404
    )
  }

  const currentSession = registerSession[0]
  if (!currentSession) {
    return c.json(
      {
        result_code: ErrorCode.SESSION_NOT_FOUND,
        result_desc: "không có đợt đăng ký",
      },
      404
    )
  }
  const sessionId = currentSession.id
  const semesterIds = registerSession.map((s) => s.semesterId)
  const class_valid: string[] = []
  const class_invalid: string[] = []
  const descriptions: string[] = []
  const sortedClassData = [...class_data].sort()

  await prisma.$transaction(async (tx) => {
    // Lock SubjectClass rows (sorted order prevents deadlocks)
    if (sortedClassData.length > 0) {
      await tx.$queryRaw`
        SELECT id FROM "ql-dao-tao"."SubjectClass"
        WHERE id IN (${Prisma.join(sortedClassData)})
        ORDER BY id
        FOR UPDATE
      `
    }

    for (const cls of class_data) {
      try {
        const subjectClass = await tx.subjectClass.findFirst({
          where: {
            id: cls,
            semesterId: { in: semesterIds },
          },
          include: {
            subject: true,
          },
        })

        if (!subjectClass) {
          throw new Error(`Lớp học ${cls} không hợp lệ`)
        }

        const existed = await tx.classRegisterLogs.findFirst({
          where: {
            studentId: student.id,
            subjectClassId: subjectClass.id,
            classRegisterSessionId: sessionId,
          },
        })

        if (type_res === TYPE_RES.REGISTER) {
          if (existed) {
            throw new Error(`Bạn đã đăng ký lớp ${subjectClass.subject.name}`)
          }

          const registeredCount = await tx.classRegisterLogs.count({
            where: {
              subjectClassId: subjectClass.id,
              classRegisterSessionId: sessionId,
            },
          })

          if (registeredCount >= subjectClass.maxStudent) {
            throw new Error(`Lớp ${subjectClass.subject.name} đã đủ số lượng`)
          }
          await tx.classRegisterLogs.create({
            data: {
              studentId: student.id,
              subjectClassId: subjectClass.id,
              classRegisterSessionId: sessionId,
            },
          })
        }

        if (type_res === TYPE_RES.CANCEL) {
          if (!existed) {
            throw new Error(`Bạn chưa đăng ký lớp ${subjectClass.subject.name}`)
          }

          await tx.classRegisterLogs.delete({
            where: { id: existed.id },
          })
        }

        class_valid.push(cls)
      } catch (err) {
        class_invalid.push(cls)
        descriptions.push((err as Error).message)
      }
    }
  })

  return c.json(
    {
      result_code: "000",
      result_desc: "success" as const,
      students_code,
      class_valid,
      class_invalid,
      invalid_desc: descriptions.join(", "),
    },
    200
  )
})

export default app
