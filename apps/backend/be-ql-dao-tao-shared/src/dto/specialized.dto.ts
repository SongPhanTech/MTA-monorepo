import { z } from "@hono/zod-openapi"
import { SuccessResponseSchema } from "./base"

export const SpecializedRequest = z
  .object({
    key_word: z.string().optional(),
    specialized_code: z.string().optional(),
  })
  .openapi("SpecializedRequest")

export const SpecializedInfo = z
  .object({
    specialized_code: z.string().nullable(),
    specialized_name: z.string(),
    scholastic: z.string(),
    specialized_info: z.string().nullable(),
    program_name: z.string(),
    program_code: z.string().nullable(),
  })
  .openapi("SpecializedInfo")

export type SpecializedInfo = z.infer<typeof SpecializedInfo>

export const SpecializedResponse = SuccessResponseSchema.extend({
  data: z.array(SpecializedInfo),
}).openapi("SpecializedResponse")

// export const SpecializedDetailRequest = z
//     .object({ specialized_code: z.string() })
//     .openapi('SpecializedDetailRequest')

// export const SpecializedDetailResponse = SuccessResponseSchema.merge(SpecializedInfo).openapi(
//     'SpecializedDetailResponse'
// )
