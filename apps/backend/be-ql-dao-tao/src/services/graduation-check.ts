import {
  AcademicActionType,
  AcademicRankingBaseType,
  ApplicationStatus,
  ArchivedCertificateStatus,
  CriteriaSource,
  RankingContext,
  type CriteriaField,
} from "@workspace/db"
import { criteriaOperatorLabels } from "@workspace/libs/constants"
import { chunk } from "@workspace/libs/utils"
import Decimal from "decimal.js"
import { prisma } from ".."
import type { StudentDataContext } from "../types/student-context"
import {
  buildTrainingBlockExpander,
  computeCustomCriteria,
  prepareCustomCriteria,
  type CriteriaCalcContext,
  type PreparedCriteria,
} from "./criteria-calculators"
import { compareConditionValue, evaluateCondition } from "./student-result.service"
import {
  computeGraduationSubjectScores,
  graduationCurriculumSelect,
  loadGraduationScoreSources,
  sumRequiredCredits,
} from "./graduation-scores"

/**
 * Bộ quy tắc hạ bậc là phép AND của các điều kiện. Bộ chỉ được xét khi không rỗng và mọi tiêu chí
 * còn hoạt động: nếu chỉ bỏ điều kiện của tiêu chí đã ngừng thì bộ sẽ lỏng hơn quy định
 * (nhiều sinh viên bị hạ bậc hơn), nên bỏ qua cả bộ.
 */
function isDowngradeRuleUsable(
  conditions: Array<{ criteria: { active: boolean; deletedAt: Date | null } }>
) {
  return (
    conditions.length > 0 &&
    conditions.every(({ criteria }) => criteria.active && !criteria.deletedAt)
  )
}

function isGpaInGraduationRankRange(
  rank: {
    base10Min: number | null
    base10Max: number | null
    base4Min: number | null
    base4Max: number | null
  },
  cumulativeBase10: Decimal,
  cumulativeBase4: Decimal,
  displayBaseScore: AcademicRankingBaseType | string | null | undefined
) {
  const useBase10 =
    displayBaseScore === AcademicRankingBaseType.Base10 || displayBaseScore === "Base10"

  if (useBase10) {
    if (rank.base10Min == null || rank.base10Max == null) return false
    return cumulativeBase10.gte(rank.base10Min) && cumulativeBase10.lte(rank.base10Max)
  }

  if (rank.base4Min == null || rank.base4Max == null) return false
  return cumulativeBase4.gte(rank.base4Min) && cumulativeBase4.lte(rank.base4Max)
}

export type GraduationCheckItemResult = {
  applicationId: string
  graduation: boolean
  reason: string
  gpa?: number | null
  rank?: { id: string } | null
  trainingMajor: { id: string } | null
  diplomaType: { id: string } | null
  downgraded?: {
    from: unknown
    conditions: unknown[]
  }
}

type ApplicationUpdate = {
  applicationId: string
  gpaScoreIds?: string[]
  supplementaryScoreIds?: string[]
  result: GraduationCheckItemResult
}

export async function runGraduationCheck(input: {
  sessionId: string
  applicationIds?: string[]
}): Promise<{ results: GraduationCheckItemResult[] }> {
  const { sessionId, applicationIds } = input

  const session = await prisma.graduationSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      applications: {
        where: applicationIds?.length
          ? { id: { in: applicationIds } }
          : {
              status: {
                in: [ApplicationStatus.SUBMITTED, ApplicationStatus.IN_REVIEW],
              },
            },
      },
      outputStandard: {
        where: { deletedAt: null, active: true },
        include: {
          certificates: true,
          outputStandardOnCurriculum: {
            where: { deletedAt: null, active: true },
            select: { curriculumVersionId: true, isRequired: true },
          },
        },
      },
    },
  })

  if (session.applications.length === 0) {
    return { results: [] }
  }

  const studentIds = [...new Set(session.applications.map((item) => item.studentId))]
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      academicWarningLevel: true,
      disciplinaryWarningLevel: true,
      entryScore: true,
      foreignLangPass: true,
      curriculumVersionId: true,
      fixedClassId: true,
      _count: { select: { priorityObject: true } },
      classMonitor: { select: { id: true } },
      studentAcademicDecision: true,
      // lịch sử cảnh báo học tập / cảnh cáo học đường (tiêu chí tự định nghĩa WARNING_COUNT)
      academicWarning: { where: { deletedAt: null, active: true }, select: { level: true } },
      disciplinaryWarning: { where: { deletedAt: null, active: true }, select: { level: true } },
      semesterTrainingScore: {
        where: { deletedAt: null },
        take: 1,
        orderBy: { semester: { startDate: "desc" } },
      },
      studentSemesterResult: {
        where: { deletedAt: null },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      studentYearResult: { where: { deletedAt: null }, take: 1, orderBy: { createdAt: "desc" } },
      archivedCertificate: {
        where: { deletedAt: null, status: ArchivedCertificateStatus.APPROVED },
      },
    },
  })

  if (students.length !== studentIds.length) {
    const found = new Set(students.map((item) => item.id))
    const missing = studentIds.find((id) => !found.has(id))
    throw new Error(`Không tìm thấy sinh viên ${missing}`)
  }

  const classIds = [
    ...new Set(students.map((item) => item.fixedClassId).filter((id): id is string => !!id)),
  ]
  const classes = classIds.length
    ? await prisma.fixedClass.findMany({
        where: { id: { in: classIds } },
        select: {
          id: true,
          curriculumVersionId: true,
          trainingCourse: {
            include: {
              scoreConverts: { where: { deletedAt: null, active: true } },
              academicRankingConvert: {
                where: {
                  context: RankingContext.GRADUATION,
                  deletedAt: null,
                  active: true,
                },
                include: {
                  rankingCondition: true,
                  downgradeRules: {
                    where: { deletedAt: null, active: true },
                    include: {
                      initialRank: true,
                      conditions: {
                        // Không lọc theo trạng thái tiêu chí ở đây: bộ quy tắc là phép AND, bỏ riêng
                        // điều kiện của tiêu chí đã ngừng sẽ làm bộ lỏng hơn. Bộ có tiêu chí đã ngừng /
                        // đã xoá bị bỏ qua cả bộ (xem isDowngradeRuleUsable).
                        where: { deletedAt: null, active: true },
                        include: {
                          criteria: {
                            include: {
                              // khối / môn đã xoá mềm không còn thuộc phạm vi
                              trainingBlocks: { where: { deletedAt: null }, select: { id: true } },
                              subjects: { where: { deletedAt: null }, select: { id: true } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                orderBy: { rankOrder: "asc" },
              },
            },
          },
        },
      })
    : []

  const classMap = new Map(classes.map((item) => [item.id, item]))

  // Tiêu chí tự định nghĩa dùng trong quy tắc hạ bậc: kiểm tra cấu hình một lần cho cả đợt xét.
  // Chỉ bộ còn dùng được: tiêu chí đã ngừng (dù cấu hình sai) không làm dừng cả đợt xét.
  const customCriteriaRows = new Map<string, Parameters<typeof prepareCustomCriteria>[0]>()
  for (const fixedClass of classes) {
    for (const rank of fixedClass.trainingCourse.academicRankingConvert) {
      for (const rule of rank.downgradeRules) {
        if (!isDowngradeRuleUsable(rule.conditions)) continue
        for (const condition of rule.conditions) {
          if (condition.criteria.source === CriteriaSource.CUSTOM) {
            customCriteriaRows.set(condition.criteria.id, condition.criteria)
          }
        }
      }
    }
  }
  const usesTrainingBlockScope = [...customCriteriaRows.values()].some(
    (criteria) => criteria.trainingBlocks.length > 0
  )
  const expandTrainingBlocks = buildTrainingBlockExpander(
    usesTrainingBlockScope
      ? await prisma.trainingBlock.findMany({
          where: { deletedAt: null },
          select: { id: true, parentId: true },
        })
      : []
  )
  const preparedCriteria = new Map<string, PreparedCriteria>()
  for (const criteria of customCriteriaRows.values()) {
    preparedCriteria.set(criteria.id, prepareCustomCriteria(criteria, expandTrainingBlocks))
  }
  const curriculumIds = [
    ...new Set(
      [
        ...students.map((item) => item.curriculumVersionId),
        ...classes.map((item) => item.curriculumVersionId),
      ].filter((id): id is string => !!id)
    ),
  ]
  const curricula = curriculumIds.length
    ? await prisma.curriculumVersion.findMany({
        where: { id: { in: curriculumIds } },
        select: graduationCurriculumSelect,
      })
    : []
  const curriculumMap = new Map(curricula.map((item) => [item.id, item]))
  const curriculumSubjectIds = [
    ...new Set(
      curricula.flatMap((curriculum) =>
        curriculum.trainingBlocks.flatMap((block) =>
          block.subjects.map((subject) => subject.subjectId)
        )
      )
    ),
  ]

  const scoreSources = await loadGraduationScoreSources({
    studentIds,
    curriculumSubjectIds,
  })

  const studentMap = new Map(students.map((item) => [item.id, item]))
  const results: GraduationCheckItemResult[] = []
  const checkResultsToWrite: Array<{
    studentGraduationApplicationId: string
    rankingConditionId: string
    passed: boolean
    actualValue: number
  }> = []
  const applicationUpdates: ApplicationUpdate[] = []

  const pushResult = (update: ApplicationUpdate) => {
    results.push(update.result)
    applicationUpdates.push(update)
  }

  for (const [idx, application] of session.applications.entries()) {
    const student = studentMap.get(application.studentId)
    if (!student) {
      throw new Error(`Không tìm thấy sinh viên ${application.studentId}`)
    }

    const fixedClass = student.fixedClassId ? classMap.get(student.fixedClassId) : undefined
    if (!fixedClass) {
      pushResult({
        applicationId: application.id,
        result: {
          applicationId: application.id,
          graduation: false,
          reason: "Sinh viên không có lớp quản lý",
          trainingMajor: null,
          diplomaType: null,
        },
      })
      continue
    }

    const curriculumVersion =
      (student.curriculumVersionId
        ? curriculumMap.get(student.curriculumVersionId)
        : undefined) ||
      (fixedClass.curriculumVersionId
        ? curriculumMap.get(fixedClass.curriculumVersionId)
        : undefined)

    if (!curriculumVersion) {
      pushResult({
        applicationId: application.id,
        result: {
          applicationId: application.id,
          graduation: false,
          reason: "Sinh viên không có CTĐT",
          trainingMajor: null,
          diplomaType: null,
        },
      })
      continue
    }

    const reasons: string[] = []

    // Đợt xét có thể gắn nhiều chuẩn đầu ra: chỉ xét chuẩn gắn với CTĐT của SV (và bắt buộc).
    // CTĐT không gắn chuẩn đầu ra nào trong đợt → bỏ qua điều kiện này.
    const applicableOutputStandards = session.outputStandard.filter((standard) =>
      standard.outputStandardOnCurriculum.some(
        (link) => link.curriculumVersionId === curriculumVersion.id && link.isRequired
      )
    )

    if (applicableOutputStandards.length > 0) {
      // Chứng chỉ chỉ còn hiệu lực khi không có ngày hết hạn hoặc hết hạn từ ngày họp hội đồng trở đi
      const isCertValid = (archived: (typeof student.archivedCertificate)[number]) =>
        !archived.expiredDate || archived.expiredDate >= session.sessionDate

      const lackOfOutputStandard: string[] = []
      const expiredOutputStandard: string[] = []
      for (const standard of applicableOutputStandards) {
        if (standard.certificates.length === 0) continue
        const certIds = new Set(standard.certificates.map((cert) => cert.id))
        const owned = student.archivedCertificate.filter((archived) =>
          certIds.has(archived.certificateId)
        )
        if (owned.some(isCertValid)) continue
        if (owned.length > 0) expiredOutputStandard.push(standard.name)
        else lackOfOutputStandard.push(standard.name)
      }

      if (lackOfOutputStandard.length > 0) {
        reasons.push(`Chưa đạt chuẩn đầu ra: ${lackOfOutputStandard.join(", ")}`)
      }
      if (expiredOutputStandard.length > 0) {
        reasons.push(`Chứng chỉ chuẩn đầu ra đã hết hạn: ${expiredOutputStandard.join(", ")}`)
      }
    }

    const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(({ subjects }) => subjects)
    const trainingCourse = fixedClass.trainingCourse
    const { baseScore } = trainingCourse
    const useCourseBase10 = baseScore === AcademicRankingBaseType.Base10
    const electiveCreditsRequired = curriculumVersion.trainingBlocks.reduce(
      (pre, cur) => pre + cur.electiveCreditsRequired,
      0
    )

    const resolvedScores = computeGraduationSubjectScores({
      curriculumSubjects,
      trainingCourse,
      electiveCreditsRequired,
      rawSubjectScores: scoreSources.rawScoresByStudent.get(application.studentId) ?? [],
      issueScores: scoreSources.issueScoresByStudent.get(application.studentId) ?? [],
      equivalencyGroups: scoreSources.equivalencyGroups,
    })

    const {
      finalScores,
      markDoneScores,
      totalDebtCredit,
      issueReasons,
      subjectReasons,
      totalScoreBase10,
      totalScoreBase4,
      totalPassCredit,
      courseGradeLowest,
      graduationCourseGradeLowest,
    } = resolvedScores

    reasons.push(...issueReasons, ...subjectReasons)

    const gpaScoreIds = Array.from(finalScores.values()).map((score) => score.id)
    const supplementaryScoreIds = Array.from(markDoneScores.values()).map((score) => score.id)

    const requiredCredits = sumRequiredCredits(curriculumSubjects, electiveCreditsRequired)
    if (requiredCredits > 0 && totalPassCredit < requiredCredits) {
      reasons.push(`Chưa đạt số tín chỉ bắt buộc (${totalPassCredit} < ${requiredCredits})`)
    }

    const cumulativeBase10 = totalPassCredit
      ? totalScoreBase10.div(totalPassCredit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(0)
    const cumulativeBase4 = totalPassCredit
      ? totalScoreBase4.div(totalPassCredit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(0)

    const rankLevels = trainingCourse.academicRankingConvert
    if (!rankLevels.length) {
      reasons.push("Không có hạng xếp loại")
    }

    const CUMULATIVE_GPA = (useCourseBase10 ? cumulativeBase10 : cumulativeBase4).toNumber()
    const latestSemesterResult = student.studentSemesterResult[0]
    const semesterRegisteredCredits = latestSemesterResult?.registeredCredits || 0
    const semesterFailedCredits = latestSemesterResult?.failedCredits || 0
    let repeatYearCount = 0
    let suspensionCount = 0
    for (const decision of student.studentAcademicDecision) {
      if (decision.actionTaken === AcademicActionType.REPEAT_YEAR) {
        repeatYearCount++
      }
      if (decision.actionTaken === AcademicActionType.SUSPENSION) {
        suspensionCount++
      }
    }

    const studentDataContext: StudentDataContext = {
      SEMESTER_GPA: useCourseBase10
        ? latestSemesterResult?.gpaBase10.toNumber() || 0
        : latestSemesterResult?.gpaBase4.toNumber() || 0,
      YEARLY_GPA: useCourseBase10
        ? student.studentYearResult[0]?.gpaBase10.toNumber() || 0
        : student.studentYearResult[0]?.gpaBase4.toNumber() || 0,
      CUMULATIVE_GPA,
      ENTRY_SCORE: student.entryScore || 0,
      COURSE_GRADE_LOWEST: courseGradeLowest,
      GRADUATION_COURSE_GRADE_LOWEST: graduationCourseGradeLowest,

      SEMESTER_REGISTERED_CREDITS: semesterRegisteredCredits,
      SEMESTER_PASSED_CREDITS: latestSemesterResult?.passedCredits || 0,
      SEMESTER_FAILED_CREDITS: semesterFailedCredits,
      FAILED_CREDITS_PERCENT: semesterRegisteredCredits
        ? (semesterFailedCredits / semesterRegisteredCredits) * 100
        : 0,
      YEAR_FAILED_CREDITS: student.studentYearResult[0]?.failedCredits || 0,
      CUMULATIVE_PASSED_CREDITS: totalPassCredit,
      CUMULATIVE_DEBT_CREDITS: totalDebtCredit,
      CUMULATIVE_PROGRESS_PERCENT: requiredCredits ? (totalPassCredit / requiredCredits) * 100 : 0,
      CUMULATIVE_RETAKE_PERCENT: totalPassCredit ? (totalDebtCredit / totalPassCredit) * 100 : 0,

      ACADEMIC_WARNING_LEVEL: student.academicWarningLevel,
      DISCIPLINARY_WARNING_LEVEL: student.disciplinaryWarningLevel,
      REPEAT_YEAR_COUNT: repeatYearCount,
      SUSPENSION_COUNT: suspensionCount,

      CONDUCT_SCORE: student.semesterTrainingScore[0]?.score || 0,
      HAS_PASSED_FOREIGN_LANGUAGE: student.foreignLangPass,
      HAS_REGISTERED_FOR_SEMESTER: !!latestSemesterResult,
      IS_PRIORITY_STUDENT: !!student._count.priorityObject,
      IS_CLASS_MONITOR_OR_LEADER: !!student.classMonitor,
      IS_STUDY_DURATION_EXCEEDED: false,
      IS_DEBT_SUBJECT_CONSECUTIVE: false,
      HAS_IMPROVEMENT_REGISTRATION: latestSemesterResult?.isImproving || false,
    }

    // Giá trị của tiêu chí trong danh mục: SYSTEM lấy từ studentDataContext,
    // CUSTOM tính bằng calculator (chỉ tính khi cần, cache theo tiêu chí)
    let calcContext: CriteriaCalcContext | null = null
    const customValues = new Map<string, number | null>()
    const getCriteriaValue = (criteria: {
      id: string
      source: CriteriaSource
      systemField: CriteriaField | null
    }): number | boolean | null => {
      if (criteria.source === CriteriaSource.SYSTEM) {
        return criteria.systemField ? studentDataContext[criteria.systemField] : null
      }
      if (customValues.has(criteria.id)) return customValues.get(criteria.id) ?? null
      const prepared = preparedCriteria.get(criteria.id)
      if (!prepared) return null
      const ctx = (calcContext ??= {
        curriculumSubjects: curriculumVersion.trainingBlocks.flatMap((block) =>
          block.subjects.map((item) => ({
            subjectId: item.subjectId,
            trainingBlockId: block.trainingBlock.id,
            useForFinalScore: item.useForFinalScore,
            graduation: item.graduation,
            subject: {
              code: item.subject.code,
              credit: item.subject.credit,
              subjectId: item.subject.subjectId,
              type: item.subject.type,
            },
          }))
        ),
        finalScores,
        markDoneScores,
        rawSubjectScores: scoreSources.rawScoresByStudent.get(application.studentId) ?? [],
        requiredCredits,
        academicDecisions: student.studentAcademicDecision,
        academicWarnings: student.academicWarning,
        disciplinaryWarnings: student.disciplinaryWarning,
      })
      const value = computeCustomCriteria(ctx, prepared)
      customValues.set(criteria.id, value)
      return value
    }
    const formatCriteriaValue = (value: number | boolean | null) => {
      if (value == null) return "không có dữ liệu"
      if (typeof value === "boolean") return value ? "có" : "không"
      return `${Math.round(value * 100) / 100}`
    }

    if (reasons.length > 0) {
      pushResult({
        applicationId: application.id,
        gpaScoreIds,
        supplementaryScoreIds,
        result: {
          applicationId: application.id,
          graduation: false,
          gpa: CUMULATIVE_GPA,
          rank: null,
          reason: reasons.join("\n"),
          trainingMajor: curriculumVersion.curriculum.trainingMajor,
          diplomaType: curriculumVersion.diplomaType,
        },
      })
      continue
    }

    const sortedRankLevels = rankLevels
    let matched = false

    for (const [rankIdx, rank] of sortedRankLevels.entries()) {
      const eligibilityResults = rank.rankingCondition.map((rule) => {
        const passed = evaluateCondition(studentDataContext, rule)
        checkResultsToWrite.push({
          studentGraduationApplicationId: application.id,
          rankingConditionId: rule.id,
          passed,
          actualValue: Number(studentDataContext[rule.field]),
        })
        return passed
      })
      const isEligible = eligibilityResults.every((passed) => passed)
      const isCorrectScore = isGpaInGraduationRankRange(
        rank,
        cumulativeBase10,
        cumulativeBase4,
        baseScore
      )
      const eligibleRank = isEligible && isCorrectScore ? rank : null

      if (!eligibleRank) continue

      // Bộ rỗng hoặc có tiêu chí đã ngừng / đã xoá bị bỏ qua cả bộ (không xét phần còn lại)
      const downgrade = eligibleRank.downgradeRules.find(
        ({ conditions }) =>
          isDowngradeRuleUsable(conditions) &&
          conditions.every((condition) =>
            compareConditionValue(getCriteriaValue(condition.criteria), condition)
          )
      )
      const rankDowngrade = sortedRankLevels[rankIdx + 1] || null

      if (downgrade) {
        pushResult({
          applicationId: application.id,
          gpaScoreIds,
          supplementaryScoreIds,
          result: {
            applicationId: application.id,
            graduation: !!rankDowngrade?.graduated,
            gpa: CUMULATIVE_GPA,
            rank: rankDowngrade || null,
            reason: `Bị hạ bậc: ${downgrade.conditions
              .map(
                (condition) =>
                  `${condition.criteria.name} ${criteriaOperatorLabels[condition.operator]} ${condition.value} (thực tế: ${formatCriteriaValue(getCriteriaValue(condition.criteria))})`
              )
              .join("\n")}`,
            trainingMajor: curriculumVersion.curriculum.trainingMajor,
            diplomaType: curriculumVersion.diplomaType,
            downgraded: {
              from: rank,
              conditions: downgrade.conditions,
            },
          },
        })
        matched = true
        break
      }

      pushResult({
        applicationId: application.id,
        gpaScoreIds,
        supplementaryScoreIds,
        result: {
          applicationId: application.id,
          graduation: !!rank.graduated,
          gpa: CUMULATIVE_GPA,
          rank,
          reason: "",
          trainingMajor: curriculumVersion.curriculum.trainingMajor,
          diplomaType: curriculumVersion.diplomaType,
        },
      })
      matched = true
      break
    }

    if (!matched && !results[idx]) {
      pushResult({
        applicationId: application.id,
        gpaScoreIds,
        supplementaryScoreIds,
        result: {
          applicationId: application.id,
          graduation: false,
          gpa: CUMULATIVE_GPA,
          rank: null,
          reason: "Không thoả mãn xếp loại nào",
          trainingMajor: curriculumVersion.curriculum.trainingMajor,
          diplomaType: curriculumVersion.diplomaType,
        },
      })
    }
  }

  const applicationIdsToUpdate = applicationUpdates.map((item) => item.applicationId)
  await prisma.$transaction(
    async (tx) => {
      if (applicationIdsToUpdate.length > 0) {
        await tx.applicationCheckResult.deleteMany({
          where: { studentGraduationApplicationId: { in: applicationIdsToUpdate } },
        })
      }
      if (checkResultsToWrite.length > 0) {
        await tx.applicationCheckResult.createMany({
          data: checkResultsToWrite,
          skipDuplicates: true,
        })
      }

      for (const batch of chunk(applicationUpdates, 25)) {
        await Promise.all(
          batch.map((update) =>
            tx.studentGraduationApplication.update({
              where: { id: update.applicationId },
              data: {
                ...(update.gpaScoreIds
                  ? { gpaScore: { set: update.gpaScoreIds.map((id) => ({ id })) } }
                  : {}),
                ...(update.supplementaryScoreIds
                  ? {
                      supplementaryScore: {
                        set: update.supplementaryScoreIds.map((id) => ({ id })),
                      },
                    }
                  : {}),
                graduation: update.result.graduation,
                diplomaTypeId: update.result.diplomaType?.id,
                trainingMajorId: update.result.trainingMajor?.id,
                gpa: update.result.gpa,
                rankId: update.result.rank?.id,
                reason: update.result.reason,
                status: ApplicationStatus.IN_REVIEW,
              },
            })
          )
        )
      }
    },
    { timeout: 180_000 }
  )

  return { results }
}
