import { useMutation, useQueryClient } from "@tanstack/react-query"
import { customPortalFetch } from "./custom-instance"

export type ImportFromInternalPayload = {
  message: string
  sessionId?: string
  sessionName?: string
  steps?: Array<{ table: string; count: number }>
  warnings?: string[]
  syncHistoryId?: string
  status?: "PENDING" | "SUCCESS" | string
}

type ImportFromInternalSuccess = {
  status: 200 | 202
  data: ImportFromInternalPayload
  headers: Headers
}

type ImportFromInternalError = {
  status: number
  data: { message?: string }
  headers: Headers
}

export type ImportFromInternalResponse = ImportFromInternalSuccess | ImportFromInternalError

export function isImportFromInternalOk(
  res: ImportFromInternalResponse
): res is ImportFromInternalSuccess {
  return res.status === 200 || res.status === 202
}

export type ImportFromInternalRequest = {
  file: File
  syncHistoryId?: string
}

export const importFromInternal = async (
  { file, syncHistoryId }: ImportFromInternalRequest,
  options?: RequestInit
): Promise<ImportFromInternalResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  if (syncHistoryId) {
    formData.append("syncHistoryId", syncHistoryId)
  }

  return customPortalFetch<ImportFromInternalResponse>("/api/data-sync/import-from-internal", {
    ...options,
    method: "POST",
    body: formData,
  })
}

export const useImportFromInternal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ImportFromInternalRequest) => importFromInternal(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-sync-history"] })
    },
  })
}
