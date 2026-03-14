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
    const wb = read(file, { cellDates: true })

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

        const parseDateFromCell = (colName: string, rowNum: number): dayjs.Dayjs => {
            const cell = ws[`${colName}${rowNum + 1}`]
            if (!cell?.v) return dayjs('')

            return cell.v instanceof Date ? dayjs(cell.v) : parseDate(String(cell.v))
        }

        const students = data
            .filter((row) => Number.isInteger(Number.parseFloat(row[cols.stt] || '')))
            .map((row) => {
                const dateOfBirth = parseDateFromCell(cols.dateOfBirth, row.__rowNum__)

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
    const wb = read(file, { cellDates: true })
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

    const parseDateFromCell = (colName: string, rowNum: number): dayjs.Dayjs => {
        const cell = ws[`${colName}${rowNum + 1}`]
        if (!cell?.v) return dayjs('')

        return cell.v instanceof Date ? dayjs(cell.v) : parseDate(String(cell.v))
    }

    const students = data
        .filter((row) => Number.isInteger(Number.parseFloat(row[cols.stt] || '')))
        .map((row) => {
            const dateOfBirth = parseDateFromCell(cols.dateOfBirth, row.__rowNum__)

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
    const wb = read(file, { cellDates: true }) // Tự động convert Excel date sang JS Date
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
        fixedClassCode: 'P', // Mã lớp quản lý
        fixedClass: 'Q', // Lớp quản lý
        trainingField: 'R', // Ngành đào tạo
        trainingMajor: 'S', // Chuyên ngành đào tạo
        curriculum: 'T', // Chương trình đào tạo
        managementOrganization: 'U', // Đơn vị quản lý
        objectType: 'V', // Quân sự/Dân sự
        officerNumber: 'W', // Số hiệu SQ/QNCN
        rank: 'X', // Cấp bậc
        position: 'Y', // Chức vụ
        department: 'Z', // Cơ quan, đơn vị
        departmentAddress: 'AA', // Địa chỉ cơ quan, đơn vị
        careerYear: 'AB', // Năm bắt đầu vào nghề/Năm nghiệp vụ
        // Thông tin tốt nghiệp đại học (Phục vụ cao học)
        universitySchool: 'AC', // Trường ĐH
        universityTrainingType: 'AD', // Hệ đào tạo
        universityGraduationYear: 'AE', // Năm tốt nghiệp
        universityMajor: 'AF', // Ngành, Chuyên ngành tốt nghiệp
        universityRank: 'AG', // Loại/Bậc tốt nghiệp
        basic: 'AH', // Cơ bản
        facility: 'AI', // Cơ sở
        foreignLanguage: 'AJ', // Ngoại ngữ
        priorityReason: 'AK', // Lý do ưu tiên
        description: 'AL', // Mô tả (Ghi chú)
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

    // Helper function to parse date from Excel cell
    const parseDateFromCell = (colName: string, rowNum: number): dayjs.Dayjs => {
        const cell = ws[`${colName}${rowNum + 1}`]
        if (!cell?.v) return dayjs('')

        // cellDates: true đã convert thành Date object hoặc giữ nguyên string
        return cell.v instanceof Date ? dayjs(cell.v) : parseDate(String(cell.v))
    }

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

            const idCardNumber = row[cols.idCardNumber]?.trim()
            if (!idCardNumber || !/^[0-9]{12}$/.test(idCardNumber)) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.idCardNumber}${row.__rowNum__ + 1}`,
                    message: 'CCCD không hợp lệ',
                })
            }

            if (!row[cols.fixedClassCode]) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.fixedClassCode}${row.__rowNum__ + 1}`,
                    message: 'Mã lớp quản lý không được để trống',
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

            const managementOrganization = row[cols.managementOrganization]?.trim()
            if (!managementOrganization) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.managementOrganization}${row.__rowNum__ + 1}`,
                    message: 'Đơn vị quản lý không được để trống',
                })
            }

            const dateOfBirth = parseDateFromCell(cols.dateOfBirth, row.__rowNum__)
            if (row[cols.dateOfBirth] && !dateOfBirth.isValid()) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.code}${row.__rowNum__ + 1}`,
                    message: 'Ngày sinh không hợp lệ (ngày/tháng/năm)',
                })
            }

            const phoneNumber = row[cols.phoneNumber]?.trim()
            if (phoneNumber && !/^0\d{9,10}$/.test(phoneNumber)) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.phoneNumber}${row.__rowNum__ + 1}`,
                    message: 'Số điện thoại không hợp lệ',
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
                idCardNumber: idCardNumber as string,
                phoneNumber,
                admissionCombination: row[cols.admissionCombination]?.trim(),
                entryScore: row[cols.entryScore]?.trim(),
                competencyScore: row[cols.competencyScore]?.trim(),
                fixedClassCode: row[cols.fixedClassCode]?.trim() as string,
                fixedClass: row[cols.fixedClass]?.trim() as string,
                trainingField: row[cols.trainingField]?.trim(),
                trainingMajor: row[cols.trainingMajor]?.trim(),
                curriculum: row[cols.curriculum]?.trim() as string,
                managementOrganization: managementOrganization as string,
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

    const duplicateIdCardNumbers = students
        .map((student) => student.idCardNumber)
        .filter((idCardNumber, index, arr) => arr.indexOf(idCardNumber) !== index)

    if (duplicateIdCardNumbers.length) {
        errors.push({
            sheetRef: sheetName,
            cellRef: '',
            message: `CCCD bị trùng: ${duplicateIdCardNumbers.join(', ')}`,
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
