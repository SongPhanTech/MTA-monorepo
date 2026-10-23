/** Cấu hình in PLVB — mặc định giữ đúng thông số đang dùng ở Excel. */

export type PlvbPrintVariant = "military" | "international"

/** Mặc định theo mẫu "MẪU PLVB HỆ QS.xls" / mẫu hệ quốc tế. */
export const PLVB_PRINT_SETTINGS_KEYS: Record<PlvbPrintVariant, string> = {
  /** v9: lề mặc định trên 12 / dưới 10 / trái 6 / phải 3 mm. */
  military: "plvb-html-print-settings-v9-qs",
  /** v3: lề mặc định giống hệ QS. */
  international: "plvb-html-print-settings-v3-qt",
}

/** @deprecated dùng PLVB_PRINT_SETTINGS_KEYS.military */
export const PLVB_PRINT_SETTINGS_KEY = PLVB_PRINT_SETTINGS_KEYS.military

/** Tên môn dài hơn 34 ký tự → xuống dòng 2 (~25.5pt); ≤34 ký tự (~15.6pt). */
export const PLVB_NAME_ONE_LINE_MAX = 34
export const PLVB_BODY_ROW_HEIGHT_1 = 15.6
export const PLVB_BODY_ROW_HEIGHT_2 = 25.5
/** Khoảng cách giữa 2 dòng tên môn (hệ số line-height). */
export const PLVB_NAME_LINE_HEIGHT = 1.2
/** Khoảng cách 2 dòng — cụm thông tin cá nhân. */
export const PLVB_INFO_LINE_HEIGHT = 1.3
/** Khoảng cách 2 dòng — cụm tổng kết. */
export const PLVB_SUMMARY_LINE_HEIGHT = 1.15
/** Khoảng cách 2 dòng — cụm ghi chú. */
export const PLVB_NOTE_LINE_HEIGHT = 1.35
/** Chiều cao 1 dòng khối tổng kết (pt). */
export const PLVB_SUMMARY_ROW_HEIGHT = 15.75
/** Dòng Tổng số tín chỉ chiếm bao nhiêu dòng (chỉ bên trái, không đẩy chữ ký). */
export const PLVB_CREDIT_ROW_LINE_COUNT = 1
/** Khoảng cách giữa quốc hiệu và tiêu ngữ (pt). */
export const PLVB_HEADER_RIGHT_GAP = 0
/** Khoảng cách từ mép bảng điểm xuống khối tổng kết/chữ ký (pt). */
export const PLVB_SUMMARY_BLOCK_MARGIN_TOP = 10
export const PLVB_NOTE_FONT = 10
export const PLVB_BODY_FONT = 10
export const PLVB_HEADER_FONT = 9
export const PLVB_INFO_FONT = 12
export const PLVB_FONT_FAMILY = "Times New Roman"

export type PlvbPrintColumns = 1 | 2

export type PlvbPrintSettings = {
  columns: PlvbPrintColumns
  fontFamily: string
  bodyFontSize: number
  headerFontSize: number
  infoFontSize: number
  noteFontSize: number
  nameOneLineMax: number
  rowHeight1: number
  rowHeight2: number
  /** Khoảng cách giữa 2 dòng khi tên môn xuống dòng. */
  nameLineHeight: number
  /** Khoảng cách 2 dòng — cụm thông tin cá nhân. */
  infoLineHeight: number
  /** Khoảng cách 2 dòng — cụm tổng kết. */
  summaryLineHeight: number
  /** Khoảng cách 2 dòng — cụm ghi chú. */
  noteLineHeight: number
  /** Chiều cao 1 dòng khối tổng kết (pt). */
  summaryRowHeight: number
  /** Dòng Tổng số tín chỉ chiếm bao nhiêu dòng. */
  creditRowLineCount: number
  /** Khoảng cách giữa quốc hiệu và tiêu ngữ (pt). */
  headerRightGap: number
  /** Khoảng cách từ bảng điểm xuống khối tổng kết/chữ ký (pt). */
  summaryBlockMarginTop: number
  marginTopMm: number
  marginBottomMm: number
  marginLeftMm: number
  marginRightMm: number
  showScore10: boolean
  showScore4: boolean
  showLetterGrade: boolean
  showGraduationSection: boolean
  showTrainingResultLabel: boolean
  showRegistryNumber: boolean
  /**
   * Hệ quốc tế: khóa môn HKDK 1–2 bị ẩn khi in.
   * Môn khác (HKDK ≠ 1,2) luôn hiển thị. Rỗng = hiện tất cả HKDK 1–2.
   */
  hiddenHkdk12SubjectKeys: string[]
  signerTitle1: string
  signerTitle2: string
  title: string
  subtitleTemplate: string
  /** Quốc hiệu / cơ quan — nội dung từng dòng */
  headerLeftLine1: string
  headerLeftLine2: string
  /** Đoạn gạch chân trong dòng 2 trái (vd. "KỸ THUẬT"); rỗng = không gạch riêng */
  headerLeftLine2Underline: string
  headerRightLine1: string
  headerRightLine2: string
  trainingResultLabel: string
  /** Nhãn dòng Nơi sinh trong cụm thông tin cá nhân */
  infoLabelPlaceOfBirth: string
  /** Quốc hiệu trái — từng dòng (pt) */
  headerLeftLine1Height: number
  headerLeftLine2Height: number
  headerLeftLine1FontSize: number
  headerLeftLine2FontSize: number
  /** Quốc hiệu phải — từng dòng (pt) */
  headerRightLine1Height: number
  headerRightLine2Height: number
  headerRightLine1FontSize: number
  headerRightLine2FontSize: number
  /** Tiêu đề PLVB — khoảng cách sau quốc hiệu + từng dòng (pt) */
  titleBlockMarginTop: number
  titleLineHeight: number
  subtitleLineHeight: number
  titleFontSize: number
  subtitleFontSize: number
  /** Khối tổng kết trái + chữ ký (pt) */
  summaryFontSize: number
  signDateLineHeight: number
  signerTitle1LineHeight: number
  signerTitle2LineHeight: number
  signerGapHeight: number
  signerNameLineHeight: number
  signerTitle1FontSize: number
  signerTitle2FontSize: number
  signerNameFontSize: number
}

const SHARED_LAYOUT_DEFAULTS: Omit<
  PlvbPrintSettings,
  | "signerTitle1"
  | "signerTitle2"
  | "title"
  | "subtitleTemplate"
  | "headerLeftLine1"
  | "headerLeftLine2"
  | "headerLeftLine2Underline"
  | "headerRightLine1"
  | "headerRightLine2"
  | "trainingResultLabel"
  | "infoLabelPlaceOfBirth"
> = {
  columns: 2,
  fontFamily: PLVB_FONT_FAMILY,
  bodyFontSize: PLVB_BODY_FONT,
  headerFontSize: PLVB_HEADER_FONT,
  infoFontSize: PLVB_INFO_FONT,
  noteFontSize: PLVB_NOTE_FONT,
  nameOneLineMax: PLVB_NAME_ONE_LINE_MAX,
  rowHeight1: PLVB_BODY_ROW_HEIGHT_1,
  rowHeight2: PLVB_BODY_ROW_HEIGHT_2,
  nameLineHeight: PLVB_NAME_LINE_HEIGHT,
  infoLineHeight: PLVB_INFO_LINE_HEIGHT,
  summaryLineHeight: PLVB_SUMMARY_LINE_HEIGHT,
  noteLineHeight: PLVB_NOTE_LINE_HEIGHT,
  summaryRowHeight: PLVB_SUMMARY_ROW_HEIGHT,
  creditRowLineCount: PLVB_CREDIT_ROW_LINE_COUNT,
  headerRightGap: PLVB_HEADER_RIGHT_GAP,
  summaryBlockMarginTop: PLVB_SUMMARY_BLOCK_MARGIN_TOP,
  marginTopMm: 12,
  marginBottomMm: 10,
  marginLeftMm: 6,
  marginRightMm: 3,
  showScore10: true,
  showScore4: true,
  showLetterGrade: true,
  showGraduationSection: true,
  showTrainingResultLabel: true,
  showRegistryNumber: true,
  hiddenHkdk12SubjectKeys: [],
  headerLeftLine1Height: 16,
  headerLeftLine2Height: 18,
  headerLeftLine1FontSize: 13,
  headerLeftLine2FontSize: 13,
  headerRightLine1Height: 16,
  headerRightLine2Height: 18,
  headerRightLine1FontSize: 13,
  headerRightLine2FontSize: 14,
  titleBlockMarginTop: 10,
  titleLineHeight: 18,
  subtitleLineHeight: 16,
  titleFontSize: 14,
  subtitleFontSize: 12,
  summaryFontSize: 12,
  signDateLineHeight: 15.9,
  signerTitle1LineHeight: 18,
  signerTitle2LineHeight: 18,
  signerGapHeight: 48,
  signerNameLineHeight: 16,
  signerTitle1FontSize: 14,
  signerTitle2FontSize: 14,
  signerNameFontSize: 12,
}

/** Mẫu hệ quân sự (QS). */
export const DEFAULT_PLVB_PRINT_SETTINGS: PlvbPrintSettings = {
  ...SHARED_LAYOUT_DEFAULTS,
  signerTitle1: "TL. GIÁM ĐỐC",
  signerTitle2: "TRƯỞNG PHÒNG ĐÀO TẠO",
  title: "PHỤ LỤC VĂN BẰNG",
  subtitleTemplate: "(Kèm theo Bằng tốt nghiệp {trinh_do} số hiệu: {so_hieu})",
  headerLeftLine1: "BỘ QUỐC PHÒNG",
  headerLeftLine2: "HỌC VIỆN KỸ THUẬT QUÂN SỰ",
  headerLeftLine2Underline: "KỸ THUẬT",
  headerRightLine1: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
  headerRightLine2: "Độc lập - Tự do - Hạnh phúc",
  trainingResultLabel: "Kết quả đào tạo:",
  infoLabelPlaceOfBirth: "Nơi sinh:",
}

/** Mẫu hệ quốc tế — mặc định giống hệt hệ QS (chỉnh riêng trong cấu hình in). */
export const DEFAULT_PLVB_PRINT_SETTINGS_INTERNATIONAL: PlvbPrintSettings = {
  ...DEFAULT_PLVB_PRINT_SETTINGS,
}

export function getDefaultPlvbPrintSettings(
  variant: PlvbPrintVariant = "military"
): PlvbPrintSettings {
  return variant === "international"
    ? { ...DEFAULT_PLVB_PRINT_SETTINGS_INTERNATIONAL }
    : { ...DEFAULT_PLVB_PRINT_SETTINGS }
}

export function loadPlvbPrintSettings(variant: PlvbPrintVariant = "military"): PlvbPrintSettings {
  const defaults = getDefaultPlvbPrintSettings(variant)
  if (typeof window === "undefined") return defaults
  try {
    const raw = window.localStorage.getItem(PLVB_PRINT_SETTINGS_KEYS[variant])
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<PlvbPrintSettings>
    const merged = { ...defaults, ...parsed }
    // v9 lưu nhầm mặc định 3 dòng tổng tín chỉ — kéo cả chữ ký ra xa bảng điểm.
    if (parsed.headerRightGap == null && parsed.creditRowLineCount === 3) {
      merged.creditRowLineCount = defaults.creditRowLineCount
    }
    if (parsed.summaryBlockMarginTop === 2) {
      merged.summaryBlockMarginTop = defaults.summaryBlockMarginTop
    }
    return merged
  } catch {
    return defaults
  }
}

export function savePlvbPrintSettings(
  settings: PlvbPrintSettings,
  variant: PlvbPrintVariant = "military"
) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PLVB_PRINT_SETTINGS_KEYS[variant], JSON.stringify(settings))
}

export function appendixSubjectNameLength(name?: string | null): number {
  return String(name || "")
    .replace(/\s+/g, " ")
    .trim().length
}

export function wrapAppendixSubjectName(
  name?: string | null,
  nameOneLineMax = PLVB_NAME_ONE_LINE_MAX
): string {
  const text = String(name || "")
    .replace(/\s+/g, " ")
    .trim()
  if (!text || appendixSubjectNameLength(text) <= nameOneLineMax) return text
  const head = text.slice(0, nameOneLineMax + 1)
  let breakAt = Math.max(head.lastIndexOf(" "), head.lastIndexOf(","))
  if (breakAt < Math.floor(nameOneLineMax * 0.45)) {
    return `${text.slice(0, nameOneLineMax).trim()}\n${text.slice(nameOneLineMax).trim()}`
  }
  // Tránh từ cuối dòng 2 quá ngắn (vd. "hủy") — kéo thêm 1 từ xuống cùng dòng
  // → "…không\nphá hủy" thay vì "…không phá\nhủy".
  let line2 = text.slice(breakAt + 1).trim()
  if (line2 && !/\s/.test(line2) && line2.length <= 8) {
    const before = text.slice(0, breakAt).trimEnd()
    const prevBreak = Math.max(before.lastIndexOf(" "), before.lastIndexOf(","))
    if (prevBreak >= Math.floor(nameOneLineMax * 0.45)) {
      breakAt = prevBreak
      line2 = text.slice(breakAt + 1).trim()
    }
  }
  const keepComma = text[breakAt] === ","
  return `${text.slice(0, breakAt + (keepComma ? 1 : 0)).trim()}\n${line2}`
}

export function isTwoLineAppendixName(
  name?: string | null,
  nameOneLineMax = PLVB_NAME_ONE_LINE_MAX
): boolean {
  return appendixSubjectNameLength(name) > nameOneLineMax
}

export function getAppendixSubjectRowHeight(
  names: Array<string | null | undefined>,
  settings: Pick<PlvbPrintSettings, "nameOneLineMax" | "rowHeight1" | "rowHeight2">
): number {
  const twoLine = names.some((n) => isTwoLineAppendixName(n, settings.nameOneLineMax))
  return twoLine ? settings.rowHeight2 : settings.rowHeight1
}

export function formatAppendixScoreDisplay(value: unknown, decimals = 1): string {
  if (value == null || value === "" || value === "-") return ""
  const n = Number(value)
  if (!Number.isFinite(n)) return ""
  return n.toFixed(decimals).replace(".", ",")
}

export type PlvbAppendixSubject = {
  id?: string
  key?: string
  /** subjectVersion.id — dùng chọn ẩn/hiện HKDK 1–2 (hệ QT) */
  subjectKey?: string | null
  /** Học kỳ dự kiến trên CTĐT (TrainingBlockSubject.semester) */
  hocKyDuKien?: number | null
  tenHocPhan?: string | null
  soTinChi?: number | string | null
  thangDiem10?: string | number | null
  thangDiem4?: string | number | null
  thangDiemChu?: string | null
  /** `TrainingBlockSubject.useForFinalScore === false` — học phần điều kiện, in dấu * */
  isConditional?: boolean
}

/** Gắn "* " trước tên học phần điều kiện khi in PLVB. */
export function markConditionalAppendixSubjectName(
  name?: string | null,
  isConditional?: boolean | null
): string {
  const text = String(name || "")
    .replace(/\s+/g, " ")
    .trim()
  if (!isConditional || !text || /^\*/.test(text)) return text
  return `* ${text}`
}

export function getAppendixSubjectPrintName(
  subject?: Pick<PlvbAppendixSubject, "tenHocPhan" | "isConditional"> | null
): string {
  return markConditionalAppendixSubjectName(subject?.tenHocPhan, subject?.isConditional)
}

export function plvbSubjectSelectKey(subject: PlvbAppendixSubject): string {
  return String(subject.subjectKey || subject.id || subject.tenHocPhan || "").trim()
}

/** Hệ QT: ẩn môn HKDK 1–2 theo checkbox; môn khác luôn hiện. */
export function filterSubjectsForPlvbPrint(
  subjects: PlvbAppendixSubject[],
  settings: Pick<PlvbPrintSettings, "hiddenHkdk12SubjectKeys">,
  variant: PlvbPrintVariant
): PlvbAppendixSubject[] {
  if (variant !== "international") return subjects
  const hidden = new Set(settings.hiddenHkdk12SubjectKeys || [])
  if (!hidden.size) return subjects
  return subjects.filter((sub) => {
    const hk = Number(sub.hocKyDuKien)
    if (hk !== 1 && hk !== 2) return true
    const key = plvbSubjectSelectKey(sub)
    return !key || !hidden.has(key)
  })
}

/** Mẫu 2 cột: hết nửa trái rồi mới sang nửa phải (giống Excel). */
export function splitSubjectsTwoColumns<T>(subjects: T[]): { left: T[]; right: T[] } {
  const leftCount = Math.ceil(subjects.length / 2)
  return {
    left: subjects.slice(0, leftCount),
    right: subjects.slice(leftCount),
  }
}

/** Render dòng 2 quốc hiệu trái, gạch chân đoạn `underline`. */
export function renderUnderlinedSegment(text: string, underline: string) {
  const full = String(text || "")
  const mark = String(underline || "").trim()
  if (!mark || !full.includes(mark)) {
    return { before: full, marked: "", after: "" }
  }
  const idx = full.indexOf(mark)
  return {
    before: full.slice(0, idx),
    marked: mark,
    after: full.slice(idx + mark.length),
  }
}
