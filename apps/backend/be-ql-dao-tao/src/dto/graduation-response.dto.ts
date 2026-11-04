import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const GraduationConflictResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo lỗi xung đột dữ liệu.")),
    existing: z.array(z.string()).optional().openapi(fieldDesc("Danh sách mã / ID đã tồn tại.")),
    shouldSkip: z
      .array(z.number())
      .optional()
      .openapi(fieldDesc("Chỉ số dòng Excel nên bỏ qua khi import.")),
  })
  .openapi("GraduationConflictResponse")

export const GraduationClassificationCountSchema = z
  .object({
    count: z.number().openapi(fieldDesc("Số học viên trong nhóm xếp loại.")),
    year: z.number().openapi(fieldDesc("Năm tốt nghiệp.")),
    classification: z.string().openapi(fieldDesc("Xếp loại tốt nghiệp (Giỏi, Khá, …).")),
  })
  .openapi("GraduationClassificationCount")

export const PptxBinaryResponseSchema = z.string().openapi({
  type: "string",
  format: "binary",
  description: "File PowerPoint (.pptx) — tải về qua header Content-Disposition.",
})

export const GraduationTranscriptSubjectSchema = z
  .object({
    id: z.string(),
    subjectVersionId: z.string(),
    code: z.string().nullable(),
    name: z.string(),
    credit: z.number(),
    type: z.string().nullable(),
    attendanceScore: z.number().nullable(),
    midtermScore: z.number().nullable(),
    examScore: z.number().nullable(),
    finalScore: z.number().nullable(),
    scoreBase4: z.number().nullable(),
    letter: z.string().nullable(),
    passed: z.boolean(),
    exempted: z.boolean(),
    usedForGpa: z.boolean(),
    equivalentNote: z.string().nullable(),
  })
  .openapi("GraduationTranscriptSubject")

export const GraduationTranscriptBlockSchema = z
  .object({
    id: z.string(),
    code: z.string().nullable(),
    name: z.string(),
    subjectsInCurriculum: z.array(GraduationTranscriptSubjectSchema),
  })
  .openapi("GraduationTranscriptBlock")

export const GraduationTranscriptSchema = z
  .object({
    studentId: z.string(),
    fullname: z.string(),
    studentCode: z.string().nullable(),
    curriculumVersionName: z.string().nullable(),
    gpaBase10: z.number(),
    gpaBase4: z.number(),
    totalPassCredit: z.number(),
    requiredCredits: z.number().nullable(),
    accumulatedElectiveCredits: z.number(),
    electiveCreditsRequired: z.number(),
    curriculumBlocks: z.array(GraduationTranscriptBlockSchema),
    extraCurriculumSubjects: z.array(GraduationTranscriptSubjectSchema),
    conditionalSubjects: z.array(GraduationTranscriptSubjectSchema),
  })
  .openapi("GraduationTranscript")
