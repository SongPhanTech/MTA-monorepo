import ExcelJS, { type Alignment, type Font } from "exceljs"
import { saveAs } from "file-saver"

// 1. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU (INTERFACES)

/** Dữ liệu cho một ô đơn lẻ */
export interface SimpleCellData {
  /** Giá trị của ô */
  value: string | number | null | Date

  /** Tùy chọn gộp ô */
  merge?: {
    rowSpan?: number
    colSpan?: number
  }

  /** * Tùy chọn Font chữ
   * (Đây là nơi bạn chỉnh màu chữ)
   */
  font?: {
    /** * Màu chữ dạng ARGB, ví dụ: 'FFFF0000' (Đỏ), 'FF00FF00' (Xanh)
     */
    color?: string
    bold?: boolean
    size?: number
    name?: string
  }

  /** Tùy chọn màu nền */
  fill?: {
    /** * Màu nền dạng ARGB, ví dụ: 'FFFFFF00' (Vàng)
     */
    bgColor?: string
  }

  /** Tùy chọn căn lề */
  alignment?: Partial<Alignment>

  /** Thêm viền (border) */
  border?: boolean
}

/** Dữ liệu cho một hàng */
export interface SimpleRowData {
  cells: SimpleCellData[]
  height?: number
}

/** Tùy chọn cho hàm xuất file */
export interface SimpleExportOptions {
  sheetName: string
  rows: SimpleRowData[]
  fileName: string
}

// 2. HÀM HELPER CHÍNH

/**
 * Tạo và tải về một file Excel đơn giản từ dữ liệu.
 * Hỗ trợ merge cell, màu chữ, và màu nền.
 * @param options Dữ liệu và tên file
 */
export async function createSimpleExcel(options: SimpleExportOptions): Promise<void> {
  const { sheetName, rows, fileName } = options
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  // Duyệt qua từng hàng dữ liệu
  rows.forEach((rowData, rowIndex) => {
    // rowIndex trong mảng (bắt đầu từ 0)
    // excelRowIndex trong ExcelJS (bắt đầu từ 1)
    const excelRowIndex = rowIndex + 1
    const excelRow = worksheet.getRow(excelRowIndex)

    if (rowData.height) {
      excelRow.height = rowData.height
    }

    // Duyệt qua từng ô trong hàng
    rowData.cells.forEach((cellData, colIndex) => {
      // colIndex trong mảng (bắt đầu từ 0)
      // excelColIndex trong ExcelJS (bắt đầu từ 1)
      const excelColIndex = colIndex + 1
      const cell = excelRow.getCell(excelColIndex)

      // 1. Gán giá trị
      cell.value = cellData.value

      // 2. Áp dụng Font (Màu chữ ở đây)
      if (cellData.font) {
        const fontOptions: Partial<Font> = {
          bold: cellData.font.bold,
          size: cellData.font.size,
          name: cellData.font.name || "Times New Roman",
        }
        if (cellData.font.color) {
          // ✅ Đây là phần xử lý màu chữ
          fontOptions.color = { argb: cellData.font.color }
        }
        cell.font = fontOptions
      }

      // 3. Áp dụng Màu nền
      if (cellData.fill?.bgColor) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: cellData.fill.bgColor },
        }
      }

      // 4. Áp dụng Căn lề
      if (cellData.alignment) {
        cell.alignment = cellData.alignment
      }

      // 5. Áp dụng Viền
      if (cellData.border) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      }

      // 6. ✅ Xử lý Merge Cell
      if (cellData.merge) {
        const rowSpan = cellData.merge.rowSpan || 1
        const colSpan = cellData.merge.colSpan || 1

        if (rowSpan > 1 || colSpan > 1) {
          worksheet.mergeCells(
            excelRowIndex, // Hàng bắt đầu
            excelColIndex, // Cột bắt đầu
            excelRowIndex + rowSpan - 1, // Hàng kết thúc
            excelColIndex + colSpan - 1 // Cột kết thúc
          )
        }
      }
    })
  })

  // Tự động điều chỉnh độ rộng cột (tùy chọn, có thể bỏ)
  // worksheet.columns.forEach(column => {
  //     column.width = (column.width || 10) + 5;
  // });

  // 7. Xuất file
  const outBuffer = await workbook.xlsx.writeBuffer()
  saveAs(
    new Blob([outBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`
  )
}
