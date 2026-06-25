import { z } from "@hono/zod-openapi"
import { models } from "@workspace/db/zod"
import { fieldDesc } from "./openapi-helpers"

export const GenExamBankResultSchema = z
  .object({
    success: z.boolean().openapi(fieldDesc("true = sinh đề thành công.", true)),
    message: z.string().openapi(fieldDesc("Thông báo kết quả.")),
  })
  .openapi("GenExamBankResult")

const ExamBankQuestionWithDetailSchema = models.ExamBankQuestionScalarSchema.extend({
  question: models.QuestionScalarSchema.nullable().optional(),
}).openapi("ExamBankQuestionWithDetail")

export const ExamBankQuestionsResultSchema = z
  .object({
    isGroup: z.boolean().openapi(fieldDesc("Có nhóm trắc nghiệm / tự luận không.")),
    questions: z
      .array(ExamBankQuestionWithDetailSchema)
      .optional()
      .openapi(fieldDesc("Danh sách câu hỏi theo thứ tự (khi isGroup = false).")),
    listQuestionChoice: z
      .array(ExamBankQuestionWithDetailSchema)
      .optional()
      .openapi(fieldDesc("Câu hỏi trắc nghiệm (khi isGroup = true).")),
    listQuestionEssay: z
      .array(ExamBankQuestionWithDetailSchema)
      .optional()
      .openapi(fieldDesc("Câu hỏi tự luận (khi isGroup = true).")),
  })
  .openapi("ExamBankQuestionsResult")
