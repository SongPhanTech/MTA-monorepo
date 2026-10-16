/** Cấu hình in PLVB — mặc định giữ đúng thông số đang dùng ở Excel. */

export type PlvbPrintVariant = "military" | "international"

/** Mặc định theo mẫu "MẪU PLVB HỆ QS.xls" / mẫu hệ quốc tế. */
export const PLVB_PRINT_SETTINGS_KEYS: Record<PlvbPrintVariant, string> = {
  military: "plvb-html-print-settings-v8-qs",
  /** v2: mặc định giống hệ QS (trước đó EN). */
  international: "plvb-html-print-settings-v2-qt",
}

/** @deprecated dùng PLVB_PRINT_SETTINGS_KEYS.military */
export const PLVB_PRINT_SETTINGS_KEY = PLVB_PRINT_SETTINGS_KEYS.military

/** Tên môn dài hơn 34 ký tự → xuống dòng 2 (~25.5pt); ≤34 ký tự (~15.6pt). */
export const PLVB_NAME_ONE_LINE_MAX = 34
export const PLVB_BODY_ROW_HEIGHT_1 = 15.6
export const PLVB_BODY_ROW_HEIGHT_2 = 25.5
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
  marginTopMm: 6,
  marginBottomMm: 10,
  /** 0.6" / 0.3" như mẫu Excel PLVB. */
  marginLeftMm: 15.24,
  marginRightMm: 7.62,
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
}

/** Mẫu hệ quốc tế — mặc định giống hệt hệ QS (chỉnh riêng trong cấu hình in). */
export const DEFAULT_PLVB_PRINT_SETTINGS_INTERNATIONAL: PlvbPrintSettings = {
  ...DEFAULT_PLVB_PRINT_SETTINGS,
}

export function getDefaultPlvbPrintSettings(variant: PlvbPrintVariant = "military"): PlvbPrintSettings {
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
    return { ...defaults, ...parsed }
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
