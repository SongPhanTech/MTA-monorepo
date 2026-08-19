import {
  parseSurveyFormDisplayContent,
  type SurveyFormDisplayContent,
  type SurveyFormFieldBindKey,
} from "@workspace/libs/survey-form-content"
import { Col, Row } from "antd"

export type SurveyFormIntroData = {
  formContent?: unknown
  lectureInfo?: {
    firstName?: string | null
    lastName?: string | null
    organization?: string | null
  } | null
  subjectClass?: {
    code?: string | null
    name?: string | null
  } | null
  semester?: {
    name?: string | null
  } | null
}

type SurveyFormIntroProps = {
  survey?: SurveyFormIntroData | null
  fallback: SurveyFormDisplayContent
  className?: string
}

const joinName = (...parts: (string | null | undefined)[]) =>
  parts.filter((part) => part && part.trim()).join(" ")

function fieldValue(bindKey: SurveyFormFieldBindKey | undefined, survey?: SurveyFormIntroData | null) {
  if (!bindKey || !survey) return ""
  switch (bindKey) {
    case "lecturerName":
      return joinName(survey.lectureInfo?.lastName, survey.lectureInfo?.firstName)
    case "subjectClass":
      return joinName(survey.subjectClass?.code, survey.subjectClass?.name)
    case "organization":
      return survey.lectureInfo?.organization || ""
    case "semester":
      return survey.semester?.name || ""
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
        <span>{fieldValue(field.bindKey, survey)}</span>
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
