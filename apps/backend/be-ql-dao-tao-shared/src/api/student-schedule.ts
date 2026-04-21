import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import _ from "lodash"
import { prisma } from ".."
import { FailedResponseSchema } from "../dto/base"
import { StudentScheduleRequest, StudentScheduleResponse } from "../dto/student-schedule"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const postStudentSchedule = createRoute({
  operationId: "schedules",
  path: "/schedules",
  tags: ["Schedules"],
  summary: "2.6. Thời khoá biểu",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StudentScheduleRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: StudentScheduleResponse,
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

app.openapi(postStudentSchedule, async (c) => {
  const { class_terms, students_code } = c.req.valid("json")

  const student = await prisma.subjectClass.findMany({
    where: {
      subjectClassStudent: {
        some: {
          student: {
            code: students_code,
          },
        },
      },
      semester: {
        name: class_terms,
      },
    },

    select: {
      room: {
        select: {
          name: true,
          code: true,
        },
      },

      subjectClassTimes: {
        select: {
          dayOfWeek: true,
          startPeriod: true,
          endPeriod: true,
        },
      },
      code: true,
      subject: {
        select: {
          name: true,
          code: true,
          credit: true,
        },
      },
    },
  })

  const studentScheduleList = student.map((item) => {
    const uniqueTimes = _.uniqBy(item.subjectClassTimes, "dayOfWeek")
    const class_time = uniqueTimes
      .map((tkb) => {
        const dayLabel = tkb.dayOfWeek === 8 ? "CN" : `T${tkb.dayOfWeek}`
        return `${dayLabel} - ${tkb.startPeriod} - ${tkb.endPeriod}`
      })
      .join(", ")

    return {
      courses_code: item.subject.code ?? "",
      courses_name: item.subject.name ?? "",
      class_credit_hour: item.subject.credit ?? 0,
      class_id: item.code,
      class_time: class_time,
      class_classroom: item.room?.name ?? "",
    }
  })

  return c.json(
    {
      result_code: "000",
      result_desc: "success" as const,
      class_terms: class_terms ?? "",
      students_code: students_code ?? "",
      students_schedules: studentScheduleList,
    },
    200
  )
})

export default app
