import { useMutation, useQueryClient } from "@tanstack/react-query"
import { customPortalFetch } from "./custom-instance"

export type ExportToInternalRequest = {
  classRegisterSessionId: string
  syncHistoryId?: string
}

export type ExportToInternalPayload = {
  version: string
  type: string
  exportedAt: string
  filters: {
    classRegisterSessionId: string
    semesterId: string
  }
  meta: {
    sessionName: string
    sessionActive: boolean
    sessionEnded: boolean
    startDate: string
    endDate: string
    registrationCount: number
  }
  counts: Record<string, number>
  fileName: string
  fileBase64: string
  fileSize: number
  syncHistoryId?: string
}

type ExportToInternalSuccess = {
  status: 200
  data: ExportToInternalPayload
  headers: Headers
}

type ExportToInternalError = {
  status: number
  data: { message?: string }
  headers: Headers
}

export type ExportToInternalResponse = ExportToInternalSuccess | ExportToInternalError

export const exportToInternal = async (
  body: ExportToInternalRequest,
  options?: RequestInit
): Promise<ExportToInternalResponse> => {
  return customPortalFetch<ExportToInternalResponse>("/api/data-sync/export-to-internal", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  })
}

export const useExportToInternal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ExportToInternalRequest) => exportToInternal(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-sync-history"] })
    },
  })
}

/** Tải gói .dat (base64 từ API) về máy */
export function downloadExportDat(payload: ExportToInternalPayload, fallbackName?: string) {
  const fileName =
    payload.fileName ||
    `export-ket-qua-dang-ky-${(payload.meta.sessionName || fallbackName || "dot-dang-ky")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim()}.dat`

  const binary = Uint8Array.from(atob(payload.fileBase64), (c) => c.charCodeAt(0))
  const blob = new Blob([binary], { type: "application/x-mta-dat" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** @deprecated Dùng downloadExportDat */
export function downloadExportJson(payload: ExportToInternalPayload, fallbackName?: string) {
  downloadExportDat(payload, fallbackName)
}
