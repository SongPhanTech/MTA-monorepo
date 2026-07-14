import { useMutation } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

export type ImportTrainingDataRequest = {
  classRegisterSessionId: string
  file: File
}

export type ImportTrainingDataPayload = {
  message: string
  imported?: number
  failed?: number
}

type ImportTrainingDataSuccess = {
  status: 200
  data: ImportTrainingDataPayload
  headers: Headers
}

type ImportTrainingDataError = {
  status: number
  data: { message?: string }
  headers: Headers
}

export type ImportTrainingDataResponse = ImportTrainingDataSuccess | ImportTrainingDataError

export const importTrainingData = async (
  { classRegisterSessionId, file }: ImportTrainingDataRequest,
  options?: RequestInit
): Promise<ImportTrainingDataResponse> => {
  const formData = new FormData()
  formData.append("classRegisterSessionId", classRegisterSessionId)
  formData.append("file", file)

  return customTrainingFetch<ImportTrainingDataResponse>("/api/import-training-data/import", {
    ...options,
    method: "POST",
    body: formData,
  })
}

export const useImportTrainingData = () =>
  useMutation({
    mutationFn: (body: ImportTrainingDataRequest) => importTrainingData(body),
  })
