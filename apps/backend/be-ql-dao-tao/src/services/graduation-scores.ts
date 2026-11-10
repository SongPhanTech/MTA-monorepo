import {
  SubjectRequirementType,
  type ScoreConvert,
  type SubjectClassType,
  type TrainingBlockSubject,
} from "@workspace/db"
import { courseScoreConfigFrom, isFailedByCourseConfig } from "@workspace/libs/utils"
import Decimal from "decimal.js"
import { prisma } from ".."

export type GraduationCourseScoreConfig = {
  scoreToPass: number
  scoreToPassConditional: number
  scoreToPassGraduation: number
  scoreToRetain: number
  scoreToTakeExam?: number | null
  examScoreToPass?: number | null
  scoreConverts: Pick<
    ScoreConvert,
    "base10Min" | "base10Max" | "base4" | "letter" | "pass" | "improvementRegister"
  >[]
}

export type GraduationCurriculumSubjectInput = Pick<
  TrainingBlockSubject,
  "subjectId" | "type" | "useForFinalScore" | "graduation"
> & {
  subject: { name: string; credit: number; code?: string | null; subjectId?: string }
}

/**
 * Ngưỡng tín chỉ cùng tập môn với GPA:
 * môn có tính điểm tổng kết, tự chọn chỉ đến hạn mức tín chỉ tự chọn.
 * Môn điều kiện không cộng.
 */
export function sumRequiredCredits(
  subjects: Array<{
    type: SubjectRequirementType
    useForFinalScore: boolean
    subject: { credit: number }
  }>,
  electiveCreditsRequired = 0
) {
  let mandatoryCredits = 0
  let electiveCredits = 0
  for (const subject of subjects) {
    if (!subject.useForFinalScore) continue
    const credit = subject.subject.credit || 0
    if (subject.type === SubjectRequirementType.Optional) electiveCredits += credit
    else mandatoryCredits += credit
  }
  const countedElectiveCredits = Math.min(electiveCredits, Math.max(electiveCreditsRequired, 0))
  return mandatoryCredits + countedElectiveCredits
}

export type ResolvedGraduationScore = {
  id: string
  subjectVersionId: string
  attendanceScore: number | null
  midtermScore: number | null
  examScore: number | null
  scoreBase10: Decimal
  scoreBase4: Decimal
  letter: string | null
  canImprove: boolean
  /** miễn học theo chứng chỉ Đạt/Không đạt, không có điểm */
  exempted?: boolean
  /** điểm thay thế theo môn tương đương: id các bản ghi điểm gốc (môn ngoài CTĐT) */
  sourceScoreIds?: string[]
  subjectVersion: {
    id: string
    name: string
    code: string | null
    credit: number
    subjectId: string
  }
}

export type ResolveGraduationScoresResult = {
  finalScores: Map<string, ResolvedGraduationScore>
  markDoneScores: Map<string, ResolvedGraduationScore>
  subjectScoresMap: Map<string, ResolvedGraduationScore>
  displayScoresMap: Map<string, ResolvedGraduationScore>
  curriculumDisplayScores: Map<string, ResolvedGraduationScore>
  processedSubjects: Set<string>
  equivalencyNotes: Map<string, string>
  equivalencyScores: Map<string, ResolvedGraduationScore>
  totalDebtCredit: number
  issueReasons: string[]
  subjectReasons: string[]
  accumulatedElectiveCredits: number
  totalScoreBase10: Decimal
  totalScoreBase4: Decimal
  totalPassCredit: number
  courseGradeLowest: number
  graduationCourseGradeLowest: number
}

function toScoreBase10(score: {
  manualFinalScore?: number | null
  finalScore?: Decimal | number | null
}): Decimal | null {
  if (score.manualFinalScore != null && !Number.isNaN(Number(score.manualFinalScore))) {
    return new Decimal(score.manualFinalScore)
  }
  if (score.finalScore != null) {
    const value = new Decimal(score.finalScore)
    return value.isNaN() ? null : value
  }
  return null
}

function isPassedByCourseRules(
  curriculumSubject: GraduationCurriculumSubjectInput | undefined,
  scoreBase10: Decimal,
  record: {
    attendanceScore?: number | null
    midtermScore?: number | null
    examScore?: number | null
  },
  course: GraduationCourseScoreConfig,
  scoreConvert: GraduationCourseScoreConfig["scoreConverts"][number] | undefined
) {
  if (
    isFailedByCourseConfig(
      courseScoreConfigFrom(
        course,
        {
          attendanceScore: record.attendanceScore,
          midtermScore: record.midtermScore,
          examScore: record.examScore,
        },
        {
          isGraduation: !!curriculumSubject?.graduation,
          isConditional:
            !!curriculumSubject &&
            !curriculumSubject.graduation &&
            !curriculumSubject.useForFinalScore,
        }
      ),
      scoreBase10.toNumber()
    )
  ) {
    return false
  }

  if (scoreConvert && !scoreConvert.pass) return false
  return true
}

/** Môn điều kiện: không tính điểm tổng kết, không phải môn tốt nghiệp (VD: GDQP-AN) */
function isConditionalSubject(curriculumSubject: GraduationCurriculumSubjectInput | undefined) {
  return !!curriculumSubject && !curriculumSubject.graduation && !curriculumSubject.useForFinalScore
}

function keepHighestScore(
  map: Map<string, ResolvedGraduationScore>,
  score: ResolvedGraduationScore
) {
  const current = map.get(score.subjectVersionId)
  if (current && current.scoreBase10.gte(score.scoreBase10)) return
  map.set(score.subjectVersionId, score)
}

export function sameSubjectCode(left?: string | null, right?: string | null) {
  const a = left?.trim()
  const b = right?.trim()
  return !!a && !!b && a === b
}

/** Chỉ lấy điểm đúng phiên bản môn CTĐT, hoặc cùng mã môn. Không lấy phiên bản khác (012463 ≠ 012469). */
function findScoreForCurriculumSubject(
  subject: GraduationCurriculumSubjectInput,
  map: Map<string, ResolvedGraduationScore>,
  usedScoreIds: Set<string>
) {
  // điểm miễn chỉ dùng cho môn điều kiện, không bao giờ cho môn tính GPA
  const usable = (item: ResolvedGraduationScore) =>
    !usedScoreIds.has(item.id) && (!item.exempted || isConditionalSubject(subject))

  const exact = map.get(subject.subjectId)
  if (exact && usable(exact)) return exact

  const matches = [...map.values()]
    .filter((item) => sameSubjectCode(item.subjectVersion.code, subject.subject.code))
    .filter(usable)
    .sort((a, b) => b.scoreBase10.cmp(a.scoreBase10))
  return matches[0]
}

export type LoadedSubjectScore = {
  id: string
  studentId: string
  subjectVersionId: string
  attendanceScore: number | null
  midtermScore: number | null
  examScore: number | null
  manualFinalScore: number | null
  finalScore: Decimal | number | null
  examPostponed: boolean
  exempted: boolean
  withdrew: boolean
  suspended: boolean
  examBanned: boolean
  repeated: boolean
  isImproving: boolean
  examBannedReason: string | null
  suspendedReason: string | null
  /** loại lớp học phần: RETAKE = học lại, REEXAM = thi lại (dùng cho tiêu chí tự định nghĩa) */
  subjectClass: { type: SubjectClassType } | null
  subjectVersion: {
    id: string
    name: string
    code: string | null
    credit: number
    subjectId: string
  }
}

type LoadedIssueScore = {
  studentId: string
  subjectVersionId: string
  examBanned: boolean
  examBannedReason: string | null
  suspended: boolean
  suspendedReason: string | null
  subjectVersion: { id: string; name: string; code: string | null; credit: number }
}

type LoadedEquivalencyGroup = {
  id: string
  subjects: Array<{
    subjectId: string
    side: string
    subject: { id: string; name: string; code: string | null; credit: number }
  }>
}

function groupByStudentId<T extends { studentId: string }>(items: T[]) {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(item.studentId)
    if (list) list.push(item)
    else map.set(item.studentId, [item])
  }
  return map
}

export async function loadGraduationScoreSources(input: {
  studentIds: string[]
  curriculumSubjectIds: string[]
}) {
  const { studentIds, curriculumSubjectIds } = input
  if (studentIds.length === 0) {
    return {
      rawScoresByStudent: new Map<string, LoadedSubjectScore[]>(),
      issueScoresByStudent: new Map<string, LoadedIssueScore[]>(),
      equivalencyGroups: [] as LoadedEquivalencyGroup[],
    }
  }

  const [rawSubjectScores, issueScores, equivalencyGroups] = await Promise.all([
    prisma.studentSubjectScore.findMany({
      where: {
        studentId: { in: studentIds },
        deletedAt: null,
        AND: [
          {
            OR: [{ subjectClassId: null }, { subjectClass: { cancelled: false } }],
          },
          {
            OR: [
              { manualFinalScore: { not: null } },
              { finalScore: { not: null } },
              // miễn học từ phiên chứng chỉ Đạt/Không đạt (không có điểm)
              { exempted: true, certificates: { some: {} } },
            ],
          },
        ],
      },
      include: {
        subjectVersion: {
          select: { id: true, name: true, code: true, credit: true, subjectId: true },
        },
        subjectClass: { select: { type: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.studentSubjectScore.findMany({
      where: {
        studentId: { in: studentIds },
        deletedAt: null,
        active: true,
        AND: [
          { OR: [{ subjectClassId: null }, { subjectClass: { cancelled: false } }] },
          { OR: [{ examBanned: true }, { suspended: true }] },
        ],
      },
      include: { subjectVersion: { select: { id: true, name: true, code: true, credit: true } } },
    }),
    curriculumSubjectIds.length
      ? prisma.equivalencyGroup.findMany({
          where: {
            deletedAt: null,
            active: true,
            subjects: {
              some: {
                subjectId: { in: curriculumSubjectIds },
              },
            },
          },
          include: {
            subjects: {
              where: { deletedAt: null },
              include: { subject: { select: { id: true, name: true, code: true, credit: true } } },
            },
          },
        })
      : Promise.resolve([]),
  ])

  return {
    rawScoresByStudent: groupByStudentId(rawSubjectScores as LoadedSubjectScore[]),
    issueScoresByStudent: groupByStudentId(issueScores as LoadedIssueScore[]),
    equivalencyGroups: equivalencyGroups as LoadedEquivalencyGroup[],
  }
}

export function computeGraduationSubjectScores(input: {
  curriculumSubjects: GraduationCurriculumSubjectInput[]
  trainingCourse: GraduationCourseScoreConfig
  electiveCreditsRequired: number
  rawSubjectScores: LoadedSubjectScore[]
  issueScores: LoadedIssueScore[]
  equivalencyGroups: LoadedEquivalencyGroup[]
}): ResolveGraduationScoresResult {
  const {
    curriculumSubjects,
    trainingCourse,
    electiveCreditsRequired,
    rawSubjectScores,
    issueScores,
    equivalencyGroups,
  } = input
  const { scoreToRetain, scoreConverts } = trainingCourse

  const displayScoresMap = new Map<string, ResolvedGraduationScore>()
  const subjectScoresMap = new Map<string, ResolvedGraduationScore>()
  // bản ghi miễn học không điểm nhưng môn trong CTĐT không phải môn điều kiện (để ghi lý do)
  const ignoredExemptions: LoadedSubjectScore[] = []

  for (const subjectScore of rawSubjectScores) {
    const curriculumSubject =
      curriculumSubjects.find((subject) => subject.subjectId === subjectScore.subjectVersionId) ||
      curriculumSubjects.find((subject) =>
        sameSubjectCode(subject.subject.code, subjectScore.subjectVersion.code)
      )
    const scoreBase10 = toScoreBase10(subjectScore)

    // Miễn học không điểm chỉ công nhận đạt cho môn điều kiện, không vào GPA/tín chỉ
    if (!scoreBase10 && subjectScore.exempted && isConditionalSubject(curriculumSubject)) {
      keepHighestScore(subjectScoresMap, {
        id: subjectScore.id,
        subjectVersionId: subjectScore.subjectVersionId,
        attendanceScore: null,
        midtermScore: null,
        examScore: null,
        scoreBase10: new Decimal(0),
        scoreBase4: new Decimal(0),
        letter: null,
        canImprove: false,
        exempted: true,
        subjectVersion: subjectScore.subjectVersion,
      })
      continue
    }
    if (!scoreBase10) {
      if (subjectScore.exempted) ignoredExemptions.push(subjectScore)
      continue
    }

    const scoreConvert = scoreConverts.find(
      (item) =>
        new Decimal(item.base10Min).lte(scoreBase10) && new Decimal(item.base10Max).gte(scoreBase10)
    )
    const resolved: ResolvedGraduationScore = {
      id: subjectScore.id,
      subjectVersionId: subjectScore.subjectVersionId,
      attendanceScore: subjectScore.attendanceScore,
      midtermScore: subjectScore.midtermScore,
      examScore: subjectScore.examScore,
      scoreBase10,
      scoreBase4: new Decimal(scoreConvert?.base4 || 0),
      letter: scoreConvert?.letter ?? null,
      canImprove: scoreConvert?.improvementRegister || false,
      subjectVersion: subjectScore.subjectVersion,
    }
    keepHighestScore(displayScoresMap, resolved)

    if (
      subjectScore.examPostponed ||
      subjectScore.exempted ||
      subjectScore.withdrew ||
      subjectScore.suspended ||
      subjectScore.examBanned
    ) {
      continue
    }
    if (subjectScore.repeated && scoreBase10.lt(scoreToRetain)) continue

    if (
      !isPassedByCourseRules(
        curriculumSubject,
        scoreBase10,
        subjectScore,
        trainingCourse,
        scoreConvert
      )
    ) {
      continue
    }
    keepHighestScore(subjectScoresMap, resolved)
  }

  const finalScores = new Map<string, ResolvedGraduationScore>()
  const markDoneScores = new Map<string, ResolvedGraduationScore>()
  const processedSubjects = new Set<string>()
  const processedEquivalencyGroups = new Set<string>()
  const equivalencyNotes = new Map<string, string>()
  const equivalencyScores = new Map<string, ResolvedGraduationScore>()
  const curriculumDisplayScores = new Map<string, ResolvedGraduationScore>()
  const usedScoreIds = new Set<string>()
  const subjectReasons: string[] = []
  const missingSubjectReason = (subject: GraduationCurriculumSubjectInput) => {
    const hasIgnoredExemption = ignoredExemptions.some(
      (item) =>
        item.subjectVersionId === subject.subjectId ||
        sameSubjectCode(item.subjectVersion.code, subject.subject.code)
    )
    return hasIgnoredExemption
      ? `Chưa đạt môn bắt buộc (${subject.subject.name}): có miễn học theo chứng chỉ nhưng CTĐT đang cấu hình môn tính điểm tổng kết/môn tốt nghiệp`
      : `Chưa đạt môn bắt buộc (${subject.subject.name})`
  }

  const curriculumVersionIds = new Set(curriculumSubjects.map((item) => item.subjectId))
  const curriculumSubjectById = new Map(curriculumSubjects.map((item) => [item.subjectId, item]))
  // mã môn (đã trim) → môn CTĐT đầu tiên có mã đó (giống find + sameSubjectCode)
  const curriculumSubjectByCode = new Map<string, GraduationCurriculumSubjectInput>()
  for (const item of curriculumSubjects) {
    const code = item.subject.code?.trim()
    if (code && !curriculumSubjectByCode.has(code)) curriculumSubjectByCode.set(code, item)
  }
  const findCurriculumSubjectByCode = (code?: string | null) => {
    const key = code?.trim()
    return key ? curriculumSubjectByCode.get(key) : undefined
  }
  // môn → các nhóm tương đương chứa môn đó (giữ thứ tự gốc)
  const groupsBySubjectId = new Map<string, LoadedEquivalencyGroup[]>()
  for (const group of equivalencyGroups) {
    for (const subjectId of new Set(group.subjects.map((item) => item.subjectId))) {
      const list = groupsBySubjectId.get(subjectId)
      if (list) list.push(group)
      else groupsBySubjectId.set(subjectId, [group])
    }
  }

  const assignScore = (subjectId: string, score: ResolvedGraduationScore) => {
    const subjectInCurriculum = curriculumSubjectById.get(subjectId)
    if (subjectInCurriculum && !subjectInCurriculum.useForFinalScore) {
      markDoneScores.set(subjectId, score)
      finalScores.delete(subjectId)
      return
    }
    finalScores.set(subjectId, score)
    markDoneScores.delete(subjectId)
  }

  const useScore = (subjectId: string, score: ResolvedGraduationScore) => {
    usedScoreIds.add(score.id)
    assignScore(subjectId, score)
  }

  const getGroupSubjectScore = (subjectId: string) => {
    const curriculumSubject = curriculumSubjectById.get(subjectId)
    if (curriculumSubject) {
      return (
        finalScores.get(subjectId) ||
        markDoneScores.get(subjectId) ||
        findScoreForCurriculumSubject(curriculumSubject, subjectScoresMap, usedScoreIds)
      )
    }
    const score = subjectScoresMap.get(subjectId)
    if (!score || usedScoreIds.has(score.id)) return undefined
    // điểm trùng mã với môn CTĐT thuộc về môn đó, không dùng để thay thế môn khác
    if (findCurriculumSubjectByCode(score.subjectVersion.code)) return undefined
    return score
  }

  const buildReplacementScore = (
    target: GraduationCurriculumSubjectInput,
    sources: ResolvedGraduationScore[]
  ): ResolvedGraduationScore | null => {
    const [first] = sources
    if (!first) return null

    const conditional = isConditionalSubject(target)
    const hasExempted = sources.some((item) => item.exempted)
    if (hasExempted && !conditional) return null

    const subjectVersion = {
      id: target.subjectId,
      name: target.subject.name,
      code: target.subject.code ?? null,
      credit: target.subject.credit,
      subjectId: target.subject.subjectId ?? first.subjectVersion.subjectId,
    }
    const sourceScoreIds = sources.map((item) => item.id)

    if (hasExempted) {
      return {
        id: first.id,
        subjectVersionId: target.subjectId,
        attendanceScore: null,
        midtermScore: null,
        examScore: null,
        scoreBase10: new Decimal(0),
        scoreBase4: new Decimal(0),
        letter: null,
        canImprove: false,
        exempted: true,
        sourceScoreIds,
        subjectVersion,
      }
    }

    const single = sources.length === 1
    const totalCredit = sources.reduce((sum, item) => sum + item.subjectVersion.credit, 0)
    const weightOf = (item: ResolvedGraduationScore) =>
      totalCredit > 0 ? item.subjectVersion.credit : 1
    const totalWeight = sources.reduce((sum, item) => sum + weightOf(item), 0)
    const scoreBase10 = single
      ? first.scoreBase10
      : sources
          .reduce((sum, item) => sum.add(item.scoreBase10.mul(weightOf(item))), new Decimal(0))
          .div(totalWeight)
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

    const scoreConvert = scoreConverts.find(
      (item) =>
        new Decimal(item.base10Min).lte(scoreBase10) && new Decimal(item.base10Max).gte(scoreBase10)
    )
    const record = single ? first : { attendanceScore: null, midtermScore: null, examScore: null }
    if (!isPassedByCourseRules(target, scoreBase10, record, trainingCourse, scoreConvert)) {
      return null
    }

    return {
      id: first.id,
      subjectVersionId: target.subjectId,
      attendanceScore: record.attendanceScore,
      midtermScore: record.midtermScore,
      examScore: record.examScore,
      scoreBase10,
      scoreBase4: new Decimal(scoreConvert?.base4 || 0),
      letter: scoreConvert?.letter ?? null,
      canImprove: scoreConvert?.improvementRegister || false,
      sourceScoreIds,
      subjectVersion,
    }
  }

  for (const subject of curriculumSubjects) {
    if (
      finalScores.has(subject.subjectId) ||
      markDoneScores.has(subject.subjectId) ||
      processedSubjects.has(subject.subjectId)
    ) {
      continue
    }

    const displayScore = findScoreForCurriculumSubject(subject, displayScoresMap, new Set())
    if (displayScore) curriculumDisplayScores.set(subject.subjectId, displayScore)

    const subjectScore = findScoreForCurriculumSubject(subject, subjectScoresMap, usedScoreIds)
    if (subjectScore) {
      usedScoreIds.add(subjectScore.id)
      assignScore(subject.subjectId, subjectScore)
      continue
    }

    const equivGroups = (groupsBySubjectId.get(subject.subjectId) ?? []).filter(
      ({ id }) => !processedEquivalencyGroups.has(id)
    )

    if (!subjectScore && !equivGroups.length) {
      if (subject.type === SubjectRequirementType.Mandatory) {
        subjectReasons.push(missingSubjectReason(subject))
      }
      continue
    }

    let hasEquivalencyGroup = false
    for (const equivGroup of equivGroups) {
      const equivalencyGroupSubject = equivGroup.subjects.find(
        ({ subjectId }) => subject.subjectId === subjectId
      )
      if (!equivalencyGroupSubject) continue

      const side = equivalencyGroupSubject.side
      const curriculumSide = equivGroup.subjects.filter(
        (item) => item.side === side && curriculumVersionIds.has(item.subjectId)
      )
      const otherSide = equivGroup.subjects.filter((item) => item.side !== side)
      if (!otherSide.length) continue

      const otherSideResult = otherSide.map((item) => ({
        ...item,
        score: getGroupSubjectScore(item.subjectId),
      }))
      if (otherSideResult.some((item) => !item.score)) continue

      const curriculumSideResult = curriculumSide.map((item) => ({
        ...item,
        score: getGroupSubjectScore(item.subjectId),
      }))
      const missing = curriculumSideResult.filter((item) => !item.score)
      if (!missing.length) continue

      const outsideScores = otherSideResult
        .filter((item) => !curriculumVersionIds.has(item.subjectId))
        .map((item) => item.score as ResolvedGraduationScore)
      const replacements = new Map<string, ResolvedGraduationScore>()
      if (outsideScores.length) {
        let allPassed = true
        for (const item of missing) {
          const target = curriculumSubjectById.get(item.subjectId)
          const replacement = target ? buildReplacementScore(target, outsideScores) : null
          if (!replacement) {
            allPassed = false
            break
          }
          replacements.set(item.subjectId, replacement)
        }
        if (!allPassed) continue
      }

      hasEquivalencyGroup = true
      processedEquivalencyGroups.add(equivGroup.id)

      const replacementNote = `Đạt bằng môn tương đương: ${otherSideResult
        .map((item) => `${item.subject.code ? `${item.subject.code} - ` : ""}${item.subject.name}`)
        .join(", ")}`

      for (const item of curriculumSideResult) {
        if (item.score) {
          useScore(item.subjectId, item.score)
          continue
        }
        equivalencyNotes.set(item.subjectId, replacementNote)
        const replacement = replacements.get(item.subjectId)
        if (replacement) {
          equivalencyScores.set(item.subjectId, replacement)
          assignScore(item.subjectId, replacement)
        } else {
          processedSubjects.add(item.subjectId)
        }
      }

      for (const item of otherSideResult) {
        const score = item.score as ResolvedGraduationScore
        if (curriculumVersionIds.has(item.subjectId)) useScore(item.subjectId, score)
        else usedScoreIds.add(score.id)
      }
      break
    }

    if (!hasEquivalencyGroup && subject.type === SubjectRequirementType.Mandatory) {
      subjectReasons.push(missingSubjectReason(subject))
    }
  }

  const electiveSubjects = curriculumSubjects.filter(
    (subject) =>
      subject.type === SubjectRequirementType.Optional && !processedSubjects.has(subject.subjectId)
  )

  const passedElectives = electiveSubjects
    .map((subject) => ({
      subject,
      score: finalScores.get(subject.subjectId),
    }))
    .filter(
      (item): item is { subject: typeof item.subject; score: ResolvedGraduationScore } =>
        item.score !== undefined
    )
    .sort((a, b) => b.score.scoreBase10.cmp(a.score.scoreBase10))

  let accumulatedElectiveCredits = 0
  for (const { subject, score } of passedElectives) {
    if (accumulatedElectiveCredits >= electiveCreditsRequired) {
      finalScores.delete(subject.subjectId)
      markDoneScores.set(subject.subjectId, score)
    } else {
      accumulatedElectiveCredits += subject.subject.credit
    }
  }

  if (accumulatedElectiveCredits < electiveCreditsRequired) {
    subjectReasons.push(
      `Chưa đủ tín chỉ tự chọn (${accumulatedElectiveCredits}/${electiveCreditsRequired} TC)`
    )
  }

  let totalScoreBase10 = new Decimal(0)
  let totalScoreBase4 = new Decimal(0)
  let totalPassCredit = 0
  let courseGradeLowest = Number.POSITIVE_INFINITY
  let graduationCourseGradeLowest = Number.POSITIVE_INFINITY

  for (const [subjectId, score] of finalScores) {
    const credit = score.subjectVersion.credit
    totalScoreBase10 = totalScoreBase10.add(score.scoreBase10.mul(credit))
    totalScoreBase4 = totalScoreBase4.add(score.scoreBase4.mul(credit))
    totalPassCredit += credit

    if (score.scoreBase10.lt(courseGradeLowest)) {
      courseGradeLowest = score.scoreBase10.toNumber()
    }

    const subjectInCurriculum = curriculumSubjectById.get(subjectId)
    if (subjectInCurriculum?.graduation && score.scoreBase10.lt(graduationCourseGradeLowest)) {
      graduationCourseGradeLowest = score.scoreBase10.toNumber()
    }
  }

  if (courseGradeLowest === Number.POSITIVE_INFINITY) courseGradeLowest = 0
  if (graduationCourseGradeLowest === Number.POSITIVE_INFINITY) graduationCourseGradeLowest = 0

  const issueReasons: string[] = []
  const debtSubjectIds = new Set<string>()

  for (const subject of curriculumSubjects) {
    if (
      finalScores.has(subject.subjectId) ||
      markDoneScores.has(subject.subjectId) ||
      processedSubjects.has(subject.subjectId)
    ) {
      continue
    }
    if (subject.type === SubjectRequirementType.Optional) continue
    debtSubjectIds.add(subject.subjectId)
  }

  const issueBySubject = new Map<
    string,
    { name: string; examBannedReasons: string[]; suspendedReasons: string[] }
  >()
  // môn CTĐT đã đạt / đạt bằng môn tương đương / đã được miễn bởi nhóm tương đương
  const isCurriculumSubjectResolved = (subjectId: string) =>
    finalScores.has(subjectId) || markDoneScores.has(subjectId) || processedSubjects.has(subjectId)

  for (const score of issueScores) {
    if (subjectScoresMap.has(score.subjectVersionId)) continue
    const issueCurriculumSubject =
      curriculumSubjectById.get(score.subjectVersionId) ||
      findCurriculumSubjectByCode(score.subjectVersion.code)
    if (issueCurriculumSubject && isCurriculumSubjectResolved(issueCurriculumSubject.subjectId)) {
      continue
    }
    const current = issueBySubject.get(score.subjectVersionId) ?? {
      name: score.subjectVersion.name,
      examBannedReasons: [],
      suspendedReasons: [],
    }
    if (score.examBanned && score.examBannedReason) {
      current.examBannedReasons.push(score.examBannedReason)
    }
    if (score.suspended && score.suspendedReason) {
      current.suspendedReasons.push(score.suspendedReason)
    }
    issueBySubject.set(score.subjectVersionId, current)
    if (!curriculumVersionIds.has(score.subjectVersionId)) {
      debtSubjectIds.add(score.subjectVersionId)
    }
  }

  for (const [subjectId, issue] of issueBySubject) {
    if (!debtSubjectIds.has(subjectId) && subjectScoresMap.has(subjectId)) continue
    for (const reason of [...new Set(issue.examBannedReasons)]) {
      issueReasons.push(`Môn ${issue.name}: ${reason}`)
    }
    for (const reason of [...new Set(issue.suspendedReasons)]) {
      issueReasons.push(`Môn ${issue.name}: ${reason}`)
    }
  }

  let totalDebtCredit = 0
  for (const subjectId of debtSubjectIds) {
    const curriculumSubject = curriculumSubjectById.get(subjectId)
    const score = subjectScoresMap.get(subjectId)
    totalDebtCredit += curriculumSubject?.subject.credit || score?.subjectVersion.credit || 0
  }

  return {
    finalScores,
    markDoneScores,
    subjectScoresMap,
    displayScoresMap,
    curriculumDisplayScores,
    processedSubjects,
    equivalencyNotes,
    equivalencyScores,
    totalDebtCredit,
    issueReasons,
    subjectReasons,
    accumulatedElectiveCredits,
    totalScoreBase10,
    totalScoreBase4,
    totalPassCredit,
    courseGradeLowest,
    graduationCourseGradeLowest,
  }
}

export async function resolveGraduationSubjectScores(input: {
  studentId: string
  curriculumSubjects: GraduationCurriculumSubjectInput[]
  trainingCourse: GraduationCourseScoreConfig
  electiveCreditsRequired: number
}): Promise<ResolveGraduationScoresResult> {
  const { studentId, curriculumSubjects, trainingCourse, electiveCreditsRequired } = input
  const sources = await loadGraduationScoreSources({
    studentIds: [studentId],
    curriculumSubjectIds: curriculumSubjects.map((subject) => subject.subjectId),
  })
  return computeGraduationSubjectScores({
    curriculumSubjects,
    trainingCourse,
    electiveCreditsRequired,
    rawSubjectScores: sources.rawScoresByStudent.get(studentId) ?? [],
    issueScores: sources.issueScoresByStudent.get(studentId) ?? [],
    equivalencyGroups: sources.equivalencyGroups,
  })
}

export const graduationCurriculumSelect = {
  id: true,
  name: true,
  requiredCredits: true,
  electiveCredits: true,
  diplomaType: true,
  trainingBlocks: {
    where: { deletedAt: null, active: true },
    include: {
      trainingBlock: { select: { id: true, code: true, name: true } },
      subjects: {
        where: { deletedAt: null, active: true },
        include: {
          subject: {
            select: { id: true, name: true, code: true, credit: true, subjectId: true, type: true },
          },
        },
      },
    },
  },
  curriculum: { include: { trainingMajor: true } },
} as const

export type GraduationTranscriptSubject = {
  id: string
  subjectVersionId: string
  code: string | null
  name: string
  credit: number
  type: SubjectRequirementType | null
  attendanceScore: number | null
  midtermScore: number | null
  examScore: number | null
  finalScore: number | null
  scoreBase4: number | null
  letter: string | null
  passed: boolean
  /** miễn học theo chứng chỉ Đạt/Không đạt: hiển thị "Miễn" thay cho điểm */
  exempted: boolean
  usedForGpa: boolean
  equivalentNote: string | null
}

export type GraduationTranscriptBlock = {
  id: string
  code: string | null
  name: string
  subjectsInCurriculum: GraduationTranscriptSubject[]
}

export type GraduationTranscript = {
  studentId: string
  fullname: string
  studentCode: string | null
  curriculumVersionName: string | null
  gpaBase10: number
  gpaBase4: number
  totalPassCredit: number
  requiredCredits: number | null
  accumulatedElectiveCredits: number
  electiveCreditsRequired: number
  curriculumBlocks: GraduationTranscriptBlock[]
  extraCurriculumSubjects: GraduationTranscriptSubject[]
  conditionalSubjects: GraduationTranscriptSubject[]
}

function toTranscriptSubject(input: {
  id: string
  subjectVersionId: string
  code: string | null
  name: string
  credit: number
  type: SubjectRequirementType | null
  score?: ResolvedGraduationScore | null
  usedForGpa: boolean
  /** đã đạt (kể cả đạt bằng môn tương đương / được miễn bởi nhóm tương đương) */
  passed: boolean
  equivalentNote?: string | null
}): GraduationTranscriptSubject {
  return {
    id: input.id,
    subjectVersionId: input.subjectVersionId,
    code: input.code,
    name: input.name,
    credit: input.credit,
    type: input.type,
    attendanceScore: input.score?.attendanceScore ?? null,
    midtermScore: input.score?.midtermScore ?? null,
    examScore: input.score?.examScore ?? null,
    finalScore: input.score && !input.score.exempted ? input.score.scoreBase10.toNumber() : null,
    scoreBase4: input.score && !input.score.exempted ? input.score.scoreBase4.toNumber() : null,
    letter: input.score?.letter ?? null,
    passed: input.passed,
    exempted: !!input.score?.exempted,
    usedForGpa: input.usedForGpa,
    equivalentNote: input.equivalentNote ?? null,
  }
}

export async function buildGraduationTranscript(
  studentId: string
): Promise<{ data: GraduationTranscript } | { error: string; status: 400 | 404 }> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: {
      id: true,
      userProfile: { select: { fullname: true, code: true } },
      curriculumVersion: { select: graduationCurriculumSelect },
      fixedClass: {
        select: {
          trainingCourse: {
            select: {
              scoreToPass: true,
              scoreToPassConditional: true,
              scoreToPassGraduation: true,
              scoreToRetain: true,
              scoreToTakeExam: true,
              examScoreToPass: true,
              scoreConverts: { where: { deletedAt: null, active: true } },
            },
          },
          curriculumVersion: { select: graduationCurriculumSelect },
        },
      },
    },
  })

  if (!student) return { error: "Không tìm thấy sinh viên", status: 404 }
  if (!student.fixedClass) return { error: "Sinh viên không có lớp quản lý", status: 400 }

  const curriculumVersion = student.curriculumVersion || student.fixedClass.curriculumVersion
  if (!curriculumVersion) return { error: "Sinh viên không có CTĐT", status: 400 }

  const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap((block) =>
    block.subjects.map((subject) => ({
      ...subject,
      trainingBlockId: block.trainingBlock.id,
      trainingBlockCode: block.trainingBlock.code,
      trainingBlockName: block.trainingBlock.name,
    }))
  )

  const electiveCreditsRequired = curriculumVersion.trainingBlocks.reduce(
    (sum, block) => sum + block.electiveCreditsRequired,
    0
  )

  const resolved = await resolveGraduationSubjectScores({
    studentId,
    curriculumSubjects,
    trainingCourse: student.fixedClass.trainingCourse,
    electiveCreditsRequired,
  })

  const usedScoreIds = new Set(
    [...resolved.finalScores.values(), ...resolved.markDoneScores.values()].flatMap((item) => [
      item.id,
      ...(item.sourceScoreIds ?? []),
    ])
  )
  const isResolved = (subjectId: string) =>
    resolved.finalScores.has(subjectId) ||
    resolved.markDoneScores.has(subjectId) ||
    resolved.processedSubjects.has(subjectId)

  const curriculumBlocks: GraduationTranscriptBlock[] = curriculumVersion.trainingBlocks.map(
    (block) => ({
      id: block.trainingBlock.id,
      code: block.trainingBlock.code,
      name: block.trainingBlock.name,
      subjectsInCurriculum: block.subjects
        .filter((subject) => subject.useForFinalScore !== false)
        .map((subject) => {
          const score =
            resolved.equivalencyScores.get(subject.subjectId) ||
            resolved.curriculumDisplayScores.get(subject.subjectId) ||
            resolved.finalScores.get(subject.subjectId) ||
            resolved.subjectScoresMap.get(subject.subjectId)
          return toTranscriptSubject({
            id: subject.id,
            subjectVersionId: subject.subjectId,
            code: subject.subject.code,
            name: subject.subject.name,
            credit: subject.subject.credit,
            type: subject.type,
            score,
            usedForGpa: resolved.finalScores.has(subject.subjectId),
            passed: isResolved(subject.subjectId),
            equivalentNote: resolved.equivalencyNotes.get(subject.subjectId) ?? null,
          })
        }),
    })
  )

  const conditionalSubjects = curriculumSubjects
    .filter((subject) => subject.useForFinalScore === false)
    .map((subject) => {
      const doneScore = resolved.markDoneScores.get(subject.subjectId)
      const score =
        resolved.equivalencyScores.get(subject.subjectId) ||
        (doneScore?.exempted ? doneScore : undefined) ||
        resolved.curriculumDisplayScores.get(subject.subjectId) ||
        doneScore ||
        resolved.subjectScoresMap.get(subject.subjectId)
      return toTranscriptSubject({
        id: subject.id,
        subjectVersionId: subject.subjectId,
        code: subject.subject.code,
        name: subject.subject.name,
        credit: subject.subject.credit,
        type: subject.type,
        score,
        usedForGpa: false,
        passed: isResolved(subject.subjectId),
        equivalentNote: resolved.equivalencyNotes.get(subject.subjectId) ?? null,
      })
    })

  const curriculumSubjectIds = new Set(curriculumSubjects.map((subject) => subject.subjectId))
  const extraCurriculumSubjects = [...resolved.displayScoresMap.values()]
    .filter(
      (score) => !curriculumSubjectIds.has(score.subjectVersionId) && !usedScoreIds.has(score.id)
    )
    .map((score) =>
      toTranscriptSubject({
        id: score.id,
        subjectVersionId: score.subjectVersionId,
        code: score.subjectVersion.code,
        name: score.subjectVersion.name,
        credit: score.subjectVersion.credit,
        type: null,
        score,
        usedForGpa: usedScoreIds.has(score.id),
        passed: resolved.subjectScoresMap.get(score.subjectVersionId)?.id === score.id,
      })
    )

  const gpaBase10 = resolved.totalPassCredit
    ? resolved.totalScoreBase10
        .div(resolved.totalPassCredit)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toNumber()
    : 0
  const gpaBase4 = resolved.totalPassCredit
    ? resolved.totalScoreBase4
        .div(resolved.totalPassCredit)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toNumber()
    : 0

  return {
    data: {
      studentId: student.id,
      fullname: student.userProfile.fullname ?? "",
      studentCode: student.userProfile.code,
      curriculumVersionName: curriculumVersion.name,
      gpaBase10,
      gpaBase4,
      totalPassCredit: resolved.totalPassCredit,
      requiredCredits: sumRequiredCredits(curriculumSubjects, electiveCreditsRequired),
      accumulatedElectiveCredits: resolved.accumulatedElectiveCredits,
      electiveCreditsRequired,
      curriculumBlocks,
      extraCurriculumSubjects,
      conditionalSubjects,
    },
  }
}
