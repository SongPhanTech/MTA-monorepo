import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { getMinioUrl } from "@workspace/libs"
import ExcelJS from "exceljs"
import XlsxTemplate from "xlsx-template"

const app = new OpenAPIHono({ strict: false })
const payloadItemSchema = z.object({
  data: z.any(),
  mergeCells: z.array(z.string()).optional().openapi({
    description: "Danh sách các ô cần gộp trong sheet, định dạng giống như A1:B2",
  }),
})
app.openapi(
  createRoute({
    operationId: "excelTemplate",
    path: "/",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z
              .object({
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
                    description:
                      "Dữ liệu nhiều sheet. Nếu có thì mỗi phần tử tạo ra 1 sheet trong file xuất.",
                  }),
                fileName: z.string(),
                path: z.string(),
                showGridLines: z.boolean().optional().openapi({
                  description: "Có hiển thị lưới trong Excel hay không",
                  default: false,
                }),
                wrapText: z.boolean().optional().openapi({
                  description: "Có tự động xuống dòng trong ô hay không",
                  default: true,
                }),
                orientation: z.enum(["portrait", "landscape"]).optional(),
                horizontalCentered: z.boolean().optional(),
              })
              .superRefine((data, ctx) => {
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
              }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Export thành công",
        content: {
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
            schema: z.any().openapi({ type: "string", format: "binary" }),
          },
        },
      },
    },
  }),
  async (c) => {
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
      fileName,
      path,
      payload,
      sheets,
      showGridLines = false,
      wrapText = false,
      head,
      tail,
      orientation,
      horizontalCentered,
    } = c.req.valid("json")
    const res = await fetch(getMinioUrl(`/mta/template/${path}`))
    const buffer = await res.arrayBuffer()
    const nodeBuffer = Buffer.from(buffer)
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

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
      const base = (rawName || fallback).trim().replace(/[\\/?*:[\]]/g, "_").slice(0, 31) || fallback
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
      const applyPrintDefaults = () => {
        targetSheet.pageSetup.paperSize = 9
        targetSheet.pageSetup.fitToPage = false
        targetSheet.pageSetup.scale = 100
        if (orientation) {
          targetSheet.pageSetup.orientation = orientation
        }
        if (horizontalCentered !== undefined) {
          targetSheet.pageSetup.horizontalCentered = horizontalCentered
        }
      }
      if (finalMarkerRows.length > 0) {
        const uniqueBreakRows = [...new Set(finalMarkerRows)].sort((a, b) => a - b)
        for (const markerRow of uniqueBreakRows) {
          if (markerRow <= 1) continue
          if (markerRow > lastDataRow) continue
          targetSheet.getRow(markerRow - 1).addPageBreak()
        }
        targetSheet.pageSetup.printArea = `A1:${maxColumnLetter}${lastDataRow}`
        applyPrintDefaults()
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

    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  }
)

export default app
