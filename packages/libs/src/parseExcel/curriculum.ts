import { $Enums } from "@workspace/db"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import type { CellObject } from "xlsx"
import { read, utils } from "xlsx"
import type { ParseSheetError } from "./types"

dayjs.extend(customParseFormat)

// TODO!: now depends on stt column(it need to be a integer), maybe need to change to more reliable way

type TrainingBlockResult = {
  name: string
  priority: number
  electiveCreditsRequired: number
  subjects: {
    name: string
    organizationCode: string | undefined
    credit: number
    period: number
    semester: number | null
    type: $Enums.SubjectRequirementType
    subjectVersionType: $Enums.SubjectVersionType
    examType: $Enums.ExamType
    useForFinalScore: boolean
    graduation: boolean // có phải là môn học tốt nghiệp hay không
  }[]
}

type ParseCurriculumSheetResult = {
  trainingMajor: string | undefined
  errors: ParseSheetError[]
  trainingBlocks: TrainingBlockResult[]
}

export const parseCurriculumSheet = (file: ArrayBufferLike): ParseCurriculumSheetResult => {
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
    return { trainingMajor: undefined, errors, trainingBlocks: [] }
  }

  // start: Các tham chiếu ô cố định trong sheet
  const trainingMajorRef = "D3" // Chuyên ngành
  const startRow = 6 // Dòng bắt đầu đọc dữ liệu (0-based index)
  const semesters = {
    semester1: "O",
    semester2: "P",
    semester3: "Q",
    semester4: "R",
    semester5: "S",
    semester6: "T",
    semester7: "U",
    semester8: "V",
    semester9: "W",
    semester10: "X",
  } as const

  const cols = {
    stt: "A",
    subjectName: "B",
    inCurriculum: "C",
    organizationCode: "D",
    credit: "E",
    structure: "F",
    period: "G",
    ...semesters,
    description: "Y",
  } as const
  // end: Các tham chiếu ô cố định trong sheet

  const trainingMajorCell: CellObject | undefined = ws[trainingMajorRef]
  const trainingMajor = trainingMajorCell
    ? trainingMajorCell.v?.toString().replace("Chuyên ngành: ", "").trim()
    : ""
  if (!trainingMajor) {
    errors.push({
      sheetRef: sheetName,
      cellRef: trainingMajorRef,
      message: "Chuyên ngành không hợp lệ",
    })
  }

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

  let isMandatory = true

  for (const row of rows) {
    // Khối kiến thức
    if (
      row[cols.stt] &&
      !row[cols.subjectName] &&
      !row[cols.inCurriculum] &&
      !row[cols.organizationCode] &&
      row[cols.credit]
    ) {
      const maybeTrainingBlock = row[cols.stt]?.split(".").pop()
      if (!maybeTrainingBlock) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.stt}${row.__rowNum__ + 1}`,
          message: `Tên khối kiến thức không hợp lệ: ${row[cols.stt]}`,
        })
        return { trainingMajor, trainingBlocks, errors }
      }

      // Bỏ qua nếu là khối kiến thức nhỏ
      if (maybeTrainingBlock?.toUpperCase() !== maybeTrainingBlock) {
        continue
      }

      trainingBlocks.push({
        name: maybeTrainingBlock.trim(),
        priority: trainingBlocks.length + 1,
        electiveCreditsRequired: 0,
        subjects: [],
      })
      isMandatory = true

      continue
    }

    // Môn bắt buộc hay tự chọn
    if (
      !row[cols.stt] &&
      row[cols.subjectName] &&
      !row[cols.inCurriculum] &&
      !row[cols.organizationCode] && // môn thực tập không có đơn vị quản lý
      row[cols.credit]
    ) {
      const requirement = row[cols.subjectName]
      if (requirement?.toLocaleLowerCase().includes("tự chọn")) {
        isMandatory = false

        // set số TC tự chọn yêu cầu
        const trainingBlock = trainingBlocks[trainingBlocks.length - 1]
        if (trainingBlock) {
          trainingBlock.electiveCreditsRequired = Number.parseInt(row[cols.credit] || "", 10) || 0
        }
      } else {
        isMandatory = true
      }
      continue
    }

    // Môn học
    if (
      row[cols.stt] &&
      row[cols.subjectName] &&
      ((row[cols.inCurriculum] && row[cols.organizationCode]) ||
        (row[cols.organizationCode] && row[cols.credit]) ||
        (row[cols.inCurriculum] && row[cols.credit]))
    ) {
      const credit =
        Number.parseInt(row[cols.credit] || "", 10) ||
        Number.parseInt(row[cols.structure] || "", 10)
      if (!Number.isInteger(credit)) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.credit}${row.__rowNum__ + 1}`,
          message: "Số tín chỉ không hợp lệ",
        })
      }
      const period = Number.parseInt(row[cols.period] || "", 10)
      if (!Number.isInteger(period)) {
        errors.push({
          sheetRef: sheetName,
          cellRef: `${cols.period}${row.__rowNum__ + 1}`,
          message: "Số tiết học không hợp lệ",
        })
      }

      // nếu không có "Số TC" => môn điều kiện, không tính điểm tích luỹ
      const useForFinalScore = !cols.credit

      const semester = Object.values(semesters).findIndex((semester) => row[semester]) + 1 || null

      const subjectName = row[cols.subjectName]?.trim() as string

      // TODO: this is a bit magic words
      const graduation = subjectName.toLowerCase().includes("tốt nghiệp")
      const project = subjectName.startsWith("Dự án")

      trainingBlocks[trainingBlocks.length - 1]?.subjects.push({
        name: subjectName,
        organizationCode: row[cols.organizationCode]?.trim(),
        credit,
        period,
        semester,
        type: isMandatory
          ? $Enums.SubjectRequirementType.Mandatory
          : $Enums.SubjectRequirementType.Optional,
        useForFinalScore,
        graduation,
        examType: $Enums.ExamType.OfflineWritten,
        subjectVersionType: project
          ? $Enums.SubjectVersionType.Project
          : $Enums.SubjectVersionType.Normal,
      })

      continue
    }
  }

  if (trainingBlocks.length === 0) {
    errors.push({
      sheetRef: sheetName,
      cellRef: sheetName,
      message: "Không tìm thấy môn học trong file",
    })
  }

  const duplicateTrainingBlocks = trainingBlocks
    .map(({ name }) => name)
    .filter((name, index, arr) => arr.indexOf(name) !== index)

  if (duplicateTrainingBlocks.length) {
    errors.push({
      sheetRef: sheetName,
      cellRef: null,
      message: `Khối kiến thức bị trùng: ${duplicateTrainingBlocks.join(", ")}`,
    })
  }

  const duplicateSubjects = trainingBlocks
    .flatMap(({ subjects }) => subjects.map(({ name }) => name))
    .filter((name, index, arr) => arr.indexOf(name) !== index)

  if (duplicateSubjects.length) {
    errors.push({
      sheetRef: sheetName,
      cellRef: null,
      message: `Môn học bị trùng: ${duplicateSubjects.join(", ")}`,
    })
  }

  return { trainingMajor, trainingBlocks, errors }
}
