import { $Enums } from '@workspace/db'
import { read, utils } from 'xlsx'
import type { ParseSheetError } from './types'
export type SubjectResult = {
    name: string
    trainingBlockName: string
    code?: string
    organizationCode: string | undefined
    credit: number
    period: number
    semester: number | null
    type: $Enums.SubjectRequirementType
    subjectVersionType: $Enums.SubjectVersionType
    examType: $Enums.ExamType
    useForFinalScore: boolean
    graduation: boolean
    numberOfTheory?: number
    numberOfPractical?: number
    numberOfSelfStudy?: number
    numberOfPractice?: number
    numberOfReview?: number
    numberOfExam?: number
}

export interface ParseSubjectResult {
    subjects: SubjectResult[]
    errors: ParseSheetError[]
}

export const parseSheetSubject = (file: ArrayBufferLike): ParseSubjectResult => {
    const wb = read(file)
    const sheetName = wb.SheetNames[0]

    if (!sheetName) {
        throw new Error('Không tìm thấy sheet trong file')
    }

    const errors: ParseSheetError[] = []
    const ws = wb.Sheets[sheetName]
    if (!ws) {
        errors.push({
            sheetRef: sheetName,
            cellRef: sheetName,
            message: `Không tìm thấy sheet "${sheetName}" trong file`,
        })
        return { errors, subjects: [] }
    }

    // Mapping cột theo đúng cấu trúc Excel
    const cols = {
        stt: 'A', // STT
        knowledgeBlock: 'B', // Khối kiến thức
        name: 'C', // Tên học phần
        required: 'D', // Bắt buộc
        conditional: 'E', // HP điều kiện (không tính điểm tích luỹ)
        subjectVersionType: 'F', // Loại học phần
        code: 'G', // Mã học phần
        orgCode: 'H', // Khoa, Viện phụ trách
        credit: 'I', // Số tín chỉ
        // structure: 'I', // Cấu trúc
        periodCtdt: 'K', // Số tiết CTĐT
        periodTkb: 'L', // Số tiết TKB
        theory: 'M', // LT
        practice: 'N', // TL, BT
        discussion: 'O', // ThL
        experiment: 'P', // TN, TH
        review: 'Q', // Ôn
        exam: 'R', // KT, Thi
        semester: 'S', // Học kỳ dự kiến
        examType: 'T', // Hình thức thi
        note: 'U', // Mối đầu điểm
    } as const

    const startRow = 1 // Dòng bắt đầu đọc dữ liệu (bỏ qua header)

    const rows = utils.sheet_to_json(ws, {
        defval: '',
        blankrows: false,
        raw: false,
        header: 'A',
        range: startRow,
    }) as (Record<(typeof cols)[keyof typeof cols], string | null> & {
        __rowNum__: number
    })[]

    const subjects: SubjectResult[] = []

    // Parse số nguyên
    const parseIntField = (value: string | null | undefined): number | undefined => {
        const trimmed = value?.trim()
        if (!trimmed) return undefined
        const parsed = Number.parseInt(trimmed, 10)
        return Number.isInteger(parsed) ? parsed : undefined
    }

    // Parse số thực
    const parseFloatField = (value: string | null | undefined): number | undefined => {
        const trimmed = value?.trim()
        if (!trimmed) return undefined
        const parsed = Number.parseFloat(trimmed)
        return !Number.isNaN(parsed) ? parsed : undefined
    }

    // Parse exam type từ text
    const parseExamType = (value: string | null | undefined): $Enums.ExamType => {
        const trimmed = value?.trim()
        if (!trimmed) return $Enums.ExamType.OfflineWritten

        if (trimmed === 'Thi viết') {
            return $Enums.ExamType.OfflineWritten
        }
        if (trimmed === 'Thi vấn đáp') {
            return $Enums.ExamType.Oral
        }
        if (trimmed === 'Khác') {
            return $Enums.ExamType.Other
        }
        // if (trimmed.includes('đồ án') || trimmed.includes('luận văn')) {
        //     return $Enums.ExamType.Project
        // }

        return $Enums.ExamType.OfflineWritten
    }

    for (const row of rows) {
        const rowNumber = row.__rowNum__ + 1
        const knowledgeBlock = row[cols.knowledgeBlock]?.trim()
        if (!knowledgeBlock) {
            errors.push({
                sheetRef: sheetName,
                cellRef: `${cols.name}${rowNumber}`,
                message: 'Tên khối kiến thức không được để trống',
            })
            continue
        }

        // Validate tên học phần (bắt buộc)
        const name = row[cols.name]?.trim()
        if (!name) {
            errors.push({
                sheetRef: sheetName,
                cellRef: `${cols.name}${rowNumber}`,
                message: 'Tên môn học không được để trống',
            })
            continue
        }

        // Parse các trường bắt buộc
        const credit = parseIntField(row[cols.credit])
        if (credit === undefined) {
            errors.push({
                sheetRef: sheetName,
                cellRef: `${cols.credit}${rowNumber}`,
                message: `Số tín chỉ không hợp lệ cho môn học "${name}"`,
            })
            continue
        }

        const period = parseIntField(row[cols.periodTkb]) || 0
        const semester = parseIntField(row[cols.semester]) || null

        // Parse loại bắt buộc
        const requiredText = row[cols.required]?.trim()
        const type =
            requiredText === 'Tự chọn'
                ? $Enums.SubjectRequirementType.Optional
                : $Enums.SubjectRequirementType.Mandatory

        // Parse exam type
        const examType = parseExamType(row[cols.examType])

        // Xác định subject version type
        const subjectVersionText = row[cols.subjectVersionType]?.trim()
        let subjectVersionType: $Enums.SubjectVersionType = $Enums.SubjectVersionType.Normal
        if (subjectVersionText === 'Thực tập') {
            subjectVersionType = $Enums.SubjectVersionType.Internship
        } else if (subjectVersionText === 'Chuyên đề nghiên cứu') {
            subjectVersionType = $Enums.SubjectVersionType.Research
        } else if (subjectVersionText === 'Luận văn-Đề án') {
            subjectVersionType = $Enums.SubjectVersionType.Project
        } else if (subjectVersionText === 'Thi tốt nghiệp') {
            // TODO: add this subject version type
            subjectVersionType = $Enums.SubjectVersionType.Normal
        }

        // Parse số tiết chi tiết
        const numberOfTheory = parseIntField(row[cols.theory])
        const numberOfPractical = parseIntField(row[cols.practice])
        const numberOfSelfStudy = parseIntField(row[cols.discussion])
        const numberOfPractice = parseIntField(row[cols.experiment])
        const numberOfReview = parseIntField(row[cols.review])
        const numberOfExam = parseIntField(row[cols.exam])

        // Lấy mã học phần và mã khoa/viện
        const code = row[cols.code]?.trim() || undefined
        const organizationCode = row[cols.orgCode]?.trim() || undefined

        // Thêm môn học vào khối kiến thức hiện tại
        subjects.push({
            name,
            trainingBlockName: knowledgeBlock,
            code,
            organizationCode,
            credit,
            period,
            semester,
            type,
            subjectVersionType,
            examType,
            useForFinalScore: type !== $Enums.SubjectRequirementType.Optional,
            numberOfTheory,
            numberOfPractical,
            numberOfSelfStudy,
            numberOfPractice,
            numberOfReview,
            numberOfExam,
            graduation: false, // TODO: add this
        })
    }

    // // Kiểm tra trùng lặp training blocks
    // const duplicateTrainingBlocks = trainingBlocks
    //     .map(({ name }) => name)
    //     .filter((name, index, arr) => arr.indexOf(name) !== index)

    // if (duplicateTrainingBlocks.length) {
    //     errors.push({
    //         sheetRef: sheetName,
    //         cellRef: null,
    //         message: `Khối kiến thức bị trùng: ${duplicateTrainingBlocks.join(', ')}`,
    //     })
    // }

    // // Kiểm tra trùng lặp subjects
    // const duplicateSubjects = trainingBlocks
    //     .flatMap(({ subjects }) => subjects.map(({ name }) => name))
    //     .filter((name, index, arr) => arr.indexOf(name) !== index)

    // if (duplicateSubjects.length) {
    //     errors.push({
    //         sheetRef: sheetName,
    //         cellRef: null,
    //         message: `Môn học bị trùng: ${duplicateSubjects.join(', ')}`,
    //     })
    // }

    return { subjects, errors }
}
