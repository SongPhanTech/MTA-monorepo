import { useMutation } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

export type ExportTrainingDataRequest = {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  type?: "NORMAL" | "RETAKE" | "REEXAM"
}

export type ExportTrainingDataPayload = {
  version: string
  exportedAt: string
  filters: {
    semesterId: string
    trainingObjectTypeId: string
    trainingCourseId: string | null
    type: string | null
  }
  counts: Record<string, number>
  data: Record<string, unknown[]>
}

type ExportTrainingDataSuccess = {
  status: 200
  data: ExportTrainingDataPayload
  headers: Headers
}

type ExportTrainingDataError = {
  status: Exclude<number, 200>
  data: { message?: string }
  headers: Headers
}

export type ExportTrainingDataResponse = ExportTrainingDataSuccess | ExportTrainingDataError

export const exportTrainingData = async (
  body: ExportTrainingDataRequest,
  options?: RequestInit
): Promise<ExportTrainingDataResponse> => {
  return customTrainingFetch<ExportTrainingDataResponse>("/api/export-training-data/export", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  })
}

export const useExportTrainingData = () =>
  useMutation({
    mutationFn: (body: ExportTrainingDataRequest) => exportTrainingData(body),
  })
