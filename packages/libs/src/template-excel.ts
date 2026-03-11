import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

/** ──────────────── Types ──────────────── */
export interface TableCell {
    value?: string | number | null
    colSpan?: number
    rowSpan?: number
    align?: 'left' | 'center' | 'right'
    bgColor?: string
    bold?: boolean
    wrapText?: boolean
    border?: boolean
    color?: string
}

export interface TableRow {
    cells: TableCell[]
}

export interface SheetExportOptions {
    sheet?: string | number
    data?: Record<string, string | number | null>
    rows?: TableRow[]
    tableStartCell?: { row: number; col: number }
    hiddenColumns?: string[]
}

export interface ExportOptions {
    templateUrl: string
    extension?: string
    sheets: SheetExportOptions[]
    fileName: string
    fontFamily?: string
    fontSize?: number
    mergeSheetsToOne?: boolean
    sheetName?: string
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

    return newSheet
}

/** ──────────────── Main ──────────────── */
export async function exportFromTemplate(options: ExportOptions) {
    const { templateUrl, sheets, fileName, extension } = options
    const ext = extension ?? templateUrl.split('.').pop()?.toLowerCase()

    if (ext === 'xlsx') {
        await handleExcelJSExport(templateUrl, sheets, fileName, options)
    } else if (ext === 'xls') {
        await handleSheetJSExport(templateUrl, sheets, fileName, options)
    } else {
        throw new Error('Unsupported file type')
    }
}

/** ──────────────── XLSX: ExcelJS ──────────────── */
async function handleExcelJSDefault(
    templateUrl: string,
    sheets: SheetExportOptions[],
    fileName: string,
    options: ExportOptions
) {
    const response = await fetch(templateUrl)
    const buffer = await response.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const firstSheet = workbook.worksheets[0]
    if (!firstSheet) {
        throw new Error('Template is empty')
    }
    for (const sheetOption of sheets) {
        const { sheet, data = {}, rows, tableStartCell } = sheetOption
        let worksheet: ExcelJS.Worksheet | undefined
        if (typeof sheet === 'string' || typeof sheet === 'number') {
            worksheet = workbook.getWorksheet(sheet)
            if (!worksheet) {
                worksheet = cloneWorksheet(workbook, firstSheet, String(sheet))
            }
        } else {
            worksheet = workbook.worksheets[0]
        }
        if (!worksheet) {
            console.log('Cannot find or create sheet:', sheet)
            continue
        }
        if (sheetOption.hiddenColumns && sheetOption.hiddenColumns.length > 0) {
            sheetOption.hiddenColumns.forEach((colName) => {
                worksheet.getColumn(colName).hidden = true
            })
        }
        // 1️⃣ Replace placeholder {{...}}
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                if (typeof cell.value === 'string') {
                    let text = cell.value
                    for (const key in data) {
                        text = text.replace(
                            new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
                            String(data[key] ?? '')
                        )
                    }
                    cell.value = text
                }
            })
        })

        // 2️⃣ Render bảng động
        if (rows && tableStartCell) {
            let currentRow = tableStartCell.row
            const colWidths: number[] = []

            if (rows.length > 1) {
                worksheet.spliceRows(tableStartCell.row + 1, 0, ...Array(rows.length - 1).fill([]))
            }

            for (const rowData of rows) {
                let currentCol = tableStartCell.col
                const excelRow = worksheet.getRow(currentRow)

                for (const cellData of rowData.cells) {
                    const cell = excelRow.getCell(currentCol)
                    cell.value = cellData.value

                    // Style
                    cell.alignment = {
                        horizontal: cellData.align || 'left',
                        vertical: 'middle',
                        wrapText: cellData.wrapText ?? true,
                    }
                    cell.font = {
                        name: options.fontFamily || 'Times New Roman',
                        size: options.fontSize || 14,
                        bold: !!cellData.bold,
                    }
                    if (cellData.bgColor) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: cellData.bgColor },
                        }
                    }
                    const applyBorder = cellData.border ?? true

                    if (applyBorder) {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' },
                        }
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
                            color: { argb: cellData.color },
                        }
                    }
                    const colSpan = cellData.colSpan ?? 1
                    const rowSpan = cellData.rowSpan ?? 1
                    if (colSpan > 1 || rowSpan > 1) {
                        worksheet.mergeCells(
                            currentRow,
                            currentCol,
                            currentRow + rowSpan - 1,
                            currentCol + colSpan - 1
                        )
                    }

                    const textLength = String(cellData.value ?? '').length
                    for (let i = 0; i < colSpan; i++) {
                        const idx = currentCol - tableStartCell.col + i
                        colWidths[idx] = Math.max(colWidths[idx] || 10, textLength + 2)
                    }

                    currentCol += colSpan
                }

                excelRow.commit()
                currentRow++
            }

            // 3️⃣ Autofit column width
            // colWidths.forEach((width, index) => {
            //     worksheet.getColumn(tableStartCell.col + index).width = width
            // })
        }
    }

    workbook.removeWorksheet(firstSheet.id)
    const outBuffer = await workbook.xlsx.writeBuffer()
    saveAs(
        new Blob([outBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
    )
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
    templateUrl: string,
    sheets: SheetExportOptions[],
    fileName: string,
    options: ExportOptions
) {
    const response = await fetch(templateUrl)
    const buffer = await response.arrayBuffer()

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const firstSheet = workbook.worksheets[0]

    if (!firstSheet) {
        throw new Error('Template is empty')
    }

    for (const sheetOption of sheets) {
        const { sheet, data = {}, rows, tableStartCell } = sheetOption

        let worksheet: ExcelJS.Worksheet | undefined

        if (typeof sheet === 'string' || typeof sheet === 'number') {
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
                if (typeof cell.value === 'string') {
                    let text = cell.value

                    for (const key in data) {
                        text = text.replace(
                            new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
                            String(data[key] ?? '')
                        )
                    }

                    cell.value = text
                }
            })
        })

        if (rows && tableStartCell) {
            let currentRow = tableStartCell.row

            const templateRow = worksheet.getRow(tableStartCell.row)

            if (rows.length > 1) {
                worksheet.spliceRows(tableStartCell.row + 1, 0, ...Array(rows.length - 1).fill([]))
            }

            for (const rowData of rows) {
                let currentCol = tableStartCell.col

                const excelRow = worksheet.getRow(currentRow)

                excelRow.height = templateRow.height

                for (const cellData of rowData.cells) {
                    const cell = excelRow.getCell(currentCol)
                    const templateCell = templateRow.getCell(currentCol)

                    cloneCellStyle(templateCell, cell)

                    cell.value = cellData.value

                    const colSpan = cellData.colSpan ?? 1
                    const rowSpan = cellData.rowSpan ?? 1

                    if (colSpan > 1 || rowSpan > 1) {
                        worksheet.mergeCells(
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
        type: 'array',
        cellStyles: true,
        cellNF: true,
        cellHTML: false,
        cellText: false,
    })

    const xlsBuffer = XLSX.write(wb, {
        bookType: 'xls',
        type: 'array',
        cellStyles: true,
        compression: false,
    })

    saveAs(
        new Blob([xlsBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        fileName.endsWith('.xls') ? fileName : `${fileName}.xls`
    )
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
            const [startCell, endCell] = mergeRange.split(':')

            // Phân tích ô bắt đầu (ví dụ "A5")
            const startMatch = startCell?.match(/([A-Z]+)(\d+)/)
            if (!startMatch) return // Bỏ qua nếu không khớp
            const startCol = startMatch[1] // "A"
            const startRow = Number.parseInt(startMatch[2] ?? '0', 10) // 5

            // Phân tích ô kết thúc (ví dụ "C6")
            const endMatch = endCell?.match(/([A-Z]+)(\d+)/)
            if (!endMatch) return // Bỏ qua nếu không khớp
            const endCol = endMatch[1] // "C"
            const endRow = Number.parseInt(endMatch[2] ?? '0', 10) // 6

            // Tính toán lại tọa độ hàng mới
            const newStartRow = startRow + rowOffset
            const newEndRow = endRow + rowOffset

            // Tạo chuỗi range mới (ví dụ "A55:C56")
            const newRange = `${startCol}${newStartRow}:${endCol}${newEndRow}`

            // Merge bằng chuỗi, giống như cloneWorksheet
            masterSheet.mergeCells(newRange)
        } catch (e) {
            console.error('Error processing merge range:', mergeRange, e)
        }
    })
}
// THAY THẾ TOÀN BỘ HÀM handleExcelJSExport CŨ BẰNG HÀM NÀY

async function handleExcelJSMergeSheets(
    templateUrl: string,
    sheets: SheetExportOptions[],
    fileName: string,
    options: ExportOptions
) {
    const response = await fetch(templateUrl)
    const buffer = await response.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const firstSheet = workbook.worksheets[0] // Template
    if (!firstSheet) {
        throw new Error('Template is empty')
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

        // 1b. Thay thế placeholder {{...}}
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                if (typeof cell.value === 'string') {
                    let text = cell.value
                    for (const key in data) {
                        text = text.replace(
                            new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
                            String(data[key] ?? '')
                        )
                    }
                    cell.value = text
                }
            })
        })

        // 1c. Render bảng động
        if (rows && tableStartCell) {
            let currentRow = tableStartCell.row

            if (rows.length > 1) {
                worksheet.spliceRows(tableStartCell.row + 1, 0, ...Array(rows.length - 1).fill([]))
            }

            for (const rowData of rows) {
                let currentCol = tableStartCell.col
                const excelRow = worksheet.getRow(currentRow)

                for (const cellData of rowData.cells) {
                    const cell = excelRow.getCell(currentCol)
                    cell.value = cellData.value

                    // Style (đã bao gồm logic border: false)
                    cell.alignment = {
                        horizontal: cellData.align || 'left',
                        vertical: 'middle',
                        wrapText: cellData.wrapText ?? true,
                    }
                    cell.font = {
                        name: options.fontFamily || 'Times New Roman',
                        size: options.fontSize || 14,
                        bold: !!cellData.bold,
                    }
                    if (cellData.bgColor) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: cellData.bgColor },
                        }
                    }

                    const applyBorder = cellData.border ?? true
                    if (applyBorder) {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' },
                        }
                    } else {
                        cell.border = {
                            top: { style: undefined },
                            left: { style: undefined },
                            bottom: { style: undefined },
                            right: { style: undefined },
                        }
                    }

                    const colSpan = cellData.colSpan ?? 1
                    const rowSpan = cellData.rowSpan ?? 1
                    if (colSpan > 1 || rowSpan > 1) {
                        worksheet.mergeCells(
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

        // 1d. Thêm sheet đã xử lý vào danh sách tạm
        tempWorksheets.push(worksheet)
    }

    // 2. GỘP CÁC SHEET TẠM VÀO MASTER SHEET
    if (tempWorksheets.length === 0) {
        throw new Error('No data provided to export')
    }

    const masterSheet = tempWorksheets[0] // Lấy sheet đầu tiên làm sheet chính

    // Gộp từ sheet thứ 2 trở đi
    if (tempWorksheets.length > 1) {
        let currentRowOffset = masterSheet?.lastRow ? masterSheet.lastRow.number : 0

        for (let i = 1; i < tempWorksheets.length; i++) {
            const sheetToCopy = tempWorksheets[i]

            // Thêm 2 hàng trống để ngăn cách
            masterSheet?.addRow({})
            masterSheet?.addRow({})
            currentRowOffset += 2

            // Copy nội dung
            appendSheet(
                masterSheet as ExcelJS.Worksheet,
                sheetToCopy as ExcelJS.Worksheet,
                currentRowOffset + 1
            )

            // Cập nhật lại offset
            currentRowOffset = masterSheet?.lastRow ? masterSheet.lastRow.number : 0

            // Xóa sheet tạm sau khi copy
            workbook.removeWorksheet(sheetToCopy?.id ?? '')
        }
    }

    // 3. XÓA TEMPLATE GỐC VÀ XUẤT FILE
    workbook.removeWorksheet(firstSheet.id)

    // Đổi tên sheet chính (nếu muốn)
    if (masterSheet) {
        masterSheet.name = options.sheetName || 'TongHopDiem'
    }

    const outBuffer = await workbook.xlsx.writeBuffer()
    saveAs(
        new Blob([outBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
    )
}
// DÁN HÀM ĐIỀU PHỐI NÀY VÀO
async function handleExcelJSExport(
    templateUrl: string,
    sheets: SheetExportOptions[],
    fileName: string,
    options: ExportOptions
) {
    if (options.mergeSheetsToOne) {
        await handleExcelJSMergeSheets(templateUrl, sheets, fileName, options)
    } else {
        await handleExcelJSDefault(templateUrl, sheets, fileName, options)
    }
}
