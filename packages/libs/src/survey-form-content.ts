export type SurveyFormFieldBindKey =
  | "lecturerName"
  | "subjectClass"
  | "organization"
  | "semester"

export type SurveyFormInfoField = {
  label: string
  fullWidth?: boolean
  span?: number
  bindKey?: SurveyFormFieldBindKey
}

export type SurveyFormDisplayContent = {
  headerLeft?: string
  formCode?: string
  notes: string[]
  notesAfterInfo?: boolean
  infoTitle?: string
  infoFields: SurveyFormInfoField[]
  contentTitle?: string
  footerNotes?: string[]
}

export const LECTURER_SURVEY_PRINT_FORM_CONTENT: SurveyFormDisplayContent = {
  headerLeft: "HỌC VIỆN KTQS",
  formCode: "Mẫu số 11-ĐBCL",
  notes: [
    "Nhằm góp phần nâng cao chất lượng giảng dạy, phục vụ lợi ích của người học, Học viện đề nghị Anh/Chị với tinh thần trách nhiệm và xây dựng, cho ý kiến về hoạt động giảng dạy của giảng viên thông qua phiếu phản hồi này. Thông tin do Anh/Chị cung cấp sẽ được Học viện bảo mật và xử lý đảm bảo không làm ảnh hưởng đến kết quả học tập, rèn luyện của Anh/Chị",
    'Đề nghị Anh/Chị đánh dấu "X" vào các ô tương ứng với nội dung trong bảng câu hỏi theo thang phản hồi',
  ],
  notesAfterInfo: true,
  infoFields: [
    { label: "Tên giảng viên: ", bindKey: "lecturerName" },
    { label: "Tên học phần: ", bindKey: "subjectClass" },
    { label: "Khoa (Viện): ", bindKey: "organization" },
    { label: "Bộ môn: ", span: 6 },
    { label: "Lớp: ", span: 6 },
    { label: "Ngày lấy ý kiến: " },
    { label: "Học kỳ: ", bindKey: "semester" },
    { label: "Năm học: " },
  ],
  footerNotes: ["Xin trân trọng cảm ơn Anh/Chị đã dành thời gian phản hồi!"],
}

export const DEFAULT_SURVEY_PRINT_FORM_CONTENT: SurveyFormDisplayContent = {
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
    { label: "Đối tượng đào tạo: ", fullWidth: true, span: 24 },
  ],
  contentTitle: "II. NỘI DUNG ĐÁNH GIÁ",
  footerNotes: [
    "Xin trân trọng cảm ơn đồng chí (anh/chị) đã dành thời gian hoàn thành phiếu khảo sát.",
  ],
}

const BIND_KEYS: SurveyFormFieldBindKey[] = [
  "lecturerName",
  "subjectClass",
  "organization",
  "semester",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isBindKey(value: unknown): value is SurveyFormFieldBindKey {
  return typeof value === "string" && BIND_KEYS.includes(value as SurveyFormFieldBindKey)
}

export function cloneSurveyFormDisplayContent(
  content: SurveyFormDisplayContent
): SurveyFormDisplayContent {
  return {
    ...content,
    notes: [...content.notes],
    infoFields: content.infoFields.map((field) => ({ ...field })),
    ...(content.footerNotes ? { footerNotes: [...content.footerNotes] } : {}),
  }
}

function parseInfoFields(raw: unknown): SurveyFormInfoField[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const fields: SurveyFormInfoField[] = []
  for (const item of raw) {
    if (!isRecord(item) || typeof item.label !== "string") continue
    fields.push({
      label: item.label,
      ...(item.fullWidth === true || item.span === 24 ? { fullWidth: true } : {}),
      ...(typeof item.span === "number"
        ? { span: item.span }
        : item.fullWidth === true
          ? { span: 24 }
          : {}),
      ...(isBindKey(item.bindKey) ? { bindKey: item.bindKey } : {}),
    })
  }
  return fields
}

function parseNotes(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw.filter((note): note is string => typeof note === "string")
}

function parseDisplayContentObject(raw: unknown): Partial<SurveyFormDisplayContent> | null {
  if (!isRecord(raw)) return null
  const notes = parseNotes(raw.notes)
  const infoFields = parseInfoFields(raw.infoFields)
  const footerNotes = parseNotes(raw.footerNotes)
  if (
    !notes &&
    !infoFields &&
    !footerNotes &&
    typeof raw.infoTitle !== "string" &&
    typeof raw.contentTitle !== "string"
  ) {
    return null
  }
  return {
    ...(notes ? { notes } : {}),
    ...(infoFields ? { infoFields } : {}),
    ...(footerNotes ? { footerNotes } : {}),
    ...(typeof raw.infoTitle === "string" ? { infoTitle: raw.infoTitle } : {}),
    ...(typeof raw.contentTitle === "string" ? { contentTitle: raw.contentTitle } : {}),
    ...(typeof raw.headerLeft === "string" ? { headerLeft: raw.headerLeft } : {}),
    ...(typeof raw.formCode === "string" ? { formCode: raw.formCode } : {}),
    ...(typeof raw.notesAfterInfo === "boolean" ? { notesAfterInfo: raw.notesAfterInfo } : {}),
  }
}

function resolveFooterNotes(
  parsed: string[] | undefined,
  fallback: string[] | undefined
): string[] | undefined {
  const parsedNotes = parsed?.filter((note) => note.trim()) ?? []
  if (parsedNotes.length) return parsedNotes
  const fallbackNotes = fallback?.filter((note) => note.trim()) ?? []
  return fallbackNotes.length ? fallbackNotes : undefined
}

/** Read editable survey form intro from formContent JSON. */
export function parseSurveyFormDisplayContent(
  raw: unknown,
  fallback: SurveyFormDisplayContent
): SurveyFormDisplayContent {
  const clonedFallback = cloneSurveyFormDisplayContent(fallback)
  const parsed = parseDisplayContentObject(raw)
  if (!parsed) return clonedFallback

  return {
    headerLeft: parsed.headerLeft ?? clonedFallback.headerLeft,
    formCode: parsed.formCode ?? clonedFallback.formCode,
    notes: parsed.notes ?? clonedFallback.notes,
    notesAfterInfo: parsed.notesAfterInfo ?? clonedFallback.notesAfterInfo,
    infoTitle: parsed.infoTitle ?? clonedFallback.infoTitle,
    infoFields: parsed.infoFields ?? clonedFallback.infoFields,
    contentTitle: parsed.contentTitle ?? clonedFallback.contentTitle,
    footerNotes: resolveFooterNotes(parsed.footerNotes, clonedFallback.footerNotes),
  }
}
