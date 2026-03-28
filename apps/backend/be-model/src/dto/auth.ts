import { z } from "zod"

export const sessionSchema = z
  .object({
    userId: z.string(),
    username: z.string(),
    fullName: z.string(),
    organizationId: z.string(),
    sDM_NhanVienId: z.string(),
    sDM_DonViId: z.string(),
  })
  .openapi("Session")

export const sessionStatusSchema = z
  .union([z.literal("authenticated"), z.literal("unauthenticated"), z.literal("loading")])
  .openapi("SessionStatus")
