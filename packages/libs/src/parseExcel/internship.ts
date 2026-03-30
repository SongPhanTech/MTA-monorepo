import { parseDate } from "@workspace/libs/utils"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { read, utils } from "xlsx"
import type { ParseSheetError } from "./types"

dayjs.extend(customParseFormat)

export const parseSheetInternship = (file: ArrayBufferLike) => {
  const wb = read(file, { cellDates: true }) // Tự động convert Excel date sang JS Date
  const sheetName = "Danh sách thực tập"
  const errors: ParseSheetError[] = []

  const ws = wb.Sheets[sheetName]
  if (!ws) {
    errors.push({
      sheetRef: sheetName,
      cellRef: sheetName,
      message: `Không tìm thấy sheet "${sheetName}" trong file`,
    })
    return {
      internships: [],
      errors,
    }
  }

  const startRow = 0
  const cols = {
    stt: "A",
    code: "B",
    fullname: "C",
    dateOfBirth: "D",
    subjectClassCode: "E",
    subjectClassName: "F",
    gender: "G",
    institution: "H",
    address: "I",
    internshipContent: "J",
    supervisor: "K",
    coSupervisor: "L",
    startDate: "M",
    endDate: "N",
    reportDate: "O",
    finalScore: "P",
  }

  const records = utils.sheet_to_json(ws, {
    defval: "",
    blankrows: false,
    raw: false,
    header: "A",
    range: startRow,
  }) as (Record<(typeof cols)[keyof typeof cols], string> & {
    __rowNum__: number
  })[]

  // Helper function to parse date from Excel cell
  const parseDateFromCell = (colName: string, rowNum: number): dayjs.Dayjs => {
    const cell = ws[`${colName}${rowNum + 1}`]
    if (!cell?.v) return dayjs("")

    // cellDates: true đã convert thành Date object hoặc giữ nguyên string
    return cell.v instanceof Date ? dayjs(cell.v) : parseDate(String(cell.v))
  }

  const data = records
    .filter((row) => Number.isInteger(Number.parseFloat(row[cols.stt] || "")))
    .map((row) => {
      const startDate = parseDateFromCell(cols.startDate, row.__rowNum__)
      const endDate = parseDateFromCell(cols.endDate, row.__rowNum__)
      const reportDate = parseDateFromCell(cols.reportDate, row.__rowNum__)

      if (row[cols.startDate] && !startDate.isValid()) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.startDate}${row.__rowNum__ + 1}`,
          message: "Ngày bắt đầu không hợp lệ (ngày/tháng/năm)",
        })
      }

      if (row[cols.endDate] && !endDate.isValid()) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.endDate}${row.__rowNum__ + 1}`,
          message: "Ngày kết thúc không hợp lệ (ngày/tháng/năm)",
        })
      }

      if (row[cols.reportDate] && !reportDate.isValid()) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.reportDate}${row.__rowNum__ + 1}`,
          message: "Ngày báo cáo không hợp lệ (ngày/tháng/năm)",
        })
      }

      if (!row[cols.code]) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.code}${row.__rowNum__ + 1}`,
          message: "Mã sinh viên không được để trống",
        })
      }

      if (!row[cols.subjectClassCode]) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.subjectClassCode}${row.__rowNum__ + 1}`,
          message: "Mã lớp học phần không được để trống",
        })
      }

      const rawInstitutionValue = (row[cols.institution] || "").toString().trim()
      let institution = ""
      let unit = ""

      if (rawInstitutionValue.includes("/")) {
        // Format: "Institution / Unit"
        const parts = rawInstitutionValue.split("/").map((p) => p.trim())
        institution = parts[0] || ""
        unit = parts[1] || ""
      } else {
        unit = rawInstitutionValue
        institution = ""
      }

      return {
        stt: row[cols.stt],
        code: row[cols.code]?.trim() as string,
        fullname: row[cols.fullname]?.trim(),
        dateOfBirth: row[cols.dateOfBirth]?.trim(),
        subjectClassCode: row[cols.subjectClassCode]?.trim() as string,
        subjectClassName: row[cols.subjectClassName]?.trim(),
        gender: row[cols.gender]?.trim(),
        institution,
        unit,
        address: row[cols.address]?.trim(),
        internshipContent: row[cols.internshipContent]?.trim(),
        supervisor: row[cols.supervisor]?.trim(),
        coSupervisor: row[cols.coSupervisor]?.trim(),
        startDate: startDate.isValid() ? startDate.toDate() : null,
        endDate: endDate.isValid() ? endDate.toDate() : null,
        reportDate: reportDate.isValid() ? reportDate.toDate() : null,
        finalScore: row[cols.finalScore]?.trim(),
      }
    })

  return {
    internships: data,
    errors,
  }
}
