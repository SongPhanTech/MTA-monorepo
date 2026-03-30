import { z } from "zod"

export const sessionSchema = z
  .object({
    exp: z.number(),
    iat: z.number(),
    auth_time: z.number(),
    jti: z.string(),
    iss: z.string(),
    aud: z.array(z.string()),
    sub: z.string(),
    typ: z.string(),
    azp: z.string(),
    sid: z.string(),
    acr: z.string(),
    "allowed-origins": z.array(z.string()),
    realm_access: z.object({
      roles: z.array(z.string()),
    }),
    resource_access: z.object({
      "fe-test-local": z.object({
        roles: z.array(z.string()),
      }),
      "realm-management": z.object({
        roles: z.array(z.string()),
      }),
      "fe-system-local": z.object({
        roles: z.array(z.string()),
      }),
      broker: z.object({
        roles: z.array(z.string()),
      }),
      account: z.object({
        roles: z.array(z.string()),
      }),
    }),
    scope: z.string(),
    sDM_NhanVienId: z.string(),
    email_verified: z.boolean(),
    sDM_DonViId: z.string(),
    name: z.string(),
    preferred_username: z.string(),
    given_name: z.string(),
    family_name: z.string(),
    email: z.string(),
    access_token: z.string(),
  })
  .openapi("Session")

export const sessionStatusSchema = z
  .union([z.literal("authenticated"), z.literal("unauthenticated"), z.literal("loading")])
  .openapi("SessionStatus")
