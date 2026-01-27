import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getMinioUrl } from '@workspace/libs'
import XlsxTemplate from 'xlsx-template'
import ExcelJS from 'exceljs'

const app = new OpenAPIHono({ strict: false })
app.openapi(
    createRoute({
        operationId: 'excelTemplate',
        path: '/',
        method: 'post',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            payload: z
                                .array(
                                    z.object({
                                        data: z.any(),
                                    })
                                )
                                .openapi({ description: 'Dữ liệu để điền vào template' }),
                            fileName: z.string(),
                            path: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Export thành công',
                content: {
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                        schema: z.any().openapi({ type: 'string', format: 'binary' }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { fileName, path, payload } = c.req.valid('json')
        const res = await fetch(getMinioUrl(`/mta/template/${path}`))
        const buffer = await res.arrayBuffer()
        const nodeBuffer = Buffer.from(buffer)

        // Generate a workbook for each payload item
        const generatedSheets: ExcelJS.Worksheet[] = []

        for (const item of payload) {
            const template = new XlsxTemplate(nodeBuffer)
            template.substitute(1, item.data)
            const sheetBuffer = await template.generate({ type: 'arraybuffer' })

            // Load the generated sheet using exceljs
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.load(sheetBuffer)
            const worksheet = workbook.getWorksheet(1)
            if (worksheet) {
                generatedSheets.push(worksheet)
            }
        }

        // Create a new workbook and merge all sheets vertically
        const mergedWorkbook = new ExcelJS.Workbook()
        const mergedSheet = mergedWorkbook.addWorksheet('Merged')

        // Hide gridlines
        mergedSheet.views = [{ showGridLines: false }]

        let currentRow = 1
        for (const sheet of generatedSheets) {
            const rowOffset = currentRow - 1

            // Copy all rows with full formatting
            sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const newRow = mergedSheet.getRow(currentRow)

                // Copy row height
                if (row.height) {
                    newRow.height = row.height
                }

                // Copy all cells with full styling
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const newCell = newRow.getCell(colNumber)
                    newCell.value = cell.value

                    // Copy full cell style
                    newCell.style = {
                        font: cell.font,
                        alignment: cell.alignment,
                        border: cell.border,
                        fill: cell.fill,
                        numFmt: cell.numFmt,
                        protection: cell.protection,
                    }
                })

                newRow.commit()
                currentRow++
            })

            // Copy merged cells with adjusted row positions
            if (sheet.model.merges) {
                for (const merge of sheet.model.merges) {
                    const [topLeft, bottomRight] = merge.split(':')

                    // Parse cell references

                    const topMatch = topLeft?.match(/([A-Z]+)(\d+)/)
                    const bottomMatch = bottomRight?.match(/([A-Z]+)(\d+)/)

                    if (topMatch && bottomMatch && topMatch[2] && bottomMatch[2]) {
                        const startRow = Number.parseInt(topMatch[2], 10) + rowOffset
                        const endRow = Number.parseInt(bottomMatch[2], 10) + rowOffset
                        const startCol = topMatch[1]
                        const endCol = bottomMatch[1]

                        mergedSheet.mergeCells(`${startCol}${startRow}:${endCol}${endRow}`)
                    }
                }
            }
        }

        // Copy column widths from the first sheet
        if (generatedSheets.length > 0 && generatedSheets[0]) {
            generatedSheets[0].columns.forEach((col, index) => {
                if (col.width) {
                    mergedSheet.getColumn(index + 1).width = col.width
                }
            })
        }

        const result = await mergedWorkbook.xlsx.writeBuffer()
        const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

        return c.body(result, 200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': disposition,
        })
    }
)

export default app
