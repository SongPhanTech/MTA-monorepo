import { useMutation } from "@tanstack/react-query"
import { customPortalFetch } from "./custom-instance"

export type RegistrationStatsRequest = {
  classRegisterSessionId: string
  from: string
  to: string
  page?: number
  pageSize?: number
}

export type RegistrationStatsPayload = {
  summary: {
    eligibleCount: number
    registeredCount: number
    notRegisteredCount: number
    failedCount: number
  }
  failures: {
    total: number
    page: number
    pageSize: number
    items: Array<{
      id: string
      occurredAt: string
      code: string | null
      message: string
      student: {
        id: string | null
        studentCode: string | null
        fullName: string | null
        fixedClassName: string | null
      }
      subjectClasses: Array<{
        id: string
        classCode: string
        subjectName: string
      }>
    }>
  }
  from: string
  to: string
}

type RegistrationStatsSuccess = {
  status: 200
  data: RegistrationStatsPayload
  headers: Headers
}

type RegistrationStatsError = {
  status: 400 | 404 | 500
  data: { message?: string }
  headers: Headers
}

export type RegistrationStatsResponse = RegistrationStatsSuccess | RegistrationStatsError

export const registrationStats = async (
  body: RegistrationStatsRequest,
  options?: RequestInit
): Promise<RegistrationStatsResponse> => {
  return customPortalFetch<RegistrationStatsResponse>("/api/class-register/registration-stats", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  })
}

export const useRegistrationStats = () => {
  return useMutation({
    mutationFn: (body: RegistrationStatsRequest) => registrationStats(body),
  })
}
