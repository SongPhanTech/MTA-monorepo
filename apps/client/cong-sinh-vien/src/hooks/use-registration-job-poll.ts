import { customPortalFetch } from "@workspace/libs/api/custom-instance"

export const REGISTRATION_POLL_INTERVAL_MS = 2000
export const REGISTRATION_POLL_TIMEOUT_MS = 30_000

export type RegistrationJobPollResult =
  | { outcome: "success"; message?: string }
  | { outcome: "failed"; message: string }
  | { outcome: "timeout"; message: string }

type RegistrationStatusPayload = {
  status: number
  data?: {
    jobId?: string
    status?: string
    message?: string
  }
}

function normalizeJobStatus(status?: string) {
  return String(status || "")
    .trim()
    .toLowerCase()
}

/**
 * Poll GET /api/class-register/registration-status/:jobId mỗi `intervalMs`
 * cho tới khi Success / Failed hoặc hết `timeoutMs` (mặc định 30s).
 */
export async function pollRegistrationJob(
  jobId: string,
  options?: {
    intervalMs?: number
    timeoutMs?: number
    signal?: AbortSignal
  }
): Promise<RegistrationJobPollResult> {
  const intervalMs = options?.intervalMs ?? REGISTRATION_POLL_INTERVAL_MS
  const timeoutMs = options?.timeoutMs ?? REGISTRATION_POLL_TIMEOUT_MS
  const deadline = Date.now() + timeoutMs

  while (Date.now() <= deadline) {
    if (options?.signal?.aborted) {
      return {
        outcome: "timeout",
        message: "Yêu cầu đăng ký đã bị hủy.",
      }
    }

    try {
      const job = await customPortalFetch<RegistrationStatusPayload>(
        `/api/class-register/registration-status/${jobId}`,
        { method: "GET", signal: options?.signal }
      )

      if (job?.status === 200) {
        const jobStatus = normalizeJobStatus(job.data?.status)

        if (jobStatus === "success") {
          return {
            outcome: "success",
            message: job.data?.message || "Đăng ký thành công",
          }
        }

        if (jobStatus === "failed") {
          return {
            outcome: "failed",
            message:
              job.data?.message ||
              "Đăng ký thất bại. Vui lòng kiểm tra lại (hết chỗ, trùng lịch, thiếu tiên quyết...).",
          }
        }
        // pending | processing → tiếp tục poll
      }
    } catch {
      // Lỗi mạng tạm thời / abort → nếu còn thời gian thì poll tiếp
      if (options?.signal?.aborted) {
        return {
          outcome: "timeout",
          message: "Yêu cầu đăng ký đã bị hủy.",
        }
      }
    }

    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, Math.min(intervalMs, remaining))
      options?.signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(t)
          resolve()
        },
        { once: true }
      )
    })
  }

  return {
    outcome: "timeout",
    message:
      "Hết thời gian chờ kết quả đăng ký (30 giây). Vui lòng kiểm tra lại danh sách đã đăng ký sau ít phút.",
  }
}
