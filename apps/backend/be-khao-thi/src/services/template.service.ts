import * as fs from "node:fs/promises"
import * as path from "node:path"
import axios from "axios"
import ExcelJS from "exceljs"
import { prisma } from ".."

const sanitizeSheetName = (name: string) => {
  if (typeof name !== "string") return ""
  return name.replace(/[\\/]/g, "_")
}

const duplicateWorksheet = (
  workbook: ExcelJS.Workbook,
  sourceSheetName: string,
  newSheetName: string
): ExcelJS.Worksheet => {
  const sourceSheet = workbook.getWorksheet(sourceSheetName)
  if (!sourceSheet) {
    throw new Error(`Không tìm thấy sheet nguồn "${sourceSheetName}" để sao chép.`)
  }

  const newSheet = workbook.addWorksheet(newSheetName)

  sourceSheet.columns.forEach((column, index) => {
    newSheet.getColumn(index + 1).width = column.width
    newSheet.getColumn(index + 1).style = JSON.parse(JSON.stringify(column.style || {}))
  })

  sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const newRow = newSheet.getRow(rowNumber)
    newRow.height = row.height

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber)
      newCell.value = cell.value
      newCell.style = JSON.parse(JSON.stringify(cell.style))
    })
    newRow.commit()
  })

  const merges = (sourceSheet as any).model?.merges || []
  merges.forEach((merge: string) => {
    newSheet.mergeCells(merge)
  })

  return newSheet
}

// Sửa lại hàm này
export const fillExcelTemplate = async (
  templateBuffer: Buffer,
  exportData: {
    cellData: { sheet: string; cell: string; text: string; style?: any }[]
    mergeData: { [key: string]: string[] }
  },
  sourceSheetForDuplication = "Sheet1"
) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateBuffer)
  const { cellData, mergeData } = exportData

  // Chuẩn bị các sheet (sao chép từ sheet mẫu nếu cần)
  const requiredSheetNames = new Set(cellData.map((item) => item.sheet))
  requiredSheetNames.forEach((sheetName) => {
    if (!workbook.getWorksheet(sanitizeSheetName(sheetName))) {
      duplicateWorksheet(workbook, sourceSheetForDuplication, sanitizeSheetName(sheetName))
    }
  })

  // Điền dữ liệu vào các ô
  cellData.forEach((item) => {
    // console.log(`Filling cell ${item.cell} in sheet ${item.sheet} with text: ${item.text}`);
    const worksheet = workbook.getWorksheet(sanitizeSheetName(item.sheet))
    if (worksheet) {
      const cell = worksheet.getCell(item.cell)
      cell.value = item.text
      if (item.style) {
        cell.style = item.style
      }
    }
  })

  for (const sheetName in mergeData) {
    const worksheet = workbook.getWorksheet(sanitizeSheetName(sheetName))
    if (worksheet) {
      const mergesForSheet = mergeData[sheetName]
      if (mergesForSheet) {
        mergesForSheet.forEach((range) => {
          worksheet.mergeCells(range)
        })
      }
    }
  }

  // Dọn dẹp sheet mẫu
  workbook.removeWorksheet(sourceSheetForDuplication)

  return await workbook.xlsx.writeBuffer()
}

export const getBufferFromUrl = async (
  templateCode: string,
  downloadPath?: string
): Promise<Buffer> => {
  const templateFile = await prisma.templateFile.findFirst({
    where: { code: templateCode },
  })

  if (!templateFile) {
    console.error(`No template found for code: ${templateCode}`)
    return Buffer.from("")
  }

  try {
    const response = await axios.get(templateFile.path, {
      responseType: "arraybuffer",
    })

    const buffer = Buffer.from(response.data)

    if (downloadPath) {
      const resolvedPath = path.resolve(downloadPath)
      await fs.writeFile(resolvedPath, buffer)
      console.log(`Original template successfully saved to: ${resolvedPath}`)
    }

    return buffer
  } catch (error) {
    console.error("Error fetching file from URL:", error)
    throw error
  }
}
