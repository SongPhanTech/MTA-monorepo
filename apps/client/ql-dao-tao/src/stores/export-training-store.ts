import { Store, useStore } from "@tanstack/react-store"
import { getExportStatus } from "@workspace/libs/api/export-training-data"
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

export function downloadExportedFile(downloadUrl: string, fileName?: string) {
  if (typeof window === "undefined") return
  const baseApi = process.env.NEXT_PUBLIC_API_LMS_BASE_URL || "http://localhost:3002"
  const link = document.createElement("a")
  link.href = `${baseApi}${downloadUrl}`
  link.download = fileName || "export-toan-bo-du-lieu.json"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
          message: data.message,
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

          const mb = ((data.fileSize || 0) / (1024 * 1024)).toFixed(1)
          message.success({
            content: `Xuất dữ liệu ra internet thành công (${mb} MB)! Đang tải file...`,
            key: "global-export-task",
            duration: 6,
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
            content: data.message || "Xuất dữ liệu thất bại",
            key: "global-export-task",
            duration: 6,
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
    message: "Đã tạo tác vụ nền, Worker đang tải dữ liệu...",
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
