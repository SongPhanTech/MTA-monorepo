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
 * Gateway `/api/model/` thường rewrite thành be-model `/api/`.
 * Vì vậy MinIO proxy phải gọi `/api/model/api/minio` (không phải `/api/minio`).
 */
export function buildMinioApiBases(rawModelBase: string): string[] {
  const trimmed = rawModelBase.replace(/\/+$/, "")
  if (!trimmed) return []

  const modelEndpoint = trimmed.endsWith("/api/model") ? trimmed : `${trimmed}/api/model`
  const viaGateway = `${modelEndpoint}/api/minio`
  const direct = modelEndpoint.replace(/\/model$/, "/minio")

  return Array.from(new Set([viaGateway, direct]))
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
  status === 404 || status === 405 || status === 502 || status === 503

/** Upload DOCX via BE proxy (client → server → MinIO). */
export async function uploadSurveyPrintViaServer(
  minioApiBases: string[],
  objectName: string,
  blob: Blob
): Promise<{ filePath: string }> {
  if (!minioApiBases.length) throw new Error("Missing MinIO API base")

  let lastStatus = 0
  for (const base of minioApiBases) {
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
  }
  throw new Error(`Upload survey print failed: ${lastStatus}`)
}

/** true = file đã có trên MinIO và GET proxy trả docx. */
export async function surveyPrintFileExists(
  minioApiBases: string[],
  objectName: string
): Promise<boolean> {
  for (const base of minioApiBases) {
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
  }
  return false
}

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
  if (typeof raw.objectName !== "string" || !raw.objectName.startsWith(SURVEY_PRINT_OBJECT_PREFIX)) {
    return null
  }
  if (typeof raw.filePath !== "string" || !raw.filePath.includes(SURVEY_PRINT_OBJECT_PREFIX)) {
    return null
  }
  const version = typeof raw.version === "number" && raw.version > 0 ? raw.version : 1
  return { objectName: raw.objectName, filePath: raw.filePath, version }
}

/** Defaults for cluster (lecturer) survey DOCX. */
export const LECTURER_SURVEY_PRINT_FORM_CONTENT = {
  headerLeft: "HỌC VIỆN KTQS",
  formCode: "Mẫu số 11-ĐBCL",
  notes: [
    "Nhằm góp phần nâng cao chất lượng giảng dạy, phục vụ lợi ích của người học, Học viện đề nghị Anh/Chị với tinh thần trách nhiệm và xây dựng, cho ý kiến về hoạt động giảng dạy của giảng viên thông qua phiếu phản hồi này. Thông tin do Anh/Chị cung cấp sẽ được Học viện bảo mật và xử lý đảm bảo không làm ảnh hưởng đến kết quả học tập, rèn luyện của Anh/Chị",
    'Đề nghị Anh/Chị đánh dấu "X" vào các ô tương ứng với nội dung trong bảng câu hỏi theo thang phản hồi',
  ],
  notesAfterInfo: true,
  infoFields: [
    { label: "Tên giảng viên: " },
    { label: "Tên học phần: " },
    { label: "Khoa (Viện): " },
    { label: "Bộ môn: " },
    { label: "Lớp: " },
    { label: "Ngày lấy ý kiến: " },
    { label: "Học kỳ: " },
    { label: "Năm học: " },
  ],
}

/** Defaults used when generating the initial DOCX snapshot. */
export const DEFAULT_SURVEY_PRINT_FORM_CONTENT = {
  headerLeft: "HỌC VIỆN KTQS",
  formCode: "Mẫu số 11-ĐBCL",
  notes: [
    'Để đóng góp phần tìm ra những giải pháp nhằm nâng cao chất lượng đào tạo của Học viện đề nghị đồng chí (anh/chị) vui lòng điền đầy đủ thông tin trả lời các câu hỏi dưới dây bằng cách đánh dấu "X" vào một ô phù hợp nhất trong mục "các phương án trả lời".',
    "Thông tin đồng chí (anh/chị) cung cấp sẽ được Học viện xử lý khách quan và bảo mật",
  ],
  infoTitle: "I. THÔNG TIN CHUNG",
  infoFields: [
    { label: "Chuyên ngành: " },
    { label: "Khoa (Viện): " },
    { label: "Lớp: " },
    { label: "Khoá: " },
    { label: "Đối tượng đào tạo: ", fullWidth: true as const },
  ],
  contentTitle: "II. NỘI DUNG ĐÁNH GIÁ",
}
