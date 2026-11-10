import {
  parseSurveyFormDisplayContent,
  type SurveyFormDisplayContent,
  type SurveyFormFieldBindKey,
  type SurveyFormInfoField,
} from "@workspace/libs/survey-form-content"
import { Col, Row } from "antd"
import dayjs from "dayjs"

export type SurveyFormStudentInfo = {
  majorName?: string | null
  facultyName?: string | null
  className?: string | null
  courseName?: string | null
  trainingObjectTypeName?: string | null
}

type FixedClassStudentInfoSource = {
  name?: string | null
  managementOrganization?: { sTen?: string | null } | null
  trainingCourse?: {
    name?: string | null
    trainingObjectType?: { name?: string | null } | null
  } | null
  curriculumVersion?: {
    trainingObjectType?: { name?: string | null } | null
    curriculum?: {
      trainingMajor?: {
        name?: string | null
        organization?: { sTen?: string | null } | null
      } | null
    } | null
  } | null
}

export function mapStudentInfo(
  fixedClass?: FixedClassStudentInfoSource | null
): SurveyFormStudentInfo | null {
  if (!fixedClass) return null

  return {
    majorName: fixedClass.curriculumVersion?.curriculum?.trainingMajor?.name ?? null,
    facultyName:
      fixedClass.curriculumVersion?.curriculum?.trainingMajor?.organization?.sTen ??
      fixedClass.managementOrganization?.sTen ??
      null,
    className: fixedClass.name ?? null,
    courseName: fixedClass.trainingCourse?.name ?? null,
    trainingObjectTypeName:
      fixedClass.curriculumVersion?.trainingObjectType?.name ??
      fixedClass.trainingCourse?.trainingObjectType?.name ??
      null,
  }
}

export type SurveyFormIntroData = {
  formContent?: unknown
  lectureInfo?: {
    firstName?: string | null
    lastName?: string | null
    organization?: string | null
    faculty?: string | null
    department?: string | null
  } | null
  studentInfo?: SurveyFormStudentInfo | null
  subjectClass?: {
    code?: string | null
    name?: string | null
  } | null
  semester?: {
    name?: string | null
    schoolYear?: {
      name?: string | null
    } | null
  } | null
  surveyDate?: string | null
  schoolYear?: string | null
}

type SurveyFormIntroProps = {
  survey?: SurveyFormIntroData | null
  fallback: SurveyFormDisplayContent
  className?: string
}

const joinName = (...parts: (string | null | undefined)[]) =>
  parts.filter((part) => part && part.trim()).join(" ")

function extractSchoolYear(text?: string | null) {
  if (!text) return ""
  const match = text.match(/\d{4}\s*[-–]\s*\d{4}/)
  return match ? match[0].replace(/\s+/g, " ") : ""
}

function inferBindKeyFromLabel(label: string): SurveyFormFieldBindKey | undefined {
  const lower = label.normalize("NFC").toLowerCase()
  // "Khóa" (course) và "Khoa" (faculty) đều thành "khoa" sau khi bỏ dấu.
  // Phân biệt chúng trước khi normalize NFD để form cấu hình tùy chỉnh bind đúng dữ liệu.
  if (/kh(oá|óa)/.test(lower)) return "trainingCourse"

  const clean = lower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")

  if (clean.includes("chuyennganh")) return "trainingMajor"
  if (clean.includes("bomon")) return "department"
  if (clean.includes("khoavien") || clean === "khoa" || clean === "vien") return "faculty"
  if (clean === "lop") return "fixedClass"
  if (clean.includes("khoahoc")) return "trainingCourse"
  if (clean.includes("doituongdaotao") || clean.includes("doituong")) return "trainingObjectType"
  if (clean.includes("namhoc")) return "schoolYear"
  if (
    clean.includes("ngaylayykin") ||
    clean.includes("ngaylayykien") ||
    clean.includes("ngaykhaosat")
  )
    return "surveyDate"
  if (clean.includes("giangvien")) return "lecturerName"
  if (clean.includes("hocphan") || clean.includes("monhoc")) return "subjectClass"
  if (clean.includes("hocky")) return "semester"
  if (clean.includes("donvi") || clean.includes("tochuc")) return "organization"
  return undefined
}

function fieldValue(field: SurveyFormInfoField, survey?: SurveyFormIntroData | null) {
  if (!survey) return ""
  const bindKey = field.bindKey || inferBindKeyFromLabel(field.label)
  if (!bindKey) return ""

  switch (bindKey) {
    case "lecturerName":
      return joinName(survey.lectureInfo?.lastName, survey.lectureInfo?.firstName)
    case "subjectClass":
      return joinName(survey.subjectClass?.code, survey.subjectClass?.name)
    case "organization":
      return (
        survey.lectureInfo?.faculty ||
        survey.lectureInfo?.organization ||
        survey.studentInfo?.facultyName ||
        ""
      )
    case "faculty":
      return survey.lectureInfo?.faculty || survey.studentInfo?.facultyName || ""
    case "department":
      return survey.lectureInfo?.department || ""
    case "semester":
      return survey.semester?.name || ""
    case "schoolYear":
      return (
        survey.schoolYear ||
        survey.semester?.schoolYear?.name ||
        extractSchoolYear(survey.semester?.name) ||
        ""
      )
    case "surveyDate":
      return survey.surveyDate || dayjs().format("DD/MM/YYYY")
    case "trainingMajor":
      return survey.studentInfo?.majorName || ""
    case "fixedClass":
      return survey.studentInfo?.className || ""
    case "trainingCourse":
      return survey.studentInfo?.courseName || ""
    case "trainingObjectType":
      return survey.studentInfo?.trainingObjectTypeName || ""
    default:
      return ""
  }
}

function fieldSpan(field: { fullWidth?: boolean; span?: number }) {
  if (field.span) return field.span
  return field.fullWidth ? 24 : 12
}

export function SurveyFormIntro({ survey, fallback, className }: SurveyFormIntroProps) {
  const content = parseSurveyFormDisplayContent(survey?.formContent, fallback)
  const notes = content.notes.filter((note) => note.trim())
  const infoFields = content.infoFields.map((field, index) => (
    <Col span={fieldSpan(field)} key={`${field.label}-${index}`}>
      <div className="flex items-end">
        <div className="!w-fit whitespace-nowrap">{field.label}</div>
        <span>{fieldValue(field, survey)}</span>
      </div>
    </Col>
  ))
  const noteBlock = notes.map((note, index) => (
    <Col span={24} key={`${index}-${note.slice(0, 24)}`}>
      <div className={`indent-8 italic ${index === 0 ? "mt-4" : ""}`}>{note}</div>
    </Col>
  ))

  return (
    <Row gutter={[0, 2]} className={className ?? "mb-3 text-black color-black"}>
      {content.notesAfterInfo ? (
        <>
          {infoFields}
          {noteBlock}
        </>
      ) : (
        <>
          {noteBlock}
          {content.infoTitle ? (
            <Col span={24}>
              <div className="indent-8 font-bold uppercase">{content.infoTitle}</div>
            </Col>
          ) : null}
          {infoFields}
          {content.contentTitle ? (
            <Col span={24}>
              <div className="indent-8 font-bold uppercase">{content.contentTitle}</div>
            </Col>
          ) : null}
        </>
      )}
    </Row>
  )
}

type SurveyFormFooterProps = {
  survey?: SurveyFormIntroData | null
  fallback: SurveyFormDisplayContent
  className?: string
}

export function SurveyFormFooter({ survey, fallback, className }: SurveyFormFooterProps) {
  const content = parseSurveyFormDisplayContent(survey?.formContent, fallback)
  const footerNotes = (content.footerNotes ?? []).filter((note) => note.trim())
  if (!footerNotes.length) return null

  return (
    <Row gutter={[0, 2]} className={className ?? "my-4 text-black color-black"}>
      {footerNotes.map((note, index) => (
        <Col span={24} key={`${index}-${note.slice(0, 24)}`}>
          <div className="indent-8 italic">{note}</div>
        </Col>
      ))}
    </Row>
  )
}
