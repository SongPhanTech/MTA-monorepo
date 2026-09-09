import { useMutation } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

export type SyncExamDatesRequest = {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  fixedClassId?: string
  type?: "NORMAL" | "RETAKE" | "REEXAM"
}

export type SyncExamDatesPayload = {
  message: string
  totalClasses: number
  matched: number
  updated: number
  unchanged: number
  unmatched: number
  unmatchedIds: string[]
}

type SyncExamDatesSuccess = {
  status: 200
  data: SyncExamDatesPayload
  headers: Headers
}

type SyncExamDatesError = {
  status: 400 | 404 | 500
  data: { message?: string }
  headers: Headers
}

export type SyncExamDatesResponse = SyncExamDatesSuccess | SyncExamDatesError

export const syncExamDates = async (
  data: SyncExamDatesRequest,
  options?: RequestInit
): Promise<SyncExamDatesResponse> => {
  return customTrainingFetch<SyncExamDatesResponse>(`/api/thoi-khoa-bieu/sync-exam-dates`, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(data),
  })
}

export const useSyncExamDates = () => {
  return useMutation({
    mutationFn: (data: SyncExamDatesRequest) => syncExamDates(data),
  })
}
