import * as ExcelJS from "exceljs"
import PizZip from "pizzip"
import * as XLSX from "xlsx"

/** ──────────────── Types ──────────────── */
export interface TableCell {
  value?: ExcelJS.CellValue | null
  colSpan?: number
  rowSpan?: number
  align?: "left" | "center" | "right"
  /** Căn dọc ô. Mặc định middle. */
  vertical?: "top" | "middle" | "bottom"
  bgColor?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: number
  wrapText?: boolean
  border?: boolean
  /** Kiểu viền ô. Mặc định thin; bảng PLVB tinh chỉnh màu qua tableBorderRange. */
  borderStyle?: ExcelJS.BorderStyle
  /** Lùi dòng (Excel indent), dùng cho ghi chú. */
  indent?: number
  color?: string
  numFmt?: string
  /** Bỏ qua ô (dùng khi hàng dưới bị rowSpan chiếm). */
  skip?: boolean
  /** Chỉ vẽ một số cạnh; ưu tiên hơn `border`. */
  borderEdges?: { top?: boolean; left?: boolean; bottom?: boolean; right?: boolean }
}

export interface TableRow {
  cells: TableCell[]
  height?: number
}

export interface SheetExportOptions {
  sheet?: string | number
  data?: Record<string, string | number | null>
  /** Các key trong `data` — ô chứa `{{key}}` sẽ được in đậm sau khi thay placeholder */
  boldDataKeys?: string[]
  rows?: TableRow[]
  tableStartCell?: { row: number; col: number }
  hiddenColumns?: string[]
  /** Độ rộng cột theo index 0 = cột A. `undefined` giữ nguyên width template. */
  columnWidths?: Array<number | undefined>
  thinBorderRange?: { top: number; left: number; bottom: number; right: number }
  /**
   * Viền bảng PLVB:
   * - ngoài / đáy tiêu đề / hàng nhấn (Học phần TN) / cột giữa: medium đen
   * - lưới trong: thin xám nhạt
   */
  tableBorderRange?: {
    top: number
    left: number
    bottom: number
    right: number
    /** Số hàng tiêu đề bảng (STT / Thang điểm…) — đáy khung tiêu đề đậm */
    headerRows?: number
    /** Hàng cần đường kẻ ngang đậm phía trên (1-based), vd. "Học phần tốt nghiệp" */
    accentTopRows?: number[]
    /** Cột cuối nửa trái — cạnh phải đậm (phân cách 2 cột bảng) */
    midCol?: number
  }
  /** Căn tiêu đề / header template theo mẫu phụ lục văn bằng. */
  headerStylePreset?: "phu-luc-van-bang"
  /** Xóa nội dung sheet trước khi ghi `rows` (không dùng layout template). */
  resetSheet?: boolean
  /**
   * Chèn dòng dữ liệu quanh một dòng mốc có sẵn trong template.
   * Không vẽ lại header, lề, chữ ký — chỉ điền giá trị và kẻ lưới dòng môn.
   */
  templateInserts?: TemplateInsert[]
}

export interface TemplateValueRow {
  values: Array<string | number | null>
  height?: number
}

export interface TemplateInsert {
  /** Cụm chữ trên dòng mốc, ví dụ "Học phần tốt nghiệp". Dòng mốc được giữ. */
  marker: string
  before?: TemplateValueRow[]
  after?: TemplateValueRow[]
  /** Bỏ dòng mốc khi không có dòng `after`. */
  removeMarkerWhenNoAfter?: boolean
}

export interface BuildExcelFromTemplateOptions {
  templateBuffer: Buffer | ArrayBuffer
  extension?: string
  sheets: SheetExportOptions[]
  fileName: string
  fontFamily?: string
  fontSize?: number
  mergeSheetsToOne?: boolean
  sheetName?: string
  /** Khi gộp nhiều sheet: ngắt trang in giữa từng khối (mỗi học viên một trang). */
  pageBreakBetweenSheets?: boolean
  pageSetup?: Partial<ExcelJS.PageSetup>
  /** Không ghi đè font, cỡ chữ, theme của template. */
  preserveTemplateStyle?: boolean
}

/** @deprecated Dùng BuildExcelFromTemplateOptions trên server */
export type ExportOptions = BuildExcelFromTemplateOptions & { templateUrl?: string }

const INVALID_XML_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g

/**
 * Excel/OpenXML không chấp nhận một số control chars trong text cell.
 * Dữ liệu production đôi khi chứa các ký tự này (copy/paste), khiến file tải về nhưng Excel báo corrupt.
 */
function sanitizeExcelCellValue(value: unknown): ExcelJS.CellValue {
  if (typeof value !== "string") return value as ExcelJS.CellValue
  return value.replace(INVALID_XML_CONTROL_CHARS, "")
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function replacePlaceholdersInText(
  text: string,
  data: Record<string, string | number | null>
): string {
  let next = text
  for (const key in data) {
    const escaped = escapeRegExp(key)
    const replacement = String(data[key] ?? "")
    next = next.replace(new RegExp(`{{\\s*${escaped}\\s*}}`, "g"), () => replacement)
    next = next.replace(new RegExp(`\\$\\{\\s*${escaped}\\s*}`, "g"), () => replacement)
  }
  return next
}

function replaceTemplatePlaceholders(
  value: ExcelJS.CellValue,
  data: Record<string, string | number | null>
): ExcelJS.CellValue {
  if (typeof value === "string") {
    return sanitizeExcelCellValue(replacePlaceholdersInText(value, data))
  }

  if (value && typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return {
      ...value,
      richText: value.richText.map((part) => ({
        ...part,
        text: sanitizeExcelCellValue(replacePlaceholdersInText(part.text, data)) as string,
      })),
    } as ExcelJS.CellRichTextValue
  }

  return value
}

function cellHasTemplatePlaceholder(value: ExcelJS.CellValue): boolean {
  const text = cellPlainText(value)
  return text.includes("{{") || text.includes("${")
}

function cellContainsPlaceholder(value: ExcelJS.CellValue, key: string): boolean {
  const escaped = escapeRegExp(key)
  const pattern = new RegExp(`({{\\s*${escaped}\\s*}}|\\$\\{\\s*${escaped}\\s*})`)
  if (typeof value === "string") return pattern.test(value)
  if (value && typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return value.richText.some((part) => pattern.test(part.text))
  }
  return false
}

function applyColumnWidths(worksheet: ExcelJS.Worksheet, widths?: Array<number | undefined>) {
  if (!widths?.length) return
  widths.forEach((width, idx) => {
    if (typeof width === "number") {
      worksheet.getColumn(idx + 1).width = width
    }
  })
}

function toColumnLetter(col: number): string {
  let letter = ""
  let n = col
  while (n > 0) {
    const mod = (n - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}

function applyPageSetup(worksheet: ExcelJS.Worksheet, pageSetup?: Partial<ExcelJS.PageSetup>) {
  if (!pageSetup) return
  const next: Partial<ExcelJS.PageSetup> = {
    ...worksheet.pageSetup,
    ...pageSetup,
    margins: pageSetup.margins
      ? { ...worksheet.pageSetup.margins, ...pageSetup.margins }
      : worksheet.pageSetup.margins,
  }
  // ExcelJS hay ghi DPI = 4294967295 → preview/in macOS lệch lề, nội dung bị thu nhỏ.
  const dpi = (v: number | undefined) => (v == null || v <= 0 || v > 10000 ? 600 : v)
  next.horizontalDpi = dpi(next.horizontalDpi)
  next.verticalDpi = dpi(next.verticalDpi)
  if (next.fitToWidth != null || next.fitToHeight != null || next.fitToPage) {
    next.fitToPage = true
    // Khi fit-to-page, bỏ scale cố định để Excel tính scale theo fit.
    delete (next as { scale?: number }).scale
  }
  worksheet.pageSetup = next as ExcelJS.PageSetup
}

function applyPrintArea(worksheet: ExcelJS.Worksheet, lastColOverride?: number) {
  const lastRow = worksheet.lastRow?.number ?? 0
  const lastCol = Math.max(lastColOverride ?? worksheet.columnCount, 1)
  if (lastRow <= 0) return
  worksheet.pageSetup.printArea = `A1:${toColumnLetter(lastCol)}${lastRow}`
}

const TABLE_GRID_COLOR = { argb: "FFBFBFBF" }

/** Gán viền trên bản sao style. Gán trực tiếp làm các ô dùng chung một border, trang sau khác trang đầu. */
function setCellBorder(cell: ExcelJS.Cell, border: Partial<ExcelJS.Borders>) {
  const style = JSON.parse(JSON.stringify(cell.style || {})) as ExcelJS.Style
  style.border = border as ExcelJS.Borders
  cell.style = style
}

/** Lưới bảng điểm in mờ. Chỉ từ dòng tiêu đề bảng trở xuống, không đụng phần đầu trang. */
function useThinBorders(worksheet: ExcelJS.Worksheet, minRow = 1) {
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    if (row.number < minRow) return
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.master && cell.master.address !== cell.address) return
      const border = cell.border
      if (!border) return
      let changed = false
      const next: Partial<ExcelJS.Borders> = {}
      for (const edge of ["top", "left", "bottom", "right"] as const) {
        const side = border[edge]
        if (!side?.style) continue
        next[edge] = { style: "thin", color: TABLE_GRID_COLOR }
        changed = true
      }
      if (changed) setCellBorder(cell, { ...border, ...next })
    })
  })
}

const TABLE_FRAME_COLOR = { argb: "FF000000" }

function cellHasGridBorder(border?: Partial<ExcelJS.Borders> | null) {
  return Boolean(
    border?.left?.style || border?.right?.style || border?.top?.style || border?.bottom?.style
  )
}

/** Viền ngoài và đường kẻ giữa của bảng điểm. Không kẻ lại phần đầu trang. */
function emphasizeDiplomaTableFrame(worksheet: ExcelJS.Worksheet, minRow = 1) {
  const maxCol = 12
  const midCol = 6
  const boxes: Array<{ top: number; left: number; bottom: number; right: number }> = []
  const seen = new Set<string>()
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    for (let col = 1; col <= maxCol; col++) {
      const cell = row.getCell(col)
      if (!cellHasGridBorder(cell.border)) continue
      const master = cell.master && cell.master.address !== cell.address ? cell.master : cell
      const key = master.address
      if (seen.has(key)) continue
      seen.add(key)
      let top = Number(master.row)
      let left = Number(master.col)
      let bottom = top
      let right = left
      for (const range of worksheet.model.merges || []) {
        if (typeof range !== "string") continue
        const [startRef, endRef] = range.split(":")
        if (startRef !== master.address) continue
        const end = worksheet.getCell(endRef || startRef)
        bottom = Number(end.row)
        right = Number(end.col)
        break
      }
      if (top < minRow) continue
      boxes.push({ top, left, bottom, right })
    }
  })
  if (!boxes.length) return
  const frameTop = Math.min(...boxes.map((box) => box.top))
  const maxRow = Math.max(...boxes.map((box) => box.bottom))
  const strong = { style: "thin" as const, color: TABLE_FRAME_COLOR }
  const grid = { style: "thin" as const, color: TABLE_GRID_COLOR }

  for (const box of boxes) {
    const cell = worksheet.getCell(box.top, box.left)
    const crossesCenter = box.left <= midCol && box.right >= midCol + 1
    const border: Partial<ExcelJS.Borders> = {
      top: box.top === frameTop ? strong : grid,
      bottom: box.bottom === maxRow ? strong : grid,
      left: box.left === 1 ? strong : grid,
      right: box.right === maxCol || (!crossesCenter && box.right === midCol) ? strong : grid,
    }
    if (!crossesCenter && box.left === midCol + 1) border.left = strong
    setCellBorder(cell, border)
  }
}

function applyBoldToCell(cell: ExcelJS.Cell) {
  cell.font = {
    ...(cell.font ?? {}),
    bold: true,
  }
}

function cloneWorksheet(
  workbook: ExcelJS.Workbook,
  sourceSheet: ExcelJS.Worksheet,
  newSheetName: string
) {
  const newSheet = workbook.addWorksheet(newSheetName)
  // ExcelJS gán dyDescent = 55 cho sheet mới, Excel nhân độ cao dòng thêm 4/3 (20 → 26,75, 30 → 40).
  const sourceDyDescent = sourceSheet.properties?.dyDescent
  newSheet.properties.dyDescent =
    typeof sourceDyDescent === "number" && sourceDyDescent > 0 && sourceDyDescent < 5
      ? sourceDyDescent
      : 0.2

  // 1️⃣ Clone độ rộng cột
  sourceSheet.columns.forEach((col, idx) => {
    const newCol = newSheet.getColumn(idx + 1)
    newCol.width = col.width
    if (!newCol?.hidden) {
      newCol.hidden = false
    } else {
      newCol.hidden = true
    }
    // nếu có style cột thì copy
    if (col.style) {
      newCol.style = JSON.parse(JSON.stringify(col.style))
    }
  })

  // 2️⃣ Clone hàng, ô và style
  sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const newRow = newSheet.getRow(rowNumber)
    newRow.height = row.height

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber)
      const master = cell.master
      const isSlave = master != null && master.address !== cell.address
      // Ô phụ trong vùng gộp không copy chữ — tránh lặp khi mất merge
      newCell.value = isSlave ? null : cell.value

      if (cell.style && Object.keys(cell.style).length > 0) {
        newCell.style = JSON.parse(JSON.stringify(cell.style))
      }
    })

    newRow.commit()
  })

  // 3️⃣ Clone merge cell
  sourceSheet.model.merges.forEach((mergeRange) => {
    try {
      newSheet.mergeCells(mergeRange)
    } catch {
      /* vùng gộp đã có */
    }
  })

  if (sourceSheet.pageSetup) {
    newSheet.pageSetup = JSON.parse(JSON.stringify(sourceSheet.pageSetup))
  }
  if (sourceSheet.headerFooter) {
    newSheet.headerFooter = JSON.parse(JSON.stringify(sourceSheet.headerFooter))
  }

  return newSheet
}

function cellRectsIntersect(
  t1: number,
  l1: number,
  b1: number,
  r1: number,
  t2: number,
  l2: number,
  b2: number,
  r2: number
): boolean {
  return !(b2 < t1 || t2 > b1 || r2 < l1 || l2 > r1)
}

/**
 * Gỡ merge cũ (kể cả khi `unMergeCells` không tìm thấy ô do hàng thưa), rồi merge lại.
 * Tránh lỗi ExcelJS "Cannot merge already merged cells" khi gộp ô trùng vùng template / sau spliceRows.
 */
function mergeCellsSafe(
  worksheet: ExcelJS.Worksheet,
  top: number,
  left: number,
  bottom: number,
  right: number
) {
  type MergeBounds = { top: number; left: number; bottom: number; right: number }
  const ws = worksheet as ExcelJS.Worksheet & { _merges?: Record<string, MergeBounds> }
  for (let attempt = 0; attempt < 24; attempt++) {
    const merges = ws._merges
    if (!merges) break
    const snapshot = Object.values(merges).filter(Boolean) as MergeBounds[]
    let clearedAny = false
    for (const m of snapshot) {
      if (cellRectsIntersect(top, left, bottom, right, m.top, m.left, m.bottom, m.right)) {
        worksheet.getCell(m.top, m.left)
        worksheet.unMergeCells(m.top, m.left, m.bottom, m.right)
        clearedAny = true
      }
    }
    if (!clearedAny) break
  }
  worksheet.mergeCells(top, left, bottom, right)
}

function applyThinBorderRange(
  worksheet: ExcelJS.Worksheet,
  top: number,
  left: number,
  bottom: number,
  right: number
) {
  applyBorderRange(worksheet, top, left, bottom, right, "thin")
}

function applyBorderRange(
  worksheet: ExcelJS.Worksheet,
  top: number,
  left: number,
  bottom: number,
  right: number,
  style: ExcelJS.BorderStyle
) {
  const side = { style, color: { argb: "FF000000" } }
  for (let row = top; row <= bottom; row++) {
    const excelRow = worksheet.getRow(row)
    for (let col = left; col <= right; col++) {
      const cell = excelRow.getCell(col)
      cell.border = {
        top: side,
        left: side,
        bottom: side,
        right: side,
      }
    }
    excelRow.commit()
  }
}

type TableFrameBorderOptions = {
  top: number
  left: number
  bottom: number
  right: number
  headerRows?: number
  accentTopRows?: number[]
  midCol?: number
}

/**
 * Ngoài + khung tiêu đề + phân cách môn TN + cột giữa: medium đen.
 * Lưới trong: thin xám.
 * Quan trọng: gán viền theo vùng merge (ô gốc) — rowSpan STT/Tên HP nếu tô từng ô
 * thì cạnh trên khung tiêu đề bị mất nét đậm.
 */
function applyTableFrameBorder(worksheet: ExcelJS.Worksheet, opts: TableFrameBorderOptions) {
  const { top, left, bottom, right, headerRows = 0, midCol } = opts
  const accentTops = new Set(opts.accentTopRows || [])
  const headerBottom = headerRows > 0 ? top + headerRows - 1 : top - 1
  const inner = { style: "thin" as const, color: { argb: "FFB0B0B0" } }
  const strong = { style: "medium" as const, color: { argb: "FF000000" } }
  const none = { style: undefined as ExcelJS.BorderStyle | undefined }

  type Box = { t: number; l: number; b: number; r: number }
  const merges: Box[] = []
  for (const range of worksheet.model.merges || []) {
    if (typeof range !== "string") continue
    const [startRef, endRef] = range.split(":")
    if (!startRef) continue
    const start = worksheet.getCell(startRef)
    const end = worksheet.getCell(endRef || startRef)
    merges.push({
      t: Number(start.row),
      l: Number(start.col),
      b: Number(end.row),
      r: Number(end.col),
    })
  }

  const mergeBox = (row: number, col: number): Box => {
    for (const m of merges) {
      if (row >= m.t && row <= m.b && col >= m.l && col <= m.r) return m
    }
    return { t: row, l: col, b: row, r: col }
  }

  const seen = new Set<string>()
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      const box = mergeBox(row, col)
      const key = `${box.t}:${box.l}:${box.b}:${box.r}`
      if (seen.has(key)) continue
      seen.add(key)

      // Cạnh của CẢ vùng gộp (ô gốc) — STT/Tên HP rowSpan mới giữ được nét đậm trên/dưới
      const isAccent = accentTops.has(box.t)
      const topBorder = box.t === top || isAccent ? strong : inner
      const bottomBorder = box.b === bottom || box.b === headerBottom || isAccent ? strong : inner
      const leftBorder = box.l === left ? strong : inner
      const rightBorder = box.r === right || (midCol != null && box.r === midCol) ? strong : inner

      for (let r = box.t; r <= box.b; r++) {
        for (let c = box.l; c <= box.r; c++) {
          if (r === box.t && c === box.l) continue
          if (r < top || r > bottom || c < left || c > right) continue
          worksheet.getCell(r, c).border = {
            top: none,
            left: none,
            bottom: none,
            right: none,
          }
        }
      }
      worksheet.getCell(box.t, box.l).border = {
        top: topBorder,
        left: leftBorder,
        bottom: bottomBorder,
        right: rightBorder,
      }
    }
  }
}

function cellPlainText(value: ExcelJS.CellValue): string {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join("")
  }
  if (value && typeof value === "object" && "text" in value) {
    return String((value as { text?: unknown }).text ?? "")
  }
  if (value == null) return ""
  return String(value)
}

/**
 * Ép font chữ khi xuất — không phụ thuộc font trong template.
 * family=1 (Roman/serif) bắt buộc với Times New Roman; nếu để family=2 (Swiss)
 * máy in / Excel dễ render giống Calibri/Arial dù tên font đúng.
 */
function resolveExportFontFamily(options: BuildExcelFromTemplateOptions): string {
  return options.fontFamily?.trim() || "Times New Roman"
}

function isSerifExportFont(fontFamily: string): boolean {
  return /times\s*new\s*roman|times|georgia|garamond|cambria/i.test(fontFamily)
}

function exportFontProps(fontFamily: string): Pick<ExcelJS.Font, "name" | "family"> {
  return {
    name: fontFamily,
    family: isSerifExportFont(fontFamily) ? 1 : 2,
  }
}

function applyWorkbookFontFamily(workbook: ExcelJS.Workbook, fontFamily: string) {
  const themes = workbook.model?.themes as unknown
  if (!themes || typeof themes !== "object" || Array.isArray(themes)) return
  const themeMap = themes as Record<string, unknown>
  for (const key of Object.keys(themeMap)) {
    const xml = themeMap[key]
    if (typeof xml !== "string") continue
    // Đổi cả major + minor latin — tránh theme fallback sang Calibri/Cambria khi in.
    themeMap[key] = xml
      .replace(/(<a:minorFont>[\s\S]*?<a:latin\s+)typeface="[^"]*"/, `$1typeface="${fontFamily}"`)
      .replace(/(<a:majorFont>[\s\S]*?<a:latin\s+)typeface="[^"]*"/, `$1typeface="${fontFamily}"`)
  }
}

/**
 * Vá styles/theme/sharedStrings sau khi ghi xlsx.
 * - Đổi tên font mặc định (Calibri/Arial…) → fontFamily
 * - Bỏ scheme theme
 * - Ép family=1 cho font serif (quan trọng khi in)
 */
function rewriteXlsxFontFamily(
  buffer: Buffer,
  fontFamily: string,
  preserveTemplateStyle = false
): Buffer {
  const zip = new PizZip(buffer)
  const serifFamily = isSerifExportFont(fontFamily) ? "1" : "2"
  const stylesEntry = zip.file("xl/styles.xml")
  if (stylesEntry && !preserveTemplateStyle) {
    let styles = stylesEntry.asText()
    styles = styles.replace(
      /name val="(?:Calibri|Arial|Helvetica|SansSerif|Microsoft Sans Serif)"/g,
      `name val="${fontFamily}"`
    )
    styles = styles.replace(/<scheme val="(?:minor|major)"\s*\/>/g, "")
    // Đổi family Swiss(2) → Roman(1) khi dùng Times New Roman
    if (serifFamily === "1") {
      styles = styles.replace(/<family val="2"\s*\/>/g, `<family val="1"/>`)
      // Thêm family cho font chưa có (ExcelJS thường bỏ)
      styles = styles.replace(/<font>([\s\S]*?)<\/font>/g, (_m, inner: string) => {
        if (/<family\s/i.test(inner)) return `<font>${inner}</font>`
        if (
          new RegExp(`name val="${fontFamily.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(inner)
        ) {
          return `<font>${inner}<family val="1"/></font>`
        }
        return `<font>${inner}</font>`
      })
    }
    zip.file("xl/styles.xml", styles)
  }
  const themeEntry = zip.file("xl/theme/theme1.xml")
  if (themeEntry && !preserveTemplateStyle) {
    let theme = themeEntry.asText()
    theme = theme
      .replace(/(<a:minorFont>[\s\S]*?<a:latin\s+)typeface="[^"]*"/, `$1typeface="${fontFamily}"`)
      .replace(/(<a:majorFont>[\s\S]*?<a:latin\s+)typeface="[^"]*"/, `$1typeface="${fontFamily}"`)
    zip.file("xl/theme/theme1.xml", theme)
  }
  const ssEntry = zip.file("xl/sharedStrings.xml")
  if (ssEntry && !preserveTemplateStyle) {
    let ss = ssEntry.asText()
    ss = ss.replace(
      /rFont val="(?:Calibri|Arial|Helvetica|SansSerif|Microsoft Sans Serif)"/g,
      `rFont val="${fontFamily}"`
    )
    // Ép mọi rFont về fontFamily nếu thiếu / khác (chỉ khi export serif chuẩn)
    if (serifFamily === "1") {
      ss = ss.replace(/rFont val="[^"]*"/g, `rFont val="${fontFamily}"`)
      ss = ss.replace(/<rPr>([\s\S]*?)<\/rPr>/g, (_m, inner: string) => {
        let next = inner
        if (!/<rFont\s/i.test(next)) {
          next += `<rFont val="${fontFamily}"/>`
        }
        if (!/<family\s/i.test(next)) {
          next += `<family val="1"/>`
        } else {
          next = next.replace(/<family val="\d+"\s*\/>/g, `<family val="1"/>`)
        }
        return `<rPr>${next}</rPr>`
      })
    }
    zip.file("xl/sharedStrings.xml", ss)
  }
  // Khi giữ nguyên template thì không sửa DPI / fitToPage của file người dùng upload.
  if (preserveTemplateStyle) {
    return Buffer.from(zip.generate({ type: "nodebuffer", compression: "DEFLATE" }))
  }
  // Sửa pageSetup: DPI lỗi + bỏ scale khi đang fitToPage (tránh in bị thụt lề / thu nhỏ).
  for (const name of Object.keys(zip.files)) {
    if (!/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) continue
    const entry = zip.file(name)
    if (!entry) continue
    let sheetXml = entry.asText()
    sheetXml = sheetXml
      .replace(/horizontalDpi="4294967295"/g, 'horizontalDpi="600"')
      .replace(/verticalDpi="4294967295"/g, 'verticalDpi="600"')
    if (/fitToPage="1"/.test(sheetXml) || /fitToWidth="\d+"/.test(sheetXml)) {
      sheetXml = sheetXml.replace(/\s+scale="\d+"/g, "")
      if (!/<pageSetUpPr\b/i.test(sheetXml)) {
        if (/<sheetPr\b[^>]*\/>/.test(sheetXml)) {
          sheetXml = sheetXml.replace(
            /<sheetPr\b([^>]*)\/>/,
            `<sheetPr$1><pageSetUpPr fitToPage="1"/></sheetPr>`
          )
        } else if (/<sheetPr\b[^>]*>/.test(sheetXml) && !/fitToPage=/.test(sheetXml)) {
          sheetXml = sheetXml.replace(
            /<sheetPr\b([^>]*)>/,
            `<sheetPr$1><pageSetUpPr fitToPage="1"/>`
          )
        }
      }
    }
    zip.file(name, sheetXml)
  }

  return Buffer.from(zip.generate({ type: "nodebuffer", compression: "DEFLATE" }))
}

function firstXmlTag(xml: string, tag: string): string | null {
  const match =
    xml.match(new RegExp(`<${tag}\\b[^>]*/>`)) ??
    xml.match(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`))
  return match?.[0] ?? null
}

function replaceXmlTag(xml: string, tag: string, replacement: string | null): string {
  const existing = firstXmlTag(xml, tag)
  if (replacement == null) return existing ? xml.replace(existing, "") : xml
  if (existing) return xml.replace(existing, replacement)
  return xml.replace("</worksheet>", `${replacement}</worksheet>`)
}

/**
 * Giữ lề và khoảng cách của mẫu.
 * Nhiều học viên: fitToHeight=0 để ngắt trang còn hiệu lực, mỗi người một trang.
 * DPI 4294967295 là giá trị hỏng của ExcelJS.
 */
function fitPageSetupForPrint(pageSetupTag: string, pagesTall: number): string {
  let tag = pageSetupTag
    .replace(/\s+horizontalDpi="4294967295"/g, "")
    .replace(/\s+verticalDpi="4294967295"/g, "")
  if (pagesTall <= 1) return tag
  tag = tag.replace(/\s+fitToHeight="[^"]*"/g, "")
  return tag.replace("<pageSetup", '<pageSetup fitToHeight="0"')
}

function blockStartRows(sheetXml: string): number[] {
  const starts = [1]
  for (const match of sheetXml.matchAll(/<brk\b[^>]*\bid="(\d+)"/g)) {
    starts.push(Number(match[1]) + 1)
  }
  return starts
}

/** Gạch chân tiêu đề nằm trong drawing, neo theo dòng. Nhân bản cho từng học viên. */
function repeatDrawingAnchors(drawingXml: string, excelStartRows: number[]): string {
  if (excelStartRows.length <= 1) return drawingXml
  const anchors = [...drawingXml.matchAll(/<xdr:oneCellAnchor>[\s\S]*?<\/xdr:oneCellAnchor>/g)].map(
    (match) => match[0]
  )
  if (!anchors.length) return drawingXml
  let nextId = 100
  const copies: string[] = []
  for (const start of excelStartRows) {
    const delta = start - 1
    for (const anchor of anchors) {
      const shapeId = nextId
      nextId += 1
      let copy = anchor.replace(/(<xdr:row>)(\d+)(<\/xdr:row>)/g, (_match, open, row, close) => {
        return `${open}${Number(row) + delta}${close}`
      })
      copy = copy.replace(
        /(<xdr:cNvPr\b[^>]*\bid=")(\d+)(")/,
        (_match, open, _id, close) => `${open}${shapeId}${close}`
      )
      copy = copy.replace(
        /(<xdr:cNvPr\b[^>]*\bname=")([^"]*)(")/,
        (_match, open, _name, close) => `${open}GachChan${shapeId}${close}`
      )
      const creationId = `{00000000-0008-0000-0000-${String(shapeId).padStart(12, "0")}}`
      copy = copy.replace(
        /(<a16:creationId\b[^>]*\bid=")\{[^"]*\}(")/,
        (_match, open, close) => `${open}${creationId}${close}`
      )
      copies.push(copy)
    }
  }
  let used = false
  return drawingXml.replace(/<xdr:oneCellAnchor>[\s\S]*?<\/xdr:oneCellAnchor>/g, () => {
    if (used) return ""
    used = true
    return copies.join("")
  })
}

function ensureFitToPage(xml: string): string {
  if (/<pageSetUpPr\b[^>]*fitToPage="1"/.test(xml)) return xml
  if (/<pageSetUpPr\b/.test(xml)) {
    return xml.replace(/<pageSetUpPr\b([^>]*?)\s*\/?>/, (_match, attrs: string) => {
      const next = attrs.replace(/\s+fitToPage="[^"]*"/, "")
      return `<pageSetUpPr${next} fitToPage="1"/>`
    })
  }
  if (/<sheetPr\b[^>]*\/>/.test(xml)) {
    return xml.replace(/<sheetPr\b([^>]*)\/>/, `<sheetPr$1><pageSetUpPr fitToPage="1"/></sheetPr>`)
  }
  if (/<sheetPr\b/.test(xml)) {
    return xml.replace(/<sheetPr\b([^>]*)>/, `<sheetPr$1><pageSetUpPr fitToPage="1"/>`)
  }
  return xml.replace("<dimension", `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension`)
}

function absoluteCellRef(ref: string): string {
  return ref.replace(/([A-Z]+)(\d+)/gi, "$$$1$$$2")
}

function quoteSheetName(name: string): string {
  return `'${name.replace(/'/g, "''")}'`
}

/** Vùng in cũ của mẫu (A1:L32) không theo các dòng môn vừa chèn, nên phần dưới bị đẩy sang trang 2. */
function rewritePrintAreas(zip: PizZip) {
  const workbookEntry = zip.file("xl/workbook.xml")
  const relsEntry = zip.file("xl/_rels/workbook.xml.rels")
  if (!workbookEntry || !relsEntry) return
  const rels = relsEntry.asText()
  const sheetTags = [...workbookEntry.asText().matchAll(/<sheet\b[^>]*>/g)]
  const areas: string[] = []
  sheetTags.forEach((match, index) => {
    const tag = match[0]
    const name = tag.match(/\bname="([^"]*)"/)?.[1]
    const relId = tag.match(/\br:id="([^"]+)"/)?.[1]
    if (!name || !relId) return
    const target = rels.match(new RegExp(`Id="${relId}"[^>]*Target="([^"]+)"`))?.[1]
    const sheetPath = target
      ? `xl/${target.replace(/^\//, "")}`
      : `xl/worksheets/sheet${index + 1}.xml`
    const sheetXml = zip.file(sheetPath)?.asText() ?? ""
    const dimension = sheetXml.match(/<dimension\b[^>]*ref="([A-Z]+\d+:[A-Z]+\d+)"/i)?.[1]
    const lastRow = [...sheetXml.matchAll(/<row\b[^>]*\br="(\d+)"/g)].reduce(
      (max, row) => Math.max(max, Number(row[1])),
      0
    )
    const usedRef = dimension
      ? dimension.replace(
          /(\d+)$/,
          String(Math.max(lastRow, Number(dimension.match(/(\d+)$/)?.[1] ?? 0)))
        )
      : `A1:L${lastRow || 33}`
    areas.push(
      `<definedName name="_xlnm.Print_Area" localSheetId="${index}">${quoteSheetName(name)}!${absoluteCellRef(usedRef)}</definedName>`
    )
  })
  if (!areas.length) return
  let workbook = workbookEntry
    .asText()
    .replace(/<definedName\b[^>]*name="_xlnm\.Print_Area"[\s\S]*?<\/definedName>/g, "")
  if (/<definedNames>/.test(workbook)) {
    workbook = workbook.replace("</definedNames>", `${areas.join("")}</definedNames>`)
  } else {
    workbook = workbook.replace(
      "</workbook>",
      `<definedNames>${areas.join("")}</definedNames></workbook>`
    )
  }
  zip.file("xl/workbook.xml", workbook)
}

/** ExcelJS bỏ drawing và ghi thêm fit/căn trang. Gắn lại đúng phần đó từ file upload. */
function restoreUploadedTemplateChrome(original: Buffer, output: Buffer): Buffer {
  const src = new PizZip(original)
  const dst = new PizZip(output)
  const srcSheet = src.file("xl/worksheets/sheet1.xml")?.asText()
  if (!srcSheet) return output

  for (const name of Object.keys(src.files)) {
    if (!name.startsWith("xl/drawings/") || name.endsWith("/")) continue
    const file = src.file(name)
    if (file && !dst.file(name)) dst.file(name, file.asUint8Array())
  }

  const drawingOverrides =
    src
      .file("[Content_Types].xml")
      ?.asText()
      .match(/<Override[^>]*PartName="\/xl\/drawings\/[^"]+"[^>]*\/>/g) ?? []
  const typesEntry = dst.file("[Content_Types].xml")
  if (typesEntry && drawingOverrides.length) {
    let types = typesEntry.asText()
    for (const override of drawingOverrides) {
      if (!types.includes(override)) types = types.replace("</Types>", `${override}</Types>`)
    }
    dst.file("[Content_Types].xml", types)
  }

  const sheetXmlNames = Object.keys(dst.files).filter((name) =>
    /^xl\/worksheets\/sheet\d+\.xml$/i.test(name)
  )
  const stackedName =
    sheetXmlNames.find((name) => /<brk\b/.test(dst.file(name)?.asText() ?? "")) ?? sheetXmlNames[0]
  const stackedSheet = stackedName ? (dst.file(stackedName)?.asText() ?? "") : ""
  const studentStarts = blockStartRows(stackedSheet)
  const drawingFile = dst.file("xl/drawings/drawing1.xml")
  if (drawingFile && studentStarts.length > 1) {
    dst.file("xl/drawings/drawing1.xml", repeatDrawingAnchors(drawingFile.asText(), studentStarts))
  }

  const srcRels = src.file("xl/worksheets/_rels/sheet1.xml.rels")?.asText() ?? ""
  const drawingRel = srcRels.match(/<Relationship\b[^>]*\/drawing[^>]*\/>/i)?.[0] ?? null
  const pageMargins = firstXmlTag(srcSheet, "pageMargins")
  const pageSetup = firstXmlTag(srcSheet, "pageSetup")
  const printOptions = firstXmlTag(srcSheet, "printOptions")
  const drawing = firstXmlTag(srcSheet, "drawing")
  // ExcelJS ghi dyDescent="0.25" trên mọi dòng. Mẫu là 0.2, nên Excel hiện 20 thành 26,25 và 30 thành 40.
  const rowDyDescent = srcSheet.match(/x14ac:dyDescent="([0-9.]+)"/)?.[1] ?? "0.2"

  for (const name of Object.keys(dst.files)) {
    if (!/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) continue
    const entry = dst.file(name)
    if (!entry) continue
    let xml = entry.asText()
    xml = xml.replace(/x14ac:dyDescent="[^"]*"/g, `x14ac:dyDescent="${rowDyDescent}"`)
    if (pageMargins) xml = replaceXmlTag(xml, "pageMargins", pageMargins)
    const fittedPageSetup = pageSetup
      ? fitPageSetupForPrint(pageSetup, blockStartRows(xml).length)
      : null
    if (fittedPageSetup) xml = replaceXmlTag(xml, "pageSetup", fittedPageSetup)
    xml = ensureFitToPage(xml)
    xml = replaceXmlTag(xml, "printOptions", printOptions)
    if (drawing) xml = replaceXmlTag(xml, "drawing", drawing)
    dst.file(name, xml)

    if (!drawingRel) continue
    const relName = name.replace("xl/worksheets/", "xl/worksheets/_rels/") + ".rels"
    const relEntry = dst.file(relName)
    if (!relEntry) {
      dst.file(
        relName,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${drawingRel}</Relationships>`
      )
      continue
    }
    let rels = relEntry.asText()
    if (!/\/drawing"/i.test(rels)) {
      rels = rels.replace("</Relationships>", `${drawingRel}</Relationships>`)
      dst.file(relName, rels)
    }
  }

  rewritePrintAreas(dst)
  // ExcelJS gắn theme Excel 2013. Excel 2016 trở đi nhân độ cao dòng × 1,3125 (20 → 26,25, 30 → 40).
  const workbookEntry = dst.file("xl/workbook.xml")
  const templateWorkbook = src.file("xl/workbook.xml")?.asText() ?? ""
  if (workbookEntry) {
    let workbookXml = workbookEntry.asText().replace(/\s+defaultThemeVersion="[^"]*"/g, "")
    const fileVersion = templateWorkbook.match(/<fileVersion\b[^>]*\/>/)?.[0]
    if (fileVersion) workbookXml = workbookXml.replace(/<fileVersion\b[^>]*\/>/, fileVersion)
    dst.file("xl/workbook.xml", workbookXml)
  }
  return Buffer.from(dst.generate({ type: "nodebuffer", compression: "DEFLATE" }))
}

function enforceWorksheetFontFamily(worksheet: ExcelJS.Worksheet, fontFamily: string) {
  const base = exportFontProps(fontFamily)
  const withoutScheme = (font?: Partial<ExcelJS.Font> | null): Partial<ExcelJS.Font> => {
    const { scheme: _scheme, ...rest } = (font || {}) as ExcelJS.Font & { scheme?: string }
    return rest
  }
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { ...withoutScheme(cell.font), ...base }
      const value = cell.value
      if (
        value &&
        typeof value === "object" &&
        "richText" in value &&
        Array.isArray(value.richText)
      ) {
        cell.value = {
          richText: value.richText.map((part) => ({
            text: part.text,
            font: { ...withoutScheme(part.font), ...base },
          })),
        }
      }
    })
  })
  worksheet.columns.forEach((col) => {
    if (!col) return
    const style = (col.style || {}) as Partial<ExcelJS.Style>
    col.style = { ...style, font: { ...withoutScheme(style.font), ...base } }
  })
}

function applyDynamicCellStyle(
  cell: ExcelJS.Cell,
  cellData: TableCell,
  options: BuildExcelFromTemplateOptions
) {
  cell.alignment = {
    horizontal: cellData.align || "left",
    vertical: cellData.vertical || "middle",
    wrapText: cellData.wrapText ?? true,
    indent: cellData.indent,
  }
  const fontFamily = resolveExportFontFamily(options)
  cell.font = {
    ...exportFontProps(fontFamily),
    size: cellData.fontSize ?? options.fontSize ?? 14,
    bold: !!cellData.bold,
    italic: !!cellData.italic,
    underline: !!cellData.underline,
  }
  if (cellData.numFmt) {
    cell.numFmt = cellData.numFmt
  }
  if (cellData.bgColor) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: cellData.bgColor },
    }
  }
  const applyBorder = cellData.border ?? true
  const edge = {
    style: cellData.borderStyle || "thin",
    color: { argb: "FF000000" },
  }
  if (cellData.borderEdges) {
    const e = cellData.borderEdges
    cell.border = {
      top: e.top ? edge : { style: undefined },
      left: e.left ? edge : { style: undefined },
      bottom: e.bottom ? edge : { style: undefined },
      right: e.right ? edge : { style: undefined },
    }
  } else if (applyBorder) {
    cell.border = { top: edge, left: edge, bottom: edge, right: edge }
  } else {
    cell.border = {
      top: { style: undefined },
      left: { style: undefined },
      bottom: { style: undefined },
      right: { style: undefined },
    }
  }
  if (cellData.color) {
    cell.font = {
      ...cell.font,
      color: { argb: cellData.color },
    }
  }
  if (
    cell.value &&
    typeof cell.value === "object" &&
    "richText" in cell.value &&
    Array.isArray(cell.value.richText)
  ) {
    const baseFont = cell.font || {}
    const richFontBase = exportFontProps(fontFamily)
    cell.value = {
      richText: cell.value.richText.map((part) => ({
        text: part.text,
        font: {
          ...richFontBase,
          name: part.font?.name || baseFont.name || richFontBase.name,
          family: richFontBase.family,
          size: part.font?.size || baseFont.size,
          italic: part.font?.italic ?? baseFont.italic,
          bold: !!part.font?.bold,
          underline: part.font?.underline ?? baseFont.underline,
          color: part.font?.color || baseFont.color,
        },
      })),
    }
  }
}

function addCenteredTitleUnderline(worksheet: ExcelJS.Worksheet, titleCell: ExcelJS.Cell) {
  const col = Number(titleCell.col)
  const row = Number(titleCell.row)
  let left = col
  let right = col
  for (const range of worksheet.model.merges || []) {
    const [startRef, endRef] = range.split(":")
    if (!startRef) continue
    const start = worksheet.getCell(startRef)
    const end = worksheet.getCell(endRef || startRef)
    const mt = Number(start.row)
    const ml = Number(start.col)
    const mb = Number(end.row)
    const mr = Number(end.col)
    if (row >= mt && row <= mb && col >= ml && col <= mr) {
      left = ml
      right = mr
      break
    }
  }
  const lineLeft = left + 1
  const lineRight = Math.max(lineLeft, right - 1)
  // Gạch chân ở hàng kế — để cao hơn để không dính sát baseline chữ.
  const lineRow = worksheet.getRow(row + 1)
  lineRow.height = Math.max(Number(lineRow.height) || 0, 10)
  const line = { style: "thin" as const, color: { argb: "FF000000" } }
  for (let c = lineLeft; c <= lineRight; c++) {
    const cell = lineRow.getCell(c)
    cell.border = {
      ...(cell.border || {}),
      top: line,
      left: { style: undefined },
      right: { style: undefined },
      bottom: { style: undefined },
    }
  }
}

function applyPhuLucVanBangHeaderStyles(worksheet: ExcelJS.Worksheet, lastHeaderRow: number) {
  const times = "Times New Roman"
  for (let r = 1; r <= lastHeaderRow; r++) {
    const excelRow = worksheet.getRow(r)
    excelRow.eachCell({ includeEmpty: false }, (cell) => {
      const text = cellPlainText(cell.value).replace(/\s+/g, " ").trim()
      if (!text) return
      const font = { name: times, color: cell.font?.color, family: cell.font?.family }
      if (/BỘ QUỐC PHÒNG/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 13, bold: false }
        return
      }
      if (/HỌC VIỆN KỸ THUẬT QUÂN SỰ/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true }
        cell.font = { ...font, size: 13, bold: true, underline: false }
        addCenteredTitleUnderline(worksheet, cell)
        return
      }
      if (/CỘNG HÒA XÃ HỘI/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 12, bold: true }
        return
      }
      if (/Độc lập/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true }
        cell.font = { ...font, size: 12, bold: true, italic: false, underline: false }
        addCenteredTitleUnderline(worksheet, cell)
        return
      }
      if (/PHỤ LỤC VĂN BẰNG/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 14, bold: true }
        return
      }
      if (/Kèm theo bằng/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 12, italic: true, bold: false }
        return
      }
      if (
        /STT|TT|Tên học phần|Số tín chỉ|Điểm học phần|Thang điểm/i.test(text) &&
        text.length < 40
      ) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 10, bold: true }
        if (/^Thang điểm\s+/i.test(text) && !text.includes("\n")) {
          cell.value = text.replace(/^Thang điểm\s+/i, "Thang\nđiểm\n")
        }
        return
      }
      if (
        /Họ và tên|Ngày sinh|Khóa|Ngành|Chuyên ngành|Ngôn ngữ|Mã học viên|Nơi sinh|Ngày nhập học|Thời gian đào tạo|Trình độ|Hình thức/i.test(
          text
        )
      ) {
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true }
        cell.font = { ...cell.font, name: times, size: 13 }
      }
    })
  }

  const subHeader = worksheet.getRow(lastHeaderRow)
  subHeader.height = Math.max(Number(subHeader.height) || 0, 46)
  if (lastHeaderRow > 1) {
    const mainHeader = worksheet.getRow(lastHeaderRow - 1)
    mainHeader.height = Math.max(Number(mainHeader.height) || 0, 22)
  }
}

function applySheetTableBorders(worksheet: ExcelJS.Worksheet, sheetOption: SheetExportOptions) {
  if (sheetOption.thinBorderRange) {
    const r = sheetOption.thinBorderRange
    applyThinBorderRange(worksheet, r.top, r.left, r.bottom, r.right)
  }
  if (sheetOption.tableBorderRange) {
    applyTableFrameBorder(worksheet, sheetOption.tableBorderRange)
  }
}

function findMarkerRow(worksheet: ExcelJS.Worksheet, marker: string): number | null {
  let found: number | null = null
  worksheet.eachRow((row, rowNumber) => {
    if (found != null) return
    row.eachCell((cell) => {
      if (found != null) return
      if (cellPlainText(cell.value).includes(marker)) found = rowNumber
    })
  })
  return found
}

type MergeBox = { top: number; left: number; bottom: number; right: number }

function readMerges(worksheet: ExcelJS.Worksheet): MergeBox[] {
  const boxes: MergeBox[] = []
  for (const range of worksheet.model.merges || []) {
    if (typeof range !== "string") continue
    const [startRef, endRef] = range.split(":")
    if (!startRef) continue
    const start = worksheet.getCell(startRef)
    const end = worksheet.getCell(endRef || startRef)
    boxes.push({
      top: Number(start.row),
      left: Number(start.col),
      bottom: Number(end.row),
      right: Number(end.col),
    })
  }
  return boxes
}

function isMergeSlave(boxes: MergeBox[], row: number, col: number) {
  return boxes.some(
    (box) =>
      row >= box.top &&
      row <= box.bottom &&
      col >= box.left &&
      col <= box.right &&
      !(row === box.top && col === box.left)
  )
}

function sheetMaxCol(worksheet: ExcelJS.Worksheet) {
  return Math.max(worksheet.actualColumnCount || 0, worksheet.columnCount || 0, 12)
}

function copyRowCells(
  source: ExcelJS.Row,
  target: ExcelJS.Row,
  maxCol: number,
  slaveAt: (col: number) => boolean
) {
  target.height = source.height
  for (let col = 1; col <= maxCol; col++) {
    const from = source.getCell(col)
    const to = target.getCell(col)
    to.value = slaveAt(col) ? null : from.value
    if (from.style && Object.keys(from.style).length > 0) {
      to.style = JSON.parse(JSON.stringify(from.style)) as Partial<ExcelJS.Style>
    }
  }
}

function clearRow(row: ExcelJS.Row, maxCol: number) {
  for (let col = 1; col <= maxCol; col++) {
    row.getCell(col).value = null
  }
  delete (row as { height?: number }).height
}

/** Chèn dòng trống mà không dùng spliceRows — spliceRows làm vỡ ô gộp và lặp chữ. */
function insertBlankRows(worksheet: ExcelJS.Worksheet, startRow: number, count: number) {
  if (count <= 0) return
  const merges = readMerges(worksheet)
  const affected = merges.filter((box) => box.bottom >= startRow)
  for (const box of affected) {
    try {
      worksheet.unMergeCells(box.top, box.left, box.bottom, box.right)
    } catch {
      /* ignore */
    }
  }
  const maxCol = sheetMaxCol(worksheet)
  const last = worksheet.lastRow?.number ?? startRow
  for (let row = last; row >= startRow; row--) {
    copyRowCells(worksheet.getRow(row), worksheet.getRow(row + count), maxCol, (col) =>
      isMergeSlave(affected, row, col)
    )
    clearRow(worksheet.getRow(row), maxCol)
  }
  for (const box of affected) {
    const top = box.top >= startRow ? box.top + count : box.top
    const bottom = box.bottom + count
    if (bottom < top || (top === bottom && box.left === box.right)) continue
    try {
      worksheet.mergeCells(top, box.left, bottom, box.right)
    } catch {
      /* ignore */
    }
  }
}

function deleteWorksheetRows(worksheet: ExcelJS.Worksheet, startRow: number, count: number) {
  if (count <= 0) return
  const merges = readMerges(worksheet)
  const end = startRow + count - 1
  const affected = merges.filter((box) => box.bottom >= startRow)
  for (const box of affected) {
    try {
      worksheet.unMergeCells(box.top, box.left, box.bottom, box.right)
    } catch {
      /* ignore */
    }
  }
  const maxCol = sheetMaxCol(worksheet)
  const last = worksheet.lastRow?.number ?? startRow
  for (let row = startRow + count; row <= last; row++) {
    copyRowCells(worksheet.getRow(row), worksheet.getRow(row - count), maxCol, (col) =>
      isMergeSlave(merges, row, col)
    )
  }
  for (let row = Math.max(startRow, last - count + 1); row <= last; row++) {
    clearRow(worksheet.getRow(row), maxCol)
  }
  for (const box of affected) {
    if (box.top >= startRow && box.bottom <= end) continue
    let top = box.top
    let bottom = box.bottom
    if (top > end) {
      top -= count
      bottom -= count
    } else if (bottom >= startRow) {
      const removed = Math.min(bottom, end) - Math.max(top, startRow) + 1
      bottom -= removed
    }
    if (bottom < top || (top === bottom && box.left === box.right)) continue
    try {
      worksheet.mergeCells(top, box.left, bottom, box.right)
    } catch {
      /* ignore */
    }
  }
}

function unmergeRow(worksheet: ExcelJS.Worksheet, rowNumber: number) {
  const merges = [...(worksheet.model.merges || [])]
  for (const range of merges) {
    if (typeof range !== "string") continue
    const [startRef, endRef] = range.split(":")
    if (!startRef) continue
    const start = worksheet.getCell(startRef)
    const end = worksheet.getCell(endRef || startRef)
    const top = Number(start.row)
    const bottom = Number(end.row)
    if (rowNumber < top || rowNumber > bottom) continue
    try {
      worksheet.unMergeCells(range)
    } catch {
      /* ignore */
    }
  }
}

function captureRowStyles(worksheet: ExcelJS.Worksheet, rowNumber: number, colCount: number) {
  const row = worksheet.getRow(rowNumber)
  return Array.from({ length: colCount }, (_, index) => {
    const style = row.getCell(index + 1).style
    if (!style || Object.keys(style).length === 0) return undefined
    return JSON.parse(JSON.stringify(style)) as Partial<ExcelJS.Style>
  })
}

function writeTemplateDataRow(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  rowData: TemplateValueRow,
  styles: Array<Partial<ExcelJS.Style> | undefined>
) {
  const excelRow = worksheet.getRow(rowNumber)
  if (rowData.height != null) excelRow.height = rowData.height
  rowData.values.forEach((value, index) => {
    const cell = excelRow.getCell(index + 1)
    const style = styles[index]
    if (style?.border) {
      cell.border = JSON.parse(JSON.stringify(style.border)) as ExcelJS.Borders
    }
    const isName = index === 1 || index === 7
    cell.alignment = {
      horizontal: isName ? "left" : "center",
      vertical: "middle",
      wrapText: isName,
    }
    const { scheme: _scheme, ...font } = (cell.font ?? {}) as ExcelJS.Font & { scheme?: string }
    cell.font = { ...font, name: "Times New Roman", size: 10, bold: false }
    cell.value = sanitizeExcelCellValue(value ?? "") as ExcelJS.CellValue
  })
  excelRow.commit()
}

function applyTemplateInserts(worksheet: ExcelJS.Worksheet, inserts?: TemplateInsert[]) {
  if (!inserts?.length) return
  for (const insert of inserts) {
    const before = insert.before ?? []
    const after = insert.after ?? []
    let markerRow = findMarkerRow(worksheet, insert.marker)
    if (markerRow == null) continue

    const colCount = Math.max(
      ...before.map((row) => row.values.length),
      ...after.map((row) => row.values.length),
      1
    )
    const styles = captureRowStyles(worksheet, Math.max(1, markerRow - 1), colCount)

    if (before.length) {
      insertBlankRows(worksheet, markerRow, before.length)
      before.forEach((row, index) => {
        writeTemplateDataRow(worksheet, markerRow! + index, row, styles)
      })
      markerRow += before.length
    }

    if (after.length) {
      insertBlankRows(worksheet, markerRow + 1, after.length)
      after.forEach((row, index) => {
        writeTemplateDataRow(worksheet, markerRow! + 1 + index, row, styles)
      })
    } else if (insert.removeMarkerWhenNoAfter) {
      deleteWorksheetRows(worksheet, markerRow, 1)
    }
  }
}

function resetWorksheetContent(worksheet: ExcelJS.Worksheet) {
  const merges = [...(worksheet.model.merges || [])]
  for (const range of merges) {
    try {
      worksheet.unMergeCells(range)
    } catch {
      /* ignore */
    }
  }
  // ExcelJS bỏ qua spliceRows(1, last) khi xóa hết sheet, nên template còn lại đè nội dung mới.
  let guard = 0
  while (worksheet.rowCount > 0 && guard < 1000) {
    worksheet.spliceRows(worksheet.rowCount, 1)
    guard++
  }
}

function writeDynamicRows(
  worksheet: ExcelJS.Worksheet,
  rows: TableRow[],
  tableStartCell: { row: number; col: number },
  options: BuildExcelFromTemplateOptions,
  insertSpace: boolean
) {
  if (insertSpace && rows.length > 1) {
    worksheet.spliceRows(tableStartCell.row + 1, 0, ...Array(rows.length - 1).fill([]))
  }
  let currentRow = tableStartCell.row
  for (const rowData of rows) {
    let currentCol = tableStartCell.col
    const excelRow = worksheet.getRow(currentRow)
    for (const cellData of rowData.cells) {
      const colSpan = cellData.colSpan ?? 1
      const rowSpan = cellData.rowSpan ?? 1
      if (cellData.skip) {
        currentCol += colSpan
        continue
      }
      const cell = excelRow.getCell(currentCol)
      cell.value = sanitizeExcelCellValue(cellData.value) as ExcelJS.CellValue
      applyDynamicCellStyle(cell, cellData, options)
      if (colSpan > 1 || rowSpan > 1) {
        mergeCellsSafe(
          worksheet,
          currentRow,
          currentCol,
          currentRow + rowSpan - 1,
          currentCol + colSpan - 1
        )
      }
      currentCol += colSpan
    }
    if (rowData.height != null) excelRow.height = rowData.height
    excelRow.commit()
    currentRow++
  }
}

function toArrayBuffer(buffer: Buffer | ArrayBuffer): ArrayBuffer {
  if (buffer instanceof ArrayBuffer) return buffer
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer
}

/** ──────────────── Main ──────────────── */
export async function buildExcelFromTemplate(
  options: BuildExcelFromTemplateOptions
): Promise<Buffer> {
  const { templateBuffer, sheets, fileName, extension } = options
  const ext = extension ?? "xlsx"

  if (ext === "xlsx") {
    return handleExcelJSExport(templateBuffer, sheets, fileName, options)
  }
  if (ext === "xls") {
    return handleSheetJSExport(templateBuffer, sheets, fileName, options)
  }
  throw new Error("Unsupported file type")
}

/** ──────────────── XLSX: ExcelJS ──────────────── */
async function handleExcelJSDefault(
  templateBuffer: Buffer | ArrayBuffer,
  sheets: SheetExportOptions[],
  _fileName: string,
  options: BuildExcelFromTemplateOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(toArrayBuffer(templateBuffer))
  const fontFamily = resolveExportFontFamily(options)
  if (!options.preserveTemplateStyle) applyWorkbookFontFamily(workbook, fontFamily)

  const firstSheet = workbook.worksheets[0]
  if (!firstSheet) {
    throw new Error("Template is empty")
  }
  let usedOriginalSheet = false
  const filledSheets: ExcelJS.Worksheet[] = []
  const pristineCopies: ExcelJS.Worksheet[] = []
  if (options.preserveTemplateStyle) {
    const usedNames = new Set<string>([firstSheet.name])
    for (let i = 0; i < sheets.length; i++) {
      let name = String(sheets[i]?.sheet ?? `SV ${i + 1}`).slice(0, 31)
      if (usedNames.has(name)) name = `${name.slice(0, 28)} ${i + 1}`.slice(0, 31)
      usedNames.add(name)
      pristineCopies.push(cloneWorksheet(workbook, firstSheet, name))
    }
  }
  for (let sheetIndex = 0; sheetIndex < sheets.length; sheetIndex++) {
    const sheetOption = sheets[sheetIndex]
    if (!sheetOption) continue
    const { sheet, data = {}, rows, tableStartCell } = sheetOption
    let worksheet: ExcelJS.Worksheet | undefined
    const sheetName = String(sheet ?? firstSheet.name).slice(0, 31)
    if (options.preserveTemplateStyle) {
      worksheet = pristineCopies[sheetIndex]
    } else if (typeof sheet === "string" || typeof sheet === "number") {
      worksheet = workbook.getWorksheet(sheet)
      if (!worksheet) {
        worksheet = cloneWorksheet(workbook, firstSheet, sheetName)
      }
    } else {
      worksheet = workbook.worksheets[0]
    }
    if (!worksheet) {
      continue
    }
    if (sheetOption.hiddenColumns && sheetOption.hiddenColumns.length > 0) {
      sheetOption.hiddenColumns.forEach((colName) => {
        worksheet.getColumn(colName).hidden = true
      })
    }
    if (!sheetOption.resetSheet) {
      const boldDataKeys = sheetOption.boldDataKeys ?? []
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          const master = cell.master
          if (master && master.address !== cell.address) return
          if (options.preserveTemplateStyle && !cellHasTemplatePlaceholder(cell.value)) return
          const shouldBold = boldDataKeys.some((key) => cellContainsPlaceholder(cell.value, key))
          cell.value = replaceTemplatePlaceholders(cell.value, data)
          if (shouldBold) applyBoldToCell(cell)
        })
      })
      if (sheetOption.headerStylePreset === "phu-luc-van-bang") {
        applyPhuLucVanBangHeaderStyles(worksheet, (tableStartCell?.row ?? 14) - 1)
      }
      applyTemplateInserts(worksheet, sheetOption.templateInserts)
      if (options.preserveTemplateStyle) {
        const tableRow = findMarkerRow(worksheet, "Tên học phần")
        if (tableRow != null) {
          useThinBorders(worksheet, tableRow)
          emphasizeDiplomaTableFrame(worksheet, tableRow)
        }
        const lastRow = worksheet.lastRow?.number ?? 1
        worksheet.pageSetup.printArea = `A1:L${lastRow}`
      }
    } else {
      resetWorksheetContent(worksheet)
    }

    if (rows && tableStartCell) {
      writeDynamicRows(worksheet, rows, tableStartCell, options, !sheetOption.resetSheet)
    }

    applyColumnWidths(worksheet, sheetOption.columnWidths)
    if (!options.preserveTemplateStyle) {
      applyPageSetup(worksheet, options.pageSetup)
      applyPrintArea(worksheet, sheetOption.columnWidths?.length)
    }
    applySheetTableBorders(worksheet, sheetOption)
    if (!options.preserveTemplateStyle) enforceWorksheetFontFamily(worksheet, fontFamily)
    filledSheets.push(worksheet)
  }

  if (options.preserveTemplateStyle && filledSheets.length > 1) {
    const master = filledSheets[0]
    if (master) {
      for (let i = 1; i < filledSheets.length; i++) {
        const source = filledSheets[i]
        if (!source) continue
        const breakAfter = master.lastRow?.number ?? 1
        master.getRow(breakAfter).addPageBreak()
        appendSheet(master, source, breakAfter + 1)
        workbook.removeWorksheet(source.id)
      }
      master.name = String(options.sheetName || "PLVB").slice(0, 31)
      const lastRow = master.lastRow?.number ?? 1
      master.pageSetup.printArea = `A1:L${lastRow}`
    }
  }

  if (!usedOriginalSheet) {
    workbook.removeWorksheet(firstSheet.id)
  }
  const outBuffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const styled = rewriteXlsxFontFamily(outBuffer, fontFamily, options.preserveTemplateStyle)
  if (!options.preserveTemplateStyle) return styled
  const original = Buffer.isBuffer(templateBuffer) ? templateBuffer : Buffer.from(templateBuffer)
  return restoreUploadedTemplateChrome(original, styled)
}

/** ──────────────── XLS: SheetJS ──────────────── */
function cloneCellStyle(source: ExcelJS.Cell, target: ExcelJS.Cell) {
  if (source.font) target.font = { ...source.font }

  if (source.alignment) target.alignment = JSON.parse(JSON.stringify(source.alignment))

  if (source.border) target.border = JSON.parse(JSON.stringify(source.border))

  if (source.fill) target.fill = JSON.parse(JSON.stringify(source.fill))

  if (source.numFmt) target.numFmt = source.numFmt
}

async function handleSheetJSExport(
  templateBuffer: Buffer | ArrayBuffer,
  sheets: SheetExportOptions[],
  _fileName: string,
  options: BuildExcelFromTemplateOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(toArrayBuffer(templateBuffer))

  const firstSheet = workbook.worksheets[0]

  if (!firstSheet) {
    throw new Error("Template is empty")
  }

  for (const sheetOption of sheets) {
    const { sheet, data = {}, rows, tableStartCell } = sheetOption

    let worksheet: ExcelJS.Worksheet | undefined

    if (typeof sheet === "string" || typeof sheet === "number") {
      worksheet = workbook.getWorksheet(sheet)

      if (!worksheet) {
        worksheet = cloneWorksheet(workbook, firstSheet, String(sheet))
      }
    } else {
      worksheet = workbook.worksheets[0]
    }

    if (!worksheet) continue

    if (sheetOption.hiddenColumns?.length) {
      sheetOption.hiddenColumns.forEach((colName) => {
        worksheet!.getColumn(colName).hidden = true
      })
    }
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.value = replaceTemplatePlaceholders(cell.value, data)
      })
    })

    if (rows && tableStartCell) {
      let currentRow = tableStartCell.row

      if (rows.length > 1) {
        worksheet.spliceRows(tableStartCell.row + 1, 0, ...Array(rows.length - 1).fill([]))
      }

      for (const rowData of rows) {
        let currentCol = tableStartCell.col

        const excelRow = worksheet.getRow(currentRow)
        excelRow.height = worksheet.getRow(tableStartCell.row).height

        for (const cellData of rowData.cells) {
          const cell = excelRow.getCell(currentCol)
          const templateCell = worksheet.getRow(tableStartCell.row).getCell(currentCol)

          cloneCellStyle(templateCell, cell)

          cell.value = sanitizeExcelCellValue(cellData.value)

          const colSpan = cellData.colSpan ?? 1
          const rowSpan = cellData.rowSpan ?? 1

          if (colSpan > 1 || rowSpan > 1) {
            mergeCellsSafe(
              worksheet,
              currentRow,
              currentCol,
              currentRow + rowSpan - 1,
              currentCol + colSpan - 1
            )
          }

          currentCol += colSpan
        }

        excelRow.commit()
        currentRow++
      }
    }
  }

  workbook.removeWorksheet(firstSheet.id)

  const xlsxBuffer = await workbook.xlsx.writeBuffer()

  const wb = XLSX.read(xlsxBuffer, {
    type: "array",
    cellStyles: true,
    cellNF: true,
    cellHTML: false,
    cellText: false,
  })

  const xlsBuffer = XLSX.write(wb, {
    bookType: "xls",
    type: "array",
    cellStyles: true,
    compression: false,
  })

  return Buffer.from(xlsBuffer)
}
// Thêm hàm này vào file template-excel.ts
function appendSheet(
  masterSheet: ExcelJS.Worksheet,
  sourceSheet: ExcelJS.Worksheet,
  startRow: number
) {
  let currentRowNumber = startRow
  const rowOffset = startRow - 1 // Offset để tính toán merge

  // 1. Sao chép Hàng (giá trị, style, chiều cao)
  sourceSheet.eachRow({ includeEmpty: true }, (sourceRow) => {
    const newRow = masterSheet.getRow(currentRowNumber)
    newRow.height = sourceRow.height

    sourceRow.eachCell({ includeEmpty: true }, (sourceCell, colNumber) => {
      const newCell = newRow.getCell(colNumber)
      const master = sourceCell.master
      const isSlave = master != null && master.address !== sourceCell.address
      const value = sourceCell.value
      newCell.value =
        isSlave || value == null
          ? null
          : typeof value === "object"
            ? (JSON.parse(JSON.stringify(value)) as ExcelJS.CellValue)
            : value

      // Sao chép style
      if (sourceCell.style && Object.keys(sourceCell.style).length > 0) {
        newCell.style = JSON.parse(JSON.stringify(sourceCell.style))
      }
    })

    newRow.commit()
    currentRowNumber++
  })

  sourceSheet.model.merges.forEach((mergeRange: string) => {
    // mergeRange có dạng "A5:C6"

    try {
      const [startCell, endCell] = mergeRange.split(":")

      // Phân tích ô bắt đầu (ví dụ "A5")
      const startMatch = startCell?.match(/([A-Z]+)(\d+)/)
      if (!startMatch) return // Bỏ qua nếu không khớp
      const startCol = startMatch[1] // "A"
      const startRow = Number.parseInt(startMatch[2] ?? "0", 10) // 5

      // Phân tích ô kết thúc (ví dụ "C6")
      const endMatch = endCell?.match(/([A-Z]+)(\d+)/)
      if (!endMatch) return // Bỏ qua nếu không khớp
      const endCol = endMatch[1] // "C"
      const endRow = Number.parseInt(endMatch[2] ?? "0", 10) // 6

      // Tính toán lại tọa độ hàng mới
      const newStartRow = startRow + rowOffset
      const newEndRow = endRow + rowOffset

      // Tạo chuỗi range mới (ví dụ "A55:C56")
      const newRange = `${startCol}${newStartRow}:${endCol}${newEndRow}`

      // Merge bằng chuỗi, giống như cloneWorksheet
      masterSheet.mergeCells(newRange)
    } catch (e) {
      console.error("Error processing merge range:", mergeRange, e)
    }
  })
}
// THAY THẾ TOÀN BỘ HÀM handleExcelJSExport CŨ BẰNG HÀM NÀY

async function handleExcelJSMergeSheets(
  templateBuffer: Buffer | ArrayBuffer,
  sheets: SheetExportOptions[],
  _fileName: string,
  options: BuildExcelFromTemplateOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(toArrayBuffer(templateBuffer))
  const fontFamily = resolveExportFontFamily(options)
  if (!options.preserveTemplateStyle) applyWorkbookFontFamily(workbook, fontFamily)

  const firstSheet = workbook.worksheets[0] // Template
  if (!firstSheet) {
    throw new Error("Template is empty")
  }

  const tempWorksheets: ExcelJS.Worksheet[] = []

  // 1. TẠO TẤT CẢ CÁC SHEET TẠM TRONG BỘ NHỚ
  for (const sheetOption of sheets) {
    const { sheet, data = {}, rows, tableStartCell, hiddenColumns } = sheetOption

    // Mỗi sheetOption BẮT BUỘC phải có tên sheet duy nhất
    const sheetName = String(sheet || Date.now())
    const worksheet = cloneWorksheet(workbook, firstSheet, sheetName)

    // 1a. Ẩn cột (nếu có)
    if (hiddenColumns && hiddenColumns.length > 0) {
      hiddenColumns.forEach((colName) => {
        worksheet.getColumn(colName).hidden = true
      })
    }

    if (!sheetOption.resetSheet) {
      const boldDataKeys = sheetOption.boldDataKeys ?? []
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          const shouldBold = boldDataKeys.some((key) => cellContainsPlaceholder(cell.value, key))
          cell.value = replaceTemplatePlaceholders(cell.value, data)
          if (shouldBold) applyBoldToCell(cell)
        })
      })
      if (sheetOption.headerStylePreset === "phu-luc-van-bang") {
        applyPhuLucVanBangHeaderStyles(worksheet, (tableStartCell?.row ?? 14) - 1)
      }
      applyTemplateInserts(worksheet, sheetOption.templateInserts)
    } else {
      resetWorksheetContent(worksheet)
    }

    if (rows && tableStartCell) {
      writeDynamicRows(worksheet, rows, tableStartCell, options, !sheetOption.resetSheet)
    }

    applyColumnWidths(worksheet, sheetOption.columnWidths)
    applySheetTableBorders(worksheet, sheetOption)
    if (!options.preserveTemplateStyle) enforceWorksheetFontFamily(worksheet, fontFamily)

    // 1d. Thêm sheet đã xử lý vào danh sách tạm
    tempWorksheets.push(worksheet)
  }

  // 2. GỘP CÁC SHEET TẠM VÀO MASTER SHEET
  if (tempWorksheets.length === 0) {
    throw new Error("No data provided to export")
  }

  const masterSheet = tempWorksheets[0] // Lấy sheet đầu tiên làm sheet chính

  // Gộp từ sheet thứ 2 trở đi
  if (tempWorksheets.length > 1) {
    let currentRowOffset = masterSheet?.lastRow ? masterSheet.lastRow.number : 0

    for (let i = 1; i < tempWorksheets.length; i++) {
      const sheetToCopy = tempWorksheets[i]

      if (options.pageBreakBetweenSheets) {
        masterSheet?.getRow(currentRowOffset).addPageBreak()
      } else {
        // Thêm 2 hàng trống để ngăn cách
        masterSheet?.addRow({})
        masterSheet?.addRow({})
        currentRowOffset += 2
      }

      // Copy nội dung
      appendSheet(
        masterSheet as ExcelJS.Worksheet,
        sheetToCopy as ExcelJS.Worksheet,
        currentRowOffset + 1
      )

      // Cập nhật lại offset
      currentRowOffset = masterSheet?.lastRow ? masterSheet.lastRow.number : 0

      // Xóa sheet tạm sau khi copy
      workbook.removeWorksheet(sheetToCopy?.id ?? "")
    }
  }

  // 3. XÓA TEMPLATE GỐC VÀ XUẤT FILE
  workbook.removeWorksheet(firstSheet.id)

  // Đổi tên sheet chính (nếu muốn)
  if (masterSheet) {
    masterSheet.name = options.sheetName || "TongHopDiem"
    applyPageSetup(masterSheet, options.pageSetup)
    applyPrintArea(masterSheet, sheets[0]?.columnWidths?.length)
    if (!options.preserveTemplateStyle) enforceWorksheetFontFamily(masterSheet, fontFamily)
  }

  const outBuffer = await workbook.xlsx.writeBuffer()
  return rewriteXlsxFontFamily(Buffer.from(outBuffer), fontFamily, options.preserveTemplateStyle)
}

async function handleExcelJSExport(
  templateBuffer: Buffer | ArrayBuffer,
  sheets: SheetExportOptions[],
  fileName: string,
  options: BuildExcelFromTemplateOptions
): Promise<Buffer> {
  if (options.mergeSheetsToOne) {
    return handleExcelJSMergeSheets(templateBuffer, sheets, fileName, options)
  }
  return handleExcelJSDefault(templateBuffer, sheets, fileName, options)
}
