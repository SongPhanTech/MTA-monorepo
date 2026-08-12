export const SURVEY_PRINT_OBJECT_PREFIX = "khao-thi/survey-print/"

export type SurveyPrintFormDocMeta = {
  /** MinIO object key without bucket (for OnlyOffice callback). */
  objectName: string
  /** Path including bucket for getMinioUrl. */
  filePath: string
  version: number
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
