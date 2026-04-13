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
    const {
      fileName,
      path,
      payload,
      showGridLines = false,
      wrapText = false,
      head,
      tail,
    } = c.req.valid("json")
    const res = await fetch(getMinioUrl(`/mta/template/${path}`))
    const buffer = await res.arrayBuffer()
    const nodeBuffer = Buffer.from(buffer)
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    // Load template workbook to get Head and Tail sheets
    const templateWorkbook = new ExcelJS.Workbook()
    await templateWorkbook.xlsx.load(buffer)

    // Process Head sheet if data is provided
    let headSheet: ExcelJS.Worksheet | undefined
    if (head?.data) {
      const headTemplate = new XlsxTemplate(nodeBuffer)
      headTemplate.substitute("Head", head.data)
      const headBuffer = await headTemplate.generate({ type: "nodebuffer" })
      const headWorkbook = new ExcelJS.Workbook()
      await headWorkbook.xlsx.load(headBuffer)
      headSheet = headWorkbook.getWorksheet("Head")
    }
    // Process Tail sheet if data is provided
    let tailSheet: ExcelJS.Worksheet | undefined
    if (tail?.data) {
      const tailTemplate = new XlsxTemplate(nodeBuffer)
      tailTemplate.substitute("Tail", tail.data)
      const tailBuffer = await tailTemplate.generate({ type: "nodebuffer" })
      const tailWorkbook = new ExcelJS.Workbook()
      await tailWorkbook.xlsx.load(tailBuffer)
      tailSheet = tailWorkbook.getWorksheet("Tail")
    }

    // Generate a workbook for each payload item
    const generatedSheets: { worksheet: ExcelJS.Worksheet; mergeCells?: string[] }[] = []

    for (const item of payload) {
      const template = new XlsxTemplate(nodeBuffer)
      template.substitute(1, item.data)
      const sheetBuffer = await template.generate({ type: "nodebuffer" })
      // Load the generated sheet using exceljs
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(sheetBuffer)
      const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0]
      if (worksheet) {
        generatedSheets.push({ worksheet, mergeCells: item.mergeCells })
      }
    }

    // Create a new workbook and merge all sheets vertically
    const mergedWorkbook = new ExcelJS.Workbook()
    const mergedSheet = mergedWorkbook.addWorksheet("Merged")

    // Hide gridlines
    mergedSheet.views = [{ showGridLines: showGridLines }]

    let currentRow = 1

    // Helper function to copy sheet content
    const copySheetContent = (sheet: ExcelJS.Worksheet, startRow: number) => {
      const rowOffset = startRow - 1
      let currentRowInCopy = startRow

      // Copy all rows with full formatting
      sheet.eachRow({ includeEmpty: true }, (row) => {
        const newRow = mergedSheet.getRow(currentRowInCopy)

        // Copy row height
        if (row.height) {
          newRow.height = row.height
        }

        // Giữ trạng thái ẩn hàng / outline (template đã ẩn hàng thì bản gộp vẫn ẩn)
        if (row.hidden) {
          newRow.hidden = true
        }
        if (row.outlineLevel !== undefined && row.outlineLevel > 0) {
          newRow.outlineLevel = row.outlineLevel
        }

        // Copy all cells with full styling
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const newCell = newRow.getCell(colNumber)
          newCell.value = cell.value

          // Copy full cell style
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

      // Copy merged cells with adjusted row positions
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

    // Copy Head sheet at the top
    if (headSheet) {
      currentRow = copySheetContent(headSheet, currentRow)
    }

    // Copy all payload sheets
    for (const { worksheet: sheet, mergeCells: customMergeCells } of generatedSheets) {
      // Apply custom merge cells before copying
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

    // Copy Tail sheet at the bottom
    if (tailSheet) {
      currentRow = copySheetContent(tailSheet, currentRow)
    }

    // Copy column width + ẩn cột từ sheet nguồn đầu tiên (payload)
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

    const result = await mergedWorkbook.xlsx.writeBuffer()

    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  }
)

export default app
