import { useMutation } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

export type ImportTrainingDataRequest = {
  classRegisterSessionId: string
  file: File
}

export type ImportRegistrationPreviewPayload = {
  fileHash: string
  sessionName: string
  fileSessionId: string | null
  stats: {
    createLogs: number
    updateLogs: number
    createScores: number
    updateScores: number
    skipScoresWithGrade: number
    removeLogs: number
    removeScores: number
    failed: number
  }
  warnings: string[]
}

export type ImportTrainingDataPayload = {
  message: string
  imported?: number
  failed?: number
  details?: {
    classRegisterLogs: number
    studentSubjectScore: number
    removedLogs: number
    removedScores: number
    createdLogs?: number
    updatedLogs?: number
    createdScores?: number
    updatedScores?: number
    skippedScoresWithGrade?: number
  }
  warnings?: string[]
}

type PreviewSuccess = {
  status: 200
  data: ImportRegistrationPreviewPayload
  headers: Headers
}

type PreviewError = {
  status: number
  data: { message?: string }
  headers: Headers
}

export type ImportRegistrationPreviewResponse = PreviewSuccess | PreviewError

type ImportSuccess = {
  status: 200
  data: ImportTrainingDataPayload
  headers: Headers
}

type ImportError = {
  status: number
  data: { message?: string }
  headers: Headers
}

export type ImportTrainingDataResponse = ImportSuccess | ImportError

export const previewImportRegistrationResults = async (
  { classRegisterSessionId, file }: ImportTrainingDataRequest,
  options?: RequestInit
): Promise<ImportRegistrationPreviewResponse> => {
  const formData = new FormData()
  formData.append("classRegisterSessionId", classRegisterSessionId)
  formData.append("file", file)

  return customTrainingFetch<ImportRegistrationPreviewResponse>(
    "/api/import-training-data/preview",
    {
      ...options,
      method: "POST",
      body: formData,
    }
  )
}

export const confirmImportRegistrationResults = async (
  {
    classRegisterSessionId,
    file,
    fileHash,
  }: ImportTrainingDataRequest & { fileHash: string },
  options?: RequestInit
): Promise<ImportTrainingDataResponse> => {
  const formData = new FormData()
  formData.append("classRegisterSessionId", classRegisterSessionId)
  formData.append("fileHash", fileHash)
  formData.append("file", file)

  return customTrainingFetch<ImportTrainingDataResponse>("/api/import-training-data/confirm", {
    ...options,
    method: "POST",
    body: formData,
  })
}

/** @deprecated Dùng preview + confirm */
export const importTrainingData = async (
  body: ImportTrainingDataRequest,
  options?: RequestInit
): Promise<ImportTrainingDataResponse> => {
  return customTrainingFetch<ImportTrainingDataResponse>("/api/import-training-data/import", {
    ...options,
    method: "POST",
    body: (() => {
      const formData = new FormData()
      formData.append("classRegisterSessionId", body.classRegisterSessionId)
      formData.append("file", body.file)
      return formData
    })(),
  })
}

export const useImportTrainingData = () =>
  useMutation({
    mutationFn: (body: ImportTrainingDataRequest) => importTrainingData(body),
  })

export const usePreviewImportRegistrationResults = () =>
  useMutation({
    mutationFn: (body: ImportTrainingDataRequest) => previewImportRegistrationResults(body),
  })

export const useConfirmImportRegistrationResults = () =>
  useMutation({
    mutationFn: (body: ImportTrainingDataRequest & { fileHash: string }) =>
      confirmImportRegistrationResults(body),
  })
