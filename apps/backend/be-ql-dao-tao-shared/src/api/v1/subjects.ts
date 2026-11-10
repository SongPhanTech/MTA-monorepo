import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import type { $Enums } from "@workspace/db"
import { prisma } from "../.."
import { V1ErrorResponse, V1SearchQuery, V1SubjectsResponse } from "../../dto/v1.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const desExamType: Record<$Enums.ExamType, string> = {
  offlineWritten: "Thi viết",
  Oral: "Thi vấn đáp",
  Other: "Hình thức khác",
  Practice: "Thực hành",
  Project: "Đồ án",
  OnlineWritten: "Thi viết trực tuyến",
  MultipleChoice: "Trắc nghiệm",
  PracticeExercise: "Bài tập thực hành",
  ProjectDefense: "Bảo vệ đồ án",
  Report: "Báo cáo",
  ListeningSpeakingReadingWriting: "Nghe nói đọc viết",
  ReadingWriting: "Đọc viết",
  ListeningSpeaking: "Nghe nói",
  ListeningReadingWriting: "Nghe đọc viết",
  Unspecified: "Chưa xác định",
}

const listSubjects = createRoute({
  operationId: "v1-list-subjects",
  tags: ["V1 — Học phần"],
  path: "/subjects",
  method: "get",
  summary: "Danh sách học phần",
  description: `RESTful list học phần (SubjectVersion).

**Scope:** \`read:subjects\`

**Headers:** Authorization Bearer, X-Timestamp, X-Nonce`,
  security: [{ Bearer: [] }],
  request: { query: V1SearchQuery },
  responses: {
    200: {
      description: "Thành công",
      content: { "application/json": { schema: V1SubjectsResponse } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: V1ErrorResponse } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: V1ErrorResponse } },
    },
  },
})

app.openapi(listSubjects, async (c) => {
  const { q } = c.req.valid("query")
  const res = await prisma.subjectVersion.findMany({
    where: q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      code: true,
      name: true,
      credit: true,
      period: true,
      examType: true,
    },
    take: 500,
  })

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      data: res.map((item) => ({
        subject_code: item.code,
        subject_name: item.name,
        courser: item.period ?? 0,
        class_credit_hour: item.credit,
        dvht: Math.floor((item.period ?? 0) / 15),
        description: desExamType[item.examType],
      })),
    },
    200
  )
})

export default app
