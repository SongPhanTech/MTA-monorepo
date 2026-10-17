import { toRoman } from "@lib/utils"
import { customExamFetch } from "@workspace/libs/api/custom-instance"
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

export type TrainingCourseForTitle = {
  id: string
  name?: string | null
  startYear?: number | null
}

/** Khóa gắn đợt khảo sát GV: qua lớp HP của survey + đối tượng khảo sát của cụm. */
export const clusterTrainingCourseWhere = (clusterId: string) => ({
  OR: [
    {
      surveyObjectTypes: {
        some: { clusterSurvey: { some: { id: clusterId } } },
      },
    },
    {
      fixedClass: {
        some: {
          OR: [
            {
              surveyObjectTypes: {
                some: { clusterSurvey: { some: { id: clusterId } } },
              },
            },
            {
              subjectClasses: {
                some: {
                  OR: [
                    { survey: { some: { clusterSurveyId: clusterId } } },
                    {
                      surveyObjectTypes: {
                        some: { clusterSurvey: { some: { id: clusterId } } },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  ],
})

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

/** Cột bảng: Rất đồng ý | Đồng ý | Ý kiến khác (gộp 3 mức còn lại) */
const DISPLAY_HEADERS = ["RẤT ĐỒNG Ý", "ĐỒNG Ý", "Ý KIẾN KHÁC"] as const

const TABLE_WIDTH = 8930
const TABLE_INDENT = 250
const COL_NAME = 2400
const COL_LEVEL = 2176
const COL_WIDTHS = [COL_NAME, COL_LEVEL, COL_LEVEL, COL_LEVEL]
const COL_COUNT = COL_WIDTHS.length

/** [rất đồng ý, đồng ý, ý kiến khác] */
type DisplayCounts = [number, number, number]

const toDisplayCounts = (counts: Counts): DisplayCounts => [
  counts[4],
  counts[3],
  counts[0] + counts[1] + counts[2],
]

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

/** 0–2: ý kiến khác | 3: đồng ý | 4: rất đồng ý. Không nhận ra → ý kiến khác (2). */
const levelIndex = (answer?: string | null, description?: string | null) => {
  const d = (description || "").toLocaleLowerCase("vi-VN")

  if (d.includes("rất không")) return 0
  if (d.includes("không đồng ý") || d.includes("không hài lòng")) return 1
  if (d.includes("phân vân")) return 2
  if (d.includes("rất đồng ý") || d.includes("rất hài lòng")) return 4
  if (d.includes("đồng ý") || d.includes("hài lòng")) return 3

  const n = Number(answer)
  if (n >= 1 && n <= 5) return n - 1

  // Đáp án không nhận ra → ý kiến khác
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


/** Dùng đúng name từ DB; chỉ bổ sung tiền tố khi name là số thuần (vd. "57"). */
const formatCourseLabel = (course: TrainingCourseForTitle): string => {
  const name = (course.name || "").trim()
  if (!name) return ""
  if (/^kho[áa]\b/i.test(name)) return name
  if (/^\d{1,3}$/.test(name)) return `Khóa ${name}`
  return name
}

export const buildFacultySummarySectionTitle = (
  baseName: string | undefined,
  courses?: TrainingCourseForTitle[] | null
): string => {
  const base = baseName?.trim() || "Kết quả khảo sát"
  const labels = (courses || [])
    .slice()
    .sort((a, b) => {
      const ay = a.startYear ?? Number.MAX_SAFE_INTEGER
      const by = b.startYear ?? Number.MAX_SAFE_INTEGER
      if (ay !== by) return ay - by
      return (a.name || "").localeCompare(b.name || "", "vi")
    })
    .map(formatCourseLabel)
    .filter(Boolean)
  if (!labels.length) return `A. ${base}`
  if (labels.length === 1) return `A. ${base} ${labels[0]}`
  return `A. ${base} ${labels[0]} đến ${labels[labels.length - 1]}`
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

type LecturerChoiceAnswer = {
  id: string
  answer?: string | null
  description?: string | null
  count?: number
}

const fetchChoiceCountsByLecturer = async (clusterId: string, lectureIds: string[]) => {
  const map = new Map<string, LecturerChoiceAnswer[]>()
  if (!lectureIds.length) return map

  const res = await customExamFetch<{
    status: number
    data?: {
      message?: string
      lecturers?: Array<{ lectureId: string; answers: LecturerChoiceAnswer[] }>
    }
  }>(`/api/cluster-survey/${clusterId}/choice-counts-for-lecturers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lectureIds }),
  })

  if (res?.status !== 200) {
    throw new Error(
      res?.data?.message || "Không lấy được thống kê khảo sát giảng viên. Vui lòng thử lại."
    )
  }

  for (const item of res.data?.lecturers || []) {
    map.set(item.lectureId, item.answers || [])
  }
  return map
}

const buildLecturerRow = (
  node: LecturerTreeNode,
  answersByLecturer: Map<string, LecturerChoiceAnswer[]>
): LecturerRow => {
  const stats = getLecturerSurveyStats(node.lecturer)
  const counts = countsFromAnswers(answersByLecturer.get(node.lecturer.id) || [])
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
  const groups = getDepartmentGroups(facultyNode)
  const allLectureIds = groups.flatMap((group) =>
    group.lecturers.map((node) => node.lecturer.id)
  )
  const answersByLecturer = await fetchChoiceCountsByLecturer(clusterId, allLectureIds)

  return groups
    .map((group) => {
      const lecturers = group.lecturers.map((node) => buildLecturerRow(node, answersByLecturer))
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
    .filter((dept) => dept.lecturers.length)
}

const resultSentence = (counts: Counts, total: number) => {
  if (!total) return "Chưa có dữ liệu đánh giá."
  const dongY = formatPct((counts[3] / total) * 100)
  const ratDongY = formatPct((counts[4] / total) * 100)
  return `Kết quả xử lý phiếu: ${ratDongY}% học viên ${LEVEL_LABELS[4]} và ${dongY}% học viên ${LEVEL_LABELS[3]} về giảng viên.`
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
          width: COL_LEVEL * 3,
          columnSpan: 3,
        }),
      ],
    }),
    new TableRow({
      children: DISPLAY_HEADERS.map((header) =>
        cell(header, { bold: true, center: true, width: COL_LEVEL })
      ),
    }),
  ]

  for (const dept of departments) {
    rows.push(
      new TableRow({
        children: [
          cell(stripBoMonPrefix(dept.name), {
            bold: true,
            width: TABLE_WIDTH,
            columnSpan: COL_COUNT,
          }),
        ],
      })
    )
    for (const lecturer of dept.lecturers) {
      const displayCounts = toDisplayCounts(lecturer.counts)
      rows.push(
        new TableRow({
          children: [
            cell(lecturer.name, { both: true, width: COL_NAME }),
            ...displayCounts.map((count) =>
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
    message.error(error instanceof Error ? error.message : "Xuất file thất bại")
  }
}
