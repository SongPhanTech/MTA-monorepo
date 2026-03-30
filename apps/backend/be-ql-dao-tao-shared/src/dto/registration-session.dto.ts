import { z } from "@hono/zod-openapi"
import { SuccessResponseSchema } from "./base"

export const SESSION_STATUS = {
  OPENING: 1,
  CLOSED: 2,
} as const

export const RegistrationSessionRequest = z
  .object({
    key_word: z.string().optional(),
    session_status: z
      .nativeEnum(SESSION_STATUS)
      .describe("1: Đang mở đợt đăng ký, 2: Đóng đợt đăng ký")
      .optional(),
  })
  .openapi("RegistrationSessionRequest")

export const SessionInfo = z
  .object({
    session_code: z.string().nullable(),
    session_name: z.string(),
    session_start: z.date(),
    session_end: z.date(),
    session_status: z.nativeEnum(SESSION_STATUS),
  })
  .openapi("SessionInfo")

export type SessionInfo = z.infer<typeof SessionInfo>

export const RegistrationSessionResponse = SuccessResponseSchema.extend({
  data: z.array(SessionInfo),
}).openapi("RegistrationSessionResponse")

export const RegistrationSessionDetailRequest = z
  .object({ session_code: z.string() })
  .openapi("RegistrationSessionDetailRequest")

export const RegistrationSessionDetailResponse = SuccessResponseSchema.extend({
  session_code: z.string(),
  session_name: z.string(),
  session_start: z.date(),
  session_end: z.date(),
  session_status: z.nativeEnum(SESSION_STATUS),
  money: z.number(),
  list_scholastic_code: z.array(z.string()), // Danh sách khoá được đăng ký
  credit_registration_detail: z.array(
    z.object({
      score_start: z.number(),
      score_end: z.number(),
      min_credit: z.number(),
      max_credit: z.number(),
    })
  ),
}).openapi("RegistrationSessionResponse")
