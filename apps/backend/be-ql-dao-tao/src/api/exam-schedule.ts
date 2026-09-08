import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { fetchLecturerExamSchedules } from "../services/exam-schedule"

const app = new OpenAPIHono({ strict: false })

const ExamScheduleQuerySchema = z.object({
  userProfileId: z.string().optional().openapi({
    description: "ID UserProfile SSO (bắt buộc nếu không có session JWT)",
  }),
  semesterId: z.string().optional().openapi({
    description: "ID kỳ học",
  }),
  schoolYearId: z.string().optional().openapi({
    description: "ID năm học",
  }),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .openapi({
      description: "Từ ngày (YYYY-MM-DD)",
      example: "2026-09-01",
    }),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .openapi({
      description: "Đến ngày (YYYY-MM-DD)",
      example: "2026-09-30",
    }),
})

const LecturerExamScheduleItemSchema = z
  .object({
    Id: z.string(),
    Rownum: z.number().optional(),
    lecturer_code: z.string().nullish(),
    lecturer_name: z.string().nullish(),
    user_profile_id: z.string().nullish(),
    student_count: z.number().nullish(),
    exam_class_code: z.string().nullish(),
    exam_date: z.string().nullish(),
    start_time: z.string().nullish(),
    end_time: z.string().nullish(),
    room_name: z.string().nullish(),
    building_name: z.string().nullish(),
    training_location_name: z.string().nullish(),
    subject_code: z.string().nullish(),
    subject_name: z.string().nullish(),
    credit_count: z.number().nullish(),
    exam_type: z.string().nullish(),
    exam_period_name: z.string().nullish(),
    semester_name: z.string().nullish(),
    school_year_name: z.string().nullish(),
  })
  .passthrough()

const getLecturerExamSchedule = createRoute({
  operationId: "get-lecturer-exam-schedule",
  path: "/lecturer",
  tags: ["ExamSchedule"],
  summary: "Lịch coi thi của giảng viên",
  description:
    "Proxy tới system public `/ExamSchedules/lecturer`. Ưu tiên `userProfileId` từ session JWT; nếu không có thì lấy từ query.",
  method: "get",
  request: {
    query: ExamScheduleQuerySchema,
  },
  responses: {
    200: {
      description: "Danh sách lịch coi thi",
      content: {
        "application/json": {
          schema: z.object({
            Total: z.number(),
            Data: z.array(LecturerExamScheduleItemSchema),
          }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    500: {
      description: "Internal error",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getLecturerExamSchedule, async (c) => {
  const session = c.get("user")
  const query = c.req.valid("query")
  const userProfileId = session?.id || query.userProfileId

  if (!userProfileId) {
    return c.json({ message: "Thiếu userProfileId" }, 400)
  }

  try {
    const data = await fetchLecturerExamSchedules({
      userProfileId,
      semesterId: query.semesterId,
      schoolYearId: query.schoolYearId,
      fromDate: query.fromDate,
      toDate: query.toDate,
    })
    return c.json(data, 200)
  } catch (error: any) {
    const upstreamMessage =
      error?.response?.data?.message ||
      error?.response?.data?.title ||
      error?.message ||
      "Không lấy được lịch coi thi"
    console.error("[exam-schedule] get-lecturer failed", upstreamMessage, error?.response?.status)
    if (error?.response?.status === 400) {
      return c.json({ message: String(upstreamMessage) }, 400)
    }
    return c.json({ message: String(upstreamMessage) }, 500)
  }
})

export default app
