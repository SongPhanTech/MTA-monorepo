import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"
import { ExportDiplomaAppendix } from "@components/ui/export-button"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { formatDateDMY } from "@lib/utils"
import type { Semester, Student } from "@workspace/db"
import {
  ApplicationStatus,
  SubjectVersionType,
  type CurriculumVersion,
  type FixedClass,
  type GraduationDecision,
  type ScoreConvert,
  type StudentSubjectScore,
  type SubjectClass,
  type SubjectVersion,
  type TrainingCourse,
  type TrainingLanguage,
  type TrainingField,
  type TrainingTime,
  type TrainingLevel,
  type DiplomaType,
  type UserProfile,
} from "@workspace/db/client"
import {
  useCountStudent,
  useFindManyGraduationSession,
  useFindManyStudent,
  useFindManyThesisSession,
  useFindManyTrainingCourse,
  useFindManyTrainingObjectType,
} from "@workspace/db/hooks"
import {
  exportGraduationRegisterMaster,
  exportPhoiBangCaoHoc,
  exportPhoiBangNganHan,
  exportPhuLucVanBangCaoHoc,
  exportPhuLucVanBangNganHan,
} from "@workspace/libs/api/training"
import { exportFromTemplate, TableRow, type SheetExportOptions, type TableCell } from "@workspace/libs/template-excel"
import { formatPlaceOfBirth, getMinioUrl } from "@workspace/libs/utils"
import { docxTemplate } from "../../../utils/docx-template"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { DownOutlined } from "@ant-design/icons"
import {
  Button,
  DatePicker,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  notification,
  Radio,
} from "antd"
import { useWatch } from "antd/es/form/Form"
import dayjs, { Dayjs } from "dayjs"
import { saveAs } from "file-saver"
import type React from "react"
import { useEffect, useMemo, useState } from "react"

type TSubjectItem = StudentSubjectScore & {
  subjectVersion: SubjectVersion
  subjectClass:
    | (SubjectClass & {
        semester: Semester
      })
    | null
  semester?: Semester | null
  studentResearchTopic?: { name?: string | null } | null
}

function unwrapResearchTopicTitle(name?: string | null) {
  return (name || "")
    .trim()
    .replace(/^chuyên đề\s*/i, "")
    .replace(/^[“”"']+|[“”"']+$/g, "")
    .trim()
}

function formatResearchTopicPrintName(topicName?: string | null, fallbackName?: string | null) {
  const title = unwrapResearchTopicTitle(topicName)
  if (title) return `Chuyên đề "${title}"`
  const fallback = (fallbackName || "").trim()
  if (!fallback) return "Chuyên đề"
  if (/^chuyên đề\b/i.test(fallback)) return fallback
  return `Chuyên đề "${fallback}"`
}

function getDiplomaAppendixSubjectName(item: {
  subjectVersion?: {
    type?: string | null
    name?: string | null
    subject?: { name?: string | null } | null
  } | null
  studentResearchTopic?: { name?: string | null } | null
}) {
  const subjectName = item.subjectVersion?.name?.trim() || item.subjectVersion?.subject?.name?.trim() || ""
  if (item.subjectVersion?.type !== SubjectVersionType.Research) return subjectName
  return formatResearchTopicPrintName(item.studentResearchTopic?.name, subjectName)
}

function getSubjectScoreValue(item: {
  manualFinalScore?: number | null
  finalScore?: unknown
}): number | null {
  if (item.manualFinalScore != null && !Number.isNaN(Number(item.manualFinalScore))) {
    return Number(item.manualFinalScore)
  }
  if (item.finalScore != null) {
    const n = Number(item.finalScore)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function pickHighestScoreBySubject<
  T extends {
    id?: string
    subjectVersionId: string
    subjectVersion?: { subjectId?: string; type?: string | null } | null
    manualFinalScore?: number | null
    finalScore?: unknown
  },
>(records: T[]): T[] {
  const bestMap = new Map<string, T>()
  for (const record of records) {
    const isResearch = record.subjectVersion?.type === SubjectVersionType.Research
    const key = isResearch
      ? record.id || record.subjectVersionId
      : record.subjectVersion?.subjectId || record.subjectVersionId
    const existing = bestMap.get(key)
    if (!existing) {
      bestMap.set(key, record)
      continue
    }
    const score = getSubjectScoreValue(record)
    const existingScore = getSubjectScoreValue(existing)
    if (score != null && (existingScore == null || score > existingScore)) {
      bestMap.set(key, record)
    }
  }
  return Array.from(bestMap.values())
}

function isGraduationSubjectType(type?: string | null) {
  return (
    type === SubjectVersionType.Thesis ||
    type === SubjectVersionType.Project ||
    type === SubjectVersionType.Graduation
  )
}

type AppendixSubject = {
  tenHocPhan?: string | null
  soTinChi?: number | string | null
  thangDiem10?: string | number | null
  thangDiem4?: string | number | null
  thangDiemChu?: string | null
}

function isGraduationSemesterGroup(id?: string | null) {
  return String(id || "").startsWith("graduation-")
}

function toAppendixScore(value: unknown): number | "" {
  if (value == null || value === "" || value === "-") return ""
  const n = Number(value)
  return Number.isFinite(n) ? n : ""
}

/** Hiển thị điểm theo mẫu (dấu phẩy thập phân). */
function formatAppendixScoreDisplay(value: unknown, decimals = 1): string {
  const n = toAppendixScore(value)
  if (n === "") return ""
  return n.toFixed(decimals).replace(".", ",")
}

/**
 * Mẫu chuẩn độ dài 1 dòng: "Công tác đảng, công tác chính trị" = 33 ký tự.
 * Tên dài hơn → xuống dòng 2. Chiều cao theo cỡ chữ môn học (10).
 */
const PLVB_NAME_ONE_LINE_SAMPLE = "Công tác đảng, công tác chính trị"
const PLVB_NAME_ONE_LINE_MAX = PLVB_NAME_ONE_LINE_SAMPLE.length // 33
const PLVB_BODY_ROW_HEIGHT_1 = 16
const PLVB_BODY_ROW_HEIGHT_2 = 26

function wrapAppendixSubjectName(name?: string | null): string {
  const text = String(name || "").trim().replace(/\s+/g, " ")
  if (!text || text.length <= PLVB_NAME_ONE_LINE_MAX) return text
  // Ưu tiên ngắt tại khoảng trắng gần ngưỡng 33 ký tự
  const head = text.slice(0, PLVB_NAME_ONE_LINE_MAX + 1)
  const breakAt = Math.max(head.lastIndexOf(" "), head.lastIndexOf(","))
  if (breakAt >= Math.floor(PLVB_NAME_ONE_LINE_MAX * 0.45)) {
    return `${text.slice(0, breakAt + (text[breakAt] === "," ? 1 : 0)).trim()}\n${text
      .slice(breakAt + 1)
      .trim()}`
  }
  return `${text.slice(0, PLVB_NAME_ONE_LINE_MAX).trim()}\n${text.slice(PLVB_NAME_ONE_LINE_MAX).trim()}`
}

function isTwoLineAppendixName(name?: string | null): boolean {
  return String(name || "").trim().replace(/\s+/g, " ").length > PLVB_NAME_ONE_LINE_MAX
}

function getAppendixSubjectRowHeight(names: Array<string | null | undefined>): number {
  return names.some(isTwoLineAppendixName) ? PLVB_BODY_ROW_HEIGHT_2 : PLVB_BODY_ROW_HEIGHT_1
}

function countWrappedLines(
  texts: Array<string | null | undefined>,
  colWidth: number,
  fontSize: number
): number {
  const usablePx = Math.max(24, colWidth * 7 - 10)
  const pxPerChar = Math.max(4, fontSize * 0.5)
  return Math.max(
    1,
    ...texts.map((text) =>
      String(text || "")
        .split("\n")
        .reduce((sum, part) => {
          const words = part.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
          if (!words.length) return sum + 1
          let count = 1
          let current = 0
          for (const word of words) {
            const wordPx = word.length * pxPerChar
            const next = current === 0 ? wordPx : current + pxPerChar + wordPx
            if (next > usablePx && current > 0) {
              count += 1
              current = wordPx
            } else {
              current = next
            }
          }
          return sum + count
        }, 0)
    )
  )
}

function estimateWrappedRowHeight(
  texts: Array<string | null | undefined>,
  colWidth: number,
  fontSize: number
): number {
  const lines = countWrappedLines(texts, colWidth, fontSize)
  return Math.max(PLVB_BODY_ROW_HEIGHT_1, lines * Math.ceil(fontSize * 1.3) + 2)
}

/** Kiểu nét thin; màu khung/lưới do tableBorderRange (ngoài đen, trong xám). */
const PLVB_TABLE_BORDER = "thin" as const

function appendixSubjectCells(
  stt: number | "",
  subject?: AppendixSubject | null,
  fontSize = 11
): TableCell[] {
  const cell = (
    value: TableCell["value"],
    align: TableCell["align"] = "center"
  ): TableCell => ({
    value,
    align,
    fontSize,
    wrapText: true,
    borderStyle: PLVB_TABLE_BORDER,
  })
  const nameCell = (value: TableCell["value"]): TableCell => ({
    ...cell(value, "left"),
    colSpan: PLVB_NAME_SPAN,
  })
  if (!subject) {
    return [cell(""), nameCell(""), cell(""), cell(""), cell(""), cell("")]
  }
  return [
    cell(stt),
    nameCell(wrapAppendixSubjectName(subject.tenHocPhan)),
    cell(subject.soTinChi ?? ""),
    cell(formatAppendixScoreDisplay(subject.thangDiem10)),
    cell(formatAppendixScoreDisplay(subject.thangDiem4)),
    cell(subject.thangDiemChu ?? ""),
  ]
}

/** Mẫu chính thức: điền hết cột trái rồi mới sang cột phải (không xen kẽ từng dòng). */
function buildTwoColumnSubjectRows(
  subjects: AppendixSubject[],
  maxRows: number,
  fontSize = 11,
  _nameColWidth = 24
): TableRow[] {
  if (!subjects.length) return []
  const leftCount = Math.ceil(subjects.length / 2)
  const left = subjects.slice(0, leftCount)
  const right = subjects.slice(leftCount)
  const rows: TableRow[] = []
  for (let i = 0; i < leftCount; i++) {
    const s2 = right[i]
    rows.push({
      height: getAppendixSubjectRowHeight([left[i]?.tenHocPhan, s2?.tenHocPhan]),
      cells: [
        ...appendixSubjectCells(i + 1, left[i], fontSize),
        ...appendixSubjectCells(s2 ? leftCount + i + 1 : "", s2, fontSize),
      ],
    })
  }
  return rows.slice(0, maxRows)
}

function noBorderCell(value: TableCell["value"], extra: Partial<TableCell> = {}): TableCell {
  return {
    value,
    border: false,
    wrapText: true,
    ...extra,
  }
}

function headerBoxCell(
  value: TableCell["value"],
  extra: Partial<TableCell> = {}
): TableCell {
  return {
    value,
    align: "center",
    bold: true,
    fontSize: 9,
    wrapText: true,
    borderStyle: PLVB_TABLE_BORDER,
    ...extra,
  }
}

/** Mỗi nửa 12 ô = STT + tên 7 + tín chỉ + 3 cột điểm. */
const PLVB_HALF = 12
const PLVB_UNITS = PLVB_HALF * 2
const PLVB_NAME_SPAN = 7
/**
 * Độ rộng cột khít khổ in A4 (lề 0.6/0.3) ở scale ~100%.
 * Cột quá rộng → Excel Scale-to-Fit thu nhỏ cả trang → font/cỡ chữ in ra sai.
 */
const PLVB_STT_WIDTH = 5.0
const PLVB_NAME_UNIT = 3.6
const PLVB_CREDIT_WIDTH = 3.8
const PLVB_SCORE_WIDTH = 7.0
const PLVB_INFO_ROW_HEIGHT = 18
/** Khoảng trống chữ ký — đẩy ghi chú xuống, giảm trắng chân trang khi ít môn. */
const PLVB_SIGN_GAP_HEIGHT = 18
const PLVB_SIGN_GAP_COUNT = 5
const PLVB_TABLE_FONT = 10 // môn học / bảng điểm
const PLVB_INFO_FONT = 13 // cụm thông tin sinh viên
const PLVB_NOTE_FONT = 10 // cụm ghi chú
const PLVB_HALF_WIDTHS = [
  PLVB_STT_WIDTH,
  ...Array.from({ length: PLVB_NAME_SPAN }, () => PLVB_NAME_UNIT),
  PLVB_CREDIT_WIDTH,
  PLVB_SCORE_WIDTH,
  PLVB_SCORE_WIDTH,
  PLVB_SCORE_WIDTH,
]
const PLVB_COL_WIDTHS = [...PLVB_HALF_WIDTHS, ...PLVB_HALF_WIDTHS]
const INFO_COL_WIDTH = PLVB_HALF_WIDTHS.reduce((sum, width) => sum + width, 0)
const PLVB_NAME_COL_WIDTH = PLVB_NAME_UNIT * PLVB_NAME_SPAN

/** Chia dải cột `[from, to)` thành `count` nhóm có tổng width gần bằng nhau → mảng colSpan. */
function partitionColumnSpans(
  colWidths: number[],
  from: number,
  to: number,
  count: number
): number[] {
  const available = colWidths.slice(from, to)
  const n = available.length
  if (count <= 0 || n <= 0) return []
  const groups = Math.min(count, n)
  const totalW = available.reduce((sum, w) => sum + w, 0)
  const target = totalW / groups
  const spans: number[] = []
  let idx = 0
  for (let g = 0; g < groups; g++) {
    const groupsLeft = groups - g
    const colsLeft = n - idx
    if (groupsLeft === 1) {
      spans.push(colsLeft)
      break
    }
    let span = 1
    let sum = available[idx] ?? 0
    const maxSpan = colsLeft - (groupsLeft - 1)
    while (span < maxSpan) {
      const next = available[idx + span] ?? 0
      if (Math.abs(sum + next - target) <= Math.abs(sum - target)) {
        sum += next
        span += 1
      } else {
        break
      }
    }
    spans.push(span)
    idx += span
  }
  return spans
}

function infoRichText(label: string, value: string, boldValue: boolean): TableCell["value"] {
  return {
    richText: [
      { text: label, font: { bold: false, name: "Times New Roman", size: PLVB_INFO_FONT } },
      {
        text: value || "",
        font: { bold: boldValue, name: "Times New Roman", size: PLVB_INFO_FONT },
      },
    ],
  }
}

function infoPairRow(
  leftLabel: string,
  leftValue: string,
  rightLabel: string,
  rightValue: string,
  bold: { left?: boolean; right?: boolean } = {}
): TableRow {
  const rightEmpty = !rightLabel && !rightValue
  return {
    height: PLVB_INFO_ROW_HEIGHT,
    cells: [
      noBorderCell(infoRichText(leftLabel, leftValue, !!bold.left), {
        colSpan: PLVB_HALF,
        fontSize: PLVB_INFO_FONT,
        align: "left",
        indent: 0,
      }),
      rightEmpty
        ? noBorderCell("", { colSpan: PLVB_HALF, border: false })
        : noBorderCell(infoRichText(rightLabel, rightValue, !!bold.right), {
            colSpan: PLVB_HALF,
            fontSize: PLVB_INFO_FONT,
            align: "left",
            indent: 0,
          }),
    ],
  }
}

function buildPhuLuc2ColHeaderRows(header: ReturnType<typeof getDiplomaAppendixHeaderData>): TableRow[] {
  const bangTotNghiep = header.trinh_do_dao_tao
    ? ` tốt nghiệp ${header.trinh_do_dao_tao}`
    : header.loai_bang
      ? ` ${header.loai_bang}`
      : " tốt nghiệp"
  const scoreSubHeader = (label: string): TableCell =>
    headerBoxCell(label, { fontSize: 8, wrapText: true })

  return [
    {
      height: 18,
      cells: [
        noBorderCell("BỘ QUỐC PHÒNG", { colSpan: PLVB_HALF, align: "center", fontSize: 13 }),
        noBorderCell("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", {
          colSpan: PLVB_HALF,
          align: "center",
          fontSize: 12,
          bold: true,
        }),
      ],
    },
    {
      height: 20,
      cells: [
        // Gạch chân chỉ dưới "KỸ THUẬT"
        noBorderCell(
          {
            richText: [
              {
                text: "HỌC VIỆN ",
                font: { name: "Times New Roman", size: 13, bold: true, family: 1 },
              },
              {
                text: "KỸ THUẬT",
                font: {
                  name: "Times New Roman",
                  size: 13,
                  bold: true,
                  underline: true,
                  family: 1,
                },
              },
              {
                text: " QUÂN SỰ",
                font: { name: "Times New Roman", size: 13, bold: true, family: 1 },
              },
            ],
          },
          {
            colSpan: PLVB_HALF,
            align: "center",
            vertical: "bottom",
            fontSize: 13,
            bold: true,
          }
        ),
        // Gạch chân cả dòng "Độc lập - Tự do - Hạnh phúc"
        noBorderCell("Độc lập - Tự do - Hạnh phúc", {
          colSpan: PLVB_HALF,
          align: "center",
          vertical: "bottom",
          fontSize: 12,
          bold: true,
          italic: false,
          underline: true,
        }),
      ],
    },
    { height: 10, cells: [noBorderCell("", { colSpan: PLVB_UNITS })] },
    {
      height: 22,
      cells: [
        noBorderCell("PHỤ LỤC VĂN BẰNG", {
          colSpan: PLVB_UNITS,
          align: "center",
          bold: true,
          fontSize: 14,
        }),
      ],
    },
    {
      height: 16,
      cells: [
        noBorderCell(`(Kèm theo bằng${bangTotNghiep} số hiệu: ${header.so_ky_hieu || ""})`, {
          colSpan: PLVB_UNITS,
          align: "center",
          italic: true,
          fontSize: 12,
        }),
      ],
    },
    // Mẫu Cục nhà trường: trái (họ tên→chuyên ngành), phải (ngôn ngữ→hình thức)
    infoPairRow(
      "Họ và tên: ",
      String(header.ho_ten || ""),
      "Ngôn ngữ đào tạo: ",
      String(header.ngon_ngu || ""),
      { left: true }
    ),
    infoPairRow(
      "Ngày sinh: ",
      String(header.ngay_sinh || ""),
      "Ngày nhập học: ",
      String(header.ngay_nhap_hoc || "")
    ),
    infoPairRow(
      "Mã học viên: ",
      String(header.ma_hoc_vien || ""),
      "Thời gian đào tạo: ",
      String(header.thoi_gian_dao_tao || "")
    ),
    infoPairRow(
      "Khóa: ",
      String(header.khoa || ""),
      "Trình độ đào tạo: ",
      String(header.trinh_do_dao_tao || "")
    ),
    infoPairRow(
      "Ngành: ",
      String(header.nganh_hoc || ""),
      "Hình thức đào tạo: ",
      String(header.hinh_thuc_dao_tao || "")
    ),
    infoPairRow("Chuyên ngành: ", String(header.chuyen_nganh || ""), "", "", { left: true }),
    // Cách nhẹ trước bảng điểm
    { height: 8, cells: [noBorderCell("", { colSpan: PLVB_UNITS })] },
    {
      height: 18,
      cells: [
        headerBoxCell("STT", { rowSpan: 2, fontSize: PLVB_TABLE_FONT, wrapText: false }),
        headerBoxCell("Tên học phần", {
          rowSpan: 2,
          colSpan: PLVB_NAME_SPAN,
          fontSize: PLVB_TABLE_FONT,
        }),
        headerBoxCell("Số\ntín\nchỉ", { rowSpan: 2, fontSize: 8 }),
        headerBoxCell("Điểm học phần", { colSpan: 3, fontSize: PLVB_TABLE_FONT }),
        headerBoxCell("STT", { rowSpan: 2, fontSize: PLVB_TABLE_FONT, wrapText: false }),
        headerBoxCell("Tên học phần", {
          rowSpan: 2,
          colSpan: PLVB_NAME_SPAN,
          fontSize: PLVB_TABLE_FONT,
        }),
        headerBoxCell("Số\ntín\nchỉ", { rowSpan: 2, fontSize: 8 }),
        headerBoxCell("Điểm học phần", { colSpan: 3, fontSize: PLVB_TABLE_FONT }),
      ],
    },
    {
      height: 36,
      cells: [
        { skip: true, colSpan: 1 },
        { skip: true, colSpan: PLVB_NAME_SPAN },
        { skip: true, colSpan: 1 },
        scoreSubHeader("Thang\nđiểm\n10"),
        scoreSubHeader("Thang\nđiểm\n4"),
        scoreSubHeader("Thang\nđiểm\nchữ"),
        { skip: true, colSpan: 1 },
        { skip: true, colSpan: PLVB_NAME_SPAN },
        { skip: true, colSpan: 1 },
        scoreSubHeader("Thang\nđiểm\n10"),
        scoreSubHeader("Thang\nđiểm\n4"),
        scoreSubHeader("Thang\nđiểm\nchữ"),
      ],
    },
  ]
}

function buildGraduationSectionHeaderRow(totalColumns: number, fontSize = 11): TableRow {
  return {
    height: fontSize + 8,
    cells: [
      {
        value: "Học phần tốt nghiệp",
        colSpan: totalColumns,
        bold: true,
        fontSize,
        wrapText: true,
        align: "left",
        borderStyle: PLVB_TABLE_BORDER,
      },
    ],
  }
}

type TTrainingCourse = TrainingCourse & {
  scoreConverts: ScoreConvert[]
  academicRankingConvert?: any[]
  trainingLanguage: TrainingLanguage | null
  semesterStart?: Semester | null
}

type TFixedClass = {
  fixedClass: FixedClass & {
    trainingCourse: TTrainingCourse
    curriculumVersion: CurriculumVersion & {
      trainingType?: { name: string } | null
      trainingTime?: TrainingTime | null
      trainingLevel?: TrainingLevel | null
      trainingLanguage?: TrainingLanguage | null
      diplomaType?: Pick<DiplomaType, "name"> | null
      curriculum: {
        trainingMajor: {
          name: string
          trainingField: TrainingField | null
        }
      }
    }
  }
}

type TUserProfile = {
  userProfile: UserProfile
}

type TGraduationDecision = {
  graduationDecision?:
    | (Pick<GraduationDecision, "diplomaNumber" | "originalDiplomaNumber" | "finalGpa"> & {
        finalRanking?: {
          classification?: string
        }
        diplomaType?: Pick<DiplomaType, "name"> | null
        trainingMajor?: {
          name: string
          trainingField?: TrainingField | null
        } | null
      })
    | null
}

export interface SessionSignerInfo {
  chief?: string | null
  deputy?: string | null
  graduationDecisionSigner?: string | null
  graduationDecisionNumber?: string | null
  graduationNumber?: string | null
  graduationDecisionDate?: Date | string | null
  proposalGraduation?: string | null
  graduationReport?: string | null
  graduationDecisionMaker?: string | null
  name?: string | null
}

type TExportPayload = {
  trainingObjectTypeId: string
  trainingCourseIds?: string[]
  thesisSessionIds?: string[]
  printDate?: string
  signerName?: string
  isChief?: boolean
  includeNamePrefix?: boolean
}

type TExportApiResponse = {
  status: number
  data: Blob | { message?: string }
}

type TExportApi = (payload: TExportPayload) => Promise<TExportApiResponse>

type TExportConfig = {
  api: TExportApi
  fileName: string
}

export interface ISemesterGroup {
  id: string
  name: string
  subjects: TSubjectItem[]
}

export type TStudentWithSubjects = Student &
  TFixedClass &
  TUserProfile &
  TGraduationDecision & {
    subjectClassStudent: (StudentSubjectScore & {
      subjectVersion: SubjectVersion & {
        trainingBlocks?: Array<{
          semester?: number | null
          trainingBlockOnCurriculumVersion?: {
            curriculumVersionId: string
          } | null
        }>
      }
      subjectClass?: SubjectClass & {
        semester?: Semester
      }
      semester?: Semester | null
      studentResearchTopic?: { name?: string | null } | null
    })[]
    curriculumVersion?: CurriculumVersion & {
      trainingTime?: TrainingTime | null
      trainingLevel?: TrainingLevel | null
      trainingType?: { name: string } | null
      trainingLanguage?: TrainingLanguage | null
      diplomaType?: Pick<DiplomaType, "name"> | null
    }
    from?: Date | string | null
  }

export type TStudentWithSemesters = TStudentWithSubjects & {
  semesters: Array<{
    id: string
    name: string
    subjects: Array<{
      id: string
      key: string
      stt: number
      tenHocPhan: string
      soTinChi: number
      thangDiem10: string
      thangDiem4: string
      thangDiemChu: string | null
    }>
  }>
}

function formatAppendixDate(date?: string | Date | dayjs.Dayjs | null) {
  if (!date) return ""
  const d = dayjs(date)
  if (!d.isValid()) return formatDateDMY(date as any) || ""
  return d.format("DD/MM/YYYY")
}

function getDiplomaAppendixHeaderData(student: TStudentWithSemesters) {
  const diplomaNumber = student.graduationDecision?.diplomaNumber || ""
  const course = student.fixedClass?.trainingCourse
  const classCurriculum = student.fixedClass?.curriculumVersion
  const curriculum = student.curriculumVersion || classCurriculum
  const major =
    student.graduationDecision?.trainingMajor || classCurriculum?.curriculum?.trainingMajor
  const language =
    curriculum?.trainingLanguage?.name || course?.trainingLanguage?.name || ""
  const loaiBang =
    student.graduationDecision?.diplomaType?.name || curriculum?.diplomaType?.name || ""
  return {
    ho_ten: student.userProfile.fullname,
    ma_hoc_vien: student.userProfile.code,
    ngay_sinh: formatAppendixDate(student.userProfile.dateOfBirth),
    ngay_nhap_hoc: formatAppendixDate(student.from || course?.admissionStartDate || null),
    hinh_thuc_dao_tao: curriculum?.trainingType?.name || classCurriculum?.trainingType?.name || "",
    nganh_hoc: major?.trainingField?.name || "",
    chuyen_nganh: major?.name || "",
    thoi_gian_dao_tao: curriculum?.trainingTime?.name || "",
    trinh_do_dao_tao: curriculum?.trainingLevel?.name || "",
    ngon_ngu: language,
    ngon_ngu_dao_tao: language,
    so_ky_hieu: diplomaNumber,
    so_hieu_bang: diplomaNumber,
    loai_bang: loaiBang,
    khoa: course?.name || "",
    noi_sinh: formatPlaceOfBirth(student.userProfile),
  }
}

const formItemLayout = {
  labelCol: { flex: "0 0 100px" },
  wrapperCol: { flex: "1" },
}

const initialPagination = {
  page: 1,
  pageSize: 10,
}

export type StudentGradeSystemForm = {
  trainingObjectTypeId: string[]
  thesisSessionIds: string[]
  trainingCourseIds: string[]
  recordsPerPage: string
  date: string
  signer: string
  imageUrl: string
}
const exportHandlers: Record<string, TExportConfig> = {
  soGoc: {
    api: exportGraduationRegisterMaster,
    fileName: "SoGocCapPhatVanBangCaoHoc.xlsx",
  },
  phoiBangCaoHoc: {
    api: exportPhoiBangCaoHoc,
    fileName: "PhoiBangCaoHoc.xlsx",
  },
  phoiBangNganHan: {
    api: exportPhoiBangNganHan,
    fileName: "PhoiBangNganHan.xlsx",
  },
  phuLucVanBangNganHan: {
    api: exportPhuLucVanBangNganHan,
    fileName: "PhuLucVanBangNganHan.docx",
  },
  phuLucVanBangCaoHoc: {
    api: exportPhuLucVanBangCaoHoc,
    fileName: "PhuLucVanBangCaoHoc.docx",
  },
}

export default function StudentGradeSystem() {
  const [form] = Form.useForm<StudentGradeSystemForm>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const trainingCourseIds: string[] = useWatch("trainingCourseIds", form)
  const thesisSessionIds: string[] = useWatch("thesisSessionIds", form)
  const signerName: string = useWatch("signer", form)
  const printDate: string = useWatch("date", form)
  const [page, setPage] = useState(initialPagination.page)
  const [pageSize, setPageSize] = useState(initialPagination.pageSize)
  const [viewResult, setViewResult] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<TStudentWithSemesters | null>(null)
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [signRole, setSignRole] = useState<"chief" | "deputy">("deputy")
  const [signingDate, setSigningDate] = useState<Dayjs>(dayjs())
  const [pendingSignKind, setPendingSignKind] = useState<
    "quyetDinhCongNhan" | "phuLucVanBangCaoHoc" | "phuLucVanBangNganHan" | null
  >(null)
  const { data: trainingObjectTypes = [] } = useFindManyTrainingObjectType({
    where: { active: true },
  })

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
    {
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
      where: {
        active: true,
        deletedAt: null,
        ...(trainingObjectTypeId && {
          trainingObjectTypeId,
        }),
      },
    },
    {
      enabled: !!trainingObjectTypeId || trainingObjectTypes?.length > 0,
    }
  )

  const { data: thesisSessionData = [] } = useFindManyGraduationSession(
    {
      where: {
        active: true,
        deletedAt: null,
        ...(trainingObjectTypeId && { trainingObjectTypeId }),
        ...(trainingCourseIds?.length && {
          OR: [{ trainingCourseId: { in: trainingCourseIds } }, { trainingCourseId: null }],
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    {
      enabled: !!trainingObjectTypeId || trainingCourseData?.length > 0,
    }
  )

  const { data: postgraduateSessions = [] } = useFindManyThesisSession(
    {
      where: {
        active: true,
        deletedAt: null,
        ...(trainingObjectTypeId && { trainingObjectTypeId }),
        ...(trainingCourseIds?.length && {
          trainingCourses: { some: { id: { in: trainingCourseIds } } },
        }),
      },
      orderBy: { createdAt: "desc" },
    },
    {
      enabled: !!trainingObjectTypeId || trainingCourseData?.length > 0,
    }
  )

  const selectedThesisSession = useMemo(() => {
    const selectedSessionId = thesisSessionIds?.[0]
    return thesisSessionData.find((s) => s.id === selectedSessionId)
  }, [thesisSessionIds, thesisSessionData])

  const selectedPostgraduateSession = useMemo(() => {
    const selectedIds = thesisSessionIds ?? []
    return (
      postgraduateSessions.find((s) => selectedIds.includes(s.id)) || postgraduateSessions[0]
    )
  }, [postgraduateSessions, thesisSessionIds])

  const where = {
    active: true,
    deletedAt: null,
    ...(trainingObjectTypeId || trainingCourseIds?.length
      ? {
          fixedClass: {
            ...(trainingObjectTypeId && {
              trainingCourse: {
                trainingObjectTypeId,
              },
            }),
            ...(trainingCourseIds?.length > 0 && {
              trainingCourseId: {
                in: trainingCourseIds,
              },
            }),
          },
        }
      : {}),
    graduationApplications: {
      some: {
        status: ApplicationStatus.APPROVED,
        graduation: true,
        deletedAt: null,
        ...(thesisSessionIds?.length > 0 && {
          sessionId: {
            in: thesisSessionIds,
          },
        }),
      },
    },
  }

  const { data: count } = useCountStudent(
    {
      where: { ...where },
    },
    {
      enabled: viewResult,
    }
  )

  const {
    data: students,
    isLoading: isLoadingStudents,
    isFetching: isFetchingStudents,
  } = useFindManyStudent(
    {
      where: { ...where },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        userProfile: {
          include: {
            gender: true,
            ethnicity: true,
            nationality: true,
            provinceOfBirth: true,
            newProvinceOfBirth: true,
          },
        },
        graduationDecision: {
          include: {
            finalRanking: true,
            diplomaType: true,
            trainingMajor: {
              include: {
                trainingField: true,
              },
            },
          },
        },
        thesisRegistrations: {
          include: {
            council: true,
            thesisProject: {
              include: {
                defenseRecord: true,
              },
            },
          },
        },
        fixedClass: {
          include: {
            managementOrganization: true,
            trainingCourse: {
              include: {
                scoreConverts: true,
                academicRankingConvert: true,
                trainingLanguage: true,
              },
            },
            curriculumVersion: {
              include: {
                trainingType: true,
                trainingTime: true,
                trainingLevel: true,
                trainingLanguage: true,
                diplomaType: true,
                curriculum: {
                  include: {
                    trainingMajor: {
                      include: {
                        trainingField: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        subjectClassStudent: {
          where: {
            deletedAt: null,
            active: true,
          },
          include: {
            semester: true,
            subjectVersion: {
              include: {
                subject: true,
                trainingBlocks: {
                  include: {
                    trainingBlockOnCurriculumVersion: {
                      select: {
                        curriculumVersionId: true,
                      },
                    },
                  },
                },
              },
            },
            subjectClass: {
              include: {
                semester: true,
              },
            },
            studentResearchTopic: {
              select: {
                name: true,
              },
            },
          },
        },
        curriculumVersion: {
          include: {
            trainingTime: true,
            trainingLevel: true,
            trainingType: true,
            trainingLanguage: true,
            diplomaType: true,
          },
        },
      },
    },
    {
      enabled: viewResult,
    }
  )

  const studentsWithSemesters = useMemo(() => {
    return (students || []).map((student) => {
      const { scoreConverts } = student?.fixedClass?.trainingCourse || {}
      const curriculumVersionId =
        student?.fixedClass?.curriculumVersion?.id || student?.curriculumVersion?.id

      const sortedSubjectClassStudent = pickHighestScoreBySubject(
        student.subjectClassStudent || []
      ).sort((a, b) => {
        const aGrad = isGraduationSubjectType(a.subjectVersion?.type)
        const bGrad = isGraduationSubjectType(b.subjectVersion?.type)
        if (aGrad !== bGrad) return aGrad ? 1 : -1

        const getPlannedSemester = (item: (typeof student.subjectClassStudent)[number]) => {
          const matchedTrainingBlock = item?.subjectVersion?.trainingBlocks?.find(
            (trainingBlock) =>
              trainingBlock?.trainingBlockOnCurriculumVersion?.curriculumVersionId ===
              curriculumVersionId
          )

          return matchedTrainingBlock?.semester ?? Number.MAX_SAFE_INTEGER
        }

        const plannedSemesterA = getPlannedSemester(a)
        const plannedSemesterB = getPlannedSemester(b)

        if (plannedSemesterA !== plannedSemesterB) {
          return plannedSemesterA - plannedSemesterB
        }

        const semesterA = a?.subjectClass?.semester || a?.semester
        const semesterB = b?.subjectClass?.semester || b?.semester
        const startA = semesterA?.startDate
          ? new Date(semesterA.startDate).getTime()
          : Number.MAX_SAFE_INTEGER
        const startB = semesterB?.startDate
          ? new Date(semesterB.startDate).getTime()
          : Number.MAX_SAFE_INTEGER
        if (startA !== startB) return startA - startB

        const semesterCompare = (semesterA?.name || "").localeCompare(semesterB?.name || "", "vi")
        if (semesterCompare !== 0) {
          return semesterCompare
        }

        return (a?.subjectVersion?.name || "").localeCompare(b?.subjectVersion?.name || "", "vi")
      })

      const semesterMap = new Map()
      const graduationItems: typeof sortedSubjectClassStudent = []

      const pushSubject = (
        semesterGroup: { subjects: any[] },
        item: (typeof sortedSubjectClassStudent)[number]
      ) => {
        const scoreValue = getSubjectScoreValue(item)
        const scoreConvert = scoreConverts?.find(
          (s) =>
            scoreValue != null && s.base10Min <= scoreValue && s.base10Max >= scoreValue
        )
        semesterGroup.subjects.push({
          id: item.id,
          key: item.id,
          stt: semesterGroup.subjects.length + 1,
          tenHocPhan: getDiplomaAppendixSubjectName(item),
          soTinChi: item.subjectVersion?.credit || "",
          thangDiem10: scoreValue != null ? scoreValue.toFixed(2) : "-",
          thangDiem4: scoreConvert?.base4 || "",
          thangDiemChu: scoreConvert?.letter,
        })
      }

      sortedSubjectClassStudent.forEach((item) => {
        if (isGraduationSubjectType(item.subjectVersion?.type)) {
          graduationItems.push(item)
          return
        }

        const semester = item.subjectClass?.semester || item.semester || {
          id: `phien-diem-${student.id}`,
          name: "Phiên điểm",
        }

        if (!semesterMap.has(semester.id)) {
          semesterMap.set(semester.id, {
            id: semester.id,
            name: semester.name,
            subjects: [],
          })
        }
        pushSubject(semesterMap.get(semester.id), item)
      })

      const semesters = Array.from(semesterMap.values())
      if (graduationItems.length) {
        const graduationGroup = {
          id: `graduation-${student.id}`,
          name:
            getDiplomaAppendixSubjectName(graduationItems[0]) ||
            graduationItems[0]?.subjectClass?.semester?.name ||
            graduationItems[0]?.semester?.name ||
            "Luận văn/đề án tốt nghiệp",
          subjects: [],
        }
        graduationItems.forEach((item) => pushSubject(graduationGroup, item))
        semesters.push(graduationGroup)
      }

      return {
        ...student,
        semesters,
      }
    }) as TStudentWithSemesters[]
  }, [students])

  const studentTableData = useMemo(() => {
    return (studentsWithSemesters || []).map((student, index) => ({
      key: student.id,
      stt: (page - 1) * pageSize + index + 1,
      maSinhVien: student.userProfile?.code,
      hoTen: student.userProfile?.fullname || "",
      lop: student.fixedClass?.name || "",
      khoa: student.fixedClass?.trainingCourse?.name || "",
      semesters: student.semesters,
    }))
  }, [studentsWithSemesters, page, pageSize])

  const selectedStudentGradeData = useMemo(() => {
    if (!selectedStudent) return []

    return (selectedStudent.semesters || []).map((semester) => ({
      id: semester.id,
      key: semester.id,
      tenHocPhan: semester.name,
      $type: "parent" as const,
      subjects: semester.subjects.map((subject, index) => ({
        ...subject,
        stt: index + 1,
        $type: "child" as const,
      })),
    }))
  }, [selectedStudent])

  const getScoreClassification = (finalScore: number, scoreConverts: ScoreConvert[] = []) => {
    const matched = scoreConverts.find(
      (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
    )

    return matched?.classification ?? ""
  }

  const getGraduationClassification = (
    finalScoreBase10: number,
    finalScoreBase4: number,
    academicRankingConvert: any[] = []
  ) => {
    const graduationRankingData = academicRankingConvert.filter(
      (item) => item?.context === "GRADUATION" && item?.graduated
    )

    if (!graduationRankingData.length) return ""

    const graduationBaseScore =
      graduationRankingData.find((item) => item?.base4Min != null)?.baseScore ??
      graduationRankingData[0]?.baseScore

    const matched = graduationRankingData.find((range) => {
      if (graduationBaseScore === "Base4") {
        return finalScoreBase4 >= range.base4Min && finalScoreBase4 <= range.base4Max
      }
      return finalScoreBase10 >= range.base10Min && finalScoreBase10 <= range.base10Max
    })

    return matched?.classification ?? ""
  }

  const buildScoreSystemNoteRows = (
    scoreConverts: ScoreConvert[] = [],
    totalColumns: number,
    evenColumns = false
  ) => {
    const sortedData = [...scoreConverts].sort((a, b) => b.base4 - a.base4)
    const mark = (value: number | string | null | undefined, decimals?: number) => {
      if (value == null || value === "") return ""
      const n = Number(value)
      if (!Number.isFinite(n)) return String(value).replace(".", ",")
      if (decimals != null) return n.toFixed(decimals).replace(".", ",")
      return String(value).replace(".", ",")
    }
    const toBase10Range = (item: ScoreConvert) => {
      if (item.base10Min === 0) {
        const upper = item.base10Max != null ? mark(Number(item.base10Max) + 0.1, 1) : ""
        return upper ? `<${upper}` : ""
      }
      const min = mark(item.base10Min, 1)
      if (item.base10Max == null) return min
      const maxNum = Number(item.base10Max)
      const max =
        Number.isFinite(maxNum) && maxNum === 10 ? "10" : mark(item.base10Max, 1)
      return `${min}-${max}`
    }

    const letters = sortedData.map((item) => item.letter ?? "")
    const base4Values = sortedData.map((item) => mark(item.base4, 1))
    const base10Values = sortedData.map(toBase10Range)

    // Gạch đầu dòng thẳng hàng; 3 hàng thang điểm lùi bằng lề "Ghi chú:"
    const ghiChuLabelSpan = 2
    const bulletSpan = Math.max(totalColumns - ghiChuLabelSpan, 1)
    const SCALE_LABEL_WIDTH = 18 // fallback 1 cột (pad space)
    const SCALE_VALUE_WIDTH = 10

    const padCenter = (text: string, width: number) => {
      const t = String(text ?? "")
      if (t.length >= width) return t
      const left = Math.floor((width - t.length) / 2)
      return `${" ".repeat(left)}${t}${" ".repeat(width - t.length - left)}`
    }

    const contentRow = (value: string, withGhiChuLabel = false, wrapText = true): TableRow => ({
      height: 16,
      cells: [
        {
          value: withGhiChuLabel ? "Ghi chú:" : null,
          colSpan: ghiChuLabelSpan,
          fontSize: PLVB_NOTE_FONT,
          align: "left",
          wrapText: false,
          border: false,
          indent: 0,
        },
        {
          value,
          colSpan: bulletSpan,
          fontSize: PLVB_NOTE_FONT,
          align: "left",
          wrapText,
          border: false,
        },
      ],
    })

    /**
     * Cụm thang điểm: ô Excel thật — sát lề trái (không thụt thêm).
     * 3 hàng cùng colSpan → A+ / 4,0 / 9,0-10 thẳng cột.
     */
    const scaleRow = (label: string, values: string[]): TableRow => {
      if (evenColumns && values.length) {
        const leadSpan = 0 // sát lề trái trang/bảng
        const labelSpan = 4
        const valueStart = leadSpan + labelSpan
        const remaining = Math.max(totalColumns - valueStart, values.length)
        // Chừa 2 cột cuối (điểm rộng) để các cột giá trị cân width hơn
        const valueEnd =
          totalColumns === PLVB_UNITS && remaining >= values.length + 2
            ? valueStart + remaining - 2
            : valueStart + remaining
        const spans =
          totalColumns === PLVB_UNITS
            ? partitionColumnSpans(PLVB_COL_WIDTHS, valueStart, valueEnd, values.length)
            : (() => {
                const use = valueEnd - valueStart
                const each = Math.floor(use / values.length)
                let leftover = use - each * values.length
                return values.map(() => {
                  const extra = leftover > 0 ? 1 : 0
                  if (leftover > 0) leftover -= 1
                  return Math.max(each + extra, 1)
                })
              })()
        const used = spans.reduce((sum, s) => sum + s, 0)
        const trailSpan = totalColumns - valueStart - used
        return {
          height: 16,
          cells: [
            {
              value: label,
              colSpan: labelSpan,
              align: "left",
              fontSize: PLVB_NOTE_FONT,
              border: false,
              wrapText: false,
            },
            ...values.map((v, i) => ({
              value: v,
              colSpan: spans[i] ?? 1,
              align: "center" as const,
              fontSize: PLVB_NOTE_FONT,
              border: false,
              wrapText: false,
            })),
            ...(trailSpan > 0 ? [{ value: null, colSpan: trailSpan, border: false }] : []),
          ],
        }
      }

      const line = values.length
        ? `${label.padEnd(SCALE_LABEL_WIDTH, " ")}${values.map((v) => padCenter(v, SCALE_VALUE_WIDTH)).join("")}`
        : label
      return {
        height: 16,
        cells: [
          {
            value: line,
            colSpan: totalColumns,
            fontSize: PLVB_NOTE_FONT,
            align: "left",
            wrapText: false,
            border: false,
            indent: 0,
          },
        ],
      }
    }

    return {
      noteRow0: contentRow(
        "- Các học phần có dấu * phía trước là học phần điều kiện, không tính vào điểm trung bình chung tích lũy toàn khóa.",
        true
      ),
      noteRow1: contentRow("- Hệ thống điểm được quy định theo:"),
      noteRow2: scaleRow("Thang điểm chữ", letters),
      noteRow3: scaleRow("Thang điểm 4", base4Values),
      noteRow4: scaleRow("Thang điểm 10", base10Values),
    }
  }

  const buildGraduationRankingNote = (academicRankingConvert: any[] = []) => {
    const graduationRankingData = academicRankingConvert.filter(
      (item) => item?.context === "GRADUATION" && item?.graduated
    )

    const graduationBaseScore =
      graduationRankingData.find((item) => item?.base4Min != null)?.baseScore ??
      graduationRankingData[0]?.baseScore

    const formatRangeBound = (num: number | null | undefined) => {
      if (num == null) return "-"
      return Number(num).toFixed(2).replace(".", ",")
    }

    const sortedRankings = graduationRankingData.sort((a, b) =>
      graduationBaseScore === "Base4" ? b.base4Min - a.base4Min : b.base10Min - a.base10Min
    )

    const rankingText = sortedRankings
      .map((item) => {
        const range =
          graduationBaseScore === "Base4"
            ? `${formatRangeBound(item.base4Min)}-${formatRangeBound(item.base4Max)}`
            : `${formatRangeBound(item.base10Min)}-${formatRangeBound(item.base10Max)}`

        return `${item.classification}: ${range}`
      })
      .join("; ")

    const scaleLabel = graduationBaseScore === "Base4" ? "4" : "10"
    const downgradeNote =
      " (Hạng tốt nghiệp có thể bị hạ mức theo quy chế đào tạo đại học của HVKTQS được áp dụng tại thời điểm xét tốt nghiệp)."
    if (!rankingText) {
      return `- Phân loại tốt nghiệp theo thang điểm ${scaleLabel}: -${downgradeNote}`
    }

    return `- Phân loại tốt nghiệp theo thang điểm ${scaleLabel}: ${rankingText}.${downgradeNote}`
  }

  const handleExportPLVB2Col = () => {
    if (!students?.length) {
      notification.info({ message: "Không có dữ liệu để xuất!" })
      return
    }
    const TOTAL_COLUMNS = PLVB_UNITS
    const SIGN_COL = PLVB_HALF
    const MAX_ROWS = 500

    const allSheetOptions: SheetExportOptions[] = studentsWithSemesters.map((student) => {
      const scoreConverts = student.fixedClass?.trainingCourse?.scoreConverts || []
      const academicRankingConvert =
        student.fixedClass?.trainingCourse?.academicRankingConvert || []
      const header = getDiplomaAppendixHeaderData(student)
      const headerRows = buildPhuLuc2ColHeaderRows(header)
      const TABLE_HEADER_ROWS = 2
      const tableTop = headerRows.length - TABLE_HEADER_ROWS + 1

      const regularSubjects = student.semesters
        .filter((semester) => !isGraduationSemesterGroup(semester.id))
        .flatMap((semester) => semester?.subjects ?? [])
      const graduationSubjects = student.semesters
        .filter((semester) => isGraduationSemesterGroup(semester.id))
        .flatMap((semester) => semester?.subjects ?? [])
      const regularBodyRows = buildTwoColumnSubjectRows(
        regularSubjects,
        MAX_ROWS,
        PLVB_TABLE_FONT,
        PLVB_NAME_COL_WIDTH
      )
      const tableBodyRows: TableRow[] = [...regularBodyRows]
      // Hàng "Học phần tốt nghiệp" — đường kẻ ngang đậm phía trên
      const graduationSectionExcelRow = graduationSubjects.length
        ? tableTop + TABLE_HEADER_ROWS + regularBodyRows.length
        : undefined
      if (graduationSubjects.length) {
        tableBodyRows.push(buildGraduationSectionHeaderRow(TOTAL_COLUMNS, PLVB_TABLE_FONT))
        tableBodyRows.push(
          ...buildTwoColumnSubjectRows(
            graduationSubjects,
            MAX_ROWS,
            PLVB_TABLE_FONT,
            PLVB_NAME_COL_WIDTH
          )
        )
      }

      const tongTinChi = student.semesters.reduce(
        (acc, semester) =>
          acc + (semester.subjects?.reduce((s, sub) => s + Number(sub.soTinChi ?? 0), 0) ?? 0),
        0
      )

      const tongDiemNhanTinChiHe10 = student.semesters.reduce(
        (acc, semester) =>
          acc +
          (semester.subjects?.reduce(
            (s, sub) => s + (Number(sub?.thangDiem10) || 0) * Number(sub.soTinChi ?? 0),
            0
          ) ?? 0),
        0
      )

      const tongDiemNhanTinChiHe4 = student.semesters.reduce(
        (acc, semester) =>
          acc +
          (semester.subjects?.reduce(
            (s, sub) => s + (Number(sub?.thangDiem4) || 0) * Number(sub.soTinChi ?? 0),
            0
          ) ?? 0),
        0
      )

      const computedGpa10 =
        tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe10 / tongTinChi).toFixed(2))
      const officialGpa = student.graduationDecision?.finalGpa
      const diemTBHe10 =
        officialGpa != null && Number.isFinite(Number(officialGpa))
          ? Number(Number(officialGpa).toFixed(2))
          : computedGpa10

      const diemTBHe4 =
        tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe4 / tongTinChi).toFixed(2))

      const xepLoai =
        student.graduationDecision?.finalRanking?.classification ??
        getGraduationClassification(diemTBHe10, diemTBHe4, academicRankingConvert || [])

      const gapRow: TableRow = {
        height: 10,
        cells: [{ value: null, colSpan: TOTAL_COLUMNS, border: false }],
      }

      const signCell = (value: TableCell["value"], extra: Partial<TableCell> = {}): TableCell => ({
        value,
        colSpan: SIGN_COL,
        align: "center",
        fontSize: 12,
        border: false,
        wrapText: true,
        ...extra,
      })
      const emptyLeft: TableCell = { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false }
      const signatureGapRow = (height = PLVB_INFO_ROW_HEIGHT): TableRow => ({
        height,
        cells: [{ value: null, colSpan: TOTAL_COLUMNS, border: false }],
      })

      const signDate = printDate ? dayjs(printDate) : dayjs()
      const pad2 = (n: number) => String(n).padStart(2, "0")
      const gpaText = diemTBHe10.toFixed(2).replace(".", ",")
      const signDateText = `Hà Nội, ngày ${pad2(signDate.date())} tháng ${pad2(signDate.month() + 1)} năm ${signDate.year()}`
      // Cụm tổng kết bên trái (full width); cụm ký tên bên phải, đặt dưới khối tổng tín chỉ
      const PLVB_SUMMARY_FONT = 12
      const summaryCreditRow: TableRow = {
        height: PLVB_INFO_ROW_HEIGHT,
        cells: [
          {
            value: {
              richText: [
                {
                  text: "Tổng số tín chỉ: ",
                  font: { bold: false, name: "Times New Roman", size: PLVB_SUMMARY_FONT },
                },
                {
                  text: String(tongTinChi),
                  font: { bold: true, name: "Times New Roman", size: PLVB_SUMMARY_FONT },
                },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: PLVB_SUMMARY_FONT,
            align: "left",
            border: false,
            wrapText: false,
            indent: 0,
          },
        ],
      }
      const summaryGpaRow: TableRow = {
        height: PLVB_INFO_ROW_HEIGHT,
        cells: [
          {
            value: {
              richText: [
                {
                  text: "Điểm trung bình chung tích lũy toàn khóa (Thang điểm 10): ",
                  font: { bold: false, name: "Times New Roman", size: PLVB_SUMMARY_FONT },
                },
                {
                  text: gpaText,
                  font: { bold: true, name: "Times New Roman", size: PLVB_SUMMARY_FONT },
                },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: PLVB_SUMMARY_FONT,
            align: "left",
            border: false,
            wrapText: false,
            indent: 0,
          },
        ],
      }
      const summaryRankRow: TableRow = {
        height: PLVB_INFO_ROW_HEIGHT,
        cells: [
          {
            value: {
              richText: [
                {
                  text: "Xếp hạng tốt nghiệp: ",
                  font: { bold: false, name: "Times New Roman", size: PLVB_SUMMARY_FONT },
                },
                {
                  text: xepLoai,
                  font: { bold: true, name: "Times New Roman", size: PLVB_SUMMARY_FONT },
                },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: PLVB_SUMMARY_FONT,
            align: "left",
            border: false,
            wrapText: false,
            indent: 0,
          },
        ],
      }
      const signDateRow: TableRow = {
        height: PLVB_INFO_ROW_HEIGHT,
        cells: [emptyLeft, signCell(signDateText, { italic: true, fontSize: 12 })],
      }
      const signTitleRow1: TableRow = {
        height: PLVB_INFO_ROW_HEIGHT,
        cells: [emptyLeft, signCell("TL. GIÁM ĐỐC", { bold: true, fontSize: 13 })],
      }
      const signTitleRow2: TableRow = {
        height: PLVB_INFO_ROW_HEIGHT,
        cells: [emptyLeft, signCell("TRƯỞNG PHÒNG ĐÀO TẠO", { bold: true, fontSize: 13 })],
      }
      const nameSignatureRow: TableRow = {
        height: PLVB_INFO_ROW_HEIGHT,
        cells: [emptyLeft, signCell(signerName?.trim() || "", { bold: true, fontSize: 14 })],
      }

      const { noteRow0, noteRow1, noteRow2, noteRow3, noteRow4 } = buildScoreSystemNoteRows(
        scoreConverts || [],
        TOTAL_COLUMNS,
        true
      )

      const rankingNote = buildGraduationRankingNote(academicRankingConvert)
      // Cùng cột gạch đầu dòng với các dòng ghi chú phía trên
      const noteRow5: TableRow = {
        height: estimateWrappedRowHeight([rankingNote], 90, PLVB_NOTE_FONT),
        cells: [
          { value: null, colSpan: 2, border: false },
          {
            value: rankingNote,
            colSpan: TOTAL_COLUMNS - 2,
            fontSize: PLVB_NOTE_FONT,
            wrapText: true,
            align: "left",
            border: false,
          },
        ],
      }

      return {
        sheet: `${student.userProfile.code} - ${student.userProfile.fullname}`,
        resetSheet: true,
        tableStartCell: { row: 1, col: 1 },
        columnWidths: PLVB_COL_WIDTHS,
        tableBorderRange: {
          top: tableTop,
          left: 1,
          bottom: tableTop + TABLE_HEADER_ROWS + tableBodyRows.length - 1,
          right: TOTAL_COLUMNS,
          headerRows: TABLE_HEADER_ROWS,
          accentTopRows:
            graduationSectionExcelRow != null ? [graduationSectionExcelRow] : undefined,
          midCol: PLVB_HALF,
        },
        rows: [
          ...headerRows,
          ...tableBodyRows,
          gapRow,
          summaryCreditRow,
          summaryGpaRow,
          summaryRankRow,
          // Cụm ký tên bên phải, nằm dưới khối tổng tín chỉ
          signDateRow,
          signTitleRow1,
          signTitleRow2,
          ...Array.from({ length: PLVB_SIGN_GAP_COUNT }, () =>
            signatureGapRow(PLVB_SIGN_GAP_HEIGHT)
          ),
          nameSignatureRow,
          gapRow,
          noteRow0,
          noteRow1,
          noteRow2,
          noteRow3,
          noteRow4,
          noteRow5,
        ],
      }
    })

    exportFromTemplate({
      templateUrl: getMinioUrl("/mta/template/phu-luc-van-bang-2-cot.xlsx"),
      sheets: allSheetOptions,
      fileName: "PLVB2C.xlsx",
      fontFamily: "Times New Roman",
      fontSize: PLVB_TABLE_FONT,
      mergeSheetsToOne: true,
      pageBreakBetweenSheets: true,
      sheetName: "PLVB",
      pageSetup: {
        paperSize: 9, // A4
        orientation: "portrait",
        // 1 sinh viên = 1 trang, scale ~100% (cột đã khít khổ A4).
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        horizontalCentered: true,
        verticalCentered: false,
        horizontalDpi: 600,
        verticalDpi: 600,
        margins: {
          left: 0.6,
          right: 0.3,
          top: 0.25,
          bottom: 0.25,
          header: 0.1,
          footer: 0.1,
        },
      },
    })
  }

  const handleExportPLVB1Col = () => {
    if (!students?.length) {
      notification.info({ message: "Không có dữ liệu để xuất!" })
      return
    }
    const TOTAL_COLUMNS = 10
    const SIGN_COL = 6
    const MAX_ROWS = 500

    const allSheetOptions: SheetExportOptions[] = studentsWithSemesters.map((student) => {
      const scoreConverts = student.fixedClass?.trainingCourse?.scoreConverts || []
      const academicRankingConvert =
        student.fixedClass?.trainingCourse?.academicRankingConvert || []
      let stt = 0
      const tableRows: TableRow[] = []
      const pushSubjectRows = (subjects: AppendixSubject[], restartStt = false) => {
        if (restartStt) stt = 0
        for (const s1 of subjects) {
          stt += 1
          tableRows.push({
            height: estimateWrappedRowHeight([s1?.tenHocPhan], 40, 12),
            cells: [
              {
                value: stt,
                align: "center",
                fontSize: 12,
                wrapText: true,
                borderStyle: PLVB_TABLE_BORDER,
              },
              {
                value: s1?.tenHocPhan ?? "",
                wrapText: true,
                fontSize: 12,
                borderStyle: PLVB_TABLE_BORDER,
              },
              {
                value: s1?.soTinChi ?? "",
                colSpan: 2,
                align: "center",
                fontSize: 12,
                borderStyle: PLVB_TABLE_BORDER,
              },
              {
                value: toAppendixScore(s1?.thangDiem10),
                colSpan: 2,
                align: "center",
                numFmt: "0.0",
                fontSize: 12,
                borderStyle: PLVB_TABLE_BORDER,
              },
              {
                value: toAppendixScore(s1?.thangDiem4),
                colSpan: 2,
                align: "center",
                numFmt: "0.0",
                fontSize: 12,
                borderStyle: PLVB_TABLE_BORDER,
              },
              {
                value: s1?.thangDiemChu ?? "",
                colSpan: 2,
                align: "center",
                fontSize: 12,
                borderStyle: PLVB_TABLE_BORDER,
              },
            ],
          })
        }
      }

      const regularSubjects = student.semesters
        .filter((semester) => !isGraduationSemesterGroup(semester.id))
        .flatMap((semester) => semester?.subjects ?? [])
      const graduationSubjects = student.semesters
        .filter((semester) => isGraduationSemesterGroup(semester.id))
        .flatMap((semester) => semester?.subjects ?? [])
      pushSubjectRows(regularSubjects)
      if (graduationSubjects.length) {
        tableRows.push(buildGraduationSectionHeaderRow(TOTAL_COLUMNS, 12))
        pushSubjectRows(graduationSubjects, true)
      }
      tableRows.splice(MAX_ROWS)

      const tongTinChi = student.semesters.reduce(
        (acc, semester) =>
          acc + (semester.subjects?.reduce((s, sub) => s + Number(sub.soTinChi ?? 0), 0) ?? 0),
        0
      )

      const tongDiemNhanTinChiHe10 = student.semesters.reduce(
        (acc, semester) =>
          acc +
          (semester.subjects?.reduce(
            (s, sub) => s + (Number(sub?.thangDiem10) || 0) * Number(sub.soTinChi ?? 0),
            0
          ) ?? 0),
        0
      )

      const tongDiemNhanTinChiHe4 = student.semesters.reduce(
        (acc, semester) =>
          acc +
          (semester.subjects?.reduce(
            (s, sub) => s + (Number(sub?.thangDiem4) || 0) * Number(sub.soTinChi ?? 0),
            0
          ) ?? 0),
        0
      )

      const diemTBHe10 =
        tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe10 / tongTinChi).toFixed(2))

      const diemTBHe4 =
        tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe4 / tongTinChi).toFixed(2))

      const xepLoai =
        student.graduationDecision?.finalRanking?.classification ??
        getGraduationClassification(diemTBHe10, diemTBHe4, academicRankingConvert || [])

      const gapRow: TableRow = {
        cells: [{ value: null, colSpan: TOTAL_COLUMNS, border: false }],
      }

      const tongTinChiRow: TableRow = {
        cells: [
          {
            value: {
              richText: [
                { text: "Tổng số tín chỉ: " },
                { text: String(tongTinChi), font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const diemHe10Row: TableRow = {
        cells: [
          {
            // value: `Điểm TB hệ 10: ${diemTBHe10}`,
            value: {
              richText: [
                {
                  text: "Điểm trung bình chung tích lũy toàn khoá (Thang điểm 10): ",
                },
                { text: diemTBHe10.toFixed(2), font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const xepLoaiRow: TableRow = {
        cells: [
          {
            value: {
              richText: [
                { text: "Xếp loại: " },
                { text: xepLoai, font: { bold: true } },
              ],
            },
            colSpan: TOTAL_COLUMNS,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const signDate = printDate ? dayjs(printDate) : dayjs()

      const dateSignatureRow: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: `Hà Nội, ngày ${signDate.date()} tháng ${String(signDate.month() + 1).padStart(2, "0")} năm ${signDate.year()}`,
            colSpan: SIGN_COL,
            align: "center",
            italic: true,
            fontSize: 12,
            border: false,
          },
        ],
      }

      const titleSignatureRow1: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: "TL. GIÁM ĐỐC",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 13,
            border: false,
          },
        ],
      }

      const titleSignatureRow2: TableRow = {
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: "TRƯỞNG PHÒNG ĐÀO TẠO",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 13,
            border: false,
          },
        ],
      }

      const nameSignatureRow: TableRow = {
        height: 18,
        cells: [
          { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL, border: false },
          {
            value: signerName?.trim() || "",
            colSpan: SIGN_COL,
            align: "center",
            bold: true,
            fontSize: 14,
            border: false,
          },
        ],
      }

      const { noteRow0, noteRow1, noteRow2, noteRow3, noteRow4 } = buildScoreSystemNoteRows(
        scoreConverts || [],
        TOTAL_COLUMNS
      )

      const rankingNote1Col = buildGraduationRankingNote(academicRankingConvert)
      const noteRow5: TableRow = {
        cells: [
          { value: null, colSpan: 2, border: false, indent: 1 },
          {
            value: rankingNote1Col,
            colSpan: TOTAL_COLUMNS - 2,
            fontSize: PLVB_NOTE_FONT,
            rowSpan: 2,
            border: false,
          },
        ],
      }

      return {
        sheet: `${student.userProfile.code} - ${student.userProfile.fullname}`,
        data: getDiplomaAppendixHeaderData(student),
        boldDataKeys: ["ho_ten", "chuyen_nganh", "nganh_hoc"],
        tableStartCell: { row: 14, col: 1 },
        headerStylePreset: "phu-luc-van-bang" as const,
        tableBorderRange: {
          top: 12,
          left: 1,
          bottom: 13 + tableRows.length,
          right: TOTAL_COLUMNS,
        },
        rows: [
          ...tableRows,
          gapRow,
          tongTinChiRow,
          diemHe10Row,
          xepLoaiRow,
          gapRow,
          dateSignatureRow,
          { ...titleSignatureRow1, height: 18 },
          { ...titleSignatureRow2, height: 18 },
          ...Array.from({ length: 5 }, () => ({
            height: 18,
            cells: [{ value: null, colSpan: TOTAL_COLUMNS, border: false }],
          })),
          nameSignatureRow,
          gapRow,
          noteRow0,
          noteRow1,
          noteRow2,
          noteRow3,
          noteRow4,
          noteRow5,
        ],
      }
    })

    exportFromTemplate({
      templateUrl: getMinioUrl("/mta/template/phu-luc-van-bang-1-cot.xlsx"),
      sheets: allSheetOptions,
      fileName: "PLVB1C.xlsx",
      fontFamily: "Times New Roman",
      fontSize: 10,
      mergeSheetsToOne: true,
      sheetName: "PLVB",
    })
  }

  const handleCommonExport = async (
    config: TExportConfig,
    signerOverride?: {
      signerName?: string
      isChief?: boolean
      printDate?: string
      includeNamePrefix?: boolean
    }
  ) => {
    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn loại đối tượng đào tạo")
      return
    }

    const payload: TExportPayload = {
      trainingObjectTypeId,
      trainingCourseIds,
      thesisSessionIds,
      printDate: signerOverride?.printDate ?? printDate,
      signerName: signerOverride?.signerName ?? signerName ?? "",
      isChief: signerOverride?.isChief,
      includeNamePrefix: signerOverride?.includeNamePrefix,
    }

    try {
      showSpinner()
      const res = await config.api(payload)

      if (res.status === 200) {
        saveAs(res.data as Blob, config.fileName)
      } else {
        const errorMsg =
          (res.data as { message?: string })?.message || "Đã xảy ra lỗi khi xuất file"
        message.error(errorMsg)
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      message.error(err.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const formatSpecialDate = (date: dayjs.Dayjs | string | Date | null | undefined) => {
    if (!date) return ""
    const d = dayjs(date)
    const day = d.date()
    const month = d.month() + 1
    const year = d.year()

    return `${day}/${month}/${year}`
  }

  const handleExportQuyetDinhCongNhan = async () => {
    if (!studentsWithSemesters?.length) {
      notification.info({ message: "Không có dữ liệu để xuất!" })
      return
    }

    const selectedSessionId = thesisSessionIds?.[0]
    const session = thesisSessionData.find((s) => s.id === selectedSessionId) as
      | SessionSignerInfo
      | undefined
    if (!session) {
      message.warning("Vui lòng chọn đợt xét trước khi xuất file.")
      return
    }

    const chiefName = session.chief?.trim() || session.graduationDecisionSigner?.trim() || ""
    setPendingSignKind("quyetDinhCongNhan")
    setSignRole(chiefName ? "chief" : "deputy")
    const sidebarDate = form.getFieldValue("date")
    setSigningDate(sidebarDate ? dayjs(sidebarDate) : dayjs())
    setSignModalOpen(true)
  }

  const handleExportPhuLucVanBang = async (
    kind: "phuLucVanBangCaoHoc" | "phuLucVanBangNganHan"
  ) => {
    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn loại đối tượng đào tạo")
      return
    }
    const session = selectedPostgraduateSession
    const chiefName = session?.chief?.trim() || ""
    setPendingSignKind(kind)
    setSignRole(chiefName ? "chief" : "deputy")
    const sidebarDate = form.getFieldValue("date")
    setSigningDate(sidebarDate ? dayjs(sidebarDate) : dayjs())
    setSignModalOpen(true)
  }

  const handleConfirmSignExport = async () => {
    if (pendingSignKind === "phuLucVanBangCaoHoc" || pendingSignKind === "phuLucVanBangNganHan") {
      const session = selectedPostgraduateSession
      const chiefName = session?.chief?.trim() || ""
      const deputyName = session?.deputy?.trim() || ""
      const signerNameTS = signRole === "chief" ? chiefName : deputyName
      if (!signerNameTS.trim()) {
        message.warning(
          `Chưa có họ tên ${signRole === "chief" ? "Trưởng phòng" : "Phó trưởng phòng"} sau đại học trong đợt xét.`
        )
        return
      }

      const config =
        pendingSignKind === "phuLucVanBangCaoHoc"
          ? exportHandlers.phuLucVanBangCaoHoc
          : exportHandlers.phuLucVanBangNganHan
      setSignModalOpen(false)
      setPendingSignKind(null)
      form.setFieldValue("date", signingDate)
      await handleCommonExport(config, {
        signerName: signerNameTS,
        isChief: signRole === "chief",
        printDate: signingDate?.toISOString?.() ?? String(signingDate),
      })
      return
    }

    const selectedSessionId = thesisSessionIds?.[0]
    const session = thesisSessionData.find((s) => s.id === selectedSessionId) as
      | SessionSignerInfo
      | undefined
    if (!session) return

    const chiefName = session.chief?.trim() || session.graduationDecisionSigner?.trim() || ""
    const deputyName = session.deputy?.trim() || ""
    const signerNameTS = signRole === "chief" ? chiefName : deputyName
    if (!signerNameTS.trim()) {
      message.warning(
        `Chưa có họ tên ${signRole === "chief" ? "Trưởng phòng" : "Phó trưởng phòng"} sau đại học trong đợt xét.`
      )
      return
    }

    setSignModalOpen(false)
    setPendingSignKind(null)
    form.setFieldValue("date", signingDate)
    await doExportQuyetDinhCongNhan(signerNameTS, signingDate)
  }

  const doExportQuyetDinhCongNhan = async (signerNameTS: string, dateTS: Dayjs) => {
    const selectedSessionId = thesisSessionIds?.[0]
    const session = thesisSessionData.find((s) => s.id === selectedSessionId) as
      | SessionSignerInfo
      | undefined

    let effectiveSignerName = signerName
    if (!effectiveSignerName) {
      effectiveSignerName =
        session?.graduationDecisionMaker || session?.graduationDecisionSigner || ""
    }

    const parts = (effectiveSignerName || "").split(",").map((s) => s.trim())
    let titlePart = ""
    let rankPart = ""
    let namePart = ""

    if (parts.length >= 3) {
      titlePart = parts[0]
      rankPart = parts[1]
      namePart = parts[2]
    } else if (parts.length === 2) {
      titlePart = parts[0]
      namePart = parts[1]
    } else {
      const match = (effectiveSignerName || "").match(/^(PGD|GD|GĐ|Phó Giám đốc|Giám đốc)\s+(.*)$/i)
      if (match) {
        titlePart = match[1]
        namePart = match[2]
      } else {
        titlePart = effectiveSignerName?.includes(" ") ? "" : effectiveSignerName || ""
        namePart = effectiveSignerName?.includes(" ") ? effectiveSignerName || "" : ""
      }
    }

    const rawTitle = titlePart.toUpperCase()
    let signerTitle = "GIÁM ĐỐC"
    let signerSubTitle = ""

    if (rawTitle === "PGD" || rawTitle === "PHÓ GIÁM ĐỐC") {
      signerTitle = "KT. GIÁM ĐỐC"
      signerSubTitle = "PHÓ GIÁM ĐỐC"
    } else if (rawTitle === "GD" || rawTitle === "GĐ" || rawTitle === "GIÁM ĐỐC") {
      signerTitle = "GIÁM ĐỐC"
      signerSubTitle = ""
    } else if (rawTitle) {
      signerTitle = rawTitle
    }

    const signerRankName = [rankPart, namePart].filter(Boolean).join(" ")

    const dateQD = session?.graduationDecisionDate ? dayjs(session.graduationDecisionDate) : dayjs()
    const ngayQD = String(dateQD.date())
    const thangQD = String(dateQD.month() + 1)
    const namQD = String(dateQD.year())

    const ngayTS = String(dateTS.date())
    const thangTS = String(dateTS.month() + 1)
    const namTS = String(dateTS.year())

    let soToTrinh = session?.graduationReport || session?.proposalGraduation || ""
    let ngayToTrinh = ""
    if (soToTrinh.toLowerCase().includes(" ngày ")) {
      const reportParts = soToTrinh.split(/ ngày /i)
      soToTrinh = reportParts[0].trim()
      ngayToTrinh = reportParts[1].trim()
    }

    const firstStudentCourse = studentsWithSemesters?.[0]?.fixedClass?.trainingCourse
    const namHocStr =
      firstStudentCourse?.academicYear ||
      (firstStudentCourse?.startYear && firstStudentCourse?.endYear
        ? `${firstStudentCourse.startYear} - ${firstStudentCourse.endYear}`
        : `${dayjs().year()} - ${dayjs().year() + 1}`)

    const items = studentsWithSemesters.map((student) => {
      const course = student.fixedClass?.trainingCourse
      let nienKhoaStr = ""
      if (course?.academicYear) {
        nienKhoaStr = `(${course.academicYear})`
      } else if (course?.startYear) {
        nienKhoaStr = `(${course.startYear}${course.endYear ? ` - ${course.endYear}` : ""})`
      }

      return {
        hoTen: student.userProfile.fullname,
        ngaySinh: formatSpecialDate(student.userProfile.dateOfBirth ?? ""),
        chuyenNganh: student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ?? "",
        tenKhoa: course ? `${course.name} ${nienKhoaStr}`.trim() : "",
        soVanBang:
          student.graduationDecision?.originalDiplomaNumber ??
          student.graduationDecision?.diplomaNumber ??
          "",
      }
    })

    try {
      showSpinner()
      const res = await docxTemplate({
        fileName: "QuyetDinhCongNhanTotNghiep.docx",
        path: "QuyetDinhCongNhanTotNghiep.docx",
        prefix: "/mta/template",
        data: {
          soQD: session?.graduationNumber || session?.graduationDecisionNumber || "",
          ngayQD,
          thangQD,
          namQD,
          dot: session?.name || "",
          namHoc: namHocStr,
          ngayHop: session?.graduationDecisionDate
            ? formatSpecialDate(session.graduationDecisionDate.toString())
            : "",
          soToTrinh,
          ngayToTrinh,
          signerTitle,
          signerSubTitle,
          signerRankName,
          signerNameTS,
          ngayTS,
          thangTS,
          namTS,
          items,
        },
      })
      if (res && res.status >= 200 && res.status < 300) {
        saveAs(res.data, "QuyetDinhCongNhanTotNghiep.docx")
      } else {
        const errorDetail = res ? `Status: ${res.status}` : "No response"
        message.error(`Xuất file thất bại: ${errorDetail}`)
      }
    } catch (error: unknown) {
      console.error("Lỗi xuất file:", error)
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      message.error(`Lỗi: ${msg}`)
    } finally {
      hideSpinner()
    }
  }

  const subjects: {
    daiHoc: { id: number; name: string; onClick?: () => void }[]
    nganHan: { id: number; name: string; onClick?: () => Promise<void> }[]
    caoHoc: { id: number; name: string; onClick?: () => Promise<void> }[]
  } = {
    daiHoc: [
      { id: 1, name: "Phụ lục VB (1 cột)", onClick: handleExportPLVB1Col },
      { id: 2, name: "Phụ lục VB (2 cột)", onClick: handleExportPLVB2Col },
      // { id: 3, name: "Phụ lục VB (2 cột - 1 trang)" },
      // { id: 4, name: "Bảng điểm Ngân hạn (P2)" },
    ],
    nganHan: [
      // { id: 5, name: "Bảng điểm ngắn hạn SDH" },
      {
        id: 6,
        name: "In phôi bằng ngắn hạn SĐH",
        onClick: () => handleCommonExport(exportHandlers.phoiBangNganHan),
      },
      {
        id: 7,
        name: "Phụ lục văn bằng ngắn hạn",
        onClick: () => handleExportPhuLucVanBang("phuLucVanBangNganHan"),
      },
      // { id: 7, name: "In phôi bảng ngắn/DÀI hạn SDH (Mỹ)" },
      // { id: 8, name: "In quyết định tốt nghiệp ngắn hạn (ĐẠI HÀN) SDH" },
      // { id: 9, name: "Bảng điểm ĐẠI HÀN SDH (2 cột)" },
      // { id: 10, name: "Bảng điểm ĐẠI HÀN SDH (1 cột)" },
      // { id: 12, name: "Danh sách đề nghị TN - ĐẠI HÀN" },
    ],
    caoHoc: [
      // { id: 14, name: "PL Đề nghị công nhận tốt nghiệp" },
      // { id: 15, name: "Xác nhận thông tin HV làm văn bằng" },
      // { id: 16, name: "PL Quyết định tốt nghiệp CAO HỌC" },
      {
        id: 17,
        name: "Quyết định công nhận tốt nghiệp",
        onClick: handleExportQuyetDinhCongNhan,
      },
      // { id: 18, name: "In PL văn bằng CAO HỌC (2 cột)" },
      // { id: 19, name: "In PL văn bằng CAO HỌC (1 cột)" },
      {
        id: 20,
        name: "In phôi bằng CAO HỌC",
      },
      {
        id: 21,
        name: "Sổ gốc cấp phát văn bằng",
        onClick: () => handleCommonExport(exportHandlers.soGoc),
      },
      {
        id: 22,
        name: "Phụ lục văn bằng cao học",
        onClick: () => handleExportPhuLucVanBang("phuLucVanBangCaoHoc"),
      },
      // { id: 22, name: "Thống kê KQ đào tạo" },
      // { id: 23, name: "Thống kê kết quả bảo vệ luận văn" },
      // { id: 24, name: "In Danh sách trình chiếu CAO HỌC" },
      // { id: 25, name: "Trình chiếu tốt nghiệp (WORD)" },
      // { id: 26, name: "Trình chiếu tốt nghiệp (PDF)" },
    ],
  }
  useEffect(() => {
    if (!form) return

    form.resetFields()
    form.setFieldValue("trainingObjectTypeId", trainingObjectTypeId)
  }, [form, trainingObjectTypeId])

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-68 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-base font-bold color text-primary mb-4 p-2 rounded">
            Bảng điểm học viên
          </h2>

          <Form
            form={form}
            onValuesChange={(changed) => {
              if ("trainingCourseIds" in changed) {
                form.setFieldValue("thesisSessionIds", [])
              }
            }}
            className="space-y-4"
            initialValues={{ trainingObjectTypeId: trainingObjectTypeId }}
          >
            <div className="flex items-center">
              <FormItem
                form={form}
                name="trainingObjectTypeId"
                labelAlign="left"
                label="ĐTĐT"
                {...formItemLayout}
              >
                <Select
                  className="flex-1 w-64"
                  placeholder="Chọn ĐTĐT"
                  options={trainingObjectTypes?.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                  disabled
                />
              </FormItem>
            </div>
            <div className="flex items-center">
              <FormItem
                form={form}
                name="trainingCourseIds"
                labelAlign="left"
                label="Khoá"
                {...formItemLayout}
              >
                <Select
                  mode="multiple"
                  className="flex-1 w-64"
                  placeholder="Chọn Khoá"
                  maxTagCount={2}
                  maxTagPlaceholder={(omittedValues) => `+${omittedValues?.length}`}
                  options={trainingCourseData?.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                  disabled={!trainingObjectTypeId || !trainingObjectTypes.length}
                />
              </FormItem>
            </div>

            <div className="flex items-center">
              <FormItem
                form={form}
                name="thesisSessionIds"
                label="Đợt xét "
                labelAlign="left"
                {...formItemLayout}
              >
                <Select
                  mode="multiple"
                  className="flex-1 w-64"
                  placeholder="Chọn đợt xét tốt nghiệp"
                  maxTagCount={2}
                  maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                  options={thesisSessionData?.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                  disabled={!trainingCourseIds?.length || !trainingObjectTypeId}
                />
              </FormItem>
            </div>

            <Button
              type="primary"
              onClick={() => {
                setSelectedStudent(null)
                setViewResult(true)
                setPage(initialPagination.page)
              }}
              className="w-full h-8 text-xs text-white"
            >
              Xem kết quả
            </Button>

            <div className="flex items-center w-full">
              <FormItem
                form={form}
                name="date"
                label="Ngày in"
                labelAlign="left"
                className="w-full"
                {...formItemLayout}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder={`${dayjs().format("DD/MM/YYYY")}`}
                  className="h-8 text-xs flex-1 w-full"
                />
              </FormItem>
            </div>

            <div className="flex items-center w-full gap-2">
              <FormItem
                form={form}
                name="signer"
                className="w-full"
                label="Người ký"
                labelAlign="left"
                {...formItemLayout}
              >
                <Input
                  type="text"
                  className="h-8 text-xs flex-1 w-full"
                  placeholder="Giám đốc, Trung tướng, GS.TS Lê Minh Thái"
                />
              </FormItem>
            </div>
          </Form>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-sm font-bold color text-primary mb-3">I. Đại học</h3>
          <div className="grid grid-cols-4 gap-3">
            {subjects.daiHoc.map((subject, index) => {
              return (
                <ExportDiplomaAppendix
                  onClick={subject?.onClick}
                  key={subject?.id}
                  title={`${index + 1}. ${subject.name}`}
                  type="primary"
                  className="h-auto px-3 text-xs justify-start text-white"
                />
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold color text-primary mb-3">
            II. Ngắn hạn - Dài hạn sau đại học
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {subjects.nganHan.map((subject, index) => (
              <Button
                key={index}
                onClick={subject?.onClick}
                type="primary"
                className="h-auto py-2 px-3 text-xs justify-start text-white"
              >
                {index + 1}. {subject.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold color text-primary mb-3">III. Cao học</h3>
          <div className="grid grid-cols-4 gap-3">
            {subjects.caoHoc.map((subject, index) =>
              subject.id === 20 ? (
                <Dropdown
                  key={subject.id}
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "civilian",
                        label: "DÂN SỰ",
                        onClick: () =>
                          handleCommonExport(exportHandlers.phoiBangCaoHoc, {
                            includeNamePrefix: true,
                          }),
                      },
                      {
                        key: "military",
                        label: "QUÂN SỰ",
                        onClick: () =>
                          handleCommonExport(exportHandlers.phoiBangCaoHoc, {
                            includeNamePrefix: false,
                          }),
                      },
                    ],
                  }}
                >
                  <Button
                    type="primary"
                    className="h-auto w-full py-2 px-3 text-xs justify-start text-white"
                  >
                    {index + 1}. {subject.name} <DownOutlined />
                  </Button>
                </Dropdown>
              ) : (
                <Button
                  key={subject.id}
                  onClick={subject?.onClick}
                  type="primary"
                  className="h-auto py-2 px-3 text-xs justify-start text-white"
                >
                  {index + 1}. {subject.name}
                </Button>
              )
            )}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Danh sách sinh viên</h3>
          <Table
            loading={isLoadingStudents || isFetchingStudents}
            columns={[
              {
                title: "STT",
                dataIndex: "stt",
                key: "stt",
                width: 60,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "maSinhVien",
                key: "maSinhVien",
                width: 60,
              },
              {
                title: "Họ tên",
                dataIndex: "hoTen",
                key: "hoTen",
                width: 120,
              },
              {
                title: "Lớp",
                dataIndex: "lop",
                key: "lop",
                width: 150,
              },
              {
                title: "Khoá",
                dataIndex: "khoa",
                key: "khoa",
                width: 100,
              },
            ]}
            data={studentTableData}
            pagination={{
              pageSize,
              total: count,
              onChange(newPage, newPageSize) {
                if (newPageSize !== pageSize) {
                  setPage(initialPagination.page)
                  setPageSize(pageSize)
                  return
                }
                setPage(newPage)
                setPageSize(pageSize)
              },
            }}
            onRow={(record) => ({
              onClick: () => {
                const student = studentsWithSemesters?.find((s) => s.id === record.key)
                setSelectedStudent(student || null)
              },
              className:
                selectedStudent?.id === record.key
                  ? "bg-blue-100 cursor-pointer"
                  : "cursor-pointer",
            })}
            bordered
          />
        </div>

        {selectedStudent && (
          <div>
            <h3 className="text-md font-semibold mb-2">
              Bảng điểm: {selectedStudent.userProfile?.fullname} - {selectedStudent.userProfile?.code}
            </h3>
            <TableCollapse
              data={selectedStudentGradeData}
              columns={[
                {
                  title: "Tên học phần",
                  dataIndex: "tenHocPhan",
                  key: "tenHocPhan",
                },
                {
                  title: "Số tín chỉ",
                  dataIndex: "soTinChi",
                  key: "soTinChi",
                  width: 100,
                },
                {
                  title: "Thang điểm 10",
                  dataIndex: "thangDiem10",
                  key: "thangDiem10",
                  width: 120,
                  render: (value: string) => value || "-",
                },
                {
                  title: "Thang điểm 4",
                  dataIndex: "thangDiem4",
                  key: "thangDiem4",
                  width: 120,
                },
                {
                  title: "Thang điểm chữ",
                  dataIndex: "thangDiemChu",
                  key: "thangDiemChu",
                  width: 120,
                },
              ]}
              headerTitleKey="tenHocPhan"
              childrenFieldName="subjects"
              bordered
              pagination={{
                pageSize: initialPagination.pageSize,
              }}
              rowKey="id"
            />
          </div>
        )}
      </div>

      <Modal
        title="Tham số xuất file"
        open={signModalOpen}
        onCancel={() => {
          setSignModalOpen(false)
          setPendingSignKind(null)
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setSignModalOpen(false)
              setPendingSignKind(null)
            }}
          >
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={() => void handleConfirmSignExport()}>
            Xác nhận
          </Button>,
        ]}
        destroyOnClose
        maskClosable={false}
      >
        <p className="mb-3 text-gray-600">
          Đợt xét hiện tại:{" "}
          {pendingSignKind === "phuLucVanBangCaoHoc" || pendingSignKind === "phuLucVanBangNganHan"
            ? (selectedPostgraduateSession?.name ?? "—")
            : (selectedThesisSession?.name ?? "—")}
          .
        </p>
        <Radio.Group
          value={signRole}
          onChange={(e) => setSignRole(e.target.value)}
          className="flex flex-col gap-3"
        >
          <Radio value="chief">
            Trưởng phòng sau đại học:{" "}
            <strong>
              {pendingSignKind === "phuLucVanBangCaoHoc" ||
              pendingSignKind === "phuLucVanBangNganHan"
                ? selectedPostgraduateSession?.chief?.trim() || "(chưa nhập)"
                : (selectedThesisSession as SessionSignerInfo | undefined)?.chief?.trim() ||
                  selectedThesisSession?.graduationDecisionSigner?.trim() ||
                  "(chưa nhập)"}
            </strong>
          </Radio>
          <Radio value="deputy">
            Phó trưởng phòng sau đại học:{" "}
            <strong>
              {pendingSignKind === "phuLucVanBangCaoHoc" ||
              pendingSignKind === "phuLucVanBangNganHan"
                ? selectedPostgraduateSession?.deputy?.trim() || "(chưa nhập)"
                : (selectedThesisSession as SessionSignerInfo | undefined)?.deputy?.trim() ||
                  "(chưa nhập)"}
            </strong>
          </Radio>
        </Radio.Group>
        <div className="mt-4">
          <div className="mb-2 text-gray-700">Ngày in</div>
          <DatePicker
            className="w-full h-8"
            format="DD/MM/YYYY"
            value={signingDate}
            onChange={(value) => setSigningDate(value || dayjs())}
            placeholder="Chọn thời gian ký"
          />
        </div>
      </Modal>
    </div>
  )
}

StudentGradeSystem.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
