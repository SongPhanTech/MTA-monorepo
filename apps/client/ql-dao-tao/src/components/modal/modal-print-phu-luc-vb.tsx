import { formatNgayIn, formatThangIn } from "@workspace/libs/timezone"
import { formatPlaceOfBirth } from "@workspace/libs/utils"
import { PrinterOutlined } from "@ant-design/icons"
import { Button, Checkbox, Input, InputNumber, Modal, Radio, Select, Space } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import {
  filterSubjectsForPlvbPrint,
  formatAppendixScoreDisplay,
  getAppendixSubjectRowHeight,
  getDefaultPlvbPrintSettings,
  isTwoLineAppendixName,
  loadPlvbPrintSettings,
  plvbSubjectSelectKey,
  renderUnderlinedSegment,
  savePlvbPrintSettings,
  splitSubjectsTwoColumns,
  wrapAppendixSubjectName,
  type PlvbAppendixSubject,
  type PlvbPrintSettings,
  type PlvbPrintVariant,
} from "../../utils/phu-luc-van-bang/plvb-print-settings"
import type {
  ModalPrintPhuLucVbInput,
  PlvbPrintStudent,
} from "../../utils/phu-luc-van-bang/plvb-print-types"

dayjs.locale("vi")

export type { ModalPrintPhuLucVbInput }

type ScoreConvertItem = {
  letter?: string | null
  base4?: number | null
  base10Min?: number | null
  base10Max?: number | null
}

type RankingItem = {
  context?: string
  graduated?: boolean
  baseScore?: string
  base4Min?: number
  base4Max?: number
  base10Min?: number
  base10Max?: number
  classification?: string
}

function isGraduationSemesterGroup(id?: string | null) {
  return String(id || "").startsWith("graduation-")
}

function markScore(value: number | string | null | undefined, decimals?: number) {
  if (value == null || value === "") return ""
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value).replace(".", ",")
  if (decimals != null) return n.toFixed(decimals).replace(".", ",")
  return String(value).replace(".", ",")
}

function toBase10Range(item: ScoreConvertItem) {
  if (item.base10Min === 0) {
    const upper = item.base10Max != null ? markScore(Number(item.base10Max) + 0.1, 1) : ""
    return upper ? `<${upper}` : ""
  }
  const min = markScore(item.base10Min, 1)
  if (item.base10Max == null) return min
  const maxNum = Number(item.base10Max)
  const max = Number.isFinite(maxNum) && maxNum === 10 ? "10" : markScore(item.base10Max, 1)
  return `${min}-${max}`
}

function getGraduationClassification(
  finalScoreBase10: number,
  finalScoreBase4: number,
  academicRankingConvert: RankingItem[] = []
) {
  const graduationRankingData = academicRankingConvert.filter(
    (item) => item?.context === "GRADUATION" && item?.graduated
  )
  if (!graduationRankingData.length) return ""

  const graduationBaseScore =
    graduationRankingData.find((item) => item?.base4Min != null)?.baseScore ??
    graduationRankingData[0]?.baseScore

  const matched = graduationRankingData.find((range) => {
    if (graduationBaseScore === "Base4") {
      return finalScoreBase4 >= (range.base4Min ?? 0) && finalScoreBase4 <= (range.base4Max ?? 0)
    }
    return finalScoreBase10 >= (range.base10Min ?? 0) && finalScoreBase10 <= (range.base10Max ?? 0)
  })

  return matched?.classification ?? ""
}

function buildGraduationRankingNote(academicRankingConvert: RankingItem[] = []) {
  const graduationRankingData = academicRankingConvert.filter(
    (item) => item?.context === "GRADUATION" && item?.graduated
  )
  const graduationBaseScore =
    graduationRankingData.find((item) => item?.base4Min != null)?.baseScore ??
    graduationRankingData[0]?.baseScore

  const sortedRankings = [...graduationRankingData].sort((a, b) =>
    graduationBaseScore === "Base4"
      ? (b.base4Min ?? 0) - (a.base4Min ?? 0)
      : (b.base10Min ?? 0) - (a.base10Min ?? 0)
  )

  const rankingText = sortedRankings
    .map((item) => {
      const range =
        graduationBaseScore === "Base4"
          ? `${markScore(item.base4Min, 2)}-${markScore(item.base4Max, 2)}`
          : `${markScore(item.base10Min, 2)}-${markScore(item.base10Max, 2)}`
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

function buildStudentSummary(student: PlvbPrintStudent) {
  const academicRankingConvert = student.fixedClass?.trainingCourse?.academicRankingConvert || []
  const scoreConverts = (student.fixedClass?.trainingCourse?.scoreConverts ||
    []) as ScoreConvertItem[]

  const regularSubjects = student.semesters
    .filter((semester) => !isGraduationSemesterGroup(semester.id))
    .flatMap((semester) => semester?.subjects ?? [])
  const graduationSubjects = student.semesters
    .filter((semester) => isGraduationSemesterGroup(semester.id))
    .flatMap((semester) => semester?.subjects ?? [])

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
  const diemTBHe4 = tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe4 / tongTinChi).toFixed(2))
  const xepLoai =
    student.graduationDecision?.finalRanking?.classification ??
    getGraduationClassification(diemTBHe10, diemTBHe4, academicRankingConvert || [])

  const diplomaNumber = student.graduationDecision?.diplomaNumber || ""
  const soVaoSo =
    student.graduationDecision?.originalDiplomaNumber ||
    student.graduationDecision?.diplomaNumber ||
    ""
  const course = student.fixedClass?.trainingCourse
  const classCurriculum = student.fixedClass?.curriculumVersion
  const curriculum = student.curriculumVersion || classCurriculum
  const major =
    student.graduationDecision?.trainingMajor || classCurriculum?.curriculum?.trainingMajor
  const language = curriculum?.trainingLanguage?.name || course?.trainingLanguage?.name || ""
  const loaiBang =
    student.graduationDecision?.diplomaType?.name || curriculum?.diplomaType?.name || "tốt nghiệp"

  const sortedScoreConverts = [...scoreConverts].sort(
    (a, b) => Number(b.base4 ?? 0) - Number(a.base4 ?? 0)
  )

  return {
    student,
    regularSubjects,
    graduationSubjects,
    tongTinChi,
    diemTBHe10,
    xepLoai,
    soVaoSo,
    scoreLetters: sortedScoreConverts.map((item) => item.letter ?? ""),
    scoreBase4: sortedScoreConverts.map((item) => markScore(item.base4, 1)),
    scoreBase10: sortedScoreConverts.map(toBase10Range),
    rankingNote: buildGraduationRankingNote(academicRankingConvert),
    header: {
      ho_ten: student.userProfile.fullname,
      ma_hoc_vien: student.userProfile.code,
      ngay_sinh: student.userProfile.dateOfBirth
        ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
        : "",
      ngay_nhap_hoc: student.from
        ? dayjs(student.from).format("DD/MM/YYYY")
        : course?.admissionStartDate
          ? dayjs(course.admissionStartDate).format("DD/MM/YYYY")
          : "",
      hinh_thuc_dao_tao:
        curriculum?.trainingType?.name || classCurriculum?.trainingType?.name || "",
      nganh_hoc: major?.trainingField?.name || "",
      chuyen_nganh: major?.name || "",
      thoi_gian_dao_tao: curriculum?.trainingTime?.name || "",
      trinh_do_dao_tao: curriculum?.trainingLevel?.name || "",
      ngon_ngu: language,
      so_hieu_bang: diplomaNumber,
      loai_bang: loaiBang,
      khoa: course?.name || "",
      noi_sinh: formatPlaceOfBirth(student.userProfile as Parameters<typeof formatPlaceOfBirth>[0]),
    },
  }
}

function countScoreColumns(settings: PlvbPrintSettings) {
  return [settings.showScore10, settings.showScore4, settings.showLetterGrade].filter(Boolean)
    .length
}

function halfColCount(settings: PlvbPrintSettings) {
  return 3 + countScoreColumns(settings)
}

/**
 * Viền theo mẫu gốc Excel (một nét, không box-shadow — tránh lệch/đôi dòng):
 * - Đậm mảnh: khung table, đáy header, đường giữa 2 cột, ngăn tốt nghiệp
 * - Mờ: lưới trong
 */
const BORDER_EMPH = "0.5pt solid #000"
const BORDER_THICK = BORDER_EMPH
const BORDER_OUTER = BORDER_EMPH
/** Lưới trong — rất mờ, chỉ khung ngoài / chia cột / ngăn section đậm. */
const BORDER_FAINT = "0.25pt solid #c8c8c8"
const RULE_EMPH_PT = "0.5pt"
const RULE_FAINT = "0.25pt solid #c8c8c8"

const CELL_PAD: CSSProperties = {
  padding: "0 2pt",
  verticalAlign: "middle",
}

function bodyCellStyle(opts?: {
  textAlign?: CSSProperties["textAlign"]
  rightThick?: boolean
  leftThick?: boolean
}): CSSProperties {
  return {
    ...CELL_PAD,
    borderTop: BORDER_FAINT,
    borderBottom: BORDER_FAINT,
    borderLeft: opts?.leftThick ? BORDER_THICK : BORDER_FAINT,
    borderRight: opts?.rightThick ? BORDER_THICK : BORDER_FAINT,
    textAlign: opts?.textAlign,
  }
}

/** Header: lưới trong mờ; đậm chỉ ở mép trên (hàng 1) / mép dưới (hàng 2) qua class CSS. */
function headerCellStyle(opts?: { extra?: CSSProperties }): CSSProperties {
  return {
    ...CELL_PAD,
    borderTop: BORDER_FAINT,
    borderBottom: BORDER_FAINT,
    borderLeft: BORDER_FAINT,
    borderRight: BORDER_FAINT,
    fontWeight: 700,
    textAlign: "center",
    ...opts?.extra,
  }
}

/** Đường chia 2 cột: mép phải nửa trái + mép trái nửa phải (tránh đoạn đứt vì rowspan STT). */
function dividerClass(opts?: { right?: boolean; left?: boolean }) {
  const parts: string[] = []
  if (opts?.right) parts.push("plvb-col-divider")
  if (opts?.left) parts.push("plvb-col-divider-start")
  return parts.length ? parts.join(" ") : undefined
}

function SubjectScoreCells({
  subject,
  settings,
  stt,
  rightThick,
  leftThick,
  afterDivider,
}: {
  subject?: PlvbAppendixSubject | null
  settings: PlvbPrintSettings
  stt?: number | ""
  /** Cạnh phải ô cuối nửa trái — đường kẻ dọc chia 2 cột. */
  rightThick?: boolean
  /** Cạnh trái ô đầu nửa phải — nối liền đường chia (qua rowspan STT). */
  leftThick?: boolean
  /** Nửa phải: không vẽ border-left STT — tránh đôi nét cạnh đường chia giữa. */
  afterDivider?: boolean
}) {
  const scoreCount = countScoreColumns(settings)
  const lastScoreIndex = scoreCount - 1

  const scoreColClass = (isLast: boolean) =>
    ["plvb-score-col", dividerClass({ right: rightThick && isLast })].filter(Boolean).join(" ")

  if (!subject) {
    let emptyScoreIdx = 0
    return (
      <>
        <td
          style={{
            ...bodyCellStyle({ leftThick, textAlign: "center" }),
            ...(afterDivider ? { borderLeft: "none" } : null),
          }}
          className={[
            "plvb-stt",
            afterDivider ? "plvb-after-divider" : null,
            dividerClass({ left: leftThick }),
          ]
            .filter(Boolean)
            .join(" ")}
        />
        <td style={bodyCellStyle()} />
        <td
          style={bodyCellStyle({ rightThick: rightThick && scoreCount === 0 })}
          className={["plvb-credits", dividerClass({ right: rightThick && scoreCount === 0 })]
            .filter(Boolean)
            .join(" ")}
        />
        {settings.showScore10 ? (
          <td
            style={bodyCellStyle({
              rightThick: rightThick && lastScoreIndex === emptyScoreIdx,
            })}
            className={scoreColClass(lastScoreIndex === emptyScoreIdx++)}
          />
        ) : null}
        {settings.showScore4 ? (
          <td
            style={bodyCellStyle({
              rightThick: rightThick && lastScoreIndex === emptyScoreIdx,
            })}
            className={scoreColClass(lastScoreIndex === emptyScoreIdx++)}
          />
        ) : null}
        {settings.showLetterGrade ? (
          <td
            style={bodyCellStyle({ rightThick: Boolean(rightThick) })}
            className={scoreColClass(true)}
          />
        ) : null}
      </>
    )
  }

  const name = wrapAppendixSubjectName(subject.tenHocPhan, settings.nameOneLineMax)
  const twoLineName = isTwoLineAppendixName(subject.tenHocPhan, settings.nameOneLineMax)
  let scoreIdx = 0
  return (
    <>
      <td
        style={{
          ...bodyCellStyle({ textAlign: "center", leftThick }),
          ...(afterDivider ? { borderLeft: "none" } : null),
        }}
        className={[
          "plvb-stt",
          afterDivider ? "plvb-after-divider" : null,
          dividerClass({ left: leftThick }),
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {stt ?? ""}
      </td>
      <td
        className="plvb-subject-name"
        style={{
          ...bodyCellStyle({ textAlign: "left" }),
          whiteSpace: "pre-line",
          lineHeight: twoLineName ? settings.nameLineHeight || 1.1 : 1.1,
        }}
      >
        {name}
      </td>
      <td
        style={bodyCellStyle({
          textAlign: "center",
          rightThick: rightThick && scoreCount === 0,
        })}
        className={["plvb-credits", dividerClass({ right: rightThick && scoreCount === 0 })]
          .filter(Boolean)
          .join(" ")}
      >
        {subject.soTinChi ?? ""}
      </td>
      {settings.showScore10 ? (
        <td
          style={bodyCellStyle({
            textAlign: "center",
            rightThick: rightThick && lastScoreIndex === scoreIdx,
          })}
          className={scoreColClass(lastScoreIndex === scoreIdx++)}
        >
          {formatAppendixScoreDisplay(subject.thangDiem10, 1)}
        </td>
      ) : null}
      {settings.showScore4 ? (
        <td
          style={bodyCellStyle({
            textAlign: "center",
            rightThick: rightThick && lastScoreIndex === scoreIdx,
          })}
          className={scoreColClass(lastScoreIndex === scoreIdx++)}
        >
          {formatAppendixScoreDisplay(subject.thangDiem4, 1)}
        </td>
      ) : null}
      {settings.showLetterGrade ? (
        <td
          style={bodyCellStyle({ textAlign: "center", rightThick: Boolean(rightThick) })}
          className={scoreColClass(true)}
        >
          {subject.thangDiemChu ?? ""}
        </td>
      ) : null}
    </>
  )
}

function HalfHeaderCells({
  settings,
  rightThick,
  leftThick,
  afterDivider,
}: {
  settings: PlvbPrintSettings
  rightThick?: boolean
  leftThick?: boolean
  afterDivider?: boolean
}) {
  const showScoreCols = countScoreColumns(settings)
  const spanBase: CSSProperties = {
    ...headerCellStyle({
      extra: {
        fontSize: `${settings.headerFontSize}pt`,
        // Viền trên trên thead — cần có để lặp trang 2 không mất kẻ
        borderTop: BORDER_EMPH,
        borderBottom: BORDER_EMPH,
      },
    }),
  }
  const sttStyle: CSSProperties = {
    ...spanBase,
    borderLeft: afterDivider ? "none" : BORDER_FAINT,
    borderRight: BORDER_FAINT,
  }
  const topOnly: CSSProperties = {
    ...headerCellStyle({
      extra: {
        fontSize: `${settings.headerFontSize}pt`,
        borderTop: BORDER_EMPH,
        borderRight: rightThick ? BORDER_EMPH : BORDER_FAINT,
      },
    }),
  }
  return (
    <>
      <th
        rowSpan={2}
        style={sttStyle}
        className={[
          "plvb-stt",
          afterDivider ? "plvb-after-divider" : null,
          dividerClass({ left: leftThick }),
        ]
          .filter(Boolean)
          .join(" ")}
      >
        STT
      </th>
      <th rowSpan={2} style={spanBase}>
        Tên học phần
      </th>
      <th
        rowSpan={2}
        style={{
          ...spanBase,
          borderRight: rightThick && showScoreCols === 0 ? BORDER_THICK : BORDER_FAINT,
        }}
        className={["plvb-credits", dividerClass({ right: rightThick && showScoreCols === 0 })]
          .filter(Boolean)
          .join(" ")}
      >
        Số tín chỉ
      </th>
      {showScoreCols > 0 ? (
        <th
          colSpan={showScoreCols}
          style={{ ...topOnly, borderRight: rightThick ? BORDER_EMPH : BORDER_FAINT }}
          className={["plvb-score-col", dividerClass({ right: rightThick })]
            .filter(Boolean)
            .join(" ")}
        >
          Điểm học phần
        </th>
      ) : null}
    </>
  )
}

/** Header phụ theo mẫu Hệ QS: Thang điểm 10 / 4 / chữ */
function HalfSubHeaderCells({
  settings,
  rightThick,
}: {
  settings: PlvbPrintSettings
  rightThick?: boolean
}) {
  const scoreCount = countScoreColumns(settings)
  let idx = 0
  const subStyle = (isLast: boolean): CSSProperties =>
    headerCellStyle({
      extra: {
        fontSize: `${settings.headerFontSize}pt`,
        lineHeight: 1.1,
        whiteSpace: "normal",
        wordBreak: "keep-all",
        borderBottom: BORDER_EMPH,
        borderLeft: BORDER_FAINT,
        borderRight: rightThick && isLast ? BORDER_EMPH : BORDER_FAINT,
      },
    })
  return (
    <>
      {settings.showScore10 ? (
        <th
          style={subStyle(scoreCount - 1 === idx)}
          className={[
            "plvb-score-col",
            dividerClass({ right: rightThick && scoreCount - 1 === idx++ }),
          ]
            .filter(Boolean)
            .join(" ")}
        >
          Thang
          <br />
          điểm
          <br />
          10
        </th>
      ) : null}
      {settings.showScore4 ? (
        <th
          style={subStyle(scoreCount - 1 === idx)}
          className={[
            "plvb-score-col",
            dividerClass({ right: rightThick && scoreCount - 1 === idx++ }),
          ]
            .filter(Boolean)
            .join(" ")}
        >
          Thang
          <br />
          điểm
          <br />4
        </th>
      ) : null}
      {settings.showLetterGrade ? (
        <th
          style={subStyle(true)}
          className={["plvb-score-col", dividerClass({ right: Boolean(rightThick) })]
            .filter(Boolean)
            .join(" ")}
        >
          Thang
          <br />
          điểm
          <br />
          chữ
        </th>
      ) : null}
    </>
  )
}

/**
 * Độ rộng nửa bảng theo mẫu Hệ QS — tên HP rộng vừa đủ;
 * 3 cột điểm đủ chỗ cho "Thang / điểm / chữ" (không đè chữ).
 * Mỗi HalfColGroup = 50% bảng 2 cột.
 */
function HalfColGroup({ settings }: { settings: PlvbPrintSettings }) {
  const showScoreCols = countScoreColumns(settings)
  // Mỗi nửa = 50% — STT hẹp, tên HP rộng, điểm đều
  return (
    <>
      <col style={{ width: "3.5%" }} />
      <col style={{ width: showScoreCols ? "27%" : "39%" }} />
      <col style={{ width: "4%" }} />
      {settings.showScore10 ? <col style={{ width: "5.166%" }} /> : null}
      {settings.showScore4 ? <col style={{ width: "5.166%" }} /> : null}
      {settings.showLetterGrade ? <col style={{ width: "5.168%" }} /> : null}
    </>
  )
}

const SCORE_TABLE_WRAP_STYLE: CSSProperties = {
  // Không border/padding trên wrap — khung do chính table (tránh lệch + mất viền phải)
}

const SCORE_TABLE_STYLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  borderSpacing: 0,
  tableLayout: "fixed",
  border: BORDER_OUTER,
}

function ScoreTableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={["plvb-score-table-wrap", className].filter(Boolean).join(" ")}
      style={SCORE_TABLE_WRAP_STYLE}
    >
      {children}
    </div>
  )
}

/** Đáy đậm lặp lại mỗi khi bảng bị ngắt trang (thead/tfoot không giữ được border-collapse). */
function PageBreakFoot({
  settings,
  columns,
}: {
  settings: PlvbPrintSettings
  columns: 1 | 2
}) {
  const count = (columns === 2 ? 2 : 1) * halfColCount(settings)
  return (
    <tfoot className="plvb-page-rule">
      <tr>
        {Array.from({ length: count }, (_, index) => (
          <td key={index} />
        ))}
      </tr>
    </tfoot>
  )
}

function GraduationBannerCells({
  settings,
  columns,
}: {
  settings: PlvbPrintSettings
  columns: 1 | 2
}) {
  const colSpan = columns === 2 ? halfColCount(settings) * 2 : halfColCount(settings)
  return (
    <td
      colSpan={colSpan}
      className="plvb-grad-banner"
      style={{
        ...CELL_PAD,
        borderTop: "none",
        borderBottom: BORDER_EMPH,
        borderLeft: BORDER_FAINT,
        borderRight: BORDER_FAINT,
        fontWeight: 700,
        fontSize: `${settings.bodyFontSize + 1}pt`,
        textAlign: "left",
      }}
    >
      Học phần tốt nghiệp
    </td>
  )
}

function SubjectOneColumnTable({
  subjects,
  settings,
  showHeader = true,
  graduationSubjects = [],
}: {
  subjects: PlvbAppendixSubject[]
  settings: PlvbPrintSettings
  showHeader?: boolean
  graduationSubjects?: PlvbAppendixSubject[]
}) {
  const showGrad = graduationSubjects.length > 0
  return (
    <ScoreTableWrap>
      <table
        className="plvb-score-table"
        style={{
          ...SCORE_TABLE_STYLE,
          fontFamily: settings.fontFamily,
          fontSize: `${settings.bodyFontSize}pt`,
        }}
      >
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: countScoreColumns(settings) ? "52%" : "74%" }} />
          <col style={{ width: "8%" }} />
          {settings.showScore10 ? <col style={{ width: "12%" }} /> : null}
          {settings.showScore4 ? <col style={{ width: "8%" }} /> : null}
          {settings.showLetterGrade ? <col style={{ width: "14%" }} /> : null}
        </colgroup>
        {showHeader ? (
          <thead>
            <tr className="plvb-thead-top" style={{ height: "14pt" }}>
              <HalfHeaderCells settings={settings} />
            </tr>
            <tr className="plvb-thead-bottom" style={{ height: "36pt" }}>
              <HalfSubHeaderCells settings={settings} />
            </tr>
          </thead>
        ) : null}
        <tbody>
          {subjects.map((subject, index) => (
            <tr
              key={`1col-${index}-${subject.tenHocPhan}`}
              style={{
                height: `${getAppendixSubjectRowHeight([subject.tenHocPhan], settings)}pt`,
              }}
            >
              <SubjectScoreCells subject={subject} settings={settings} stt={index + 1} />
            </tr>
          ))}
          {showGrad ? (
            <tr
              className="plvb-grad-banner-row"
              style={{ height: `${settings.bodyFontSize + 8}pt` }}
            >
              <GraduationBannerCells settings={settings} columns={1} />
            </tr>
          ) : null}
          {graduationSubjects.map((subject, index) => (
            <tr
              key={`1col-grad-${index}-${subject.tenHocPhan}`}
              style={{
                height: `${getAppendixSubjectRowHeight([subject.tenHocPhan], settings)}pt`,
              }}
            >
              <SubjectScoreCells subject={subject} settings={settings} stt={index + 1} />
            </tr>
          ))}
        </tbody>
        <PageBreakFoot settings={settings} columns={1} />
      </table>
    </ScoreTableWrap>
  )
}

/** 1 bảng 2 nửa — mỗi hàng chung `<tr>` để không lệch dòng; viền lưới liền. */
function SubjectTwoColumnTable({
  subjects,
  settings,
  showHeader = true,
  graduationSubjects = [],
}: {
  subjects: PlvbAppendixSubject[]
  settings: PlvbPrintSettings
  showHeader?: boolean
  graduationSubjects?: PlvbAppendixSubject[]
}) {
  const { left, right } = splitSubjectsTwoColumns(subjects)
  const rowCount = Math.max(left.length, right.length)
  const showGrad = graduationSubjects.length > 0
  const gradSplit = splitSubjectsTwoColumns(graduationSubjects)
  const gradRowCount = Math.max(gradSplit.left.length, gradSplit.right.length)

  return (
    <ScoreTableWrap>
      <table
        className="plvb-score-table plvb-score-table-2col"
        style={{
          ...SCORE_TABLE_STYLE,
          fontFamily: settings.fontFamily,
          fontSize: `${settings.bodyFontSize}pt`,
        }}
      >
        <colgroup>
          <HalfColGroup settings={settings} />
          <HalfColGroup settings={settings} />
        </colgroup>
        {showHeader ? (
          <thead>
            <tr className="plvb-thead-top" style={{ height: "14pt" }}>
              <HalfHeaderCells settings={settings} rightThick />
              <HalfHeaderCells settings={settings} afterDivider />
            </tr>
            <tr className="plvb-thead-bottom" style={{ height: "36pt" }}>
              <HalfSubHeaderCells settings={settings} rightThick />
              <HalfSubHeaderCells settings={settings} />
            </tr>
          </thead>
        ) : null}
        <tbody>
          {Array.from({ length: rowCount }, (_, index) => {
            const leftSubject = left[index]
            const rightSubject = right[index]
            const height = getAppendixSubjectRowHeight(
              [leftSubject?.tenHocPhan, rightSubject?.tenHocPhan],
              settings
            )
            return (
              <tr key={`2col-${index}`} style={{ height: `${height}pt` }}>
                <SubjectScoreCells
                  subject={leftSubject}
                  settings={settings}
                  stt={leftSubject ? index + 1 : ""}
                  rightThick
                />
                <SubjectScoreCells
                  subject={rightSubject}
                  settings={settings}
                  stt={rightSubject ? left.length + index + 1 : ""}
                  afterDivider
                />
              </tr>
            )
          })}
          {showGrad ? (
            <tr
              className="plvb-grad-banner-row"
              style={{ height: `${settings.bodyFontSize + 8}pt` }}
            >
              <GraduationBannerCells settings={settings} columns={2} />
            </tr>
          ) : null}
          {Array.from({ length: gradRowCount }, (_, index) => {
            const leftSubject = gradSplit.left[index]
            const rightSubject = gradSplit.right[index]
            const height = getAppendixSubjectRowHeight(
              [leftSubject?.tenHocPhan, rightSubject?.tenHocPhan],
              settings
            )
            return (
              <tr key={`2col-grad-${index}`} style={{ height: `${height}pt` }}>
                <SubjectScoreCells
                  subject={leftSubject}
                  settings={settings}
                  stt={leftSubject ? index + 1 : ""}
                  rightThick
                />
                <SubjectScoreCells
                  subject={rightSubject}
                  settings={settings}
                  stt={rightSubject ? gradSplit.left.length + index + 1 : ""}
                  afterDivider
                />
              </tr>
            )
          })}
        </tbody>
        <PageBreakFoot settings={settings} columns={2} />
      </table>
    </ScoreTableWrap>
  )
}

/** Fallback khi khóa học chưa cấu hình scoreConverts — khớp mẫu in phổ biến. */
const FALLBACK_SCORE_LETTERS = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"]
const FALLBACK_SCORE_BASE4 = ["4,0", "3,7", "3,5", "3,0", "2,5", "2,0", "1,5", "1,0", "0"]
const FALLBACK_SCORE_BASE10 = [
  "9,0-10",
  "8,5-8,9",
  "8,0-8,4",
  "7,0-7,9",
  "6,5-6,9",
  "5,5-6,4",
  "5,0-5,4",
  "4,0-4,9",
  "<4,0",
]
const FALLBACK_RANKING_NOTE =
  "Phân loại tốt nghiệp theo thang điểm 10: Xuất sắc: 9,00-10; Giỏi: 8,00-8,99; Khá: 7,00-7,99; Trung bình khá: 6,50-6,99; Trung bình: 5,50-6,49. (Hạng tốt nghiệp có thể bị hạ mức theo quy chế đào tạo đại học của HVKTQS được áp dụng tại thời điểm xét tốt nghiệp)."

/** Xuống dòng sau "Trung bình khá: …;" — phần còn lại thẳng mép "Ghi chú:". */
function splitRankingNote(text: string): { firstLine: string; rest: string } {
  const cleaned = text
    .replace(/^\s*-\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
  const match = cleaned.match(/^(.*?Trung bình khá:\s*[\d,.\-–]+\s*;)(\s*)(.*)$/i)
  if (match?.[3]) return { firstLine: match[1].trim(), rest: match[3].trim() }
  return { firstLine: cleaned, rest: "" }
}

function ScoreScaleNote({
  settings,
  letters,
  base4,
  base10,
  rankingNote,
}: {
  settings: PlvbPrintSettings
  letters: string[]
  base4: string[]
  base10: string[]
  rankingNote: string
}) {
  const displayLetters = letters.length > 0 ? letters : FALLBACK_SCORE_LETTERS
  const displayBase4 = base4.length > 0 ? base4 : FALLBACK_SCORE_BASE4
  const displayBase10 = base10.length > 0 ? base10 : FALLBACK_SCORE_BASE10
  const rawRanking =
    rankingNote && !/:\s*-\s*\(/.test(rankingNote) ? rankingNote : FALLBACK_RANKING_NOTE
  const { firstLine: rankingFirst, rest: rankingRest } = splitRankingNote(rawRanking)

  const scaleRows = [
    { label: "Thang điểm chữ", values: displayLetters },
    { label: "Thang điểm 4", values: displayBase4 },
    { label: "Thang điểm 10", values: displayBase10 },
  ]

  // Cột "Ghi chú:" cố định → 3 gạch đầu dòng thẳng hàng
  const GHI_CHU_LABEL_WIDTH = "48pt"
  const colCount = displayLetters.length

  const noteRow = (bullet: ReactNode, isFirst = false) => (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <span
        style={{
          width: GHI_CHU_LABEL_WIDTH,
          flexShrink: 0,
          fontWeight: isFirst ? 700 : 400,
        }}
      >
        {isFirst ? "Ghi chú:" : null}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{bullet}</div>
    </div>
  )

  return (
    <div
      className="mt-0.5"
      style={{
        fontSize: `${settings.noteFontSize}pt`,
        lineHeight: 1.35,
        fontFamily: settings.fontFamily,
      }}
    >
      {noteRow(
        "- Các học phần có dấu * phía trước là học phần điều kiện, không tính vào điểm trung bình chung tích lũy toàn khóa.",
        true
      )}
      {noteRow("- Hệ thống điểm được quy định theo:")}

      {/* 1 grid chung → cột nhãn cùng bề rộng (ôm nhãn dài nhất); cột điểm thẳng hàng */}
      <div
        style={{
          marginTop: "1pt",
          width: "100%",
          display: "grid",
          gridTemplateColumns: `max-content repeat(${colCount}, minmax(0, 1fr))`,
          alignItems: "center",
          rowGap: 0,
        }}
      >
        {scaleRows.flatMap((row) => [
          <span
            key={`${row.label}-label`}
            style={{
              whiteSpace: "nowrap",
              paddingRight: "4pt",
              height: "15.9pt",
              display: "flex",
              alignItems: "center",
            }}
          >
            {row.label}
          </span>,
          ...row.values.map((value, index) => (
            <span
              key={`${row.label}-${index}`}
              style={{
                textAlign: "center",
                whiteSpace: "nowrap",
                padding: "0 1pt",
                height: "15.9pt",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {value}
            </span>
          )),
        ])}
      </div>

      {/* Dòng 1: gạch thẳng hàng; dòng 2+: thẳng mép "Ghi chú:" (không thụt) */}
      {noteRow(<div style={{ marginTop: "1pt" }}>- {rankingFirst}</div>)}
      {rankingRest ? <div>{rankingRest}</div> : null}
    </div>
  )
}

function StudentAppendixPage({
  summary,
  settings,
  variant,
  signDate,
  signerName,
  isLast,
}: {
  summary: ReturnType<typeof buildStudentSummary>
  settings: PlvbPrintSettings
  variant: PlvbPrintVariant
  signDate: dayjs.Dayjs
  signerName: string
  isLast: boolean
}) {
  const {
    header,
    regularSubjects,
    graduationSubjects,
    tongTinChi,
    diemTBHe10,
    xepLoai,
    soVaoSo,
    scoreLetters,
    scoreBase4,
    scoreBase10,
    rankingNote,
  } = summary

  const subtitle = settings.subtitleTemplate
    .replace("{loai_bang}", header.loai_bang || "tốt nghiệp")
    .replace("{trinh_do}", header.trinh_do_dao_tao || "Đại học")
    .replace("{so_hieu}", header.so_hieu_bang || "...")

  const formattedDate = `Hà Nội, ngày ${formatNgayIn(signDate.date())} tháng ${formatThangIn(signDate.month() + 1)} năm ${signDate.year()}`

  // Layout thông tin theo mẫu Hệ QS — chỉ đậm Họ và tên + Chuyên ngành
  const infoLeft = [
    { label: "Họ và tên:", value: header.ho_ten?.toUpperCase(), bold: true },
    { label: "Ngày sinh:", value: header.ngay_sinh, bold: false },
    { label: "Khóa:", value: header.khoa, bold: false },
    { label: "Ngành:", value: header.nganh_hoc, bold: false },
    { label: "Chuyên ngành:", value: header.chuyen_nganh, bold: true },
    { label: "Ngôn ngữ đào tạo:", value: header.ngon_ngu, bold: false },
  ]
  const infoRight = [
    { label: "Mã học viên:", value: header.ma_hoc_vien, bold: false },
    { label: "Nơi sinh:", value: header.noi_sinh, bold: false },
    { label: "Ngày nhập học:", value: header.ngay_nhap_hoc, bold: false },
    { label: "Thời gian đào tạo:", value: header.thoi_gian_dao_tao, bold: false },
    { label: "Trình độ đào tạo:", value: header.trinh_do_dao_tao, bold: false },
    { label: "Hình thức đào tạo:", value: header.hinh_thuc_dao_tao, bold: false },
  ]

  const graduationForTable =
    settings.showGraduationSection && graduationSubjects.length > 0 ? graduationSubjects : []
  const subjectsForTable = filterSubjectsForPlvbPrint(regularSubjects, settings, variant)

  const renderSubjectsBlock = () => {
    if (settings.columns === 1) {
      return (
        <SubjectOneColumnTable
          subjects={subjectsForTable}
          settings={settings}
          showHeader
          graduationSubjects={graduationForTable}
        />
      )
    }
    return (
      <SubjectTwoColumnTable
        subjects={subjectsForTable}
        settings={settings}
        showHeader
        graduationSubjects={graduationForTable}
      />
    )
  }

  return (
    <div
      className={isLast ? undefined : "page-break"}
      style={{
        fontFamily: settings.fontFamily,
        color: "#000",
        breakAfter: isLast ? "auto" : "page",
        pageBreakAfter: isLast ? "auto" : "always",
      }}
    >
      <div className="flex justify-between text-center uppercase">
        <div className="w-[48%]">
          <div
            style={{
              fontSize: `${settings.headerLeftLine1FontSize}pt`,
              height: `${settings.headerLeftLine1Height}pt`,
              lineHeight: `${settings.headerLeftLine1Height}pt`,
            }}
          >
            {settings.headerLeftLine1}
          </div>
          <div
            style={{
              fontSize: `${settings.headerLeftLine2FontSize}pt`,
              fontWeight: 700,
              height: `${settings.headerLeftLine2Height}pt`,
              lineHeight: `${settings.headerLeftLine2Height}pt`,
            }}
          >
            {(() => {
              const seg = renderUnderlinedSegment(
                settings.headerLeftLine2,
                settings.headerLeftLine2Underline
              )
              if (!seg.marked) return settings.headerLeftLine2
              return (
                <>
                  {seg.before}
                  <span
                    style={{
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      textDecorationThickness: "1px",
                      textDecorationSkipInk: "none",
                    }}
                  >
                    {seg.marked}
                  </span>
                  {seg.after}
                </>
              )
            })()}
          </div>
        </div>
        <div className="w-[48%]">
          <div
            style={{
              fontSize: `${settings.headerRightLine1FontSize}pt`,
              fontWeight: 700,
              height: `${settings.headerRightLine1Height}pt`,
              lineHeight: `${settings.headerRightLine1Height}pt`,
            }}
          >
            {settings.headerRightLine1}
          </div>
          <div
            className="normal-case"
            style={{
              fontSize: `${settings.headerRightLine2FontSize}pt`,
              fontWeight: 700,
              display: "inline-block",
              height: `${settings.headerRightLine2Height}pt`,
              lineHeight: `${settings.headerRightLine2Height}pt`,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              textDecorationThickness: "1px",
              textDecorationSkipInk: "none",
            }}
          >
            {settings.headerRightLine2}
          </div>
        </div>
      </div>

      <div className="text-center" style={{ marginTop: `${settings.titleBlockMarginTop}pt` }}>
        <div
          style={{
            fontSize: `${settings.titleFontSize}pt`,
            fontWeight: 700,
            height: `${settings.titleLineHeight}pt`,
            lineHeight: `${settings.titleLineHeight}pt`,
          }}
          className="uppercase"
        >
          {settings.title}
        </div>
        <div
          style={{
            fontSize: `${settings.subtitleFontSize}pt`,
            fontStyle: "italic",
            height: `${settings.subtitleLineHeight}pt`,
            lineHeight: `${settings.subtitleLineHeight}pt`,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Cụm thông tin: giá trị nối ngay sau dấu ":" */}
      <div
        className="mt-1 flex justify-between gap-6"
        style={{
          fontSize: `${settings.infoFontSize}pt`,
          lineHeight: 1.3,
          paddingLeft: "18pt",
        }}
      >
        <div className="flex w-[48%] flex-col">
          {infoLeft.map((item) => (
            <div key={item.label} style={{ minHeight: "13.95pt" }}>
              <span>{item.label} </span>
              <span style={{ fontWeight: item.bold ? 700 : 400 }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className="flex w-[48%] flex-col">
          {infoRight.map((item) => (
            <div key={item.label} style={{ minHeight: "13.95pt" }}>
              <span>{item.label} </span>
              <span style={{ fontWeight: item.bold ? 700 : 400 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {settings.showTrainingResultLabel ? (
        <div
          style={{
            fontSize: `${settings.infoFontSize}pt`,
            marginTop: "4pt",
            paddingLeft: "18pt",
          }}
        >
          {settings.trainingResultLabel}
        </div>
      ) : null}

      <div className={settings.showTrainingResultLabel ? "mt-0.5" : "mt-1"}>
        {renderSubjectsBlock()}
      </div>

      {/* Tổng kết trái + chữ ký phải — Số vào sổ gốc cùng hàng ngày ký (mẫu Hệ QS R69) */}
      <table
        className="w-full mt-1 border-collapse"
        style={{ fontSize: `${settings.summaryFontSize}pt` }}
      >
        <colgroup>
          <col style={{ width: "62%" }} />
          <col style={{ width: "38%" }} />
        </colgroup>
        <tbody>
          <tr style={{ height: "15.75pt" }}>
            <td className="align-middle">
              Tổng số tín chỉ: <strong>{tongTinChi}</strong>
            </td>
            <td />
          </tr>
          <tr style={{ height: "15.75pt" }}>
            <td className="align-middle">
              Điểm trung bình chung tích lũy toàn khóa (Thang điểm 10):{" "}
              <strong>{diemTBHe10.toFixed(2).replace(".", ",")}</strong>
            </td>
            <td />
          </tr>
          <tr style={{ height: "15.75pt" }}>
            <td className="align-middle">
              Xếp hạng tốt nghiệp: <strong>{xepLoai}</strong>
            </td>
            <td />
          </tr>
          <tr style={{ height: `${settings.signDateLineHeight}pt` }}>
            <td className="align-middle">
              {settings.showRegistryNumber ? (
                <>
                  Số vào sổ gốc cấp bằng: <strong>{soVaoSo || ""}</strong>
                </>
              ) : null}
            </td>
            <td className="text-center italic align-middle">{formattedDate}</td>
          </tr>
          <tr style={{ height: `${settings.signerTitle1LineHeight}pt` }}>
            <td />
            <td
              className="text-center font-bold uppercase align-middle"
              style={{ fontSize: `${settings.signerTitle1FontSize}pt` }}
            >
              {settings.signerTitle1}
            </td>
          </tr>
          <tr style={{ height: `${settings.signerTitle2LineHeight}pt` }}>
            <td />
            <td
              className="text-center font-bold uppercase align-middle"
              style={{ fontSize: `${settings.signerTitle2FontSize}pt` }}
            >
              {settings.signerTitle2}
            </td>
          </tr>
          {/* Khoảng trống chữ ký tay — tách khỏi hàng tên để in không bị đẩy tên lên */}
          <tr style={{ height: `${settings.signerGapHeight}pt` }}>
            <td />
            <td />
          </tr>
          <tr style={{ height: `${settings.signerNameLineHeight}pt` }}>
            <td />
            <td
              className="text-center align-middle"
              style={{ fontSize: `${settings.signerNameFontSize}pt`, fontWeight: 600 }}
            >
              {signerName}
            </td>
          </tr>
        </tbody>
      </table>

      <ScoreScaleNote
        settings={settings}
        letters={scoreLetters}
        base4={scoreBase4}
        base10={scoreBase10}
        rankingNote={rankingNote}
      />
    </div>
  )
}

const VARIANT_LABEL: Record<PlvbPrintVariant, string> = {
  military: "Hệ quân sự",
  international: "Hệ quốc tế",
}

const ModalPrintPhuLucVb = () => {
  const printRef = useRef<HTMLDivElement>(null)
  const { isOpen, onClose, input } = useDisclosure<ModalPrintPhuLucVbInput>({
    tag: "ModalPrintPhuLucVb",
  })

  const variant: PlvbPrintVariant =
    input?.variant === "international" ? "international" : "military"
  const [settings, setSettings] = useState<PlvbPrintSettings>(() =>
    getDefaultPlvbPrintSettings("military")
  )
  /** Người được chọn để in (không lưu localStorage). */
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const allSummaries = useMemo(
    () => (input?.students || []).map((student) => buildStudentSummary(student)),
    [input?.students]
  )
  const totalStudents = allSummaries.length

  const studentSelectOptions = useMemo(
    () =>
      allSummaries.map((summary, index) => {
        const code = String(summary.header.ma_hoc_vien || "").trim()
        const name = String(summary.header.ho_ten || "").trim()
        const label = [code, name].filter(Boolean).join(" — ") || summary.student.id
        return {
          value: summary.student.id,
          label: `${index + 1}. ${label}`,
        }
      }),
    [allSummaries]
  )

  useEffect(() => {
    if (!isOpen) return
    const loaded = loadPlvbPrintSettings(variant)
    if (input?.defaultColumns) {
      loaded.columns = input.defaultColumns
    }
    setSettings(loaded)
    setSelectedStudentIds((input?.students || []).map((s) => s.id))
  }, [isOpen, input?.defaultColumns, input?.students, variant])

  const summaries = useMemo(() => {
    if (!selectedStudentIds.length) return []
    const selected = new Set(selectedStudentIds)
    return allSummaries.filter((summary) => selected.has(summary.student.id))
  }, [allSummaries, selectedStudentIds])

  /** Hệ QT: danh sách môn HKDK 1–2 để chọn hiện/ẩn */
  const hkdk12SubjectOptions = useMemo(() => {
    const map = new Map<string, { key: string; name: string; hocKyDuKien: number }>()
    for (const student of input?.students || []) {
      for (const semester of student.semesters || []) {
        if (isGraduationSemesterGroup(semester.id)) continue
        for (const subject of semester.subjects || []) {
          const hk = Number(subject.hocKyDuKien)
          if (hk !== 1 && hk !== 2) continue
          const key = plvbSubjectSelectKey(subject)
          if (!key || map.has(key)) continue
          map.set(key, {
            key,
            name: String(subject.tenHocPhan || key).trim(),
            hocKyDuKien: hk,
          })
        }
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => a.hocKyDuKien - b.hocKyDuKien || a.name.localeCompare(b.name, "vi")
    )
  }, [input?.students])

  const signDate = input?.printDate ? dayjs(input.printDate) : dayjs()
  const signerName = input?.signerName?.trim() || ""

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    // Tránh header trình duyệt in tiêu đề "Học viện kỹ thuật quân sự"
    documentTitle: "\u00A0",
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: ${settings.marginTopMm}mm ${settings.marginRightMm}mm ${settings.marginBottomMm}mm ${settings.marginLeftMm}mm;
      }
      @media print {
        html, body {
          width: 210mm;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .plvb-print-root {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box;
          transform: none !important;
        }
        .plvb-print-root table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
        }
        .plvb-print-root .plvb-score-table-wrap {
          border: none !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        /* Khung ngoài trên table — giữ viền phải khi in */
        .plvb-print-root .plvb-score-table {
          border: ${RULE_EMPH_PT} solid #000 !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          border-collapse: collapse !important;
        }
        .plvb-print-root .plvb-score-table th,
        .plvb-print-root .plvb-score-table td {
          border: ${RULE_FAINT} !important;
          box-shadow: none !important;
        }
        /* Khung ngoài + đường chia 2 cột đậm; STT / tín chỉ / thang điểm mờ */
        .plvb-print-root .plvb-score-table tr > *:first-child {
          border-left: ${RULE_EMPH_PT} solid #000 !important;
        }
        .plvb-print-root .plvb-score-table tr > *:last-child {
          border-right: ${RULE_EMPH_PT} solid #000 !important;
        }
        .plvb-print-root .plvb-score-table .plvb-stt,
        .plvb-print-root .plvb-score-table .plvb-credits,
        .plvb-print-root .plvb-score-table .plvb-score-col {
          border-left: ${RULE_FAINT} !important;
          border-right: ${RULE_FAINT} !important;
        }
        .plvb-print-root .plvb-score-table .plvb-col-divider {
          border-right: ${RULE_EMPH_PT} solid #000 !important;
        }
        /* Tránh đôi nét: STT nửa phải không vẽ border-left cạnh đường chia */
        .plvb-print-root .plvb-score-table .plvb-after-divider {
          border-left: none !important;
        }
        .plvb-print-root .plvb-score-table .plvb-thead-top th,
        .plvb-print-root .plvb-score-table th[rowspan] {
          border-top: ${RULE_EMPH_PT} solid #000 !important;
        }
        .plvb-print-root .plvb-score-table thead .plvb-thead-bottom th,
        .plvb-print-root .plvb-score-table thead th[rowspan] {
          border-bottom: ${RULE_EMPH_PT} solid #000 !important;
        }
        .plvb-print-root .plvb-score-table tbody tr:has(+ .plvb-grad-banner-row) > * {
          border-bottom: ${RULE_EMPH_PT} solid #000 !important;
        }
        .plvb-print-root .plvb-score-table .plvb-grad-banner {
          border-top: none !important;
          border-bottom: ${RULE_EMPH_PT} solid #000 !important;
          border-left: ${RULE_EMPH_PT} solid #000 !important;
          border-right: ${RULE_EMPH_PT} solid #000 !important;
          box-shadow: none !important;
        }
        .plvb-print-root .plvb-score-table .plvb-grad-banner-row + tr > * {
          border-top: none !important;
        }
        .plvb-print-root .plvb-score-table tbody tr:last-child > * {
          border-bottom: ${RULE_EMPH_PT} solid #000 !important;
        }
        .plvb-print-root .plvb-score-table thead {
          display: table-header-group !important;
        }
        /* Một nét 0.5pt: bỏ border gốc kẻ đè với ::after / tfoot */
        .plvb-print-root .plvb-score-table thead .plvb-thead-bottom th,
        .plvb-print-root .plvb-score-table thead th[rowspan] {
          position: relative;
          border-bottom-width: 0 !important;
        }
        .plvb-print-root .plvb-score-table thead .plvb-thead-bottom th::after,
        .plvb-print-root .plvb-score-table thead th[rowspan]::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: ${RULE_EMPH_PT};
          background: #000;
          pointer-events: none;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .plvb-print-root .plvb-score-table tbody td {
          border-top-width: 0 !important;
        }
        /* Trang cuối: khung bảng + hàng cuối + tfoot chồng thành nét đậm. Chỉ giữ tfoot. */
        .plvb-print-root .plvb-score-table {
          border-bottom: none !important;
        }
        .plvb-print-root .plvb-score-table tbody tr:last-child > * {
          border-bottom: none !important;
        }
        .plvb-print-root .plvb-score-table tfoot.plvb-page-rule {
          display: table-footer-group;
        }
        .plvb-print-root .plvb-score-table tfoot.plvb-page-rule td {
          border: none !important;
          border-top: ${RULE_EMPH_PT} solid #000 !important;
          padding: 0 !important;
          height: 0 !important;
          line-height: 0 !important;
          font-size: 0 !important;
          color: transparent !important;
          box-shadow: none !important;
        }
        .page-break { page-break-after: always; break-after: page; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      }
    `,
  })

  const updateSetting = <K extends keyof PlvbPrintSettings>(
    key: K,
    value: PlvbPrintSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      savePlvbPrintSettings(next, variant)
      return next
    })
  }

  const ptField = (
    label: string,
    key: keyof PlvbPrintSettings,
    opts?: { min?: number; max?: number; step?: number; fallback?: number }
  ) => (
    <div>
      <div className="mb-1 text-xs text-gray-500">{label}</div>
      <InputNumber
        className="w-full"
        min={opts?.min ?? 4}
        max={opts?.max ?? 80}
        step={opts?.step ?? 0.5}
        value={settings[key] as number}
        onChange={(v) =>
          updateSetting(key, (Number(v) || opts?.fallback || 0) as PlvbPrintSettings[typeof key])
        }
      />
    </div>
  )

  const resetSettings = () => {
    const defaults = getDefaultPlvbPrintSettings(variant)
    const next = {
      ...defaults,
      columns: input?.defaultColumns ?? defaults.columns,
    }
    setSettings(next)
    savePlvbPrintSettings(next, variant)
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="min(96vw, 1440px)"
      style={{ top: 12 }}
      styles={{ body: { paddingTop: 8, paddingBottom: 12 } }}
      title={
        <div className="flex w-[98%] flex-wrap items-center justify-between gap-2 pr-6">
          <span>
            In phụ lục văn bằng — {VARIANT_LABEL[variant]} (
            {settings.columns === 2 ? "2 cột" : "1 cột"})
            {totalStudents > 0 ? (
              <span className="ml-1 font-normal text-gray-500">
                · {summaries.length}/{totalStudents} người
              </span>
            ) : null}
          </span>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => handlePrint()}
            disabled={!summaries.length}
          >
            In
          </Button>
        </div>
      }
    >
      <div className="flex gap-3" style={{ height: "calc(100vh - 130px)", minHeight: 520 }}>
        <aside className="flex w-[420px] shrink-0 flex-col overflow-hidden rounded border border-gray-200 bg-gray-50/60">
          <div className="shrink-0 border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
            Cấu hình in
            <span className="ml-1 font-normal text-gray-400">(lưu trình duyệt)</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Bố cục bảng điểm</div>
                <Radio.Group
                  value={settings.columns}
                  onChange={(e) => updateSetting("columns", e.target.value)}
                >
                  <Radio value={1}>1 cột</Radio>
                  <Radio value={2}>2 cột</Radio>
                </Radio.Group>
              </div>
              <div className="col-span-2">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500">
                    Chọn học viên in ({selectedStudentIds.length}/{totalStudents || 0})
                  </div>
                  <Space size="small">
                    <Button
                      size="small"
                      type="link"
                      className="px-0"
                      disabled={!totalStudents}
                      onClick={() => setSelectedStudentIds(allSummaries.map((s) => s.student.id))}
                    >
                      Chọn tất cả
                    </Button>
                    <Button
                      size="small"
                      type="link"
                      className="px-0"
                      disabled={!selectedStudentIds.length}
                      onClick={() => setSelectedStudentIds([])}
                    >
                      Bỏ chọn
                    </Button>
                  </Space>
                </div>
                <Select
                  className="w-full"
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn học viên để in"
                  disabled={!totalStudents}
                  maxTagCount="responsive"
                  value={selectedStudentIds}
                  options={studentSelectOptions}
                  onChange={(ids) => setSelectedStudentIds(ids)}
                />
              </div>

              <div className="col-span-2 border-t border-gray-200 pt-2 text-xs font-medium text-gray-600">
                Phông chữ & cỡ chữ
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Phông chữ</div>
                <Input
                  value={settings.fontFamily}
                  onChange={(e) => updateSetting("fontFamily", e.target.value)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Cỡ chữ bảng điểm</div>
                <InputNumber
                  className="w-full"
                  min={8}
                  max={16}
                  value={settings.bodyFontSize}
                  onChange={(v) => updateSetting("bodyFontSize", Number(v) || 10)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Cỡ chữ tiêu đề cột</div>
                <InputNumber
                  className="w-full"
                  min={8}
                  max={14}
                  value={settings.headerFontSize}
                  onChange={(v) => updateSetting("headerFontSize", Number(v) || 9)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Cỡ chữ thông tin SV</div>
                <InputNumber
                  className="w-full"
                  min={10}
                  max={14}
                  value={settings.infoFontSize}
                  onChange={(v) => updateSetting("infoFontSize", Number(v) || 12)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Cỡ chữ ghi chú cuối</div>
                <InputNumber
                  className="w-full"
                  min={8}
                  max={14}
                  value={settings.noteFontSize}
                  onChange={(v) => updateSetting("noteFontSize", Number(v) || 10)}
                />
              </div>

              <div className="col-span-2 border-t border-gray-200 pt-2 text-xs font-medium text-gray-600">
                Hàng môn học & lề trang
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">
                  Tên môn dài quá → xuống dòng (ký tự)
                </div>
                <InputNumber
                  className="w-full"
                  min={20}
                  max={80}
                  value={settings.nameOneLineMax}
                  onChange={(v) => updateSetting("nameOneLineMax", Number(v) || 34)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Chiều cao hàng 1 dòng (pt)</div>
                <InputNumber
                  className="w-full"
                  min={12}
                  max={40}
                  step={0.1}
                  value={settings.rowHeight1}
                  onChange={(v) => updateSetting("rowHeight1", Number(v) || 15.6)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Chiều cao hàng 2 dòng (pt)</div>
                <InputNumber
                  className="w-full"
                  min={18}
                  max={60}
                  step={0.1}
                  value={settings.rowHeight2}
                  onChange={(v) => updateSetting("rowHeight2", Number(v) || 25.5)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Khoảng cách 2 dòng tên môn</div>
                <InputNumber
                  className="w-full"
                  min={0.8}
                  max={2}
                  step={0.05}
                  value={settings.nameLineHeight}
                  onChange={(v) => updateSetting("nameLineHeight", Number(v) || 1.1)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Lề trên (mm)</div>
                <InputNumber
                  className="w-full"
                  min={0}
                  max={40}
                  value={settings.marginTopMm}
                  onChange={(v) => updateSetting("marginTopMm", Number(v) || 0)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Lề dưới (mm)</div>
                <InputNumber
                  className="w-full"
                  min={0}
                  max={40}
                  value={settings.marginBottomMm}
                  onChange={(v) => updateSetting("marginBottomMm", Number(v) || 0)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Lề trái (mm)</div>
                <InputNumber
                  className="w-full"
                  min={0}
                  max={40}
                  value={settings.marginLeftMm}
                  onChange={(v) => updateSetting("marginLeftMm", Number(v) || 0)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">Lề phải (mm)</div>
                <InputNumber
                  className="w-full"
                  min={0}
                  max={40}
                  value={settings.marginRightMm}
                  onChange={(v) => updateSetting("marginRightMm", Number(v) || 0)}
                />
              </div>

              <div className="col-span-2 border-t border-gray-200 pt-2 text-xs font-medium text-gray-600">
                Nội dung đầu trang & chữ ký
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Tiêu đề phụ lục</div>
                <Input
                  value={settings.title}
                  onChange={(e) => updateSetting("title", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">
                  Dòng phụ đề (dùng {"{trinh_do}"}, {"{so_hieu}"} để chèn tự động)
                </div>
                <Input
                  value={settings.subtitleTemplate}
                  onChange={(e) => updateSetting("subtitleTemplate", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">
                  Cơ quan cấp trên (góc trái, dòng 1)
                </div>
                <Input
                  value={settings.headerLeftLine1}
                  onChange={(e) => updateSetting("headerLeftLine1", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Tên đơn vị (góc trái, dòng 2)</div>
                <Input
                  value={settings.headerLeftLine2}
                  onChange={(e) => updateSetting("headerLeftLine2", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">
                  Từ cần gạch chân trong tên đơn vị (vd: KỸ THUẬT)
                </div>
                <Input
                  value={settings.headerLeftLine2Underline}
                  onChange={(e) => updateSetting("headerLeftLine2Underline", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Quốc hiệu (góc phải, dòng 1)</div>
                <Input
                  value={settings.headerRightLine1}
                  onChange={(e) => updateSetting("headerRightLine1", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Tiêu ngữ (góc phải, dòng 2)</div>
                <Input
                  value={settings.headerRightLine2}
                  onChange={(e) => updateSetting("headerRightLine2", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Nhãn trước bảng điểm</div>
                <Input
                  value={settings.trainingResultLabel}
                  onChange={(e) => updateSetting("trainingResultLabel", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Chức danh ký — dòng 1</div>
                <Input
                  value={settings.signerTitle1}
                  onChange={(e) => updateSetting("signerTitle1", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs text-gray-500">Chức danh ký — dòng 2</div>
                <Input
                  value={settings.signerTitle2}
                  onChange={(e) => updateSetting("signerTitle2", e.target.value)}
                />
              </div>

              <div className="col-span-2 border-t border-gray-200 pt-2 text-xs font-medium text-gray-600">
                Khoảng cách & cỡ chữ đầu trang (pt)
              </div>
              {ptField("Cơ quan cấp trên — chiều cao", "headerLeftLine1Height", { fallback: 16 })}
              {ptField("Cơ quan cấp trên — cỡ chữ", "headerLeftLine1FontSize", {
                min: 8,
                max: 20,
                fallback: 13,
              })}
              {ptField("Tên đơn vị — chiều cao", "headerLeftLine2Height", { fallback: 18 })}
              {ptField("Tên đơn vị — cỡ chữ", "headerLeftLine2FontSize", {
                min: 8,
                max: 20,
                fallback: 13,
              })}
              {ptField("Quốc hiệu — chiều cao", "headerRightLine1Height", { fallback: 16 })}
              {ptField("Quốc hiệu — cỡ chữ", "headerRightLine1FontSize", {
                min: 8,
                max: 20,
                fallback: 13,
              })}
              {ptField("Tiêu ngữ — chiều cao", "headerRightLine2Height", { fallback: 18 })}
              {ptField("Tiêu ngữ — cỡ chữ", "headerRightLine2FontSize", {
                min: 8,
                max: 20,
                fallback: 14,
              })}
              {ptField("Khoảng cách xuống tiêu đề", "titleBlockMarginTop", {
                min: 0,
                fallback: 10,
              })}
              {ptField("Tiêu đề phụ lục — chiều cao", "titleLineHeight", { fallback: 18 })}
              {ptField("Tiêu đề phụ lục — cỡ chữ", "titleFontSize", {
                min: 8,
                max: 22,
                fallback: 14,
              })}
              {ptField("Dòng phụ đề — chiều cao", "subtitleLineHeight", { fallback: 16 })}
              {ptField("Dòng phụ đề — cỡ chữ", "subtitleFontSize", {
                min: 8,
                max: 18,
                fallback: 12,
              })}

              <div className="col-span-2 border-t border-gray-200 pt-2 text-xs font-medium text-gray-600">
                Tổng kết & chữ ký (pt)
              </div>
              {ptField("Cỡ chữ khối tổng kết", "summaryFontSize", {
                min: 8,
                max: 16,
                fallback: 12,
              })}
              {ptField("Dòng ngày ký — chiều cao", "signDateLineHeight", {
                fallback: 15.9,
                step: 0.1,
              })}
              {ptField("Chức danh dòng 1 — chiều cao", "signerTitle1LineHeight", {
                fallback: 18,
              })}
              {ptField("Chức danh dòng 1 — cỡ chữ", "signerTitle1FontSize", {
                min: 8,
                max: 20,
                fallback: 14,
              })}
              {ptField("Chức danh dòng 2 — chiều cao", "signerTitle2LineHeight", {
                fallback: 18,
              })}
              {ptField("Chức danh dòng 2 — cỡ chữ", "signerTitle2FontSize", {
                min: 8,
                max: 20,
                fallback: 14,
              })}
              {ptField("Khoảng trống chỗ ký", "signerGapHeight", {
                min: 12,
                max: 120,
                fallback: 48,
              })}
              {ptField("Tên người ký — chiều cao", "signerNameLineHeight", { fallback: 16 })}
              {ptField("Tên người ký — cỡ chữ", "signerNameFontSize", {
                min: 8,
                max: 18,
                fallback: 12,
              })}

              <div className="col-span-2 flex flex-col gap-1">
                <Checkbox
                  checked={settings.showScore10}
                  onChange={(e) => updateSetting("showScore10", e.target.checked)}
                >
                  Hiện thang điểm 10
                </Checkbox>
                <Checkbox
                  checked={settings.showScore4}
                  onChange={(e) => updateSetting("showScore4", e.target.checked)}
                >
                  Hiện thang điểm 4
                </Checkbox>
                <Checkbox
                  checked={settings.showLetterGrade}
                  onChange={(e) => updateSetting("showLetterGrade", e.target.checked)}
                >
                  Hiện thang điểm chữ
                </Checkbox>
                <Checkbox
                  checked={settings.showGraduationSection}
                  onChange={(e) => updateSetting("showGraduationSection", e.target.checked)}
                >
                  Tách khối học phần tốt nghiệp
                </Checkbox>
                <Checkbox
                  checked={settings.showTrainingResultLabel}
                  onChange={(e) => updateSetting("showTrainingResultLabel", e.target.checked)}
                >
                  Kết quả đào tạo
                </Checkbox>
                <Checkbox
                  checked={settings.showRegistryNumber}
                  onChange={(e) => updateSetting("showRegistryNumber", e.target.checked)}
                >
                  Số vào sổ
                </Checkbox>
              </div>
              <div className="col-span-2">
                <Button onClick={resetSettings}>Khôi phục mặc định</Button>
              </div>

              {variant === "international" ? (
                <div className="col-span-2 border-t border-gray-200 pt-2">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-medium text-gray-600">
                      Môn HKDK 1–2 (bỏ chọn để ẩn khi in; môn khác luôn hiện)
                    </div>
                    <Space size="small">
                      <Button
                        size="small"
                        type="link"
                        className="px-0"
                        disabled={!hkdk12SubjectOptions.length}
                        onClick={() => updateSetting("hiddenHkdk12SubjectKeys", [])}
                      >
                        Chọn tất cả
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        className="px-0"
                        disabled={!hkdk12SubjectOptions.length}
                        onClick={() =>
                          updateSetting(
                            "hiddenHkdk12SubjectKeys",
                            hkdk12SubjectOptions.map((item) => item.key)
                          )
                        }
                      >
                        Bỏ chọn tất cả
                      </Button>
                    </Space>
                  </div>
                  {!hkdk12SubjectOptions.length ? (
                    <div className="text-xs text-gray-400">
                      Không có môn học kỳ dự kiến 1 hoặc 2 trong dữ liệu đang in.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-auto rounded border border-gray-100 bg-white p-2">
                      <div className="grid grid-cols-1 gap-1">
                        {hkdk12SubjectOptions.map((item) => {
                          const checked = !(settings.hiddenHkdk12SubjectKeys || []).includes(
                            item.key
                          )
                          return (
                            <Checkbox
                              key={item.key}
                              checked={checked}
                              onChange={(e) => {
                                const hidden = new Set(settings.hiddenHkdk12SubjectKeys || [])
                                if (e.target.checked) hidden.delete(item.key)
                                else hidden.add(item.key)
                                updateSetting("hiddenHkdk12SubjectKeys", Array.from(hidden))
                              }}
                            >
                              <span className="text-xs">
                                <span className="text-gray-400">HK{item.hocKyDuKien}</span>{" "}
                                {item.name}
                              </span>
                            </Checkbox>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded border border-gray-200 bg-white">
          <div className="shrink-0 border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
            Xem trước
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {!summaries.length ? (
              <div className="py-10 text-center text-gray-500">Không có dữ liệu để in</div>
            ) : (
              <div ref={printRef} className="plvb-print-root">
                <style>{`
                  .plvb-print-root .plvb-score-table-wrap {
                    border: none;
                    padding: 0;
                    overflow: visible;
                  }
                  .plvb-print-root .plvb-score-table {
                    border: ${RULE_EMPH_PT} solid #000 !important;
                    box-sizing: border-box;
                    border-collapse: collapse !important;
                  }
                  .plvb-print-root .plvb-score-table th,
                  .plvb-print-root .plvb-score-table td {
                    border: ${RULE_FAINT} !important;
                    box-shadow: none !important;
                  }
                  .plvb-print-root .plvb-score-table tr > *:first-child {
                    border-left: ${RULE_EMPH_PT} solid #000 !important;
                  }
                  .plvb-print-root .plvb-score-table tr > *:last-child {
                    border-right: ${RULE_EMPH_PT} solid #000 !important;
                  }
                  .plvb-print-root .plvb-score-table .plvb-stt,
                  .plvb-print-root .plvb-score-table .plvb-credits,
                  .plvb-print-root .plvb-score-table .plvb-score-col {
                    border-left: ${RULE_FAINT} !important;
                    border-right: ${RULE_FAINT} !important;
                  }
                  .plvb-print-root .plvb-score-table .plvb-col-divider {
                    border-right: ${RULE_EMPH_PT} solid #000 !important;
                  }
                  .plvb-print-root .plvb-score-table .plvb-after-divider {
                    border-left: none !important;
                  }
                  .plvb-print-root .plvb-score-table .plvb-thead-top th,
                  .plvb-print-root .plvb-score-table th[rowspan] {
                    border-top: ${RULE_EMPH_PT} solid #000 !important;
                  }
                  .plvb-print-root .plvb-score-table thead .plvb-thead-bottom th,
                  .plvb-print-root .plvb-score-table thead th[rowspan] {
                    border-bottom: ${RULE_EMPH_PT} solid #000 !important;
                  }
                  .plvb-print-root .plvb-score-table tbody tr:has(+ .plvb-grad-banner-row) > * {
                    border-bottom: ${RULE_EMPH_PT} solid #000 !important;
                  }
                  .plvb-print-root .plvb-score-table .plvb-grad-banner {
                    border-top: none !important;
                    border-bottom: ${RULE_EMPH_PT} solid #000 !important;
                    border-left: ${RULE_EMPH_PT} solid #000 !important;
                    border-right: ${RULE_EMPH_PT} solid #000 !important;
                    box-shadow: none !important;
                  }
                  .plvb-print-root .plvb-score-table .plvb-grad-banner-row + tr > * {
                    border-top: none !important;
                  }
                  .plvb-print-root .plvb-score-table tbody tr:last-child > * {
                    border-bottom: ${RULE_EMPH_PT} solid #000 !important;
                  }
                  @media screen {
                    .plvb-print-root .plvb-score-table tfoot.plvb-page-rule td {
                      border: none !important;
                      padding: 0 !important;
                      height: 0 !important;
                      line-height: 0 !important;
                      font-size: 0 !important;
                      color: transparent !important;
                    }
                  }
                  @media print {
                    .plvb-print-root .plvb-score-table thead .plvb-thead-bottom th,
                    .plvb-print-root .plvb-score-table thead th[rowspan] {
                      position: relative;
                      border-bottom-width: 0 !important;
                    }
                    .plvb-print-root .plvb-score-table thead .plvb-thead-bottom th::after,
                    .plvb-print-root .plvb-score-table thead th[rowspan]::after {
                      content: "";
                      position: absolute;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      height: ${RULE_EMPH_PT};
                      background: #000;
                      pointer-events: none;
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                    .plvb-print-root .plvb-score-table tbody td {
                      border-top-width: 0 !important;
                    }
                    .plvb-print-root .plvb-score-table {
                      border-bottom: none !important;
                    }
                    .plvb-print-root .plvb-score-table tbody tr:last-child > * {
                      border-bottom: none !important;
                    }
                    .plvb-print-root .plvb-score-table tfoot.plvb-page-rule {
                      display: table-footer-group;
                    }
                    .plvb-print-root .plvb-score-table tfoot.plvb-page-rule td {
                      border: none !important;
                      border-top: ${RULE_EMPH_PT} solid #000 !important;
                      padding: 0 !important;
                      height: 0 !important;
                      line-height: 0 !important;
                      font-size: 0 !important;
                      color: transparent !important;
                      box-shadow: none !important;
                    }
                  }
                `}</style>
                {summaries.map((summary, index) => (
                  <StudentAppendixPage
                    key={summary.student.id}
                    summary={summary}
                    settings={settings}
                    variant={variant}
                    signDate={signDate}
                    signerName={signerName}
                    isLast={index === summaries.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalPrintPhuLucVb
