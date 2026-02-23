import { parseDate } from '@workspace/libs/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { read, utils } from 'xlsx'
import type { ParseSheetError } from './types'

dayjs.extend(customParseFormat)

// TODO!: now depends on stt column(it need to be a integer), maybe need to change to more reliable way

export const parseSheetLecturer = (file: ArrayBufferLike) => {
    const wb = read(file)
    const sheetName = 'Danh sách giảng viên'
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
        stt: 'A',
        code: 'B',
        fullname: 'C',
        dateOfBirth: 'D',
        gender: 'E',
        lecturerType: 'F',
        degreeRankType: 'G',
        degreeType: 'H',
        facultyOrganization: 'I',
        departmentOrganization: 'J',
        currentAddress: 'K',
        phoneNumber: 'L',
        email: 'M',
        idCardNumber: 'N',
        description: 'R', // Mô tả
    }
    // end: Các tham chiếu ô cố định trong sheet

    const records = utils.sheet_to_json(ws, {
        defval: '',
        blankrows: false,
        raw: false,
        header: 'A',
        range: startRow,
    }) as (Record<(typeof cols)[keyof typeof cols], string> & {
        __rowNum__: number
    })[]

    const data = records
        .filter((row) => Number.isInteger(Number.parseFloat(row[cols.stt] || '')))
        .map((row) => {
            const dateOfBirth = parseDate(row[cols.dateOfBirth])

            if (row[cols.dateOfBirth] && !dateOfBirth.isValid()) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.code}${row.__rowNum__ + 1}`,
                    message: 'Ngày sinh không hợp lệ (ngày/tháng/năm)',
                })
            }

            if (!row[cols.code]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.code}${row.__rowNum__ + 1}`,
                    message: 'Mã không được để trống',
                })
            }

            if (!row[cols.fullname]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.fullname}${row.__rowNum__ + 1}`,
                    message: 'Họ và tên không được để trống',
                })
            }

            if (!row[cols.gender]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.gender}${row.__rowNum__ + 1}`,
                    message: 'Giới tính không được để trống',
                })
            }

            if (!row[cols.facultyOrganization]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.facultyOrganization}${row.__rowNum__ + 1}`,
                    message: 'Khoa không được để trống',
                })
            }

            if (!row[cols.departmentOrganization]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.departmentOrganization}${row.__rowNum__ + 1}`,
                    message: 'Bộ môn không được để trống',
                })
            }

            if (!row[cols.idCardNumber]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.idCardNumber}${row.__rowNum__ + 1}`,
                    message: 'CCCD không được để trống',
                })
            }

            if (!row[cols.lecturerType]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.lecturerType}${row.__rowNum__ + 1}`,
                    message: 'Kiểu giảng viên không được để trống',
                })
            }

            const phoneNumber = row[cols.phoneNumber]?.trim()
            if (phoneNumber && !/^0[35789]\d{8}$/.test(phoneNumber)) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.phoneNumber}${row.__rowNum__ + 1}`,
                    message: 'Số điện thoại không hợp lệ',
                })
            }

            return {
                stt: row[cols.stt],
                code: row[cols.code]?.trim() as string,
                fullname: row[cols.fullname]?.replaceAll(/\(.*\)/g, '').trim() as string,
                dateOfBirth: dateOfBirth.isValid() ? dateOfBirth.toDate() : null,
                gender: row[cols.gender]?.trim() as string,
                lecturerType: row[cols.lecturerType]?.trim() as string,
                degreeRankType: row[cols.degreeRankType]?.trim(),
                degreeType: row[cols.degreeType]?.trim(),
                facultyOrganization: row[cols.facultyOrganization]?.trim() as string,
                departmentOrganization: row[cols.departmentOrganization]?.trim() as string,
                currentAddress: row[cols.currentAddress]?.trim(),
                phoneNumber: row[cols.phoneNumber]?.trim(),
                email: row[cols.email]?.trim(),
                idCardNumber: row[cols.idCardNumber]?.trim() as string,
                description: row[cols.description]?.trim(),
            }
        })

    const duplicateCodes = data
        .map((item) => item.code)
        .filter((code, index, arr) => arr.indexOf(code) !== index)

    if (duplicateCodes.length) {
        errors.push({
            sheetRef: sheetName,
            cellRef: '',
            message: `Mã bị trùng: ${duplicateCodes.join(', ')}`,
        })
    }

    return {
        lecturers: data,
        errors,
    }
}
