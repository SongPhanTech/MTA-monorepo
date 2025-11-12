import { parseDate } from '@workspace/libs/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { CellObject } from 'xlsx'
import { read, utils } from 'xlsx'
import type { ParseSheetError } from './types'

dayjs.extend(customParseFormat)

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

    const errors: ParseSheetError[] = []
    const data = wb.SheetNames.map((name) => {
        // biome-ignore lint/style/noNonNullAssertion: <>
        const ws = wb.Sheets[name]!

        const trainingObjectTypeCell: CellObject | undefined = ws[trainingObjectTypeRef]
        if (trainingObjectTypeCell?.t !== 's' || !trainingObjectTypeCell.v) {
            errors.push({
                sheetRef: name,
                cellRef: trainingObjectTypeRef,
                message: 'Loại đào tạo không hợp lệ',
            })
        }

        const trainingCourseCell: CellObject | undefined = ws[trainingCourseRef]
        if (trainingCourseCell?.t !== 's' || !trainingCourseCell.v) {
            errors.push({
                sheetRef: name,
                cellRef: trainingCourseRef,
                message: 'Ngành đào tạo không hợp lệ',
            })
        }

        const classNameCell: CellObject | undefined = ws[classNameRef]
        if (classNameCell?.t !== 's' || !classNameCell.v) {
            errors.push({
                sheetRef: name,
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
        }) as (Record<(typeof cols)[keyof typeof cols], string> & {
            __rowNum__: number
        })[]

        const students = data
            .filter((row) => Number.isInteger(Number.parseFloat(row[cols.stt] || '')))
            .map((row) => {
                const dateOfBirth = parseDate(row[cols.dateOfBirth])

                if (row[cols.dateOfBirth] && !dateOfBirth.isValid()) {
                    errors.push({
                        sheetRef: name,
                        cellRef: `${cols.code}${row.__rowNum__ + 1}`,
                        message: 'Ngày sinh không hợp lệ (ngày/tháng/năm)',
                    })
                }

                return {
                    stt: row[cols.stt],
                    code: row[cols.code]?.trim(),
                    fullname: row[cols.fullname]?.trim(),
                    dateOfBirth: dateOfBirth.isValid() ? dateOfBirth.toDate() : null,
                    gender: row[cols.gender]?.trim(),
                    placeOfBirth: row[cols.placeOfBirth]?.trim(),
                }
            })

        return {
            code: name,
            trainingObjectType:
                typeof trainingObjectTypeCell?.v === 'string'
                    ? trainingObjectTypeCell?.v.trim()
                    : trainingObjectTypeCell?.v,
            trainingCourse:
                typeof trainingCourseCell?.v === 'string'
                    ? trainingCourseCell?.v.trim()
                    : trainingCourseCell?.v,
            name: typeof classNameCell?.v === 'string' ? classNameCell?.v.trim() : classNameCell?.v,
            students,
            errors,
        }
    })

    const duplicateStudentCode = findDuplicateStudentCodes(data)
    for (const [code, sheetRefs] of duplicateStudentCode.entries()) {
        for (const sheetRef of sheetRefs) {
            errors.push({
                sheetRef,
                cellRef: null,
                message: `MSV ${code} bị trùng: ${sheetRefs.join(', ')}`,
            })
        }
    }

    return data
}

function findDuplicateStudentCodes(
    classes: {
        code: string
        students: { code?: string }[]
    }[]
): Map<string, string[]> {
    const studentMap = new Map<string, string[]>() // studentCode -> list of class codes

    for (const classItem of classes) {
        for (const student of classItem.students) {
            if (!student.code) continue
            const classCodes = studentMap.get(student.code) ?? []
            classCodes.push(classItem.code)
            studentMap.set(student.code, classCodes)
        }
    }

    // Filter only duplicates (i.e., students in more than one class)
    const duplicates = new Map<string, string[]>()
    for (const [studentCode, classCodes] of studentMap.entries()) {
        if (classCodes.length > 1) {
            duplicates.set(studentCode, classCodes)
        }
    }

    return duplicates
}

export const parseSheetHeQuanSu = (file: ArrayBufferLike) => {
    const wb = read(file)
    const sheetName = 'HEQUANSU'
    const errors: ParseSheetError[] = []

    const ws = wb.Sheets[sheetName]
    if (!ws) {
        errors.push({
            sheetRef: sheetName,
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

    const trainingObjectTypeCell: CellObject | undefined = ws[trainingObjectTypeRef]
    if (trainingObjectTypeCell?.t !== 's' || !trainingObjectTypeCell.v) {
        errors.push({
            sheetRef: sheetName,
            cellRef: trainingObjectTypeRef,
            message: 'Đối tượng đào tạo không hợp lệ',
        })
    }
    const trainingCourseCell: CellObject | undefined = ws[trainingCourseRef]
    if (trainingCourseCell?.t !== 's' || !trainingCourseCell.v) {
        errors.push({
            sheetRef: sheetName,
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
    }) as (Record<(typeof cols)[keyof typeof cols], string> & {
        __rowNum__: number
    })[]

    const students = data
        .filter((row) => Number.isInteger(Number.parseFloat(row[cols.stt] || '')))
        .map((row) => {
            const dateOfBirth = dayjs(row[cols.dateOfBirth], 'DD/MM/YYYY').startOf('day')

            if (!row[cols.code]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.code}${row.__rowNum__ + 1}`,
                    message: 'Mã sinh viên không được để trống',
                })
            }

            if (!row[cols.fullname]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.fullname}${row.__rowNum__ + 1}`,
                    message: 'Họ và tên không được để trống',
                })
            }

            if (!row[cols.fixedClass]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.fixedClass}${row.__rowNum__ + 1}`,
                    message: 'Lớp quản lý không được để trống',
                })
            }

            if (!row[cols.curriculum]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.curriculum}${row.__rowNum__ + 1}`,
                    message: 'Chương trình đào tạo không được để trống',
                })
            }

            return {
                stt: row[cols.stt],
                registerNumber: row[cols.registerNumber]?.trim(),
                code: row[cols.code]?.trim() as string,
                fullname: row[cols.fullname]?.trim() as string,
                dateOfBirth: dateOfBirth.isValid() ? dateOfBirth.toDate() : null,
                gender: row[cols.gender]?.trim(),
                ethnicity: row[cols.ethnicity]?.trim(),
                nationality: row[cols.nationality]?.trim(),
                districtHometown: row[cols.districtHometown]?.trim(),
                provinceHometown: row[cols.provinceHometown]?.trim(),
                admissionBlock: row[cols.admissionBlock]?.trim(),
                admissionScore: row[cols.admissionScore]?.trim(),
                competencyAssessmentScore: row[cols.competencyAssessmentScore]?.trim(),
                fixedClass: row[cols.fixedClass]?.trim() as string,
                trainingField: row[cols.trainingField]?.trim(),
                trainingMajor: row[cols.trainingMajor]?.trim(),
                curriculum: row[cols.curriculum]?.trim() as string,
                description: row[cols.description]?.trim(),
            }
        })

    const duplicateCodes = students
        .map((student) => student.code)
        .filter((code, index, arr) => arr.indexOf(code) !== index)

    if (duplicateCodes.length) {
        errors.push({
            sheetRef: sheetName,
            cellRef: '',
            message: `Mã sinh viên bị trùng: ${duplicateCodes.join(', ')}`,
        })
    }

    return {
        trainingObjectType:
            typeof trainingObjectTypeCell?.v === 'string'
                ? trainingObjectTypeCell?.v.trim()
                : undefined,
        trainingCourse:
            typeof trainingCourseCell?.v === 'string' ? trainingCourseCell?.v.trim() : undefined,
        students,
        errors,
    }
}

export const parseSheetStudent = (file: ArrayBufferLike) => {
    const wb = read(file)
    const sheetName = 'HỌC VIÊN, SINH VIÊN'
    const errors: ParseSheetError[] = []

    const ws = wb.Sheets[sheetName]
    if (!ws) {
        errors.push({
            sheetRef: sheetName,
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
    const trainingObjectTypeRef = 'J6' // Đối tượng đào tạo
    const trainingCourseRef = 'J7' // Khoá đào tạo
    const startRow = 12 // Dòng bắt đầu đọc dữ liệu (0-based index)
    const cols = {
        stt: 'A',
        registerNumber: 'B', // Số báo danh
        doctoralCode: 'C', // Mã hồ sơ TS
        code: 'D', // Mã sinh viên
        fullname: 'E', // Họ và tên
        dateOfBirth: 'F', // Ngày sinh
        gender: 'G', // Giới tính
        ethnicity: 'H', // Dân tộc
        nationality: 'I', // Quốc tịch
        provinceHometown: 'J', // Nơi sinh
        idCardNumber: 'K', // CCCD
        phoneNumber: 'L', // Số ĐT
        admissionCombination: 'M', // Khối xét tuyển
        entryScore: 'N', // Điểm xét tuyển
        competencyScore: 'O', // Điểm đánh giá năng lực
        fixedClass: 'P', // Lớp quản lý
        trainingField: 'Q', // Ngành đào tạo
        trainingMajor: 'R', // Chuyên ngành đào tạo
        curriculum: 'S', // Chương trình đào tạo
        objectType: 'T', // Quân sự/Dân sự
        officerNumber: 'U', // Số hiệu SQ/QNCN
        rank: 'V', // Cấp bậc
        position: 'W', // Chức vụ
        department: 'X', // Cơ quan, đơn vị
        departmentAddress: 'Y', // Địa chỉ cơ quan, đơn vị
        careerYear: 'Z', // Năm bắt đầu vào nghề/Năm nghiệp vụ
        // Thông tin tốt nghiệp đại học (Phục vụ cao học)
        universitySchool: 'AA', // Trường ĐH
        universityTrainingType: 'AB', // Hệ đào tạo
        universityGraduationYear: 'AC', // Năm tốt nghiệp
        universityMajor: 'AD', // Ngành, Chuyên ngành tốt nghiệp
        universityRank: 'AE', // Loại/Bậc tốt nghiệp
        basic: 'AF', // Cơ bản
        facility: 'AG', // Cơ sở
        foreignLanguage: 'AH', // Ngoại ngữ
        priorityReason: 'AI', // Lý do ưu tiên
        description: 'R', // Mô tả
    }
    // end: Các tham chiếu ô cố định trong sheet

    const trainingObjectTypeCell: CellObject | undefined = ws[trainingObjectTypeRef]
    if (trainingObjectTypeCell?.t !== 's' || !trainingObjectTypeCell.v) {
        errors.push({
            sheetRef: sheetName,
            cellRef: trainingObjectTypeRef,
            message: 'Đối tượng đào tạo không hợp lệ',
        })
    }
    const trainingCourseCell: CellObject | undefined = ws[trainingCourseRef]
    if (trainingCourseCell?.t !== 's' || !trainingCourseCell.v) {
        errors.push({
            sheetRef: sheetName,
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
    }) as (Record<(typeof cols)[keyof typeof cols], string> & {
        __rowNum__: number
    })[]

    const students = data
        .filter((row) => Number.isInteger(Number.parseFloat(row[cols.stt] || '')))
        .map((row) => {
            if (!row[cols.code]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.code}${row.__rowNum__ + 1}`,
                    message: 'Mã sinh viên không được để trống',
                })
            }

            if (!row[cols.fullname]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.fullname}${row.__rowNum__ + 1}`,
                    message: 'Họ và tên không được để trống',
                })
            }

            if (!row[cols.idCardNumber]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.idCardNumber}${row.__rowNum__ + 1}`,
                    message: 'CCCD không được để trống',
                })
            }

            if (!row[cols.fixedClass]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.fixedClass}${row.__rowNum__ + 1}`,
                    message: 'Lớp quản lý không được để trống',
                })
            }

            if (!row[cols.curriculum]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.curriculum}${row.__rowNum__ + 1}`,
                    message: 'Chương trình đào tạo không được để trống',
                })
            }

            const dateOfBirth = parseDate(row[cols.dateOfBirth])
            if (row[cols.dateOfBirth] && !dateOfBirth.isValid()) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.code}${row.__rowNum__ + 1}`,
                    message: 'Ngày sinh không hợp lệ (ngày/tháng/năm)',
                })
            }

            return {
                stt: row[cols.stt],
                registerNumber: row[cols.registerNumber]?.trim(),
                doctoralCode: row[cols.doctoralCode]?.trim(),
                code: row[cols.code]?.trim() as string,
                fullname: row[cols.fullname]?.trim() as string,
                dateOfBirth: dateOfBirth.isValid() ? dateOfBirth.toDate() : null,
                gender: row[cols.gender]?.trim(),
                ethnicity: row[cols.ethnicity]?.trim(),
                nationality: row[cols.nationality]?.trim(),
                provinceHometown: row[cols.provinceHometown]?.trim(),
                idCardNumber: row[cols.idCardNumber]?.trim() as string,
                phoneNumber: row[cols.phoneNumber]?.trim(),
                admissionCombination: row[cols.admissionCombination]?.trim(),
                entryScore: row[cols.entryScore]?.trim(),
                competencyScore: row[cols.competencyScore]?.trim(),
                fixedClass: row[cols.fixedClass]?.trim() as string,
                trainingField: row[cols.trainingField]?.trim(),
                trainingMajor: row[cols.trainingMajor]?.trim(),
                curriculum: row[cols.curriculum]?.trim() as string,
                objectType: row[cols.objectType]?.trim(),
                officerNumber: row[cols.officerNumber]?.trim(),
                rank: row[cols.rank]?.trim(),
                position: row[cols.position]?.trim(),
                department: row[cols.department]?.trim(),
                departmentAddress: row[cols.departmentAddress]?.trim(),
                careerYear: row[cols.careerYear]?.trim(),
                universitySchool: row[cols.universitySchool]?.trim(),
                universityTrainingType: row[cols.universityTrainingType]?.trim(),
                universityGraduationYear: row[cols.universityGraduationYear]?.trim(),
                universityMajor: row[cols.universityMajor]?.trim(),
                universityRank: row[cols.universityRank]?.trim(),
                basic: row[cols.basic]?.trim(),
                facility: row[cols.facility]?.trim(),
                foreignLanguage: row[cols.foreignLanguage]?.trim(),
                priorityReason: row[cols.priorityReason]?.trim(),
                description: row[cols.description]?.trim(),
            }
        })

    const duplicateCodes = students
        .map((student) => student.code)
        .filter((code, index, arr) => arr.indexOf(code) !== index)

    if (duplicateCodes.length) {
        errors.push({
            sheetRef: sheetName,
            cellRef: '',
            message: `Mã sinh viên bị trùng: ${duplicateCodes.join(', ')}`,
        })
    }

    return {
        trainingObjectType:
            typeof trainingObjectTypeCell?.v === 'string'
                ? trainingObjectTypeCell?.v.trim()
                : undefined,
        trainingCourse:
            typeof trainingCourseCell?.v === 'string' ? trainingCourseCell?.v.trim() : undefined,
        students,
        errors,
    }
}
