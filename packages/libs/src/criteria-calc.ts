/**
 * Định nghĩa dùng chung (FE + BE) cho tiêu chí tự định nghĩa (CriteriaDefinition.source = CUSTOM).
 * - calcType: mã calculator, lưu ở CriteriaDefinition.calcType (String, không phải enum DB)
 * - params:   tham số calculator, lưu ở CriteriaDefinition.params (Json)
 * Backend kiểm tra params bằng zod và tính giá trị: be-ql-dao-tao/src/services/criteria-calculators.
 * Thêm kiểu tính mới: thêm vào CRITERIA_CALC_TYPES + params type ở đây và calculator ở backend.
 */
import type { $Enums, CriteriaOperator } from "@workspace/db"

export const CRITERIA_CALC_TYPES = {
  SUBJECT_AGGREGATE: "SUBJECT_AGGREGATE",
  ACADEMIC_DECISION_COUNT: "ACADEMIC_DECISION_COUNT",
  WARNING_COUNT: "WARNING_COUNT",
} as const

export type CriteriaCalcType = (typeof CRITERIA_CALC_TYPES)[keyof typeof CRITERIA_CALC_TYPES]

export const criteriaCalcTypeLabels: Record<CriteriaCalcType, string> = {
  SUBJECT_AGGREGATE: "Tổng hợp theo môn học",
  ACADEMIC_DECISION_COUNT: "Đếm quyết định xử lý học vụ",
  WARNING_COUNT: "Đếm số lần bị cảnh báo / cảnh cáo",
}

export const criteriaCalcTypeOptions = Object.entries(criteriaCalcTypeLabels).map(
  ([value, label]) => ({ value: value as CriteriaCalcType, label })
)

// ---------- SUBJECT_AGGREGATE ----------

/** Loại lần học của sinh viên với một môn */
export type SubjectAttemptType = "RETAKE" | "REEXAM" | "IMPROVE"

export const subjectAttemptTypeLabels: Record<SubjectAttemptType, string> = {
  RETAKE: "Học lại",
  REEXAM: "Thi lại / bảo vệ lại",
  IMPROVE: "Học cải thiện",
}

export type SubjectAggregateMetric =
  | "COUNT_SUBJECTS"
  | "SUM_CREDITS"
  | "PERCENT_CREDITS_OF_CURRICULUM"
  | "MIN_SCORE"
  | "MAX_SCORE"
  | "AVG_SCORE"

export const subjectAggregateMetricLabels: Record<SubjectAggregateMetric, string> = {
  COUNT_SUBJECTS: "Số môn",
  SUM_CREDITS: "Tổng số tín chỉ",
  PERCENT_CREDITS_OF_CURRICULUM: "Tỷ lệ % tín chỉ so với tổng TC của CTĐT",
  MIN_SCORE: "Điểm thấp nhất",
  MAX_SCORE: "Điểm cao nhất",
  AVG_SCORE: "Điểm trung bình (trọng số tín chỉ)",
}

/**
 * Tập môn = môn trong CTĐT của SV, lọc lần lượt theo:
 *  phạm vi (khối kiến thức gồm khối con / môn học — lưu ở quan hệ trainingBlocks, subjects),
 *  graduationOnly, subjectVersionTypes, includeConditionalSubjects,
 *  attemptTypes (môn có ít nhất một lần học thuộc loại này), điều kiện điểm.
 * Mỗi môn chỉ tính một lần (tín chỉ không nhân theo số lần học).
 */
export type SubjectAggregateParams = {
  metric: SubjectAggregateMetric
  /** Chỉ môn tốt nghiệp (TrainingBlockSubject.graduation) */
  graduationOnly?: boolean
  /** Loại học phần (SubjectVersion.type), VD: Thesis = ĐATN, Graduation = thi tốt nghiệp */
  subjectVersionTypes?: $Enums.SubjectVersionType[]
  /** Tính cả môn điều kiện (không tính điểm tổng kết: GDQP, GDTC...) */
  includeConditionalSubjects?: boolean
  /** Chỉ môn có lần học thuộc các loại này */
  attemptTypes?: SubjectAttemptType[]
  /** Điều kiện điểm tổng kết của môn */
  scoreOperator?: Exclude<CriteriaOperator, "IN">
  scoreThreshold?: number
  /** Thang điểm dùng cho điều kiện điểm và metric điểm */
  scoreBase?: "Base10" | "Base4"
}

// ---------- ACADEMIC_DECISION_COUNT ----------

export type AcademicDecisionCountParams = {
  /** Bỏ trống = mọi loại quyết định */
  actionTypes?: $Enums.AcademicActionType[]
  /** Mặc định: chỉ quyết định đã duyệt */
  statuses?: $Enums.DecisionStatus[]
}

export const academicActionTypeLabels: Record<$Enums.AcademicActionType, string> = {
  REPEAT_YEAR: "Lưu ban",
  SUSPENSION: "Đình chỉ",
  EXPULSION: "Buộc thôi học",
}

// ---------- WARNING_COUNT ----------

export type WarningSource = "ACADEMIC" | "DISCIPLINARY"

export const warningSourceLabels: Record<WarningSource, string> = {
  ACADEMIC: "Cảnh báo học tập",
  DISCIPLINARY: "Cảnh cáo học đường",
}

export type WarningCountParams = {
  /** Mặc định: cả hai nguồn */
  sources?: WarningSource[]
  /** Chỉ đếm bản ghi có mức >= minLevel (mặc định 1) */
  minLevel?: number
}

export type CriteriaCalcParams = {
  SUBJECT_AGGREGATE: SubjectAggregateParams
  ACADEMIC_DECISION_COUNT: AcademicDecisionCountParams
  WARNING_COUNT: WarningCountParams
}
