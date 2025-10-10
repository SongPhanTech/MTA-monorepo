import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface TableCell {
    value: string | number | null
    colSpan?: number
    rowSpan?: number
    align?: 'left' | 'center' | 'right'
    bgColor?: string
    bold?: boolean
    wrapText?: boolean
}

interface TableRow {
    cells: TableCell[]
}

interface ExportOptions {
    templateUrl: string
    data: Record<string, string | number | null>
    rows?: TableRow[]
    tableStartCell?: { sheet?: string; row: number; col: number }
    fileName: string
}
/*
await exportFromTemplate({
  templateUrl: "/template.xlsx",
  data: {
    name: "Hoàng Hải",
    date: new Date().toLocaleDateString(),
  },
  tableStartCell: { row: 10, col: 2 },
  rows: [
    {
      cells: [
        { value: "STT", bold: true, bgColor: "CCCCCC", align: "center" },
        { value: "Họ tên", bold: true, bgColor: "CCCCCC", align: "center" },
        { value: "Chức vụ", bold: true, bgColor: "CCCCCC", align: "center" },
      ],
    },
    {
      cells: [
        { value: 1, align: "center" },
        { value: "Nguyễn Văn A", colSpan: 2 },
      ],
    },
    {
      cells: [
        { value: 2, align: "center" },
        { value: "Lê Thị B" },
        { value: "Kỹ sư" },
      ],
    },
  ],
  fileName: "bao-cao-hoan-chinh.xlsx",
});

await exportFromTemplate({
  templateUrl: "/template.xlsx",
  data: { title: "Bảng chấm công" },
  tableStartCell: { row: 5, col: 2 },
  rows: [
    {
      cells: [
        { value: "STT", bold: true, bgColor: "CCCCCC", align: "center" },
        { value: "Họ và tên", bold: true, bgColor: "CCCCCC", align: "center" },
        { value: "Ghi chú", bold: true, bgColor: "CCCCCC", align: "center" },
      ],
    },
    {
      cells: [
        { value: 1, align: "center", rowSpan: 2 }, // merge dọc xuống 2 hàng
        { value: "Nguyễn Văn A" },
        { value: "Đi làm" },
      ],
    },
    {
      cells: [
        // chỗ này không cần truyền lại giá trị STT nữa
        { value: "Ca chiều", colSpan: 2 },
      ],
    },
  ],
  fileName: "bang-cham-cong.xlsx",
});

*/
export async function exportFromTemplate(options: ExportOptions) {
    const { templateUrl, data, rows, tableStartCell, fileName } = options
    const workbook = new ExcelJS.Workbook()

    // Load template
    const response = await fetch(templateUrl)
    const buffer = await response.arrayBuffer()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.getWorksheet(tableStartCell?.sheet || 1) || workbook.worksheets[0]
    if (!worksheet) {
        throw new Error('Worksheet not found')
    }

    if (rows && tableStartCell && rows.length > 0) {
        worksheet.getRow(tableStartCell.row).values = new Array(rows.length - 1).fill('')
        worksheet.duplicateRow(tableStartCell.row, rows.length - 1, true)
    }
    // 1️⃣ Replace các placeholder {{...}}
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (typeof cell.value === 'string') {
                let text = cell.value
                Object.keys(data).forEach((key) => {
                    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
                    text = text.replace(regex, String(data[key] ?? ''))
                })
                cell.value = text
            }
        })
    })

    // 2️⃣ Render bảng động nếu có rows
    if (rows && tableStartCell) {
        let currentRow = tableStartCell.row
        const colWidths: number[] = []

        //insert rows for dont replace footer

        for (const rowData of rows) {
            let currentCol = tableStartCell.col
            const excelRow = worksheet.getRow(currentRow)

            rowData.cells.forEach((cellData) => {
                const cell = excelRow.getCell(currentCol)
                cell.value = cellData.value

                // Style: font, align, fill, wrap
                cell.alignment = {
                    horizontal: cellData.align || 'left',
                    vertical: 'middle',
                    wrapText: cellData.wrapText ?? true,
                }
                cell.font = {
                    name: 'Times New Roman',
                    size: 14,
                    bold: !!cellData.bold,
                }
                if (cellData.bgColor) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: cellData.bgColor },
                    }
                }

                // Border
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                }

                // Merge cell nếu có colSpan/rowSpan
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

                // Tính chiều rộng cột tối đa
                const textLength = String(cellData.value ?? '').length
                for (let i = 0; i < colSpan; i++) {
                    const idx = currentCol - tableStartCell.col + i
                    colWidths[idx] = Math.max(colWidths[idx] || 10, textLength + 2)
                }

                currentCol += colSpan
            })

            excelRow.commit()
            currentRow++
        }

        // 3️⃣ Autofit chiều rộng cột
        colWidths.forEach((width, index) => {
            const colIndex = tableStartCell.col + index
            const column = worksheet.getColumn(colIndex)
            column.width = width
        })
    }

    // 4️⃣ Xuất file
    const outBuffer = await workbook.xlsx.writeBuffer()
    saveAs(
        new Blob([outBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        fileName
    )
}
