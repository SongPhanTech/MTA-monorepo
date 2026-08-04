import { useMutation } from "@tanstack/react-query"
import { customPortalFetch, customTrainingFetch } from "./custom-instance"

export type InvalidateClassRegisterCacheRequest = {
  classRegisterSessionId: string
}

type InvalidateSuccess = {
  status: 200
  data: { message: string; deleted?: number; skipped?: boolean }
  headers: Headers
}

type InvalidateError = {
  status: number
  data: { message?: string }
  headers: Headers
}

export type InvalidateClassRegisterCacheResponse = InvalidateSuccess | InvalidateError

/** Reset cache qua be-ql-dao-tao (cùng Redis với portal nếu đã cấu hình REDIS_URL) */
export const invalidateClassRegisterCache = async (
  body: InvalidateClassRegisterCacheRequest,
  options?: RequestInit
): Promise<InvalidateClassRegisterCacheResponse> => {
  return customTrainingFetch<InvalidateClassRegisterCacheResponse>(
    "/api/class-register-session/invalidate-cache",
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(body),
    }
  )
}

/** Reset cache trực tiếp trên be-portal (đảm bảo cổng SV nhận creditLimit mới) */
export const invalidatePortalRegistrationCache = async (
  body: InvalidateClassRegisterCacheRequest,
  options?: RequestInit
): Promise<InvalidateClassRegisterCacheResponse> => {
  return customPortalFetch<InvalidateClassRegisterCacheResponse>(
    "/api/class-register/invalidate-cache",
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(body),
    }
  )
}

/** Gọi cả LMS + Portal; lỗi một bên không chặn bên còn lại */
export async function invalidateRegistrationCaches(
  classRegisterSessionId: string
): Promise<void> {
  const results = await Promise.allSettled([
    invalidateClassRegisterCache({ classRegisterSessionId }),
    invalidatePortalRegistrationCache({ classRegisterSessionId }),
  ])
  for (const r of results) {
    if (r.status === "rejected") {
      console.warn("[invalidate-registration-caches]", r.reason)
    }
  }
}

export const useInvalidateClassRegisterCache = () => {
  return useMutation({
    mutationFn: (body: InvalidateClassRegisterCacheRequest) =>
      invalidateRegistrationCaches(body.classRegisterSessionId),
  })
}
