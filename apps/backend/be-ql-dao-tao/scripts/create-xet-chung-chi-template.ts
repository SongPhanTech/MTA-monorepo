import ExcelJS from "exceljs"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Danh Sach")
  sheet.columns = [
    { header: "STT", key: "stt", width: 10 },
    { header: "Mã SV", key: "code", width: 15 },
    { header: "Họ và tên", key: "fullname", width: 25 },
    { header: "Ngày sinh", key: "dob", width: 15 },
    { header: "CCCD/CMND", key: "cccd", width: 20 },
    { header: "Lớp", key: "classCode", width: 15 },
  ]
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, size: 12, name: "Times New Roman" }
  headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true }

  sheet.addRow({
    stt: "{data.stt}",
    code: "{data.code}",
    fullname: "{data.fullname}",
    dob: "{data.dob}",
    cccd: "{data.cccd}",
    classCode: "{data.classCode}",
  })
  const dataRow = sheet.getRow(2)
  dataRow.font = { size: 12, name: "Times New Roman" }

  const outputPath = path.resolve(__dirname, "danh-sach-xet-chung-chi-template.xlsx")
  await workbook.xlsx.writeFile(outputPath)
  console.log(`Đã tạo template thành công tại: ${outputPath}`)
}

generateTemplate().catch(console.error)
