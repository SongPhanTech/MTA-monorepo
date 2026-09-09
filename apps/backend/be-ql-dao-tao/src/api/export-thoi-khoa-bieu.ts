import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { exportThoiKhoaBieu, syncSubjectClassExamDates } from "../services/thoi-khoa-bieu"
import { ErrorMessageResponseSchema, ExcelBinaryResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono()

const exportThoiKhoaBieuRoute = createRoute({
  operationId: "exportThoiKhoaBieu",
  tags: ["Thời khóa biểu"],
  path: "/export-thoi-khoa-bieu",
  method: "post",
  summary: "Xuất thời khóa biểu Excel",
  description: `Xuất thời khóa biểu lớp học phần ra Excel.

**Bảng dữ liệu nguồn:** SubjectClass, ClassSchedule, SubjectClassTime, Semester.

**Tham số:** semesterId, trainingObjectTypeId, trainingCourseId (tùy chọn), type (NORMAL | RETAKE | REEXAM).`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
              trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
              trainingCourseId: z
                .string()
                .optional()
                .openapi(fieldDesc("ID khóa học (lọc tùy chọn).")),
              type: z
                .enum(["NORMAL", "RETAKE", "REEXAM"])
                .optional()
                .openapi(fieldDesc("Loại lớp học phần.")),
            })
            .openapi("ExportThoiKhoaBieuRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel thời khoá biểu",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportThoiKhoaBieuRoute, async (c) => {
  const { semesterId, trainingObjectTypeId, trainingCourseId, type } = c.req.valid("json")

  try {
    const result = await exportThoiKhoaBieu({
      semesterId,
      trainingObjectTypeId,
      trainingCourseId,
      type,
    })

    const fileName = "To-trinh-thoi-khoa-bieu.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất tờ trình thất bại"
    return c.json({ message }, 404)
  }
})

const SyncExamDatesRequestSchema = z
  .object({
    semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
    trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
    trainingCourseId: z.string().optional().openapi(fieldDesc("ID khóa học (lọc tùy chọn).")),
    fixedClassId: z.string().optional().openapi(fieldDesc("ID lớp quản lý (lọc tùy chọn).")),
    type: z
      .enum(["NORMAL", "RETAKE", "REEXAM"])
      .optional()
      .openapi(fieldDesc("Loại lớp học phần.")),
  })
  .openapi("SyncExamDatesRequest")

const SyncExamDatesResponseSchema = z
  .object({
    message: z.string(),
    totalClasses: z.number(),
    matched: z.number(),
    updated: z.number(),
    unchanged: z.number(),
    unmatched: z.number(),
    unmatchedIds: z.array(z.string()),
  })
  .openapi("SyncExamDatesResponse")

const syncExamDatesRoute = createRoute({
  operationId: "syncExamDates",
  tags: ["Thời khóa biểu"],
  path: "/sync-exam-dates",
  method: "post",
  summary: "Đồng bộ ngày thi từ ExamScheduling Public API",
  description: `Gọi public POST \`/subject-classes/exam-dates\` với danh sách SubjectClass.id (sourceIds),
rồi cập nhật \`SubjectClass.examDate\` theo ngày thi sớm nhất của từng lớp.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: SyncExamDatesRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Kết quả đồng bộ ngày thi",
      content: {
        "application/json": {
          schema: SyncExamDatesResponseSchema,
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
    500: {
      description: "Internal error",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(syncExamDatesRoute, async (c) => {
  const body = c.req.valid("json")

  try {
    const result = await syncSubjectClassExamDates(body)
    return c.json(result, 200)
  } catch (error: any) {
    const upstreamMessage =
      error?.response?.data?.message ||
      error?.response?.data?.title ||
      error?.message ||
      "Đồng bộ lịch thi thất bại"
    console.error(
      "[thoi-khoa-bieu] sync-exam-dates failed",
      upstreamMessage,
      error?.response?.status
    )
    if (error?.response?.status === 400) {
      return c.json({ message: String(upstreamMessage) }, 400)
    }
    return c.json({ message: String(upstreamMessage) }, 500)
  }
})

export default app
