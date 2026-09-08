import { $Enums, type Difficult, QuestionType } from "@workspace/db"

const DEFAULT_PAGINATE_SIZE = 10
const MAX_INPUT_LENGTH = 255
const MAX_TEXTAREA_LENGTH = 1000

const EVALUATION_MEMBER_ROLE = [
  { label: "Chủ tịch hội đồng", value: $Enums.EvaluationMemberRole.CHAIRMAN },
  { label: "Phó chủ tịch", value: $Enums.EvaluationMemberRole.VICE_PRESIDENT },
  { label: "Trưởng ban thư ký", value: $Enums.EvaluationMemberRole.HEAD_SECRETARY },
  { label: "Thư ký", value: $Enums.EvaluationMemberRole.SECRETARY },
  { label: "Uỷ viên", value: $Enums.EvaluationMemberRole.MEMBER },
  { label: "Ban tư vấn", value: $Enums.EvaluationMemberRole.ADVISORY_BOARD },
  { label: "Trưởng nhóm chuyên trách", value: $Enums.EvaluationMemberRole.HEAD_SPECIALIZED },
  { label: "Nhóm chuyên trách", value: $Enums.EvaluationMemberRole.SPECIALIZED },
  { label: "Thành viên ngoài hội đồng", value: $Enums.EvaluationMemberRole.NONCOUNCIL_MEMBERS },
]

const EVALUATION_MEMBER_ROLE_MAP: Record<$Enums.EvaluationMemberRole, string> = {
  [$Enums.EvaluationMemberRole.CHAIRMAN]: "Chủ tịch hội đồng",
  [$Enums.EvaluationMemberRole.VICE_PRESIDENT]: "Phó chủ tịch",
  [$Enums.EvaluationMemberRole.HEAD_SECRETARY]: "Trưởng ban thư ký",
  [$Enums.EvaluationMemberRole.SECRETARY]: "Thư ký",
  [$Enums.EvaluationMemberRole.MEMBER]: "Uỷ viên",
  [$Enums.EvaluationMemberRole.ADVISORY_BOARD]: "Ban tư vấn",
  [$Enums.EvaluationMemberRole.HEAD_SPECIALIZED]: "Trưởng nhóm chuyên trách",
  [$Enums.EvaluationMemberRole.SPECIALIZED]: "Nhóm chuyên trách",
  [$Enums.EvaluationMemberRole.NONCOUNCIL_MEMBERS]: "Thành viên ngoài hội đồng",
}

const EVALUATION_CRITERION_STATUS_OPTIONS = [
  { value: $Enums.EvaluationCriterionStatus.PENDING, label: "Chưa nộp" },
  { value: $Enums.EvaluationCriterionStatus.SUBMITTED, label: "Chờ Thư ký duyệt" },
  { value: $Enums.EvaluationCriterionStatus.APPROVED, label: "Chờ Ban tư vấn duyệt" },
  { value: $Enums.EvaluationCriterionStatus.REVISION, label: "Yêu cầu sửa đổi" },
  { value: $Enums.EvaluationCriterionStatus.COMPLETED, label: "Hoàn thành" },
]

const DEADLINE_OPTIONS = [
  { value: "overdue", label: "Quá hạn" },
  { value: "near", label: "Sắp quá hạn" },
]

const STANDARD_CATALOG_TYPE_OPTIONS = [
  { value: $Enums.StandardCatalogType.PROGRAM, label: "Chương trình đào tạo" },
  { value: $Enums.StandardCatalogType.ASSET, label: "Cơ sở giáo dục" },
]

const SUBJECT_OBJECT = [
  {
    value: $Enums.SurveyObject.MILITARY_STUDENT,
    label: "Sinh viên dân sự",
  },
  {
    value: $Enums.SurveyObject.CIVILIAN_STUDENT,
    label: "Học viên quân sự",
  },
  {
    value: $Enums.SurveyObject.MILITARY_GRADUATE_STUDENT,
    label: "Cao học dân sự",
  },
  {
    value: $Enums.SurveyObject.CIVILIAN_GRADUATE_STUDENT,
    label: "Cao học quân sự",
  },
  {
    value: $Enums.SurveyObject.LECTURER,
    label: "Giảng viên",
  },
  {
    value: $Enums.SurveyObject.STAFF,
    label: "Cán bộ nhân viên",
  },
]

const SURVEY_STUDENT_OBJECT_TYPES: $Enums.SurveyObject[] = [
  $Enums.SurveyObject.MILITARY_STUDENT,
  $Enums.SurveyObject.CIVILIAN_STUDENT,
  $Enums.SurveyObject.MILITARY_GRADUATE_STUDENT,
  $Enums.SurveyObject.CIVILIAN_GRADUATE_STUDENT,
]

const isSurveyStudentObjectType = (value: string) =>
  SURVEY_STUDENT_OBJECT_TYPES.includes(value as $Enums.SurveyObject)

const hasSurveyStudentObjectType = (values: string[] = []) => values.some(isSurveyStudentObjectType)

const getRejectedBy = (rawDesc?: string | null): "ADVISORY_BOARD" | "SECRETARY" | null => {
  if (!rawDesc) return null
  try {
    const parsed = JSON.parse(rawDesc)
    if (typeof parsed === "object" && parsed !== null) {
      return parsed.rejectedBy || null
    }
  } catch {
    return null
  }
  return null
}

const getStatusEvaluation = (
  status: $Enums.EvaluationCriterionStatus,
  rejectedBy?: string | null
) => {
  switch (status) {
    case $Enums.EvaluationCriterionStatus.PENDING:
      return {
        color: "yellow",
        label: "Chưa nộp",
      }
    case $Enums.EvaluationCriterionStatus.SUBMITTED:
      return {
        color: "blue",
        label: "Chờ Thư ký duyệt",
      }
    case $Enums.EvaluationCriterionStatus.APPROVED:
      return {
        color: "cyan",
        label: "Chờ Ban tư vấn duyệt",
      }
    case $Enums.EvaluationCriterionStatus.REVISION:
      return {
        color: "orange",
        label:
          rejectedBy === "ADVISORY_BOARD"
            ? "Ban tư vấn yêu cầu sửa đổi"
            : "Thư ký yêu cầu sửa đổi",
      }
    case $Enums.EvaluationCriterionStatus.COMPLETED:
      return {
        color: "green",
        label: "Hoàn thành",
      }
  }
}

const getStatusConfig = (status: $Enums.EvaluationStatus, rejectedBy?: string | null) => {
  switch (status) {
    case $Enums.EvaluationStatus.LOCK:
      return { color: "default", text: "Khoá" }
    case $Enums.EvaluationStatus.PENDING:
      return { color: "warning", text: "Chưa nộp" }
    case $Enums.EvaluationStatus.SUBMITTED:
      return { color: "processing", text: "Chờ Thư ký duyệt" }
    case $Enums.EvaluationStatus.APPROVED:
      return { color: "cyan", text: "Chờ Ban tư vấn duyệt" }
    case $Enums.EvaluationStatus.REVISION:
      return {
        color: "error",
        text:
          rejectedBy === "ADVISORY_BOARD"
            ? "Ban tư vấn yêu cầu chỉnh sửa"
            : "Thư ký yêu cầu chỉnh sửa",
      }
    case $Enums.EvaluationStatus.COMPLETED:
      return { color: "success", text: "Hoàn thành" }
    default:
      return { color: "default", text: "Không xác định" }
  }
}

const EVALUATION_PERIOD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  [$Enums.EvaluationPeriodStatus.COUNCIL_ESTABLISHED]: {
    label: "Thành lập hội đồng",
    color: "geekblue",
  },
  [$Enums.EvaluationPeriodStatus.ASSIGNMENT]: {
    label: "Phân công đánh giá",
    color: "volcano",
  },
  [$Enums.EvaluationPeriodStatus.ANALYSIS_WRITING]: {
    label: "Viết phiếu phân tích",
    color: "orange",
  },
  [$Enums.EvaluationPeriodStatus.SECRETARY_REVIEW]: {
    label: "Xét duyệt ban tư vấn",
    color: "purple",
  },
  [$Enums.EvaluationPeriodStatus.DIRECTOR_REVIEW]: {
    label: "Xét duyệt trưởng ban thư ký",
    color: "magenta",
  },
  [$Enums.EvaluationPeriodStatus.EVALUATION_WRITING]: {
    label: "Viết phiếu đánh giá",
    color: "cyan",
  },
  [$Enums.EvaluationPeriodStatus.CROSS_REVIEW_ASSIGNMENT]: {
    label: "Phân công phản biện",
    color: "gold",
  },
  [$Enums.EvaluationPeriodStatus.CROSS_REVIEW]: {
    label: "Phản biện chéo",
    color: "lime",
  },
  [$Enums.EvaluationPeriodStatus.CONSOLIDATION]: {
    label: "Tổng hợp phiếu đánh giá",
    color: "green",
  },
  [$Enums.EvaluationPeriodStatus.COUNCIL_APPROVAL]: {
    label: "Xét duyệt cuối cùng",
    color: "red",
  },
  [$Enums.EvaluationPeriodStatus.COMPLETED]: {
    label: "Hoàn thành",
    color: "success",
  },
}

const DIFFICULT_LABELS: Record<Difficult, string> = {
  D1: "Biết",
  D2: "Hiểu",
  D3: "Vận dụng",
  D4: "Vận dụng cao",
}

const LEVEL_COLUMNS = [
  { key: "biet", label: "Biết", difficult: "D1" as Difficult },
  { key: "hieu", label: "Hiểu", difficult: "D2" as Difficult },
  { key: "vanDung", label: "Vận dụng", difficult: "D3" as Difficult },
  { key: "vanDungCao", label: "Vận dụng cao", difficult: "D4" as Difficult },
] as const

const LEVEL_COLORS = [
  { key: "D1", label: "Biết", color: "blue" },
  { key: "D2", label: "Hiểu", color: "cyan" },
  { key: "D3", label: "Vận dụng", color: "orange" },
  { key: "D4", label: "Vận dụng cao", color: "green" },
]

const CLUSTER_QUESTION_TYPE = "CLUSTER" as QuestionType

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.ESSAY]: "Tự luận",
  [QuestionType.ORAL]: "Vấn đáp",
  [QuestionType.SINGLE_CHOICE]: "Trắc nghiệm 1 đáp án",
  [QuestionType.MULTIPLE_CHOICE]: "Trắc nghiệm nhiều đáp án",
  [QuestionType.FILL_IN_BLANK]: "Điền khuyết",
  [QuestionType.ORDERING]: "Sắp xếp",
  [QuestionType.CLUSTER]: "Câu hỏi chùm",
}

const QUESTION_TYPE_OPTIONS: Array<{
  value: QuestionType
  label: string
}> = (() => {
  const fromEnum = Object.values(QuestionType).map((type) => ({
    value: type,
    label: QUESTION_TYPE_LABELS[type] ?? type,
  }))
  if (fromEnum.some((o) => o.value === CLUSTER_QUESTION_TYPE)) return fromEnum
  return [
    ...fromEnum,
    { value: CLUSTER_QUESTION_TYPE, label: QUESTION_TYPE_LABELS[CLUSTER_QUESTION_TYPE] },
  ]
})()

const DIFFICULT_OPTIONS: Array<{
  value: Difficult
  label: string
}> = LEVEL_COLUMNS.map(({ difficult, label }) => ({
  value: difficult,
  label: label,
}))

const FILE_SHOW_LIMIT = 2

export {
  DEFAULT_PAGINATE_SIZE,
  MAX_INPUT_LENGTH,
  MAX_TEXTAREA_LENGTH,
  EVALUATION_MEMBER_ROLE,
  SUBJECT_OBJECT,
  SURVEY_STUDENT_OBJECT_TYPES,
  isSurveyStudentObjectType,
  hasSurveyStudentObjectType,
  getStatusEvaluation,
  getStatusConfig,
  getRejectedBy,
  EVALUATION_PERIOD_STATUS_LABELS,
  EVALUATION_CRITERION_STATUS_OPTIONS,
  DEADLINE_OPTIONS,
  STANDARD_CATALOG_TYPE_OPTIONS,
  DIFFICULT_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  LEVEL_COLORS,
  DIFFICULT_LABELS,
  QUESTION_TYPE_LABELS,
  LEVEL_COLUMNS,
  EVALUATION_MEMBER_ROLE_MAP,
  FILE_SHOW_LIMIT,
}

export type SurveyDocxTemplateVariant = "KHOA" | "BO_MON" | "GIANG_VIEN"

export const SURVEY_DOCX_TEMPLATE_VARIANT_LABEL: Record<SurveyDocxTemplateVariant, string> = {
  GIANG_VIEN: "Giảng viên",
  BO_MON: "Bộ môn",
  KHOA: "Khoa",
}
