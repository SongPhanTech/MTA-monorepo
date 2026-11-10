/**
 * Định nghĩa dùng chung (FE + BE) cho tiêu chí tự định nghĩa (CriteriaDefinition.source = CUSTOM).
 * - calcType: mã calculator, lưu ở CriteriaDefinition.calcType (String, không phải enum DB)
 * - params:   tham số calculator, lưu ở CriteriaDefinition.params (Json)
 * Zod schema của params khai báo ở đây (một nguồn duy nhất), dùng chung:
 *  - FE: kiểm tra trước khi lưu (put-tieu-chi-tu-dinh-nghia)
 *  - BE: kiểm tra lúc xét và tính giá trị (be-ql-dao-tao/src/services/criteria-calculators)
 * Thêm kiểu tính mới: thêm vào CRITERIA_CALC_TYPES + schema params ở đây và calculator ở backend.
 */
import { $Enums } from "@workspace/db"
import { z } from "zod"

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
export const subjectAttemptTypeSchema = z.enum(["RETAKE", "REEXAM", "IMPROVE"])
export type SubjectAttemptType = z.infer<typeof subjectAttemptTypeSchema>

export const subjectAttemptTypeLabels: Record<SubjectAttemptType, string> = {
  RETAKE: "Học lại",
  REEXAM: "Thi lại / bảo vệ lại",
  IMPROVE: "Học cải thiện",
}

export const subjectAggregateMetricSchema = z.enum([
  "COUNT_SUBJECTS",
  "SUM_CREDITS",
  "PERCENT_CREDITS_OF_CURRICULUM",
  "MIN_SCORE",
  "MAX_SCORE",
  "AVG_SCORE",
])
export type SubjectAggregateMetric = z.infer<typeof subjectAggregateMetricSchema>

/**
 * Phạm vi môn, lưu tường minh (không suy ra từ danh sách rỗng):
 *  - ALL:     toàn bộ CTĐT
 *  - LIMITED: chỉ khối kiến thức / môn đã chọn. Nếu các khối/môn này bị xoá hết thì tiêu chí
 *             báo lỗi cấu hình, không âm thầm mở rộng ra toàn bộ CTĐT.
 */
export const subjectScopeSchema = z.enum(["ALL", "LIMITED"])
export type SubjectScope = z.infer<typeof subjectScopeSchema>

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
export const subjectAggregateParamsSchema = z
  .object({
    metric: subjectAggregateMetricSchema,
    /** Phạm vi môn (xem subjectScopeSchema) */
    scope: subjectScopeSchema,
    /** Chỉ môn tốt nghiệp (TrainingBlockSubject.graduation) */
    graduationOnly: z.boolean().optional(),
    /** Loại học phần (SubjectVersion.type), VD: Thesis = ĐATN, Graduation = thi tốt nghiệp */
    subjectVersionTypes: z.array(z.nativeEnum($Enums.SubjectVersionType)).optional(),
    /** Tính cả môn điều kiện (không tính điểm tổng kết: GDQP, GDTC...) */
    includeConditionalSubjects: z.boolean().optional(),
    /** Chỉ môn có lần học thuộc các loại này */
    attemptTypes: z.array(subjectAttemptTypeSchema).optional(),
    /** Điều kiện điểm tổng kết của môn */
    scoreOperator: z.enum(["GT", "GTE", "LT", "LTE", "EQ"]).optional(),
    scoreThreshold: z.number().optional(),
    /** Thang điểm dùng cho điều kiện điểm và metric điểm */
    scoreBase: z.enum(["Base10", "Base4"]).optional(),
  })
  .refine((p) => (p.scoreOperator == null) === (p.scoreThreshold == null), {
    message: "Điều kiện điểm phải có cả toán tử và ngưỡng",
  })
export type SubjectAggregateParams = z.infer<typeof subjectAggregateParamsSchema>

// ---------- ACADEMIC_DECISION_COUNT ----------

export const academicDecisionCountParamsSchema = z.object({
  /** Bỏ trống = mọi loại quyết định */
  actionTypes: z.array(z.nativeEnum($Enums.AcademicActionType)).optional(),
  /** Mặc định: chỉ quyết định đã duyệt */
  statuses: z.array(z.nativeEnum($Enums.DecisionStatus)).optional(),
})
export type AcademicDecisionCountParams = z.infer<typeof academicDecisionCountParamsSchema>

export const academicActionTypeLabels: Record<$Enums.AcademicActionType, string> = {
  REPEAT_YEAR: "Lưu ban",
  SUSPENSION: "Đình chỉ",
  EXPULSION: "Buộc thôi học",
}

// ---------- WARNING_COUNT ----------

export const warningSourceSchema = z.enum(["ACADEMIC", "DISCIPLINARY"])
export type WarningSource = z.infer<typeof warningSourceSchema>

export const warningSourceLabels: Record<WarningSource, string> = {
  ACADEMIC: "Cảnh báo học tập",
  DISCIPLINARY: "Cảnh cáo học đường",
}

export const warningCountParamsSchema = z.object({
  /** Mặc định: cả hai nguồn */
  sources: z.array(warningSourceSchema).optional(),
  /** Chỉ đếm bản ghi có mức >= minLevel (mặc định 1) */
  minLevel: z.number().int().min(0).optional(),
})
export type WarningCountParams = z.infer<typeof warningCountParamsSchema>

// ---------- Registry ----------

export type CriteriaCalcParams = {
  SUBJECT_AGGREGATE: SubjectAggregateParams
  ACADEMIC_DECISION_COUNT: AcademicDecisionCountParams
  WARNING_COUNT: WarningCountParams
}

export const criteriaParamsSchemas: {
  [K in CriteriaCalcType]: z.ZodType<CriteriaCalcParams[K], z.ZodTypeDef, unknown>
} = {
  SUBJECT_AGGREGATE: subjectAggregateParamsSchema,
  ACADEMIC_DECISION_COUNT: academicDecisionCountParamsSchema,
  WARNING_COUNT: warningCountParamsSchema,
}

export function isCriteriaCalcType(value: unknown): value is CriteriaCalcType {
  return (
    typeof value === "string" && Object.prototype.hasOwnProperty.call(criteriaParamsSchemas, value)
  )
}

/**
 * Kiểm tra calcType + params của tiêu chí CUSTOM. Dùng ở FE trước khi lưu và ở BE lúc xét,
 * để lỗi cấu hình được báo cho người cấu hình thay vì làm dừng đợt xét.
 */
export function validateCriteriaParams(
  calcType: unknown,
  params: unknown
):
  | { success: true; calcType: CriteriaCalcType; params: CriteriaCalcParams[CriteriaCalcType] }
  | { success: false; message: string } {
  if (!isCriteriaCalcType(calcType)) {
    return {
      success: false,
      message: `Kiểu tính không được hỗ trợ: ${typeof calcType === "string" && calcType ? calcType : "(trống)"}`,
    }
  }
  const parsed = criteriaParamsSchemas[calcType].safeParse(params ?? {})
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues.map((issue) => issue.message).join("; ") }
  }
  return { success: true, calcType, params: parsed.data }
}
