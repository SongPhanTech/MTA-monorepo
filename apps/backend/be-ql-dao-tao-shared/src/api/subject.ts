import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import type { $Enums } from "@workspace/db"
import { prisma } from ".."
import { GetListSubjectRequest, GetListSubjectResponse } from "../dto/subject.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getListSubject = createRoute({
  operationId: "get-list-subject",
  tags: ["Môn học"],
  path: "get-list-subject",
  summary: "2.15. Lấy danh sách môn học",
  description: `Danh sách học phần / phiên bản môn học.

**Bảng dữ liệu nguồn:** SubjectVersion.

**Tham số:** key_word — tìm theo mã hoặc tên môn.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetListSubjectRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: GetListSubjectResponse,
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
