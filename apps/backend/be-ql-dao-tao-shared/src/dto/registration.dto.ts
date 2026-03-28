import { z } from "@hono/zod-openapi"
import { SuccessResponseSchema } from "./base"

export const TYPE_RES = {
  REGISTER: "R",
  CANCEL: "C",
} as const

export const RegistrationRequest = z
  .object({
    students_code: z.string(),
    class_data: z.array(z.string()),
    type_res: z.nativeEnum(TYPE_RES),
  })
  .openapi("RegistrationRequest")

export const RegistrationResponse = SuccessResponseSchema.extend({
  students_code: z.string(),
  class_valid: z.array(z.string()),
  class_invalid: z.array(z.string()),
  invalid_desc: z.string(),
}).openapi("RegistrationResponse")
