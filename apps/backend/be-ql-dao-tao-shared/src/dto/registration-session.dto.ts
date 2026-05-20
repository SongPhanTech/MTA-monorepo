import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const SESSION_STATUS = {
  OPENING: 1,
  CLOSED: 2,
} as const

export const RegistrationSessionRequest = z
  .object({
    key_word: z
      .string()
      .optional()
      .openapi(
        fieldDesc(
          "Từ khóa tìm theo tên đợt đăng ký (ClassRegisterSession.name).",
          "Đợt 1"
        )
      ),
    session_status: z
      .nativeEnum(SESSION_STATUS)
      .describe("1: Đang mở đợt đăng ký, 2: Đóng đợt đăng ký")
      .optional()
      .openapi(
        fieldDesc("Trạng thái đợt: 1 = đang mở (trong khoảng startDate–endDate); 2 = đã đóng hoặc chưa mở.")
      ),
  })
  .openapi("RegistrationSessionRequest")

export const SessionInfo = z
  .object({
    session_code: z
      .string()
      .nullable()
      .openapi(fieldDesc("Mã đợt đăng ký (ClassRegisterSession.code).", "DK_HK1_2526")),
    session_name: z.string().openapi(fieldDesc("Tên đợt (ClassRegisterSession.name).", "Đăng ký HK1")),
    session_start: z.date().openapi(fieldDesc("Thời gian bắt đầu (ClassRegisterSession.startDate).")),
    session_end: z.date().openapi(fieldDesc("Thời gian kết thúc (ClassRegisterSession.endDate).")),
    session_status: z
      .nativeEnum(SESSION_STATUS)
      .openapi(fieldDesc("1 = đang mở; 2 = đã đóng.")),
  })
  .openapi("SessionInfo")

export type SessionInfo = z.infer<typeof SessionInfo>

export const RegistrationSessionResponse = SuccessResponseSchema.extend({
  data: z.array(SessionInfo),
}).openapi("RegistrationSessionResponse")

export const RegistrationSessionDetailRequest = z
  .object({
    session_code: z
      .string()
      .openapi(fieldDesc("Mã đợt đăng ký cần xem chi tiết (ClassRegisterSession.code).", "DK_HK1_2526")),
  })
  .openapi("RegistrationSessionDetailRequest")

export const CreditRegistrationDetail = z
  .object({
    score_start: z
      .number()
      .openapi(fieldDesc("Điểm TB tối thiểu của nhóm (CreditLimit base10/base4 min).", 0)),
    score_end: z.number().openapi(fieldDesc("Điểm TB tối đa của nhóm.", 8)),
    min_credit: z.number().openapi(fieldDesc("Số tín chỉ tối thiểu được đăng ký trong đợt.", 12)),
    max_credit: z.number().openapi(fieldDesc("Số tín chỉ tối đa được đăng ký trong đợt.", 24)),
  })
  .openapi("CreditRegistrationDetail")

export const RegistrationSessionDetailResponse = SuccessResponseSchema.extend({
  session_code: z.string().openapi(fieldDesc("Mã đợt.", "DK_HK1_2526")),
  session_name: z.string().openapi(fieldDesc("Tên đợt.", "Đăng ký HK1")),
  session_start: z.date().openapi(fieldDesc("Ngày bắt đầu.")),
  session_end: z.date().openapi(fieldDesc("Ngày kết thúc.")),
  session_status: z.nativeEnum(SESSION_STATUS).openapi(fieldDesc("1 = mở; 2 = đóng.")),
  money: z
    .number()
    .openapi(fieldDesc("Đơn giá học phín/tín chỉ (ClassRegisterSession.tuitionPerCredit).", 300000)),
  list_scholastic_code: z
    .array(z.string())
    .openapi(fieldDesc("Danh sách tên khóa được phép đăng ký (TrainingCourse.name).")),
  credit_registration_detail: z
    .array(CreditRegistrationDetail)
    .openapi(fieldDesc("Hạn mức tín chỉ theo nhóm điểm (CreditLimit).")),
}).openapi("RegistrationSessionDetailResponse")
