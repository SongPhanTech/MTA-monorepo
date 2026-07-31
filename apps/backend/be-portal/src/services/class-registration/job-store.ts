/**
 * Trạng thái job đăng ký học — lưu trên Redis để API polling đọc.
 * Vòng đời: pending → processing → success | failed
 * Redis lỗi → set/get trả false/null (fail-open), producer sẽ fallback xử lý đồng bộ.
 */
import { withRedis } from "../redis-cache"

export type RegistrationJobState = "pending" | "processing" | "success" | "failed"

export type RegistrationJobStatus = {
  jobId: string
  userId: string
  status: RegistrationJobState
  message: string
  attempts: number
  updatedAt: string
}

const JOB_PREFIX = "portal:crs:job"
/** Job status giữ 1 giờ — đủ cho FE polling + user quay lại xem kết quả */
const JOB_TTL_SEC = Number(process.env.CLASS_REGISTER_JOB_TTL || 3600)

function jobKey(jobId: string) {
  return `${JOB_PREFIX}:${jobId}`
}

/** Trả false nếu Redis không khả dụng → caller không nên trả 202 (FE sẽ không poll được). */
export async function setJobStatus(job: RegistrationJobStatus): Promise<boolean> {
  const ok = await withRedis(async (redis) => {
    await redis.set(jobKey(job.jobId), JSON.stringify(job), "EX", JOB_TTL_SEC)
    return true
  })
  return ok === true
}

export async function getJobStatus(jobId: string): Promise<RegistrationJobStatus | null> {
  const raw = await withRedis((redis) => redis.get(jobKey(jobId)))
  if (raw == null) return null
  try {
    return JSON.parse(String(raw)) as RegistrationJobStatus
  } catch {
    return null
  }
}
