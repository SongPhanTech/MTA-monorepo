import * as ExcelJS from "exceljs"
import * as XLSX from "xlsx"

/** ──────────────── Types ──────────────── */
export interface TableCell {
  value?: ExcelJS.CellValue | null
  colSpan?: number
  rowSpan?: number
  align?: "left" | "center" | "right"
  bgColor?: string
  bold?: boolean
  italic?: boolean
  fontSize?: number
  wrapText?: boolean
  border?: boolean
  /** Kiểu viền ô. Mặc định thin; bảng phụ lục dùng medium để khung in đậm. */
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
  /** Viền trong thin, khung ngoài medium — khớp mẫu phụ lục văn bằng. */
  tableBorderRange?: { top: number; left: number; bottom: number; right: number }
  /** Căn tiêu đề / header template theo mẫu phụ lục văn bằng. */
  headerStylePreset?: "phu-luc-van-bang"
  /** Xóa nội dung sheet trước khi ghi `rows` (không dùng layout template). */
  resetSheet?: boolean
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
  worksheet.pageSetup = {
    ...worksheet.pageSetup,
    ...pageSetup,
    margins: pageSetup.margins
      ? { ...worksheet.pageSetup.margins, ...pageSetup.margins }
      : worksheet.pageSetup.margins,
  }
}

function applyPrintArea(worksheet: ExcelJS.Worksheet, lastColOverride?: number) {
  const lastRow = worksheet.lastRow?.number ?? 0
  const lastCol = Math.max(lastColOverride ?? worksheet.columnCount, 1)
  if (lastRow <= 0) return
  worksheet.pageSetup.printArea = `A1:${toColumnLetter(lastCol)}${lastRow}`
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

      // ✅ copy giá trị
      newCell.value = cell.value

      // ✅ copy style
      if (cell.style && Object.keys(cell.style).length > 0) {
        newCell.style = JSON.parse(JSON.stringify(cell.style))
      }
    })

    newRow.commit()
  })

  // 3️⃣ Clone merge cell
  sourceSheet.model.merges.forEach((mergeRange) => {
    newSheet.mergeCells(mergeRange)
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

/** Lưới trong mỏng; khung ngoài đậm. Xóa viền ô phụ của vùng gộp để viền template không đè khung. */
function applyTableFrameBorder(
  worksheet: ExcelJS.Worksheet,
  top: number,
  left: number,
  bottom: number,
  right: number
) {
  const inner = { style: "thin" as const, color: { argb: "FF000000" } }
  const outer = { style: "medium" as const, color: { argb: "FF000000" } }
  const none = { style: undefined as ExcelJS.BorderStyle | undefined }

  const mergeBounds = (row: number, col: number) => {
    const merges = worksheet.model.merges || []
    for (const range of merges) {
      const [startRef, endRef] = range.split(":")
      if (!startRef) continue
      const start = worksheet.getCell(startRef)
      const end = worksheet.getCell(endRef || startRef)
      const mt = Number(start.row)
      const ml = Number(start.col)
      const mb = Number(end.row)
      const mr = Number(end.col)
      if (row >= mt && row <= mb && col >= ml && col <= mr) {
        return { top: mt, left: ml, bottom: mb, right: mr }
      }
    }
    return { top: row, left: col, bottom: row, right: col }
  }

  const seen = new Set<string>()
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      const box = mergeBounds(row, col)
      const key = `${box.top}:${box.left}:${box.bottom}:${box.right}`
      if (seen.has(key)) continue
      seen.add(key)
      const frame = {
        top: box.top <= top ? outer : inner,
        left: box.left <= left ? outer : inner,
        bottom: box.bottom >= bottom ? outer : inner,
        right: box.right >= right ? outer : inner,
      }
      for (let r = box.top; r <= box.bottom; r++) {
        for (let c = box.left; c <= box.right; c++) {
          if (r === box.top && c === box.left) continue
          if (r < top || r > bottom || c < left || c > right) continue
          worksheet.getCell(r, c).border = {
            top: r === box.top && box.top <= top ? outer : none,
            left: c === box.left && box.left <= left ? outer : none,
            bottom: r === box.bottom && box.bottom >= bottom ? outer : none,
            right: c === box.right && box.right >= right ? outer : none,
          }
        }
      }
      worksheet.getCell(box.top, box.left).border = frame
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

function applyDynamicCellStyle(
  cell: ExcelJS.Cell,
  cellData: TableCell,
  options: BuildExcelFromTemplateOptions
) {
  cell.alignment = {
    horizontal: cellData.align || "left",
    vertical: "middle",
    wrapText: cellData.wrapText ?? true,
    indent: cellData.indent,
  }
  cell.font = {
    name: options.fontFamily || "Times New Roman",
    size: cellData.fontSize ?? options.fontSize ?? 14,
    bold: !!cellData.bold,
    italic: !!cellData.italic,
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
  if (cell.value && typeof cell.value === "object" && "richText" in cell.value && Array.isArray(cell.value.richText)) {
    const baseFont = cell.font || {}
    cell.value = {
      richText: cell.value.richText.map((part) => ({
        text: part.text,
        font: {
          name: part.font?.name || baseFont.name,
          size: part.font?.size || baseFont.size,
          italic: part.font?.italic ?? baseFont.italic,
          bold: !!part.font?.bold,
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
  const lineRow = worksheet.getRow(row + 1)
  lineRow.height = Math.min(Number(lineRow.height) || 8, 8)
  const line = { style: "medium" as const, color: { argb: "FF000000" } }
  for (let c = lineLeft; c <= lineRight; c++) {
    const cell = lineRow.getCell(c)
    cell.border = {
      ...(cell.border || {}),
      top: { style: undefined },
      left: { style: undefined },
      right: { style: undefined },
      bottom: line,
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
        cell.font = { ...font, size: 12, bold: false }
        return
      }
      if (/HỌC VIỆN KỸ THUẬT QUÂN SỰ/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
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
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 12, bold: true, italic: true, underline: false }
        addCenteredTitleUnderline(worksheet, cell)
        return
      }
      if (/PHỤ LỤC VĂN BẰNG/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 16, bold: true }
        return
      }
      if (/Kèm theo bằng/i.test(text)) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 11, italic: true, bold: false }
        return
      }
      if (
        /STT|TT|Tên học phần|Số tín chỉ|Điểm học phần|Thang điểm/i.test(text) &&
        text.length < 40
      ) {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { ...font, size: 9, bold: true }
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
        cell.font = { ...cell.font, name: times, size: 12 }
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
    const r = sheetOption.tableBorderRange
    applyTableFrameBorder(worksheet, r.top, r.left, r.bottom, r.right)
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
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
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
          const shouldBold = boldDataKeys.some((key) => cellContainsPlaceholder(cell.value, key))
          cell.value = replaceTemplatePlaceholders(cell.value, data)
          if (shouldBold) applyBoldToCell(cell)
        })
      })
      if (sheetOption.headerStylePreset === "phu-luc-van-bang") {
        applyPhuLucVanBangHeaderStyles(worksheet, (tableStartCell?.row ?? 14) - 1)
      }
    } else {
      resetWorksheetContent(worksheet)
    }

    if (rows && tableStartCell) {
      writeDynamicRows(worksheet, rows, tableStartCell, options, !sheetOption.resetSheet)
    }

    applyColumnWidths(worksheet, sheetOption.columnWidths)
    applyPageSetup(worksheet, options.pageSetup)
    applyPrintArea(worksheet, sheetOption.columnWidths?.length)
    applySheetTableBorders(worksheet, sheetOption)
  }

  workbook.removeWorksheet(firstSheet.id)
  const outBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(outBuffer)
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

      // Sao chép giá trị
      newCell.value = sourceCell.value

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
    } else {
      resetWorksheetContent(worksheet)
    }

    if (rows && tableStartCell) {
      writeDynamicRows(worksheet, rows, tableStartCell, options, !sheetOption.resetSheet)
    }

    applyColumnWidths(worksheet, sheetOption.columnWidths)
    applySheetTableBorders(worksheet, sheetOption)

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
  }

  const outBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(outBuffer)
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
