import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { fetchMinio } from "@workspace/libs"
import ExcelJS from "exceljs"
import XlsxTemplate from "xlsx-template"
import {
  ErrorMessageResponseSchema,
  TemplatePreviewResponseSchema,
} from "../dto/common-response.dto"
import { excelSuccess, jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { MinIOService } from "../services/minio"

const app = new OpenAPIHono({ strict: false })

const minioService = new MinIOService()

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const payloadItemSchema = z.object({
  data: z.any(),
  mergeCells: z.array(z.string()).optional().openapi({
    description: "Danh sách các ô cần gộp trong sheet, định dạng giống như A1:B2",
  }),
})

const excelTemplateObject = z.object({
  tail: z
    .object({
      data: z.any(),
    })
    .optional(),
  head: z
    .object({
      data: z.any(),
    })
    .optional(),
  payload: z.array(payloadItemSchema).optional().openapi({
    description: "Dữ liệu để điền vào template (chế độ cũ: 1 sheet)",
  }),
  sheets: z
    .array(
      z.object({
        sheetName: z.string().optional(),
        payload: z.array(payloadItemSchema),
      })
    )
    .optional()
    .openapi({
      description: "Dữ liệu nhiều sheet. Nếu có thì mỗi phần tử tạo ra 1 sheet trong file xuất.",
    }),
  fileName: z.string(),
  path: z.string(),
  prefix: z.string().nullable().optional(),
  showGridLines: z.boolean().optional().openapi({
    description: "Có hiển thị lưới trong Excel hay không",
    default: false,
  }),
  wrapText: z.boolean().optional().openapi({
    description: "Có tự động xuống dòng trong ô hay không",
    default: true,
  }),
})

const requirePayloadOrSheets = (
  data: z.infer<typeof excelTemplateObject>,
  ctx: z.RefinementCtx
) => {
  const hasPayload = Array.isArray(data.payload) && data.payload.length > 0
  const hasSheets =
    Array.isArray(data.sheets) &&
    data.sheets.some((sheet) => Array.isArray(sheet.payload) && sheet.payload.length > 0)
  if (!hasPayload && !hasSheets) {
    ctx.addIssue({
      code: "custom",
      message: "Cần có payload hoặc sheets với ít nhất 1 phần tử dữ liệu",
      path: ["payload"],
    })
  }
}

const excelTemplateSchema = excelTemplateObject.superRefine(requirePayloadOrSheets)

const excelPreviewSchema = excelTemplateObject
  .extend({ previewKey: z.string() })
  .superRefine(requirePayloadOrSheets)

type ExcelTemplateInput = z.infer<typeof excelTemplateObject>

/** Render template Excel thành workbook buffer (dùng chung cho route export và preview). */
export async function buildExcelWorkbookBuffer(body: ExcelTemplateInput): Promise<Buffer> {
  const PAGE_BREAK_MARKER = "ngắt trang"

  const normalizeCellValue = (value: ExcelJS.CellValue | null | undefined): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value).trim().toLowerCase()
    }
    if (value instanceof Date) {
      return value.toISOString().trim().toLowerCase()
    }
    if (typeof value === "object") {
      if ("richText" in value && Array.isArray(value.richText)) {
        return value.richText
          .map((part) => part.text)
          .join("")
          .trim()
          .toLowerCase()
      }
      if ("text" in value && typeof value.text === "string") {
        return value.text.trim().toLowerCase()
      }
      if ("result" in value && value.result !== undefined && value.result !== null) {
        return String(value.result).trim().toLowerCase()
      }
    }
    return ""
  }

  const toColumnLetter = (columnNumber: number) => {
    let result = ""
    let current = columnNumber
    while (current > 0) {
      const remainder = (current - 1) % 26
      result = String.fromCharCode(65 + remainder) + result
      current = Math.floor((current - 1) / 26)
    }
    return result || "A"
  }

  const getLastUsedDataRow = (sheet: ExcelJS.Worksheet) => {
    const n = sheet.rowCount
    for (let r = n; r >= 1; r--) {
      const row = sheet.getRow(r)
      let has = false
      row.eachCell({ includeEmpty: false }, () => {
        has = true
      })
      if (has) return r
    }
    return 1
  }

  const {
    path,
    payload,
    sheets,
    prefix,
    showGridLines = false,
    wrapText = false,
    head,
    tail,
  } = body
  const templatePrefix = (prefix ?? "/mta/template").replace(/\/+$/, "")
  const templatePath = path.replace(/^\/+/, "")
  const res = await fetchMinio(`${templatePrefix}/${templatePath}`)
  const buffer = await res.arrayBuffer()
  const nodeBuffer = Buffer.from(buffer)

  const isSingleSimpleSheet =
    !head?.data &&
    !tail?.data &&
    (!sheets || sheets.length === 0) &&
    Array.isArray(payload) &&
    payload.length === 1 &&
    (!payload[0]?.mergeCells || payload[0]?.mergeCells.length === 0)

  if (isSingleSimpleSheet && payload[0]?.data) {
    const template = new XlsxTemplate(nodeBuffer)
    template.substitute(1, payload[0].data)
    const sheetBuffer = await template.generate({ type: "nodebuffer" })
    return Buffer.from(sheetBuffer as any)
  }

  let headSheet: ExcelJS.Worksheet | undefined
  if (head?.data) {
    const headTemplate = new XlsxTemplate(nodeBuffer)
    headTemplate.substitute("Head", head.data)
    const headBuffer = await headTemplate.generate({ type: "nodebuffer" })
    const headWorkbook = new ExcelJS.Workbook()
    await headWorkbook.xlsx.load(headBuffer)
    headSheet = headWorkbook.getWorksheet("Head")
  }
  let tailSheet: ExcelJS.Worksheet | undefined
  if (tail?.data) {
    const tailTemplate = new XlsxTemplate(nodeBuffer)
    tailTemplate.substitute("Tail", tail.data)
    const tailBuffer = await tailTemplate.generate({ type: "nodebuffer" })
    const tailWorkbook = new ExcelJS.Workbook()
    await tailWorkbook.xlsx.load(tailBuffer)
    tailSheet = tailWorkbook.getWorksheet("Tail")
  }

  const mergedWorkbook = new ExcelJS.Workbook()
  const usedSheetNames = new Set<string>()

  const createUniqueSheetName = (rawName: string, index: number) => {
    const fallback = `Sheet${index + 1}`
    const base =
      (rawName || fallback)
        .trim()
        .replace(/[\\/?*:[\]]/g, "_")
        .slice(0, 31) || fallback
    let name = base
    let suffix = 1
    while (usedSheetNames.has(name)) {
      const suffixText = `_${suffix}`
      name = `${base.slice(0, Math.max(1, 31 - suffixText.length))}${suffixText}`
      suffix++
    }
    usedSheetNames.add(name)
    return name
  }

  const buildGeneratedSheets = async (items: z.infer<typeof payloadItemSchema>[]) => {
    const generatedSheets: { worksheet: ExcelJS.Worksheet; mergeCells?: string[] }[] = []
    for (const item of items) {
      const template = new XlsxTemplate(nodeBuffer)
      template.substitute(1, item.data)
      const sheetBuffer = await template.generate({ type: "nodebuffer" })
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(sheetBuffer)
      const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0]
      if (worksheet) {
        generatedSheets.push({ worksheet, mergeCells: item.mergeCells })
      }
    }
    return generatedSheets
  }

  const copySheetContent = (
    sourceSheet: ExcelJS.Worksheet,
    targetSheet: ExcelJS.Worksheet,
    startRow: number
  ) => {
    const rowOffset = startRow - 1
    let currentRowInCopy = startRow

    sourceSheet.eachRow({ includeEmpty: true }, (row) => {
      const newRow = targetSheet.getRow(currentRowInCopy)

      if (row.height !== undefined) {
        newRow.height = row.height
      }

      if (row.hidden) {
        newRow.hidden = true
      }
      if (row.outlineLevel !== undefined && row.outlineLevel > 0) {
        newRow.outlineLevel = row.outlineLevel
      }

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber)
        newCell.value = cell.value

        newCell.style = {
          font: cell.font,
          alignment: {
            ...cell.alignment,
            ...(wrapText && { wrapText: true }),
          },
          border: cell.border,
          fill: cell.fill,
          numFmt: cell.numFmt,
          protection: cell.protection,
        }
      })

      newRow.commit()
      currentRowInCopy++
    })

    if (sourceSheet.model.merges) {
      for (const merge of sourceSheet.model.merges) {
        const [topLeft, bottomRight] = merge.split(":")

        const topMatch = topLeft?.match(/([A-Z]+)(\d+)/)
        const bottomMatch = bottomRight?.match(/([A-Z]+)(\d+)/)

        if (topMatch && bottomMatch && topMatch[2] && bottomMatch[2]) {
          const startRowNum = Number.parseInt(topMatch[2], 10) + rowOffset
          const endRowNum = Number.parseInt(bottomMatch[2], 10) + rowOffset
          const startCol = topMatch[1]
          const endCol = bottomMatch[1]

          targetSheet.mergeCells(`${startCol}${startRowNum}:${endCol}${endRowNum}`)
        }
      }
    }

    return currentRowInCopy
  }

  /** Giữ margin, scale, fit-to-page, khổ giấy, v.v. từ sheet template (không copy printArea — layout sheet gộp khác template). */
  const applyTemplatePageSetup = (
    source: ExcelJS.Worksheet | undefined,
    target: ExcelJS.Worksheet
  ) => {
    if (!source) return
    const src = source.pageSetup
    if (!src) return
    const dst = target.pageSetup

    if (src.margins) {
      dst.margins = { ...dst.margins, ...src.margins }
    }

    const pageSetupKeys: (keyof ExcelJS.PageSetup)[] = [
      "orientation",
      "horizontalDpi",
      "verticalDpi",
      "fitToPage",
      "fitToWidth",
      "fitToHeight",
      "scale",
      "pageOrder",
      "blackAndWhite",
      "draft",
      "cellComments",
      "errors",
      "paperSize",
      "showRowColHeaders",
      "showGridLines",
      "firstPageNumber",
      "horizontalCentered",
      "verticalCentered",
      "printTitlesRow",
      "printTitlesColumn",
    ]
    for (const key of pageSetupKeys) {
      const value = src[key]
      if (value !== undefined && value !== null) {
        ;(dst as Record<string, unknown>)[key as string] = value
      }
    }

    if (source.headerFooter) {
      target.headerFooter = {
        ...target.headerFooter,
        ...source.headerFooter,
      }
    }
  }

  const applySheetConfig = async (
    targetSheet: ExcelJS.Worksheet,
    payloadItems: z.infer<typeof payloadItemSchema>[]
  ) => {
    targetSheet.views = [{ showGridLines: showGridLines }]
    const generatedSheets = await buildGeneratedSheets(payloadItems)
    let currentRow = 1

    if (headSheet) {
      currentRow = copySheetContent(headSheet, targetSheet, currentRow)
    }
    for (const { worksheet: sourceSheet, mergeCells: customMergeCells } of generatedSheets) {
      if (customMergeCells && customMergeCells.length > 0) {
        for (const merge of customMergeCells) {
          try {
            sourceSheet.mergeCells(merge)
          } catch (error) {
            console.log(`Failed to merge cells ${merge}:`, error)
          }
        }
      }
      currentRow = copySheetContent(sourceSheet, targetSheet, currentRow)
    }
    if (tailSheet) {
      currentRow = copySheetContent(tailSheet, targetSheet, currentRow)
    }

    if (generatedSheets.length > 0 && generatedSheets[0]) {
      generatedSheets[0].worksheet.columns.forEach((col, index) => {
        if (!col) return
        const dest = targetSheet.getColumn(index + 1)
        if (col.width) {
          dest.width = col.width
        }
        if (col.hidden) {
          dest.hidden = true
        }
      })
    }

    const finalMarkerRows: number[] = []
    for (let rowNumber = 1; rowNumber <= targetSheet.rowCount; rowNumber++) {
      const row = targetSheet.getRow(rowNumber)
      let hasPageBreakMarker = false
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (normalizeCellValue(cell.value) === PAGE_BREAK_MARKER) {
          hasPageBreakMarker = true
          cell.value = null
        }
      })

      if (hasPageBreakMarker) {
        row.hidden = true
        finalMarkerRows.push(rowNumber)
      }
      row.commit()
    }

    const lastDataRow = getLastUsedDataRow(targetSheet)
    const maxColumn = Math.max(targetSheet.columnCount, 1)
    const maxColumnLetter = toColumnLetter(maxColumn)

    const templatePageSource = generatedSheets[0]?.worksheet ?? headSheet ?? tailSheet
    applyTemplatePageSetup(templatePageSource, targetSheet)

    if (finalMarkerRows.length > 0) {
      const uniqueBreakRows = [...new Set(finalMarkerRows)].sort((a, b) => a - b)
      for (const markerRow of uniqueBreakRows) {
        if (markerRow <= 1) continue
        if (markerRow > lastDataRow) continue
        targetSheet.getRow(markerRow - 1).addPageBreak()
      }
      targetSheet.pageSetup.printArea = `A1:${maxColumnLetter}${lastDataRow}`
    }
  }

  if (sheets && sheets.length > 0) {
    for (let index = 0; index < sheets.length; index++) {
      const sheetInput = sheets[index]
      if (!sheetInput || !sheetInput.payload || sheetInput.payload.length === 0) continue
      const sheetName = createUniqueSheetName(sheetInput.sheetName || "", index)
      const outputSheet = mergedWorkbook.addWorksheet(sheetName)
      await applySheetConfig(outputSheet, sheetInput.payload)
    }
  } else {
    const outputSheet = mergedWorkbook.addWorksheet("Merged")
    await applySheetConfig(outputSheet, payload ?? [])
  }

  const result = await mergedWorkbook.xlsx.writeBuffer()
  return Buffer.from(result)
}

app.openapi(
  createRoute({
    operationId: "excelTemplate",
    tags: ["Mẫu Excel"],
    summary: "Xuất file Excel từ template",
    path: "/",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: excelTemplateSchema,
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...excelSuccess("Xuất file Excel thành công"),
    },
  }),
  async (c) => {
    const body = c.req.valid("json")
    const result = await buildExcelWorkbookBuffer(body)
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(body.fileName)}`

    return c.body(result, 200, {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": disposition,
    })
  }
)

app.openapi(
  createRoute({
    operationId: "excelTemplatePreview",
    tags: ["Mẫu Excel"],
    summary: "Preview template Excel trên MinIO",
    path: "/preview",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": { schema: excelPreviewSchema },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(TemplatePreviewResponseSchema, "Lưu file preview lên MinIO thành công"),
      500: {
        description: "Lỗi xử lý template",
        content: { "application/json": { schema: ErrorMessageResponseSchema } },
      },
    },
  }),
  async (c) => {
    const { previewKey, ...body } = c.req.valid("json")
    try {
      const buffer = await buildExcelWorkbookBuffer(body)

      const safeKey = previewKey.replace(/[^a-zA-Z0-9_-]/g, "_")
      const objectName = `mta/preview/luan-van/${safeKey}.xlsx`

      const { fileName } = await minioService.putObject(objectName, buffer, XLSX_CONTENT_TYPE)

      return c.json({ path: fileName, fileType: "xlsx" }, 200)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi khi xử lý template Excel"
      console.error("[EXCEL-TEMPLATE-PREVIEW] Error:", error)
      return c.json({ message: msg }, 500)
    }
  }
)

export default app
