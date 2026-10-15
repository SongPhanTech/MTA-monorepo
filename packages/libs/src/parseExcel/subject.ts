import { $Enums } from "@workspace/db"
import { read, utils } from "xlsx"
import { examTypes, subjectVersionTypes } from "../constants"
import type { ParseSheetError } from "./types"
export type SubjectResult = {
  name: string
  trainingBlockName: string
  code: string
  organizationCode: string | undefined
  credit: number
  period: number
  schedulePeriod: number
  semester: number | null
  type: $Enums.SubjectRequirementType
  subjectVersionType: $Enums.SubjectVersionType
  examType: $Enums.ExamType | null
  graduation: boolean
  numberOfTheory?: number
  numberOfPractical?: number
  numberOfSelfStudy?: number
  numberOfPractice?: number
  numberOfReview?: number
  numberOfExam?: number
  useForFinalScore: boolean
  onePoint?: boolean
}

export interface ParseSubjectResult {
  subjects: SubjectResult[]
  errors: ParseSheetError[]
}

const subjectRequirementTypes: Record<string, $Enums.SubjectRequirementType> = {
  "Bắt buộc": $Enums.SubjectRequirementType.Mandatory,
  "Tự chọn": $Enums.SubjectRequirementType.Optional,
}

/** Gộp dấu gạch ngang và chữ hoa để "Luận văn-Đề án" khớp "Luận văn/đề án". */
const normalizeSubjectVersionLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[‐‑‒–—−-]/g, "/")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")

const subjectVersionTypeByLabel = new Map(
  Object.entries(subjectVersionTypes).map(([label, type]) => [
    normalizeSubjectVersionLabel(label),
    type,
  ])
)

export const parseSheetSubject = (file: ArrayBufferLike): ParseSubjectResult => {
  const wb = read(file)
  const sheetName = wb.SheetNames[0]

  if (!sheetName) {
    throw new Error("Không tìm thấy sheet trong file")
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
    stt: "A", // STT
    knowledgeBlock: "B", // Khối kiến thức
    name: "C", // Tên học phần
    required: "D", // Bắt buộc
    conditional: "E", // HP điều kiện (không tính điểm tích luỹ)
    subjectVersionType: "F", // Loại học phần
    code: "G", // Mã học phần
    orgCode: "H", // Khoa, Viện phụ trách
    credit: "I", // Số tín chỉ
    // structure: 'I', // Cấu trúc
    period: "K", // Số tiết CTĐT
    schedulePeriod: "L", // Số tiết TKB
    theory: "M", // LT
    practice: "N", // TL, BT
    discussion: "O", // ThL
    experiment: "P", // TN, TH
    review: "Q", // Ôn
    exam: "R", // KT, Thi
    semester: "S", // Học kỳ dự kiến
    examType: "T", // Hình thức thi
    onePoint: "U", // Một đầu điểm
  } as const

  const startRow = 1 // Dòng bắt đầu đọc dữ liệu (bỏ qua header)

  const rows = utils.sheet_to_json(ws, {
    defval: "",
    blankrows: false,
    raw: false,
    header: "A",
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

  const isGraduation = (name: string, type: $Enums.SubjectVersionType): boolean => {
    // 1. Kiểm tra theo Enum chuẩn (Phòng thủ bằng code cứng của hệ thống)
    const isEnumValid =
      type === $Enums.SubjectVersionType.Project ||
      type === $Enums.SubjectVersionType.Thesis ||
      type === $Enums.SubjectVersionType.Graduation
    if (isEnumValid) return true

    // 2. Danh sách từ khóa (Tiếng Việt + Tiếng Anh + Các từ khóa dễ sai chính tả)
    // Lưu ý: Chuẩn hóa hết về lowercase để so sánh
    const keywords = [
      // Tiếng Việt
      "luận văn",
      "đồ án",
      "khóa luận",
      "tốt nghiệp",
      "thực tập",
      "luan van",
      "do an",
      "khoa luan",
      "tot nghiep",
      "thuc tap", // Không dấu

      // Tiếng Anh
      "thesis",
      "project",
      "graduation",
      "internship",
      "practicum",

      // Các biến thể/sai chính tả thường gặp
      "luanvan",
      "thuctap",
    ]

    return keywords.some((kw) => name.toLowerCase().includes(kw))
  }

  for (const row of rows) {
    const rowNumber = row.__rowNum__ + 1
    const knowledgeBlock = row[cols.knowledgeBlock]?.trim()
    if (!knowledgeBlock) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.name}${rowNumber}`,
        message: "Tên khối kiến thức không được để trống",
      })
      continue
    }

    // Validate mã học phần (bắt buộc)
    const code = row[cols.code]?.trim()
    if (!code) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.code}${rowNumber}`,
        message: "Mã môn học không được để trống",
      })
      continue
    }

    // Validate tên học phần (bắt buộc)
    const name = row[cols.name]?.trim()
    if (!name) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.name}${rowNumber}`,
        message: "Tên môn học không được để trống",
      })
      continue
    }

    // Validate đơn vị quản lý
    const orgCode = row[cols.orgCode]?.trim()
    if (!orgCode) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.name}${rowNumber}`,
        message: "ĐV phụ trách không được để trống",
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

    const period = parseIntField(row[cols.period]) || 0
    const schedulePeriod = parseIntField(row[cols.schedulePeriod]) || 0
    const semester = parseIntField(row[cols.semester]) || null

    // Parse loại bắt buộc
    const requiredText = row[cols.required]?.trim()
    if (!requiredText) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.required}${rowNumber}`,
        message: "Loại môn học không được để trống",
      })
      continue
    }

    const type = subjectRequirementTypes[requiredText]
    if (!type) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.subjectVersionType}${rowNumber}`,
        message: `Loại học phần không tồn tại [${Object.keys(subjectRequirementTypes).join(", ")}]`,
      })
      continue
    }

    const examTypeText = row[cols.examType]?.trim()
    const examType = examTypeText ? (examTypes[examTypeText] ?? null) : null
    if (examTypeText && examType === null) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.subjectVersionType}${rowNumber}`,
        message: `Hình thức thi không tồn tại [${Object.keys(examTypes).join(", ")}]`,
      })
      continue
    }

    // Xác định subject version type
    const subjectVersionText = row[cols.subjectVersionType]?.trim()
    if (!subjectVersionText) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.subjectVersionType}${rowNumber}`,
        message: "Loại học phần không được để trống",
      })
      continue
    }

    const subjectVersionType = subjectVersionTypeByLabel.get(
      normalizeSubjectVersionLabel(subjectVersionText)
    )
    if (!subjectVersionType) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.subjectVersionType}${rowNumber}`,
        message: `Loại học phần không tồn tại [${Object.keys(subjectVersionTypes).join(", ")}]`,
      })
      continue
    }

    // Parse số tiết chi tiết
    const numberOfTheory = parseIntField(row[cols.theory])
    const numberOfPractical = parseIntField(row[cols.practice])
    const numberOfSelfStudy = parseIntField(row[cols.discussion])
    const numberOfPractice = parseIntField(row[cols.experiment])
    const numberOfReview = parseIntField(row[cols.review])
    const numberOfExam = parseIntField(row[cols.exam])
    const onePoint = !!row[cols.onePoint]?.trim()
    const useForFinalScore = !row[cols.conditional]?.trim()

    // Lấy mã học phần và mã khoa/viện
    // const code = row[cols.code]?.trim() || undefined
    const organizationCode = row[cols.orgCode]?.trim() || undefined

    // Thêm môn học vào khối kiến thức hiện tại
    subjects.push({
      name,
      trainingBlockName: knowledgeBlock,
      code: code as string,
      organizationCode,
      credit,
      period,
      schedulePeriod,
      semester,
      type,
      subjectVersionType,
      examType,
      useForFinalScore,
      numberOfTheory,
      numberOfPractical,
      numberOfSelfStudy,
      numberOfPractice,
      numberOfReview,
      numberOfExam,
      onePoint,
      graduation: isGraduation(name, subjectVersionType),
    })
  }

  // Kiểm tra trùng lặp subjects
  // TODO: fix
  const duplicateSubjects = subjects.filter((s, index, arr) => arr.indexOf(s) !== index)

  if (duplicateSubjects.length) {
    errors.push({
      sheetRef: sheetName,
      cellRef: null,
      message: `Môn học bị trùng: ${duplicateSubjects.join(", ")}`,
    })
  }

  return { subjects, errors }
}

export interface TrainingBlockResult {
  trainingBlockName: string
  credit: number
}

export interface ParseTrainingBlockResult {
  trainingBlocks: TrainingBlockResult[]
  errors: ParseSheetError[]
}

export const parseSheetTrainingBlock = (file: ArrayBufferLike): ParseTrainingBlockResult => {
  const wb = read(file)
  const sheetName = "KKT_TU_CHON"

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
    trainingBlock: "A", // tên khối kiến thức
    electiveCreditsRequired: "B", // số tín chỉ tự chọn yêu cầu
  } as const

  const startRow = 1 // Dòng bắt đầu đọc dữ liệu (bỏ qua header)

  const rows = utils.sheet_to_json(ws, {
    defval: "",
    blankrows: false,
    raw: false,
    header: "A",
    range: startRow,
  }) as (Record<(typeof cols)[keyof typeof cols], string | null> & {
    __rowNum__: number
  })[]

  const trainingBlocks: TrainingBlockResult[] = []

  for (const row of rows) {
    const rowNumber = row.__rowNum__ + 1
    const trainingBlock = row[cols.trainingBlock]?.trim()
    if (!trainingBlock) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.trainingBlock}${rowNumber}`,
        message: "Tên khối kiến thức không được để trống",
      })
      continue
    }

    // Parse các trường bắt buộc
    const credit = Number.parseInt(row[cols.electiveCreditsRequired] || "", 10)
    if (credit === undefined || Number.isNaN(credit)) {
      errors.push({
        sheetRef: sheetName,
        cellRef: `${cols.electiveCreditsRequired}${rowNumber}`,
        message: `Số tín chỉ không hợp lệ cho KKT "${trainingBlock}"`,
      })
      continue
    }

    trainingBlocks.push({
      trainingBlockName: trainingBlock,
      credit,
    })
  }

  // Kiểm tra trùng lặp training blocks
  const duplicateTrainingBlocks = trainingBlocks
    .map(({ trainingBlockName }) => trainingBlockName)
    .filter((name, index, arr) => arr.indexOf(name) !== index)

  if (duplicateTrainingBlocks.length) {
    errors.push({
      sheetRef: sheetName,
      cellRef: null,
      message: `Khối kiến thức bị trùng: ${duplicateTrainingBlocks.join(", ")}`,
    })
  }

  return { trainingBlocks, errors }
}
