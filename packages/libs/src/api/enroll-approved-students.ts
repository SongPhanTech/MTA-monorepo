import { useMutation } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

export type EnrollApprovedStudentsRequest = {
  classRegisterSessionId: string
}

export type EnrollApprovedStudentsData = {
  message: string
  created: number
  alreadyEnrolled: number
  skippedMissingFk: number
  byClass: Array<{ subjectClassId: string; created: number }>
}

type EnrollSuccess = {
  status: 200
  data: EnrollApprovedStudentsData
  headers: Headers
}

type EnrollError = {
  status: 400 | 401 | 403 | 404 | 409 | 500
  data: { message?: string }
  headers: Headers
}

export type EnrollApprovedStudentsResponse = EnrollSuccess | EnrollError

/** Đưa SV có đơn SUCCESS vào lớp môn học (tạo SSS còn thiếu) */
export const enrollApprovedStudents = async (
  body: EnrollApprovedStudentsRequest,
  options?: RequestInit
): Promise<EnrollApprovedStudentsResponse> => {
  const res = await customTrainingFetch<EnrollApprovedStudentsResponse>(
    "/api/class-register-session/enroll-approved-students",
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(body),
    }
  )
  // customTrainingFetch trả status number — ép về union để caller narrow được
  if (res.status === 200) {
    return { ...res, status: 200 }
  }
  return {
    ...res,
    status: res.status as EnrollError["status"],
  }
}

export const useEnrollApprovedStudents = () => {
  return useMutation({
    mutationFn: (body: EnrollApprovedStudentsRequest) => enrollApprovedStudents(body),
  })
}
