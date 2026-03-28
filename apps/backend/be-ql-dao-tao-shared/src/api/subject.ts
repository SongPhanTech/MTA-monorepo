import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { $Enums } from "@workspace/db"
import { prisma } from ".."

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getListSubject = createRoute({
  operationId: "get-list-subject",
  tags: ["Subject"],
  path: "get-list-subject",
  summary: "2.15. Lấy danh sách môn học",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              key_word: z.string().optional(),
            })
            .openapi("GetListSubjectRequest"),
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
              data: z.array(
                z.object({
                  subject_code: z.string().nullish(),
                  subject_name: z.string(),
                  courser: z.number(),
                  class_credit_hour: z.number(),
                  dvht: z.number(),
                  description: z.string(),
                })
              ),
            })
            .openapi("GetListSubjectResponse"),
        },
      },
    },
  },
})

app.openapi(getListSubject, async (c) => {
  const { key_word } = c.req.valid("json")

  const res = await prisma.subjectVersion.findMany({
    where: {
      OR: [
        {
          code: {
            contains: key_word,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: key_word,
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      code: true,
      name: true,
      credit: true,
      period: true,
      examType: true,
    },
  })

  const desExamType: Record<$Enums.ExamType, string> = {
    OfflineWritten: "Thi viết",
    Oral: "Thi vấn đáp",
    Other: "Hình thức khác",
    Practice: "Thực hành",
    Project: "Đồ án",
  }

  return c.json(
    {
      result_code: "000",
      result_desc: "success",
      data: res.map((item) => ({
        subject_code: item.code,
        subject_name: item.name,
        courser: item.period,
        class_credit_hour: item.credit,
        dvht: Math.floor(item.period / 15),
        description: desExamType[item.examType],
      })),
    },
    200
  )
})

export default app
