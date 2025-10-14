import { $Enums } from '@workspace/db'
import { read, utils } from 'xlsx'
import type { ParseSheetError } from './types'

type TrainingBlockResult = {
    name: string
    priority: number
    electiveCreditsRequired: number
    subjects: {
        name: string
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
    }[]
}

export interface ParseSubjectResult {
    trainingBlocks: TrainingBlockResult[]
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
        return { errors, trainingBlocks: [] }
    }

    // Mapping cột theo đúng cấu trúc Excel
    const cols = {
        stt: 'A', // STT
        knowledgeBlock: 'B', // Khối kiến thức
        name: 'C', // Tên học phần
        required: 'D', // Bắt buộc
        // Bỏ cột E - HP điều kiện (không có trong ảnh)
        code: 'F', // Mã học phần (cột F trong ảnh)
        codeVisa: 'G', // Khoa, Viện phụ trách (cột G)
        credit: 'I', // Số tín chỉ (cột H)
        structure: 'I', // Cấu trúc (cột I)
        periodCtdt: 'J', // Số tiết CTĐT (cột J)
        periodTkb: 'K', // Số tiết TKB (cột K)
        theory: 'L', // LT (cột L)
        practice: 'M', // TL, BT (cột M)
        discussion: 'N', // ThL (cột N)
        experiment: 'O', // TN, TH (cột O)
        review: 'P', // Ôn (cột P)
        exam: 'Q', // KT, Thi (cột Q)
        semester: 'R', // Học kỳ dự kiến (cột R)
        examType: 'S', // Hình thức thi (cột S)
        note: 'T', // Mối đầu điểm (cột T)
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

    const trainingBlocks: TrainingBlockResult[] = []

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
        const trimmed = value?.trim().toLowerCase()
        if (!trimmed) return $Enums.ExamType.OfflineWritten

        if (
            trimmed.includes('trắc nghiệm') ||
            trimmed.includes('tự luận') ||
            trimmed.includes('viết') ||
            trimmed.includes('thư viết') ||
            trimmed.includes('thủ viết')
        ) {
            return $Enums.ExamType.OfflineWritten
        }
        if (trimmed.includes('vấn đáp')) {
            return $Enums.ExamType.Oral
        }
        if (trimmed.includes('thực hành')) {
            return $Enums.ExamType.Practice
        }
        if (trimmed.includes('đồ án') || trimmed.includes('luận văn')) {
            return $Enums.ExamType.Project
        }

        return $Enums.ExamType.OfflineWritten
    }

    let currentKnowledgeBlock: string | undefined

    for (const row of rows) {
        const rowNumber = row.__rowNum__ + 1
        const knowledgeBlock = row[cols.knowledgeBlock]?.trim()

        // Xử lý khối kiến thức
        if (knowledgeBlock) {
            // Nếu đây là dòng chứa khối kiến thức mới
            if (knowledgeBlock !== currentKnowledgeBlock) {
                currentKnowledgeBlock = knowledgeBlock

                // Tạo training block mới nếu chưa tồn tại
                const existingBlock = trainingBlocks.find((tb) => tb.name === knowledgeBlock)
                if (!existingBlock) {
                    trainingBlocks.push({
                        name: knowledgeBlock,
                        priority: trainingBlocks.length + 1,
                        electiveCreditsRequired: 0,
                        subjects: [],
                    })
                }
            }
        }

        // Validate tên học phần (bắt buộc)
        const name = row[cols.name]?.trim()
        if (!name) {
            continue
        }

        // Parse các trường bắt buộc
        const credit = parseFloatField(row[cols.credit])
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
        const requiredText = row[cols.required]?.trim().toLowerCase()
        let type: $Enums.SubjectRequirementType
        if (requiredText === 'bắt buộc') {
            type = $Enums.SubjectRequirementType.Mandatory
        } else if (requiredText === 'tự chọn') {
            type = $Enums.SubjectRequirementType.Optional
        } else {
            type = $Enums.SubjectRequirementType.None
        }

        // Parse exam type
        const examType = parseExamType(row[cols.examType])

        // Xác định subject version type
        const nameLower = name.toLowerCase()
        let subjectVersionType: $Enums.SubjectVersionType
        if (nameLower.includes('thực tập')) {
            subjectVersionType = $Enums.SubjectVersionType.Internship
        } else if (nameLower.includes('chuyên đề') || nameLower.includes('nghiên cứu')) {
            subjectVersionType = $Enums.SubjectVersionType.Research
        } else if (
            nameLower.includes('luận văn') ||
            nameLower.includes('đồ án') ||
            nameLower.includes('tốt nghiệp')
        ) {
            subjectVersionType = $Enums.SubjectVersionType.Project
        } else {
            subjectVersionType = $Enums.SubjectVersionType.Normal
        }

        // Xác định graduation (môn tốt nghiệp)
        const graduation =
            nameLower.includes('tốt nghiệp') ||
            nameLower.includes('luận văn') ||
            nameLower.includes('đồ án tốt nghiệp')

        // Parse số tiết chi tiết
        const numberOfTheory = parseIntField(row[cols.theory])
        const numberOfPractical = parseIntField(row[cols.practice])
        const numberOfSelfStudy = parseIntField(row[cols.discussion])
        const numberOfPractice = parseIntField(row[cols.experiment])
        const numberOfReview = parseIntField(row[cols.review])
        const numberOfExam = parseIntField(row[cols.exam])

        // Lấy mã học phần và mã khoa/viện
        const code = row[cols.code]?.trim() || undefined
        const organizationCode = row[cols.codeVisa]?.trim() || undefined

        // Thêm môn học vào khối kiến thức hiện tại
        if (currentKnowledgeBlock) {
            const currentBlock = trainingBlocks.find((tb) => tb.name === currentKnowledgeBlock)
            if (currentBlock) {
                currentBlock.subjects.push({
                    name,
                    code,
                    organizationCode,
                    credit,
                    period,
                    semester,
                    type,
                    subjectVersionType,
                    examType,
                    useForFinalScore: type !== $Enums.SubjectRequirementType.Optional,
                    graduation,
                    numberOfTheory,
                    numberOfPractical,
                    numberOfSelfStudy,
                    numberOfPractice,
                    numberOfReview,
                    numberOfExam,
                })
            }
        } else {
            errors.push({
                sheetRef: sheetName,
                cellRef: `${cols.name}${rowNumber}`,
                message: `Môn học "${name}" không thuộc khối kiến thức nào`,
            })
        }
    }

    // Validate
    if (trainingBlocks.length === 0) {
        errors.push({
            sheetRef: sheetName,
            cellRef: sheetName,
            message: 'Không tìm thấy khối kiến thức nào trong file',
        })
    }

    // Kiểm tra trùng lặp training blocks
    const duplicateTrainingBlocks = trainingBlocks
        .map(({ name }) => name)
        .filter((name, index, arr) => arr.indexOf(name) !== index)

    if (duplicateTrainingBlocks.length) {
        errors.push({
            sheetRef: sheetName,
            cellRef: null,
            message: `Khối kiến thức bị trùng: ${duplicateTrainingBlocks.join(', ')}`,
        })
    }

    // Kiểm tra trùng lặp subjects
    const duplicateSubjects = trainingBlocks
        .flatMap(({ subjects }) => subjects.map(({ name }) => name))
        .filter((name, index, arr) => arr.indexOf(name) !== index)

    if (duplicateSubjects.length) {
        errors.push({
            sheetRef: sheetName,
            cellRef: null,
            message: `Môn học bị trùng: ${duplicateSubjects.join(', ')}`,
        })
    }

    return {
        trainingBlocks,
        errors,
    }
}
