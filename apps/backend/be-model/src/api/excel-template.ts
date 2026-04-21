import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { getMinioUrl } from "@workspace/libs"
import ExcelJS from "exceljs"
import XlsxTemplate from "xlsx-template"

const app = new OpenAPIHono({ strict: false })
app.openapi(
  createRoute({
    operationId: "excelTemplate",
    path: "/",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
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
              payload: z
                .array(
                  z.object({
                    data: z.any(),
                    mergeCells: z.array(z.string()).optional().openapi({
                      description: "Danh sách các ô cần gộp trong sheet, định dạng giống như A1:B2",
                    }),
                  })
                )
                .openapi({ description: "Dữ liệu để điền vào template" }),
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

    const templateWorkbook = new ExcelJS.Workbook()
    await templateWorkbook.xlsx.load(buffer)

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

    const generatedSheets: { worksheet: ExcelJS.Worksheet; mergeCells?: string[] }[] = []

    for (const item of payload) {
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

    const mergedWorkbook = new ExcelJS.Workbook()
    const mergedSheet = mergedWorkbook.addWorksheet("Merged")

    mergedSheet.views = [{ showGridLines: showGridLines }]

    let currentRow = 1

    const copySheetContent = (sheet: ExcelJS.Worksheet, startRow: number) => {
      const rowOffset = startRow - 1
      let currentRowInCopy = startRow

      sheet.eachRow({ includeEmpty: true }, (row) => {
        const newRow = mergedSheet.getRow(currentRowInCopy)

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

      if (sheet.model.merges) {
        for (const merge of sheet.model.merges) {
          const [topLeft, bottomRight] = merge.split(":")

          const topMatch = topLeft?.match(/([A-Z]+)(\d+)/)
          const bottomMatch = bottomRight?.match(/([A-Z]+)(\d+)/)

          if (topMatch && bottomMatch && topMatch[2] && bottomMatch[2]) {
            const startRowNum = Number.parseInt(topMatch[2], 10) + rowOffset
            const endRowNum = Number.parseInt(bottomMatch[2], 10) + rowOffset
            const startCol = topMatch[1]
            const endCol = bottomMatch[1]

            mergedSheet.mergeCells(`${startCol}${startRowNum}:${endCol}${endRowNum}`)
          }
        }
      }

      return currentRowInCopy
    }

    if (headSheet) {
      currentRow = copySheetContent(headSheet, currentRow)
    }


    for (const { worksheet: sheet, mergeCells: customMergeCells } of generatedSheets) {
      if (customMergeCells && customMergeCells.length > 0) {
        for (const merge of customMergeCells) {
          try {
            sheet.mergeCells(merge)
          } catch (error) {
            console.log(`Failed to merge cells ${merge}:`, error)
          }
        }
      }
      currentRow = copySheetContent(sheet, currentRow)
    }

    if (tailSheet) {
      currentRow = copySheetContent(tailSheet, currentRow)
    }

    if (generatedSheets.length > 0 && generatedSheets[0]) {
      generatedSheets[0].worksheet.columns.forEach((col, index) => {
        if (!col) return
        const dest = mergedSheet.getColumn(index + 1)
        if (col.width) {
          dest.width = col.width
        }
        if (col.hidden) {
          dest.hidden = true
        }
      })
    }

    const finalMarkerRows: number[] = []
    for (let rowNumber = 1; rowNumber <= mergedSheet.rowCount; rowNumber++) {
      const row = mergedSheet.getRow(rowNumber)
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

    const lastDataRow = getLastUsedDataRow(mergedSheet)
    const maxColumn = Math.max(mergedSheet.columnCount, 1)
    const maxColumnLetter = toColumnLetter(maxColumn)

    const applyPrintDefaults = () => {
      mergedSheet.pageSetup.paperSize = 9
      mergedSheet.pageSetup.fitToPage = false
      mergedSheet.pageSetup.scale = 100
      if (orientation) {
        mergedSheet.pageSetup.orientation = orientation
      }
      if (horizontalCentered !== undefined) {
        mergedSheet.pageSetup.horizontalCentered = horizontalCentered
      }
    }

    if (finalMarkerRows.length > 0) {
      const uniqueBreakRows = [...new Set(finalMarkerRows)].sort((a, b) => a - b)
      for (const markerRow of uniqueBreakRows) {
        if (markerRow <= 1) continue
        if (markerRow > lastDataRow) continue
        mergedSheet.getRow(markerRow - 1).addPageBreak()
      }

      mergedSheet.pageSetup.printArea = `A1:${maxColumnLetter}${lastDataRow}`
      applyPrintDefaults()
    }

    const result = await mergedWorkbook.xlsx.writeBuffer()

    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  }
)

export default app
