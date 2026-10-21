import { useMutation } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

export type ExportTrainingDataRequest = {
  classRegisterSessionId?: string
}

export type ExportTrainingDataPayload = {
  version: string
  exportedAt: string
  filters: {
    scope?: "full"
    classRegisterSessionId?: string
    classRegisterSessionIds?: string[]
    semesterId?: string
    semesterIds?: string[]
    trainingCourseIds: string[]
  }
  counts: Record<string, number>
  data: Record<string, unknown[]>
}

export type ExportAsyncResponse = {
  message: string
  jobId: string
  status: "PENDING"
}

export type ExportStatusResponse = {
  jobId: string
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"
  progress: number
  message: string
  fileName?: string
  fileSize?: number
  recordCounts?: Record<string, number>
  error?: string
  downloadUrl?: string
}

type ExportTrainingDataSuccess = {
  status: 200
  data: ExportTrainingDataPayload
  headers: Headers
}

type ExportTrainingDataError = {
  status: number
  data: { message?: string }
  headers: Headers
}

export type ExportTrainingDataResponse = ExportTrainingDataSuccess | ExportTrainingDataError

// 1. Đồng bộ (Cũ)
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

// 2. Bất đồng bộ (Mới)
export const exportTrainingDataAsync = async (
  body: ExportTrainingDataRequest,
  options?: RequestInit
): Promise<{ status: number; data: ExportAsyncResponse }> => {
  return customTrainingFetch<{ status: number; data: ExportAsyncResponse }>(
    "/api/export-training-data/export-async",
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(body),
    }
  )
}

// 3. Polling trạng thái tiến độ từ Redis
export const getExportStatus = async (
  jobId: string,
  options?: RequestInit
): Promise<{ status: number; data: ExportStatusResponse }> => {
  return customTrainingFetch<{ status: number; data: ExportStatusResponse }>(
    `/api/export-training-data/status/${jobId}`,
    {
      ...options,
      method: "GET",
    }
  )
}

export const useExportTrainingData = () =>
  useMutation({
    mutationFn: (body: ExportTrainingDataRequest) => exportTrainingData(body),
  })

export const useExportTrainingDataAsync = () =>
  useMutation({
    mutationFn: (body: ExportTrainingDataRequest) => exportTrainingDataAsync(body),
  })
