import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { read, utils } from 'xlsx'
import type { CellObject } from 'xlsx'

dayjs.extend(customParseFormat)

type ParseSheetError = {
    cellRef: string
    message: string
}

// TODO!: now depends on stt column(it need to be a integer), maybe need to change to more reliable way

// DanhSachSV_Mau2
export const parseFixedClassesAndStudents = (file: Buffer) => {
    const wb = read(file)

    // start: Các tham chiếu ô cố định trong sheet
    const trainingObjectTypeRef = 'D6'
    const trainingCourseRef = 'D7'
    const classNameRef = 'D8'
    const startRow = 10 // Dòng bắt đầu đọc dữ liệu (0-based index)
    const cols = {
        stt: 'A',
        code: 'B',
        fullname: 'C',
        dateOfBirth: 'D',
        gender: 'E',
        placeOfBirth: 'F',
    }
    // end: Các tham chiếu ô cố định trong sheet

    const data = wb.SheetNames.map((name) => {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        const ws = wb.Sheets[name]!
        const errors: ParseSheetError[] = []

        const trainingObjectTypeCell: CellObject | undefined =
            ws[trainingObjectTypeRef]
        if (trainingObjectTypeCell?.t !== 's' || !trainingObjectTypeCell.v) {
            errors.push({
                cellRef: trainingObjectTypeRef,
                message: 'Loại đào tạo không hợp lệ',
            })
        }

        const trainingCourseCell: CellObject | undefined = ws[trainingCourseRef]
        if (trainingCourseCell?.t !== 's' || !trainingCourseCell.v) {
            errors.push({
                cellRef: trainingCourseRef,
                message: 'Ngành đào tạo không hợp lệ',
            })
        }

        const classNameCell: CellObject | undefined = ws[classNameRef]
        if (classNameCell?.t !== 's' || !classNameCell.v) {
            errors.push({
                cellRef: classNameRef,
                message: 'Tên lớp không hợp lệ',
            })
        }

        // Đọc từ dòng thứ 11 (start from 0)
        const data = utils.sheet_to_json(ws, {
            defval: '',
            blankrows: false,
            raw: false,
            header: 'A',
            range: startRow,
        }) as (Record<string, string> & { __rowNum__: number })[]

        const students = data
            .filter((row) =>
                Number.isInteger(Number.parseFloat(row[cols.stt] || ''))
            )
            .map((row) => {
                const dateOfBirth = dayjs(
                    row[cols.dateOfBirth],
                    'DD/MM/YYYY'
                ).startOf('day')

                return {
                    stt: row[cols.stt],
                    code: row[cols.code],
                    fullname: row[cols.fullname],
                    dateOfBirth: dateOfBirth.isValid()
                        ? dateOfBirth.toDate()
                        : null,
                    gender: row[cols.gender],
                    placeOfBirth: row[cols.placeOfBirth],
                }
            })

        return {
            code: name,
            trainingObjectType: trainingObjectTypeCell?.v,
            trainingCourse: trainingCourseCell?.v,
            name: classNameCell?.v,
            students,
            errors,
        }
    })

    return data
}

export const parseSheetHeQuanSu = (file: ArrayBufferLike) => {
    const wb = read(file)
    const sheetName = 'HEQUANSU'
    const errors: ParseSheetError[] = []

    const ws = wb.Sheets[sheetName]
    if (!ws) {
        errors.push({
            cellRef: sheetName,
            message: `Không tìm thấy sheet "${sheetName}" trong file`,
        })
        return {
            trainingObjectType: '',
            trainingCourse: '',
            students: [],
            errors,
        }
    }

    // start: Các tham chiếu ô cố định trong sheet
    const trainingObjectTypeRef = 'H6' // Đối tượng đào tạo
    const trainingCourseRef = 'H7' // Khoá đào tạo
    const startRow = 11 // Dòng bắt đầu đọc dữ liệu (0-based index)
    const cols = {
        stt: 'A',
        registerNumber: 'B',
        code: 'C',
        fullname: 'D',
        dateOfBirth: 'E',
        gender: 'F',
        ethnicity: 'G',
        nationality: 'H',
        districtHometown: 'I',
        provinceHometown: 'J',
        admissionBlock: 'K', // Khối xét tuyển
        admissionScore: 'L', // Điểm xét tuyển
        competencyAssessmentScore: 'M', // Điểm đánh giá năng lực
        fixedClass: 'N', // Lớp quản lý
        trainingField: 'O', // Ngành đào tạo
        trainingMajor: 'P', // Chuyên ngành đào tạo
        curriculum: 'Q', // Chương trình đào tạo
        description: 'R', // Mô tả
    }
    // end: Các tham chiếu ô cố định trong sheet

    const trainingObjectTypeCell: CellObject | undefined =
        ws[trainingObjectTypeRef]
    if (trainingObjectTypeCell?.t !== 's' || !trainingObjectTypeCell.v) {
        errors.push({
            cellRef: trainingObjectTypeRef,
            message: 'Đối tượng đào tạo không hợp lệ',
        })
    }
    const trainingCourseCell: CellObject | undefined = ws[trainingCourseRef]
    if (trainingCourseCell?.t !== 's' || !trainingCourseCell.v) {
        errors.push({
            cellRef: trainingCourseRef,
            message: 'Khoá đào tạo không hợp lệ',
        })
    }

    const data = utils.sheet_to_json(ws, {
        defval: '',
        blankrows: false,
        raw: false,
        header: 'A',
        range: startRow,
    }) as (Record<string, string> & { __rowNum__: number })[]

    const students = data
        .filter((row) =>
            Number.isInteger(Number.parseFloat(row[cols.stt] || ''))
        )
        .map((row) => {
            const dateOfBirth = dayjs(
                row[cols.dateOfBirth],
                'DD/MM/YYYY'
            ).startOf('day')

            if (!row[cols.code]) {
                errors.push({
                    cellRef: `${cols.code}${row.__rowNum__ + 1}`,
                    message: 'Mã sinh viên không được để trống',
                })
            }

            if (!row[cols.fullname]) {
                errors.push({
                    cellRef: `${cols.fullname}${row.__rowNum__ + 1}`,
                    message: 'Họ và tên không được để trống',
                })
            }

            if (!row[cols.fixedClass]) {
                errors.push({
                    cellRef: `${cols.fixedClass}${row.__rowNum__ + 1}`,
                    message: 'Lớp quản lý không được để trống',
                })
            }

            if (!row[cols.curriculum]) {
                errors.push({
                    cellRef: `${cols.curriculum}${row.__rowNum__ + 1}`,
                    message: 'Chương trình đào tạo không được để trống',
                })
            }

            return {
                stt: row[cols.stt],
                registerNumber: row[cols.registerNumber],
                code: row[cols.code] as string,
                fullname: row[cols.fullname] as string,
                dateOfBirth: dateOfBirth.isValid()
                    ? dateOfBirth.toDate()
                    : null,
                gender: row[cols.gender],
                ethnicity: row[cols.ethnicity],
                nationality: row[cols.nationality],
                districtHometown: row[cols.districtHometown]?.trim(),
                provinceHometown: row[cols.provinceHometown],
                admissionBlock: row[cols.admissionBlock],
                admissionScore: row[cols.admissionScore],
                competencyAssessmentScore: row[cols.competencyAssessmentScore],
                fixedClass: row[cols.fixedClass] as string,
                trainingField: row[cols.trainingField],
                trainingMajor: row[cols.trainingMajor],
                curriculum: row[cols.curriculum],
                description: row[cols.description],
            }
        })

    return {
        trainingObjectType: trainingObjectTypeCell?.v,
        trainingCourse: trainingCourseCell?.v,
        students,
        errors,
    }
}
