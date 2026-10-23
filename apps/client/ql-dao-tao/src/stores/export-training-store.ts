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

/** Tải qua fetch + Bearer token (không dùng <a href> tới API — tránh nhảy sang localhost/sai origin). */
export async function downloadExportedFile(downloadUrl: string, fileName?: string) {
  if (typeof window === "undefined") return
  // Cùng cách resolve URL với customTrainingFetch — không fallback localhost:3002
  const url = downloadUrl.startsWith("http")
    ? downloadUrl
    : getUrl(getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") || "/api/lms", downloadUrl)
  try {
    const res = await fetchInstance(url, { method: "GET" })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      message.error(text || `Không tải được file (HTTP ${res.status})`)
      return
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = fileName || "export-toan-bo-du-lieu.dat"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (e) {
    message.error(e instanceof Error ? e.message : "Không tải được file xuất dữ liệu")
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
              ? "Hoàn thành"
              : data.status === "FAILED"
                ? "Xuất thất bại"
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
            content: "Hoàn thành",
            key: "global-export-task",
            duration: 3,
          })

          if (data.downloadUrl) {
            downloadExportedFile(data.downloadUrl, data.fileName)
          }

          // Tự động giải phóng sau 15 giây
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
          }, 15000)
        } else if (data.status === "FAILED") {
          if (pollingInterval) clearInterval(pollingInterval)
          pollingInterval = null

          message.error({
            content: "Xuất thất bại",
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
