/**
 * Calculator cho tiêu chí tự định nghĩa (CriteriaDefinition.source = CUSTOM).
 * Mỗi calcType = 1 calculator: schema zod kiểm tra params + hàm tính giá trị cho 1 sinh viên.
 * Thêm kiểu tính mới: khai báo calcType/params trong @workspace/libs/criteria-calc rồi thêm calculator ở đây.
 * Calculator là hàm thuần (không query DB); dữ liệu được nạp sẵn trong CriteriaCalcContext.
 */
import {
  AcademicActionType,
  DecisionStatus,
  SubjectClassType,
  SubjectVersionType,
} from "@workspace/db"
import {
  CRITERIA_CALC_TYPES,
  type AcademicDecisionCountParams,
  type CriteriaCalcParams,
  type CriteriaCalcType,
  type SubjectAggregateParams,
  type SubjectAttemptType,
  type WarningCountParams,
} from "@workspace/libs/criteria-calc"
import { z } from "zod"
import {
  sameSubjectCode,
  type LoadedSubjectScore,
  type ResolvedGraduationScore,
} from "./graduation-scores"
import { compareConditionValue } from "./student-result.service"

export type CriteriaCalcCurriculumSubject = {
  /** id SubjectVersion trong CTĐT (khoá của finalScores / markDoneScores) */
  subjectId: string
  trainingBlockId: string
  useForFinalScore: boolean
  graduation: boolean
  subject: {
    code: string | null
    credit: number
    /** id Subject gốc */
    subjectId: string
    type: SubjectVersionType
  }
}

export type CriteriaCalcContext = {
  curriculumSubjects: CriteriaCalcCurriculumSubject[]
  finalScores: Map<string, ResolvedGraduationScore>
  markDoneScores: Map<string, ResolvedGraduationScore>
  rawSubjectScores: LoadedSubjectScore[]
  /** Tổng TC quy định của CTĐT (sumRequiredCredits) */
  requiredCredits: number
  academicDecisions: Array<{
    actionTaken: AcademicActionType
    status: DecisionStatus
    deletedAt: Date | null
  }>
  academicWarnings: Array<{ level: number }>
  disciplinaryWarnings: Array<{ level: number }>
}

/** Tiêu chí CUSTOM đã nạp và kiểm tra params */
export type PreparedCriteria = {
  id: string
  name: string
  calcType: CriteriaCalcType
  params: CriteriaCalcParams[CriteriaCalcType]
  /** Khối kiến thức trong phạm vi, đã gồm khối con */
  trainingBlockIds: Set<string>
  /** Subject gốc trong phạm vi */
  subjectIds: Set<string>
}

type Calculator<P> = {
  schema: z.ZodType<P, z.ZodTypeDef, unknown>
  compute: (ctx: CriteriaCalcContext, criteria: PreparedCriteria, params: P) => number | null
}

// ---------- SUBJECT_AGGREGATE ----------

const subjectAggregateSchema = z
  .object({
    metric: z.enum([
      "COUNT_SUBJECTS",
      "SUM_CREDITS",
      "PERCENT_CREDITS_OF_CURRICULUM",
      "MIN_SCORE",
      "MAX_SCORE",
      "AVG_SCORE",
    ]),
    graduationOnly: z.boolean().optional(),
    subjectVersionTypes: z.array(z.nativeEnum(SubjectVersionType)).optional(),
    includeConditionalSubjects: z.boolean().optional(),
    attemptTypes: z.array(z.enum(["RETAKE", "REEXAM", "IMPROVE"])).optional(),
    scoreOperator: z.enum(["GT", "GTE", "LT", "LTE", "EQ"]).optional(),
    scoreThreshold: z.number().optional(),
    scoreBase: z.enum(["Base10", "Base4"]).optional(),
  })
  .refine((p) => (p.scoreOperator == null) === (p.scoreThreshold == null), {
    message: "Điều kiện điểm phải có cả toán tử và ngưỡng",
  })

function isAttemptOfType(score: LoadedSubjectScore, types: SubjectAttemptType[]) {
  return types.some((type) => {
    if (type === "IMPROVE") return score.isImproving
    if (type === "RETAKE") return score.subjectClass?.type === SubjectClassType.RETAKE
    return score.subjectClass?.type === SubjectClassType.REEXAM
  })
}

function isInScope(subject: CriteriaCalcCurriculumSubject, criteria: PreparedCriteria) {
  if (criteria.trainingBlockIds.size === 0 && criteria.subjectIds.size === 0) return true
  return (
    criteria.trainingBlockIds.has(subject.trainingBlockId) ||
    criteria.subjectIds.has(subject.subject.subjectId)
  )
}

function computeSubjectAggregate(
  ctx: CriteriaCalcContext,
  criteria: PreparedCriteria,
  params: SubjectAggregateParams
): number | null {
  const useBase4 = params.scoreBase === "Base4"
  const attemptTypes = params.attemptTypes ?? []
  const versionTypes = params.subjectVersionTypes ?? []

  // Mỗi môn chỉ tính 1 lần (tín chỉ không nhân theo số lần học, môn có thể nằm ở nhiều khối)
  const subjects = new Map<string, CriteriaCalcCurriculumSubject>()
  for (const subject of ctx.curriculumSubjects) {
    if (!isInScope(subject, criteria)) continue
    if (params.graduationOnly && !subject.graduation) continue
    if (versionTypes.length && !versionTypes.includes(subject.subject.type)) continue
    if (!params.includeConditionalSubjects && !subject.useForFinalScore) continue
    subjects.set(subject.subjectId, subject)
  }

  const items: Array<{ credit: number; score: number | null }> = []
  for (const subject of subjects.values()) {
    if (attemptTypes.length) {
      const hasAttempt = ctx.rawSubjectScores.some(
        (raw) =>
          (raw.subjectVersionId === subject.subjectId ||
            sameSubjectCode(raw.subjectVersion.code, subject.subject.code)) &&
          isAttemptOfType(raw, attemptTypes)
      )
      if (!hasAttempt) continue
    }

    const resolved =
      ctx.finalScores.get(subject.subjectId) ?? ctx.markDoneScores.get(subject.subjectId)
    const score =
      resolved && !resolved.exempted
        ? (useBase4 ? resolved.scoreBase4 : resolved.scoreBase10).toNumber()
        : null

    if (params.scoreOperator != null && params.scoreThreshold != null) {
      const passed = compareConditionValue(score, {
        operator: params.scoreOperator,
        value: params.scoreThreshold,
      })
      if (!passed) continue
    }

    items.push({ credit: subject.subject.credit || 0, score })
  }

  const scored = items.filter(
    (item): item is { credit: number; score: number } => item.score != null
  )
  const sumCredits = (list: Array<{ credit: number }>) =>
    list.reduce((sum, item) => sum + item.credit, 0)

  switch (params.metric) {
    case "COUNT_SUBJECTS":
      return items.length
    case "SUM_CREDITS":
      return sumCredits(items)
    case "PERCENT_CREDITS_OF_CURRICULUM":
      return ctx.requiredCredits ? (sumCredits(items) / ctx.requiredCredits) * 100 : null
    case "MIN_SCORE":
      return scored.length ? Math.min(...scored.map((item) => item.score)) : null
    case "MAX_SCORE":
      return scored.length ? Math.max(...scored.map((item) => item.score)) : null
    case "AVG_SCORE": {
      const credits = sumCredits(scored)
      if (!credits) return null
      return scored.reduce((sum, item) => sum + item.score * item.credit, 0) / credits
    }
  }
}

// ---------- ACADEMIC_DECISION_COUNT ----------

const academicDecisionCountSchema = z.object({
  actionTypes: z.array(z.nativeEnum(AcademicActionType)).optional(),
  statuses: z.array(z.nativeEnum(DecisionStatus)).optional(),
})

function computeAcademicDecisionCount(
  ctx: CriteriaCalcContext,
  _criteria: PreparedCriteria,
  params: AcademicDecisionCountParams
) {
  const actionTypes = params.actionTypes ?? []
  const statuses: DecisionStatus[] = params.statuses?.length
    ? params.statuses
    : [DecisionStatus.APPROVED]
  return ctx.academicDecisions.filter(
    (decision) =>
      !decision.deletedAt &&
      statuses.includes(decision.status) &&
      (!actionTypes.length || actionTypes.includes(decision.actionTaken))
  ).length
}

// ---------- WARNING_COUNT ----------

const warningCountSchema = z.object({
  sources: z.array(z.enum(["ACADEMIC", "DISCIPLINARY"])).optional(),
  minLevel: z.number().int().min(0).optional(),
})

function computeWarningCount(
  ctx: CriteriaCalcContext,
  _criteria: PreparedCriteria,
  params: WarningCountParams
) {
  const sources = params.sources?.length ? params.sources : ["ACADEMIC", "DISCIPLINARY"]
  const minLevel = params.minLevel ?? 1
  let count = 0
  if (sources.includes("ACADEMIC")) {
    count += ctx.academicWarnings.filter((item) => item.level >= minLevel).length
  }
  if (sources.includes("DISCIPLINARY")) {
    count += ctx.disciplinaryWarnings.filter((item) => item.level >= minLevel).length
  }
  return count
}

// ---------- Registry ----------

export const criteriaCalculators: {
  [K in CriteriaCalcType]: Calculator<CriteriaCalcParams[K]>
} = {
  [CRITERIA_CALC_TYPES.SUBJECT_AGGREGATE]: {
    schema: subjectAggregateSchema,
    compute: computeSubjectAggregate,
  },
  [CRITERIA_CALC_TYPES.ACADEMIC_DECISION_COUNT]: {
    schema: academicDecisionCountSchema,
    compute: computeAcademicDecisionCount,
  },
  [CRITERIA_CALC_TYPES.WARNING_COUNT]: {
    schema: warningCountSchema,
    compute: computeWarningCount,
  },
}

function isCalcType(value: string | null): value is CriteriaCalcType {
  return !!value && Object.prototype.hasOwnProperty.call(criteriaCalculators, value)
}

/**
 * Kiểm tra cấu hình tiêu chí CUSTOM. Lỗi cấu hình → throw (dừng cả đợt xét),
 * tránh trường hợp tiêu chí cấu hình sai bị coi là "không thoả" một cách âm thầm.
 */
export function prepareCustomCriteria(
  criteria: {
    id: string
    name: string
    calcType: string | null
    params: unknown
    trainingBlocks: Array<{ id: string }>
    subjects: Array<{ id: string }>
  },
  expandTrainingBlocks: (ids: string[]) => Set<string>
): PreparedCriteria {
  if (!isCalcType(criteria.calcType)) {
    throw new Error(
      `Tiêu chí "${criteria.name}" có kiểu tính không được hỗ trợ: ${criteria.calcType ?? "(trống)"}`
    )
  }
  const calculator = criteriaCalculators[criteria.calcType] as Calculator<unknown>
  const parsed = calculator.schema.safeParse(criteria.params ?? {})
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join("; ")
    throw new Error(`Tiêu chí "${criteria.name}" cấu hình tham số không hợp lệ: ${detail}`)
  }
  return {
    id: criteria.id,
    name: criteria.name,
    calcType: criteria.calcType,
    params: parsed.data as CriteriaCalcParams[CriteriaCalcType],
    trainingBlockIds: expandTrainingBlocks(criteria.trainingBlocks.map((item) => item.id)),
    subjectIds: new Set(criteria.subjects.map((item) => item.id)),
  }
}

export function computeCustomCriteria(ctx: CriteriaCalcContext, criteria: PreparedCriteria) {
  const calculator = criteriaCalculators[criteria.calcType] as Calculator<unknown>
  return calculator.compute(ctx, criteria, criteria.params)
}

/** Trả về hàm mở rộng danh sách khối kiến thức thành khối + toàn bộ khối con */
export function buildTrainingBlockExpander(blocks: Array<{ id: string; parentId: string | null }>) {
  const children = new Map<string, string[]>()
  for (const block of blocks) {
    if (!block.parentId) continue
    const list = children.get(block.parentId)
    if (list) list.push(block.id)
    else children.set(block.parentId, [block.id])
  }
  return (ids: string[]) => {
    const result = new Set<string>()
    const stack = [...ids]
    while (stack.length) {
      const id = stack.pop() as string
      if (result.has(id)) continue
      result.add(id)
      stack.push(...(children.get(id) ?? []))
    }
    return result
  }
}
