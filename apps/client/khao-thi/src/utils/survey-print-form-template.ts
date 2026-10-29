export const SURVEY_PRINT_OBJECT_PREFIX = "khao-thi/survey-print/"

export const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export type SurveyPrintFormDocMeta = {
  /** MinIO object key without bucket (for OnlyOffice callback / proxy). */
  objectName: string
  /** Path including bucket (stored for reference; access goes through BE proxy). */
  filePath: string
  version: number
}

export function toAbsoluteUrl(url: string): string {
  if (!url || /^https?:\/\//i.test(url)) return url
  if (typeof window === "undefined") return url
  return new URL(url, window.location.origin).toString()
}

/**
 * Gateway tới be-model (NEXT_PUBLIC_API_MODEL_BASE_URL), ví dụ:
 * - dev:  https://host/api/model
 * - prod: https://host/api/lms/model
 *
 * MinIO proxy trên be-model là `/api/minio/*`, qua gateway gọi:
 * `{modelBase}/api/minio/survey-print`
 *
 * Không được nối thêm `/api/model` khi base đã kết thúc bằng `/model`
 * (prod `/api/lms/model` không khớp `.endsWith("/api/model")` nhưng vẫn là model root).
 */
export function buildMinioApiBases(rawModelBase: string): string[] {
  const trimmed = rawModelBase.replace(/\/+$/, "")
  if (!trimmed) return []

  const modelEndpoint =
    trimmed.endsWith("/api/model") || trimmed.endsWith("/model") ? trimmed : `${trimmed}/api/model`

  const viaGateway = `${modelEndpoint}/api/minio`
  const direct = modelEndpoint.replace(/\/model$/, "/minio")
  const bases = !trimmed.endsWith("/model")
    ? [`${trimmed}/api/minio`, viaGateway, direct]
    : [viaGateway, direct]

  return Array.from(new Set(bases))
}

export function surveyPrintProxyUrl(minioApiBase: string, objectName: string) {
  return toAbsoluteUrl(
    `${minioApiBase.replace(/\/+$/, "")}/survey-print?objectName=${encodeURIComponent(objectName)}`
  )
}

export function surveyPrintCallbackUrl(minioApiBase: string, objectName: string) {
  return toAbsoluteUrl(
    `${minioApiBase.replace(/\/+$/, "")}/onlyoffice-callback?objectName=${encodeURIComponent(objectName)}`
  )
}

const shouldTryNextMinioBase = (status: number) =>
  status === 400 || status === 404 || status === 405 || status === 502 || status === 503

/** Upload DOCX via BE proxy (client → server → MinIO). */
export async function uploadSurveyPrintViaServer(
  minioApiBases: string[],
  objectName: string,
  blob: Blob
): Promise<{ filePath: string }> {
  if (!minioApiBases.length) throw new Error("Missing MinIO API base")

  let lastStatus = 0
  let lastError: unknown = null
  for (const base of minioApiBases) {
    try {
      const res = await fetch(surveyPrintProxyUrl(base, objectName), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": DOCX_CONTENT_TYPE },
        body: blob,
      })
      lastStatus = res.status
      if (res.ok) {
        const data = (await res.json()) as { filePath?: string }
        return { filePath: data.filePath || objectName }
      }
      if (!shouldTryNextMinioBase(res.status)) break
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error(`Upload survey print failed: ${lastStatus}`)
}

/** true = file đã có trên MinIO và GET proxy trả docx. */
export async function surveyPrintFileExists(
  minioApiBases: string[],
  objectName: string
): Promise<boolean> {
  for (const base of minioApiBases) {
    try {
      const res = await fetch(surveyPrintProxyUrl(base, objectName), {
        method: "GET",
        credentials: "include",
      })
      const contentType = res.headers.get("content-type") || ""
      if (
        res.ok &&
        (contentType.includes("officedocument") ||
          contentType.includes("octet-stream") ||
          contentType.includes("msword"))
      ) {
        return true
      }
      if (res.ok) return true
      if (!shouldTryNextMinioBase(res.status)) break
    } catch {
      // try next base
    }
  }
  return false
}

export {
  cloneSurveyFormDisplayContent,
  DEFAULT_SURVEY_PRINT_FORM_CONTENT,
  LECTURER_SURVEY_PRINT_FORM_CONTENT,
  parseSurveyFormDisplayContent,
  type SurveyFormDisplayContent,
  type SurveyFormFieldBindKey,
  type SurveyFormInfoField,
} from "@workspace/libs/survey-form-content"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function surveyPrintObjectName(surveyId: string) {
  return `${SURVEY_PRINT_OBJECT_PREFIX}${surveyId}.docx`
}

export function clusterSurveyPrintObjectName(clusterSurveyId: string) {
  return `${SURVEY_PRINT_OBJECT_PREFIX}cluster-${clusterSurveyId}.docx`
}

/** Parse stored printFormTemplate; old field-JSON shape is treated as missing file. */
export function parseSurveyPrintFormDocMeta(raw: unknown): SurveyPrintFormDocMeta | null {
  if (!isRecord(raw)) return null
  if (
    typeof raw.objectName !== "string" ||
    !raw.objectName.startsWith(SURVEY_PRINT_OBJECT_PREFIX)
  ) {
    return null
  }
  if (typeof raw.filePath !== "string" || !raw.filePath.includes(SURVEY_PRINT_OBJECT_PREFIX)) {
    return null
  }
  const version = typeof raw.version === "number" && raw.version > 0 ? raw.version : 1
  return { objectName: raw.objectName, filePath: raw.filePath, version }
}
