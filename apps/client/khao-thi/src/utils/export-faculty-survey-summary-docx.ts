import { toRoman } from "@lib/utils"
import { getClusterSurveyStatisticsForLecturer } from "@workspace/libs/api/exam"
import { message } from "antd"
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx"

import {
  getLecturerSurveyStats,
  isLecturerNode,
  isOrgNode,
  lecturerTitle,
  type LecturerTreeNode,
  type OrgTreeNode,
  type ReportTreeNode,
} from "@/utils/buildOrgLecturerTree"
import { saveFile } from "@/utils/saveFile"

export const TRAINING_COURSE_SELECT = {
  id: true,
  code: true,
  name: true,
  startYear: true,
} as const

const FIXED_CLASS_COURSE_SELECT = {
  id: true,
  name: true,
  startYear: true,
  trainingCourse: { select: TRAINING_COURSE_SELECT },
} as const

export const SURVEY_OBJECT_TYPE_COURSE_INCLUDE = {
  trainingCourses: { select: TRAINING_COURSE_SELECT },
  fixedClasses: { select: FIXED_CLASS_COURSE_SELECT },
  subjectClasses: {
    select: {
      id: true,
      fixedClasses: { select: FIXED_CLASS_COURSE_SELECT },
    },
  },
} as const

type TrainingCourseLike = {
  id?: string
  code?: string | null
  name?: string | null
  startYear?: number | null
}

type FixedClassLike = {
  id?: string
  name?: string | null
  startYear?: number | null
  trainingCourse?: TrainingCourseLike | null
}

type SurveyObjectTypeLike = {
  trainingCourses?: TrainingCourseLike[]
  fixedClasses?: FixedClassLike[]
  subjectClasses?: Array<{ fixedClasses?: FixedClassLike[] }>
}

export type ClusterForSectionTitle = {
  surveyObjectType?: SurveyObjectTypeLike[]
  surveys?: Array<{
    surveyObjectType?: SurveyObjectTypeLike[]
    subjectClass?: {
      fixedClasses?: FixedClassLike[]
    } | null
  }>
}

export type ExportFacultySurveySummaryInput = {
  clusterId: string
  facultyNode: OrgTreeNode
  trainingObjectTypeName?: string
  trainingSystemName?: string
  sectionTitle?: string
}

type Counts = [number, number, number, number, number]

type LecturerRow = {
  name: string
  completedForms: number
  counts: Counts
  total: number
  hasData: boolean
}

type DepartmentRow = {
  name: string
  lecturers: LecturerRow[]
  completedForms: number
  counts: Counts
  total: number
}

const FONT = "Times New Roman"
const SIZE_TITLE = 27
const SIZE_BODY = 28
const LINE = 276
const FIRST_LINE = 720

const LEVEL_LABELS = [
  "rất không đồng ý",
  "không đồng ý",
  "phân vân",
  "đồng ý",
  "rất đồng ý",
] as const

const LEVEL_HEADERS = [
  "RẤT KHÔNG\nĐỒNG Ý",
  "KHÔNG\nĐỒNG Ý",
  "PHÂN VÂN",
  "ĐỒNG Ý",
  "RẤT\nĐỒNG Ý",
] as const

const TABLE_WIDTH = 8930
const TABLE_INDENT = 250
const COL_NAME = 2400
const COL_LEVEL = 1306
const COL_WIDTHS = [COL_NAME, COL_LEVEL, COL_LEVEL, COL_LEVEL, COL_LEVEL, COL_LEVEL]

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" }
const borders = { top: border, bottom: border, left: border, right: border }

const toUpperVi = (value?: string) => (value || "").trim().toLocaleUpperCase("vi-VN")
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))
const emptyCounts = (): Counts => [0, 0, 0, 0, 0]
const sumCounts = (counts: Counts) => counts.reduce((sum, n) => sum + n, 0)

const formatPct = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",")
}

const addCounts = (a: Counts, b: Counts): Counts => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
  a[3] + b[3],
  a[4] + b[4],
]

const levelIndex = (answer?: string | null, description?: string | null) => {
  const n = Number(answer)
  if (n >= 1 && n <= 5) return n - 1

  const d = (description || "").toLocaleLowerCase("vi-VN")
  if (d.includes("rất không")) return 0
  if (d.includes("không đồng ý") || d.includes("không hài lòng")) return 1
  if (d.includes("phân vân")) return 2
  if (d.includes("rất đồng ý") || d.includes("rất hài lòng")) return 4
  if (d.includes("đồng ý") || d.includes("hài lòng")) return 3
  return 2
}

const countsFromAnswers = (
  answers: Array<{ answer?: string | null; description?: string | null; count?: number }>
): Counts => {
  const counts = emptyCounts()
  for (const item of answers) {
    const count = Number(item.count || 0)
    if (!count) continue
    counts[levelIndex(item.answer, item.description)] += count
  }
  return counts
}

const pctCell = (count: number, total: number) => (total ? formatPct((count / total) * 100) : "0")

const withBoMonPrefix = (name: string) => {
  const text = name.trim()
  if (!text) return "Bộ môn"
  return /^bộ\s*môn/i.test(text) ? text : `Bộ môn ${text}`
}

const stripBoMonPrefix = (name: string) =>
  name.trim().replace(/^bộ\s*môn\s*/i, "").trim() || name.trim()

function parseCourseNumber(value?: string | null): number | null {
  if (!value?.trim()) return null
  const text = value.trim().toLocaleLowerCase("vi-VN")
  const match =
    text.match(/(?:khóa|khoa)\s*(\d+)/i) ||
    text.match(/^k\s*(\d{2,3})$/i) ||
    text.match(/\bk\s*(\d{2,3})\b/i) ||
    text.match(/clc\s*[_-]?\s*(\d{2,3})/i) ||
    text.match(/^(\d{2,3})$/) ||
    text.match(/(?:^|[^\d])(\d{2,3})(?:[^\d]|$)/)
  const n = match?.[1] ? Number(match[1]) : NaN
  // Số khóa thường 2–3 chữ số (vd 57, 61); loại năm 4 chữ số nếu lọt regex
  if (!Number.isFinite(n) || n < 1 || n > 999) return null
  return n
}

function courseNumberFromSource(source?: {
  name?: string | null
  code?: string | null
  startYear?: number | null
} | null): number | null {
  if (!source) return null
  return (
    parseCourseNumber(source.name) ??
    parseCourseNumber(source.code) ??
    (source.startYear != null && source.startYear < 1000 ? source.startYear : null)
  )
}

function collectCourseNumbers(cluster?: ClusterForSectionTitle | null): number[] {
  if (!cluster) return []
  const numbers = new Set<number>()

  const addCourse = (course?: TrainingCourseLike | null) => {
    const n = courseNumberFromSource(course)
    if (n != null) numbers.add(n)
  }
  const addFixedClass = (fixedClass?: FixedClassLike | null) => {
    if (!fixedClass) return
    addCourse(fixedClass.trainingCourse)
    const n = courseNumberFromSource(fixedClass)
    if (n != null) numbers.add(n)
  }
  const addObjectTypes = (objectTypes?: SurveyObjectTypeLike[]) => {
    for (const objectType of objectTypes || []) {
      objectType.trainingCourses?.forEach(addCourse)
      objectType.fixedClasses?.forEach(addFixedClass)
      objectType.subjectClasses?.forEach((subjectClass) =>
        subjectClass.fixedClasses?.forEach(addFixedClass)
      )
    }
  }

  addObjectTypes(cluster.surveyObjectType)
  for (const survey of cluster.surveys || []) {
    addObjectTypes(survey.surveyObjectType)
    survey.subjectClass?.fixedClasses?.forEach(addFixedClass)
  }

  return [...numbers].sort((a, b) => a - b)
}

export function buildFacultySummarySectionTitle(
  baseName: string | undefined,
  cluster?: ClusterForSectionTitle | null
): string {
  const base = baseName?.trim() || "Kết quả khảo sát"
  const numbers = collectCourseNumbers(cluster)
  if (!numbers.length) return `A. ${base}`
  if (numbers.length === 1) return `A. ${base} Khóa ${numbers[0]}`
  return `A. ${base} Khóa ${numbers[0]} đến Khóa ${numbers[numbers.length - 1]}`
}

const collectLecturers = (node: ReportTreeNode): LecturerTreeNode[] => {
  if (isLecturerNode(node)) return [node]
  if (!isOrgNode(node)) return []
  return node.children.flatMap(collectLecturers)
}

const getDepartmentGroups = (facultyNode: OrgTreeNode) => {
  const groups = facultyNode.children.filter(isOrgNode).map((org) => ({
    name: org.org.sTen?.trim() || String(org.title || "Bộ môn"),
    lecturers: collectLecturers(org),
  }))

  const directLecturers = facultyNode.children.filter(isLecturerNode)
  if (directLecturers.length) {
    groups.unshift({
      name: facultyNode.org.sTen?.trim() || String(facultyNode.title || "Đơn vị"),
      lecturers: directLecturers,
    })
  }
  return groups.filter((group) => group.lecturers.length)
}

const fetchAnswers = async (clusterId: string, lectureId: string) => {
  try {
    const res = await getClusterSurveyStatisticsForLecturer(clusterId, { lectureId })
    if (res?.status !== 200) return []
    return (res.data?.data?.questions || []).flatMap((q) => q.answers || [])
  } catch (error) {
    console.error(`Không lấy được thống kê giảng viên ${lectureId}`, error)
    return []
  }
}

const buildLecturerRow = async (
  clusterId: string,
  node: LecturerTreeNode
): Promise<LecturerRow> => {
  const stats = getLecturerSurveyStats(node.lecturer)
  const counts = countsFromAnswers(await fetchAnswers(clusterId, node.lecturer.id))
  const total = sumCounts(counts)
  return {
    name: lecturerTitle(node.lecturer),
    completedForms: stats.completed,
    counts,
    total,
    hasData: stats.completed > 0 || total > 0,
  }
}

const buildDepartments = async (clusterId: string, facultyNode: OrgTreeNode) => {
  const departments = await Promise.all(
    getDepartmentGroups(facultyNode).map(async (group) => {
      const lecturers = await Promise.all(
        group.lecturers.map((node) => buildLecturerRow(clusterId, node))
      )
      const withData = lecturers.filter((lecturer) => lecturer.hasData)
      const counts = withData.reduce(
        (acc, lecturer) => addCounts(acc, lecturer.counts),
        emptyCounts()
      )
      return {
        name: group.name,
        lecturers,
        completedForms: withData.reduce((sum, lecturer) => sum + lecturer.completedForms, 0),
        counts,
        total: sumCounts(counts),
      } satisfies DepartmentRow
    })
  )
  return departments.filter((dept) => dept.lecturers.length)
}

const resultSentence = (counts: Counts, total: number) => {
  if (!total) return "Chưa có dữ liệu đánh giá."
  const parts = LEVEL_LABELS.map(
    (label, index) => `${formatPct((counts[index] / total) * 100)}% học viên ${label}`
  )
  return `Kết quả xử lý phiếu: ${parts.slice(0, -1).join(" và ")} và ${parts[parts.length - 1]} về giảng viên.`
}

const paragraph = (
  text: string,
  opts?: { bold?: boolean; center?: boolean; both?: boolean; firstLine?: number; size?: number }
) =>
  new Paragraph({
    alignment: opts?.center
      ? AlignmentType.CENTER
      : opts?.both
        ? AlignmentType.BOTH
        : AlignmentType.LEFT,
    indent: opts?.firstLine ? { firstLine: opts.firstLine } : undefined,
    spacing: { after: 0, line: LINE },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        font: FONT,
        size: opts?.size ?? SIZE_BODY,
      }),
    ],
  })

const cell = (
  text: string,
  opts?: {
    bold?: boolean
    center?: boolean
    both?: boolean
    width?: number
    columnSpan?: number
    rowSpan?: number
  }
) =>
  new TableCell({
    borders,
    width: { size: opts?.width ?? COL_NAME, type: WidthType.DXA },
    columnSpan: opts?.columnSpan,
    rowSpan: opts?.rowSpan,
    verticalAlign: VerticalAlign.CENTER,
    children: text.split("\n").map(
      (line) =>
        new Paragraph({
          alignment: opts?.center
            ? AlignmentType.CENTER
            : opts?.both
              ? AlignmentType.BOTH
              : AlignmentType.LEFT,
          spacing: { after: 0, line: LINE },
          children: [
            new TextRun({ text: line, bold: opts?.bold, font: FONT, size: SIZE_BODY }),
          ],
        })
    ),
  })

const buildTable = (departments: DepartmentRow[]) => {
  const rows: TableRow[] = [
    new TableRow({
      children: [
        cell("BỘ MÔN/\nGIẢNG VIÊN", { bold: true, center: true, width: COL_NAME, rowSpan: 2 }),
        cell("KẾT QUẢ ĐÁNH GIÁ (%)", {
          bold: true,
          center: true,
          width: COL_LEVEL * 5,
          columnSpan: 5,
        }),
      ],
    }),
    new TableRow({
      children: LEVEL_HEADERS.map((header) =>
        cell(header, { bold: true, center: true, width: COL_LEVEL })
      ),
    }),
  ]

  for (const dept of departments) {
    rows.push(
      new TableRow({
        children: [
          cell(stripBoMonPrefix(dept.name), { bold: true, width: TABLE_WIDTH, columnSpan: 6 }),
        ],
      })
    )
    for (const lecturer of dept.lecturers) {
      rows.push(
        new TableRow({
          children: [
            cell(lecturer.name, { both: true, width: COL_NAME }),
            ...lecturer.counts.map((count) =>
              cell(lecturer.hasData ? pctCell(count, lecturer.total) : "0", {
                center: true,
                width: COL_LEVEL,
              })
            ),
          ],
        })
      )
    }
  }

  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    indent: { size: TABLE_INDENT, type: WidthType.DXA },
    columnWidths: COL_WIDTHS,
    rows,
  })
}

const resolveSectionTitle = (input: ExportFacultySurveySummaryInput) => {
  if (input.sectionTitle?.trim()) return input.sectionTitle.trim()
  if (input.trainingObjectTypeName?.trim()) return `A. ${input.trainingObjectTypeName.trim()}`
  if (input.trainingSystemName?.trim()) {
    return `A. Các lớp ${input.trainingSystemName.trim().toLocaleLowerCase("vi-VN")}`
  }
  return "A. Kết quả khảo sát"
}

export async function exportFacultySurveySummaryDocx(input: ExportFacultySurveySummaryInput) {
  const { clusterId, facultyNode } = input

  if (!clusterId) {
    message.warning("Vui lòng chọn đợt khảo sát")
    return
  }
  if (!facultyNode || !isOrgNode(facultyNode)) {
    message.warning("Vui lòng chọn Khoa/Viện trên cây đơn vị để xuất báo cáo tổng hợp")
    return
  }

  try {
    const departments = await buildDepartments(clusterId, facultyNode)
    if (!departments.length) {
      message.warning("Không có dữ liệu khảo sát hợp lệ để xuất báo cáo tổng hợp")
      return
    }

    const facultyName = toUpperVi(facultyNode.org.sTen || String(facultyNode.title || ""))
    const objectUpper = toUpperVi(input.trainingObjectTypeName)

    const children: (Paragraph | Table)[] = [
      paragraph("KẾT QUẢ XỬ LÝ PHIẾU LẤY Ý KIẾN PHẢN HỒI TỪ HỌC VIÊN", {
        bold: true,
        center: true,
        size: SIZE_TITLE,
      }),
      paragraph(
        objectUpper
          ? `${objectUpper} VỀ HOẠT ĐỘNG GIẢNG DẠY CỦA GIẢNG VIÊN`
          : "VỀ HOẠT ĐỘNG GIẢNG DẠY CỦA GIẢNG VIÊN",
        { bold: true, center: true, size: SIZE_TITLE }
      ),
      paragraph(facultyName, { bold: true, center: true }),
      paragraph(""),
      paragraph(resolveSectionTitle(input), { bold: true, both: true, firstLine: FIRST_LINE }),
    ]

    departments.forEach((dept, index) => {
      const names = dept.lecturers.map((lecturer) => lecturer.name)
      const label = `${toRoman(index + 1)}. ${withBoMonPrefix(dept.name)}:`
      const body =
        names.length === 1
          ? ` Lấy ý kiến đối với giảng viên ${names[0]}, tổng cộng ${pad2(dept.completedForms)} phiếu.`
          : ` Lấy ý kiến đối với ${pad2(dept.lecturers.length)} giảng viên (${names.join(", ")}), tổng cộng ${dept.completedForms} phiếu.`

      children.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          indent: { firstLine: FIRST_LINE },
          spacing: { after: 0, line: LINE },
          children: [
            new TextRun({ text: label, bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: body, font: FONT, size: SIZE_BODY }),
          ],
        }),
        paragraph(resultSentence(dept.counts, dept.total), {
          both: true,
          firstLine: FIRST_LINE,
        })
      )
    })

    children.push(paragraph(""), buildTable(departments))

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: FONT, size: SIZE_BODY },
            paragraph: { spacing: { after: 0, line: LINE } },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1418, right: 851, bottom: 1134, left: 1985 },
            },
          },
          children,
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    const safeName = facultyName.replace(/[\\/:*?"<>|]+/g, "_") || "BaoCao"
    saveFile(`TongKet_KhoaVien_${safeName}.docx`, blob)
    message.success("Xuất báo cáo tổng hợp thành công")
  } catch (error) {
    console.error(error)
    message.error("Xuất file thất bại")
  }
}
