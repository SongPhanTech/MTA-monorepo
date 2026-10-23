import { Store, useStore } from "@tanstack/react-store"
import { getExportStatus } from "@workspace/libs/api/export-training-data"
import { fetchInstance, getUrl } from "@workspace/libs/api/custom-instance"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { message } from "antd"

export type ExportTaskState = {
  jobId: string | null
  sessionId?: string | null
  sessionName?: string | null
  status: "IDLE" | "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"
  progress: number
  message: string
  fileName?: string
  fileSize?: number
  downloadUrl?: string
  error?: string
}

const STORAGE_KEY = "active_training_export_task"

function loadInitialState(): ExportTaskState {
  if (typeof window === "undefined") {
    return {
      jobId: null,
      sessionId: null,
      sessionName: null,
      status: "IDLE",
      progress: 0,
      message: "",
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Nếu job đã xong hoặc lỗi từ lâu, không load lại
      if (parsed.status === "SUCCESS" || parsed.status === "FAILED") {
        return { jobId: null, sessionId: null, sessionName: null, status: "IDLE", progress: 0, message: "" }
      }
      return parsed
    }
  } catch {
    // ignore
  }

  return {
    jobId: null,
    sessionId: null,
    sessionName: null,
    status: "IDLE",
    progress: 0,
    message: "",
  }
}

export const exportStore = new Store<ExportTaskState>(loadInitialState())

function saveState(state: ExportTaskState) {
  if (typeof window === "undefined") return
  try {
    if (state.status === "IDLE") {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  } catch {
    // ignore
  }
}

let pollingInterval: NodeJS.Timeout | null = null

export type DownloadExportedFileOptions = {
  /** 0–100 theo byte (hoặc ước lượng nếu thiếu Content-Length) */
  onProgress?: (percent: number) => void
}

/** Tải qua fetch + Bearer token; trả true nếu lưu file thành công. */
export async function downloadExportedFile(
  downloadUrl: string,
  fileName?: string,
  options?: DownloadExportedFileOptions
): Promise<boolean> {
  if (typeof window === "undefined") return false
  const url = downloadUrl.startsWith("http")
    ? downloadUrl
    : getUrl(getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") || "/api/lms", downloadUrl)
  try {
    const res = await fetchInstance(url, { method: "GET" })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      message.error("Không xuất được dữ liệu")
      return false
    }

    const total = Number(res.headers.get("Content-Length") || 0)
    const onProgress = options?.onProgress
    let blob: Blob

    if (res.body && onProgress) {
      const reader = res.body.getReader()
      const chunks: Uint8Array[] = []
      let received = 0
      let tick = 0
      onProgress(0)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          received += value.length
          if (total > 0) {
            onProgress(Math.min(99, Math.round((received / total) * 100)))
          } else {
            // thiếu Content-Length — ước lượng mượt tới ~90%
            tick += 1
            onProgress(Math.min(90, 8 + Math.round(Math.log10(received + 10) * 18) + (tick % 5)))
          }
        }
      }
      blob = new Blob(chunks as BlobPart[])
      onProgress(100)
    } else {
      onProgress?.(30)
      blob = await res.blob()
      onProgress?.(100)
    }

    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = fileName || "export-toan-bo-du-lieu.dat"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
    return true
  } catch (e) {
    message.error("Không xuất được dữ liệu")
    return false
  }
}

export function startPolling(jobId: string) {
  if (pollingInterval) clearInterval(pollingInterval)

  pollingInterval = setInterval(async () => {
    try {
      const res = await getExportStatus(jobId)
      if (res.status === 200) {
        const data = res.data
        const current = exportStore.state

        const nextState: ExportTaskState = {
          jobId,
          sessionId: current.sessionId,
          sessionName: current.sessionName,
          status: data.status,
          progress: data.progress,
          message:
            data.status === "SUCCESS"
              ? "Xuất dữ liệu thành công"
              : data.status === "FAILED"
                ? "Không xuất được dữ liệu"
                : "Đang xuất dữ liệu",
          fileName: data.fileName,
          fileSize: data.fileSize,
          downloadUrl: data.downloadUrl,
          error: data.error,
        }

        exportStore.setState(() => nextState)
        saveState(nextState)

        if (data.status === "SUCCESS") {
          if (pollingInterval) clearInterval(pollingInterval)
          pollingInterval = null

          message.success({
            content: "Xuất dữ liệu thành công",
            key: "global-export-task",
            duration: 2,
          })

          // Không auto-download ở đây: nút ExportInternetDownloadButton
          // tự tải với progress + micro-interaction.

          // Giữ SUCCESS đủ lâu để nút kịp tải file rồi reset
          setTimeout(() => {
            const cur = exportStore.state
            if (cur.jobId === jobId && cur.status === "SUCCESS") {
              const resetState: ExportTaskState = {
                jobId: null,
                sessionId: null,
                sessionName: null,
                status: "IDLE",
                progress: 0,
                message: "",
              }
              exportStore.setState(() => resetState)
              saveState(resetState)
            }
          }, 60000)
        } else if (data.status === "FAILED") {
          if (pollingInterval) clearInterval(pollingInterval)
          pollingInterval = null

          message.error({
            content: "Không xuất được dữ liệu",
            key: "global-export-task",
            duration: 3,
          })

          setTimeout(() => {
            const cur = exportStore.state
            if (cur.jobId === jobId && cur.status === "FAILED") {
              const resetState: ExportTaskState = {
                jobId: null,
                sessionId: null,
                sessionName: null,
                status: "IDLE",
                progress: 0,
                message: "",
              }
              exportStore.setState(() => resetState)
              saveState(resetState)
            }
          }, 10000)
        }
      }
    } catch (err) {
      console.warn("[export-store] Polling lỗi:", err)
    }
  }, 2000)
}

export function trackNewExportJob(jobId: string, sessionId?: string | null, sessionName?: string | null) {
  const initial: ExportTaskState = {
    jobId,
    sessionId: sessionId || null,
    sessionName: sessionName || null,
    status: "PROCESSING",
    progress: 5,
    message: "Đang xuất dữ liệu",
  }
  exportStore.setState(() => initial)
  saveState(initial)
  startPolling(jobId)
}

export function resetExportJob() {
  if (pollingInterval) clearInterval(pollingInterval)
  pollingInterval = null
  const resetState: ExportTaskState = {
    jobId: null,
    sessionId: null,
    sessionName: null,
    status: "IDLE",
    progress: 0,
    message: "",
  }
  exportStore.setState(() => resetState)
  saveState(resetState)
}

export function useExportTrainingStore() {
  return useStore(exportStore)
}
