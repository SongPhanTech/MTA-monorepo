import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const SpecializedRequest = z
  .object({
    key_word: z
      .string()
      .optional()
      .openapi(
        fieldDesc(
          "Từ khóa tìm theo tên ngành/chuyên ngành (TrainingMajor.name).",
          "Công nghệ thông tin"
        )
      ),
    specialized_code: z
      .string()
      .optional()
      .openapi(fieldDesc("Mã ngành đào tạo (TrainingMajor.code).", "7480201")),
  })
  .openapi("SpecializedRequest")

export const SpecializedInfo = z
  .object({
    specialized_code: z
      .string()
      .nullable()
      .openapi(fieldDesc("Mã ngành / chuyên ngành (TrainingMajor.code).", "7480201")),
    specialized_name: z
      .string()
      .openapi(fieldDesc("Tên ngành đào tạo (TrainingMajor.name).", "Công nghệ thông tin")),
    scholastic: z
      .string()
      .openapi(
        fieldDesc("Tên khóa học liên quan (TrainingCourse.name), nối bằng dấu phẩy.", "K65")
      ),
    specialized_info: z
      .string()
      .nullable()
      .openapi(fieldDesc("Mô tả ngành (TrainingMajor.description).", "")),
    program_name: z
      .string()
      .openapi(fieldDesc("Tên phiên bản CTĐT (CurriculumVersion.name).", "CNTT 2021")),
    program_code: z
      .string()
      .nullable()
      .openapi(fieldDesc("Mã phiên bản CTĐT (CurriculumVersion.code).", "CNTT_2021")),
  })
  .openapi("SpecializedInfo")

export type SpecializedInfo = z.infer<typeof SpecializedInfo>

export const SpecializedResponse = SuccessResponseSchema.extend({
  data: z
    .array(SpecializedInfo)
    .openapi(fieldDesc("Danh sách ngành / chuyên ngành (TrainingMajor).")),
}).openapi("SpecializedResponse")
