import { parseDate } from "@workspace/libs/utils"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { read, utils } from "xlsx"
import type { ParseSheetError } from "./types"

dayjs.extend(customParseFormat)

// TODO!: now depends on stt column(it need to be a integer), maybe need to change to more reliable way

export const parseSheetLecturer = (
  file: ArrayBufferLike,
  existingLecturerMap?: Map<string, string>
) => {
  const wb = read(file, { cellDates: true })
  const sheetName = "Danh sách giảng viên"
  const errors: ParseSheetError[] = []

  const ws = wb.Sheets[sheetName]
  if (!ws) {
    errors.push({
      sheetRef: sheetName,
      cellRef: sheetName,
      message: `Không tìm thấy sheet "${sheetName}" trong file`,
    })
    return {
      lecturers: [],
      errors,
    }
  }

  // start: Các tham chiếu ô cố định trong sheet
  const startRow = 0 // Dòng bắt đầu đọc dữ liệu (0-based index)
  const cols = {
    stt: "A",
    code: "B",
    fullname: "C",
    dateOfBirth: "D",
    gender: "E",
    lecturerType: "F",
    degreeRankType: "G",
    degreeType: "H",
    facultyOrganization: "I",
    departmentOrganization: "J",
    currentAddress: "K",
    phoneNumber: "L",
    email: "M",
    idCardNumber: "N",
    description: "R", // Mô tả
  }
  // end: Các tham chiếu ô cố định trong sheet

  const records = utils.sheet_to_json(ws, {
    defval: "",
    blankrows: false,
    raw: false,
    header: "A",
    range: startRow,
  }) as (Record<(typeof cols)[keyof typeof cols], string> & {
    __rowNum__: number
  })[]

  const parseDateFromCell = (colName: string, rowNum: number): dayjs.Dayjs => {
    const cell = ws[`${colName}${rowNum + 1}`]
    if (!cell?.v) return dayjs("")

    return cell.v instanceof Date ? dayjs(cell.v) : parseDate(String(cell.v))
  }

  const data = records
    .filter((row) => Number.isInteger(Number.parseFloat(row[cols.stt] || "")))
    .map((row) => {
      const dateOfBirth = parseDateFromCell(cols.dateOfBirth, row.__rowNum__)

      if (row[cols.dateOfBirth] && !dateOfBirth.isValid()) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.code}${row.__rowNum__ + 1}`,
          message: "Ngày sinh không hợp lệ (ngày/tháng/năm)",
        })
      }

      if (!row[cols.code]) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.code}${row.__rowNum__ + 1}`,
          message: "Mã không được để trống",
        })
      }

      if (!row[cols.fullname]) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.fullname}${row.__rowNum__ + 1}`,
          message: "Họ và tên không được để trống",
        })
      } else {
        const fullname = row[cols.fullname]?.trim()
        const parts = fullname ? fullname.split(/\s+/) : []
        if (parts.length < 2) {
          errors.push({
            sheetRef: sheetName,
            cellRef: `${cols.fullname}${row.__rowNum__ + 1}`,
            message: "Họ và tên phải có ít nhất 2 từ (Họ và Tên)",
          })
        }
      }

      if (!row[cols.gender]) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.gender}${row.__rowNum__ + 1}`,
          message: "Giới tính không được để trống",
        })
      }

      if (!row[cols.facultyOrganization]) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.facultyOrganization}${row.__rowNum__ + 1}`,
          message: "Khoa không được để trống",
        })
      }

      if (!row[cols.departmentOrganization]) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.departmentOrganization}${row.__rowNum__ + 1}`,
          message: "Bộ môn không được để trống",
        })
      }

      const idCardNumber = row[cols.idCardNumber]?.trim()
      if (!idCardNumber || !/^[0-9]{12}$/.test(idCardNumber)) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.idCardNumber}${row.__rowNum__ + 1}`,
          message: "CCCD không hợp lệ",
        })
      }

      if (!row[cols.lecturerType]) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.lecturerType}${row.__rowNum__ + 1}`,
          message: "Kiểu giảng viên không được để trống",
        })
      }

      const phoneNumber = row[cols.phoneNumber]?.trim()
      if (phoneNumber && !/^0\d{9,10}$/.test(phoneNumber)) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.phoneNumber}${row.__rowNum__ + 1}`,
          message: "Số điện thoại không hợp lệ",
        })
      }

      return {
        stt: row[cols.stt],
        rowNum: row.__rowNum__ + 1,
        code: row[cols.code]?.trim() as string,
        fullname: row[cols.fullname]?.replaceAll(/\(.*\)/g, "").trim() as string,
        dateOfBirth: dateOfBirth.isValid() ? dateOfBirth.toDate() : null,
        gender: row[cols.gender]?.trim() as string,
        lecturerType: row[cols.lecturerType]?.trim() as string,
        degreeRankType: row[cols.degreeRankType]?.trim(),
        degreeType: row[cols.degreeType]?.trim(),
        facultyOrganization: row[cols.facultyOrganization]?.trim() as string,
        departmentOrganization: row[cols.departmentOrganization]?.trim() as string,
        currentAddress: row[cols.currentAddress]?.trim(),
        phoneNumber,
        email: row[cols.email]?.trim(),
        idCardNumber: idCardNumber as string,
        description: row[cols.description]?.trim(),
      }
    })

  // Check duplicate lecturer codes with row tracking
  const codeRowMap = new Map<string, number[]>()
  for (const item of data) {
    if (!item.code) continue
    const existing = codeRowMap.get(item.code) ?? []
    existing.push(item.rowNum)
    codeRowMap.set(item.code, existing)
  }
  for (const [code, rowNums] of codeRowMap) {
    if (rowNums.length > 1) {
      errors.push({
        sheetRef: sheetName,
        cellRef: rowNums.map((r) => `${cols.code}${r}`).join(", "),
        message: `Mã định danh bị trùng trong file: ${code}`,
      })
    }
  }

  if (existingLecturerMap && existingLecturerMap.size > 0) {
    const dbDuplicateMap = new Map<string, number[]>()

    for (const item of data) {
      if (!item.code) continue
      const existingCCCD = existingLecturerMap.get(item.code)

      if (existingCCCD && existingCCCD !== item.idCardNumber) {
        const existing = dbDuplicateMap.get(item.code) ?? []
        existing.push(item.rowNum)
        dbDuplicateMap.set(item.code, existing)
      }
    }

    for (const [code, rowNums] of dbDuplicateMap) {
      errors.push({
        sheetRef: sheetName,
        cellRef: rowNums.map((r) => `${cols.code}${r}`).join(", "),
        message: `Mã định danh đã tồn tại trong hệ thống: ${code}`,
      })
    }
  }

  const cccdRowMap = new Map<string, { code: string; rowNum: number }[]>()
  for (const item of data) {
    if (!item.idCardNumber) continue
    const existing = cccdRowMap.get(item.idCardNumber) ?? []
    existing.push({ code: item.code, rowNum: item.rowNum })
    cccdRowMap.set(item.idCardNumber, existing)
  }
  for (const [cccd, items] of cccdRowMap) {
    if (items.length > 1) {
      errors.push({
        sheetRef: sheetName,
        cellRef: items.map((i) => `${cols.idCardNumber}${i.rowNum}`).join(", "),
        message: `CCCD bị trùng: ${cccd}`,
      })
    }
  }

  return {
    lecturers: data,
    errors,
  }
}
