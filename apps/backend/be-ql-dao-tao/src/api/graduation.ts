import { Readable } from "node:stream"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  AcademicActionType,
  ApplicationStatus,
  RankingContext,
  StudentStatus,
  SubjectRequirementType,
} from "@workspace/db"
import {
  AcademicRankingConvertScalarSchema,
  DiplomaTypeScalarSchema,
  GraduationRankDowngradeConditionScalarSchema,
  TrainingMajorScalarSchema,
} from "@workspace/db/zod/models"
import { getFilesEmployeeUserIdImage } from "@workspace/libs/api/system-share"
import { getTemplateBuffer } from "@workspace/libs/server"
import { chunk, genOriginalDiplomaNumber } from "@workspace/libs/utils"
import Decimal from "decimal.js"
import { Automizer } from "pptx-automizer"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
dayjs.extend(customParseFormat)
import ExcelJS from "exceljs"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { evaluateCondition } from "../services/student-result.service"
import type { StudentDataContext } from "../types/student-context"
import { criteriaFieldLabels, criteriaOperatorLabels } from "@workspace/libs/constants"
import {
  parseSignerInfo,
  generateExcelFromTemplate,
  getScoreClassification,
  getReportDateParts,
  formatScore,
  generateExcelMultiSheet,
} from "../utils"

const app = new OpenAPIHono({ strict: false })

const graduationApplicationInit = createRoute({
  operationId: "graduationApplicationInit",
  tags: ["Graduation"],
  path: "/application-init",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              sessionId: z.string(),
              trainingCourseId: z.string().optional(),
              fixedClassId: z.string().optional(),
            })
            .refine(
              (data) => data.trainingCourseId || data.fixedClassId,
              "Cần chọn Khoá hoặc Lớp quản lý"
            ),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Graduation application initialized successfully",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    400: {
      description: "Graduation application initialization failed",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(graduationApplicationInit, async (c) => {
  const { sessionId, trainingCourseId, fixedClassId } = c.req.valid("json")

  const session = await prisma.graduationSession.findUniqueOrThrow({
    where: { id: sessionId },
  })

  const students = await prisma.student.findMany({
    where: {
      ...(trainingCourseId ? { fixedClass: { trainingCourseId } } : {}),
      ...(fixedClassId ? { fixedClassId } : {}),
      deletedAt: null,
      status: {
        in: [StudentStatus.ENROLLED, StudentStatus.PENDING_GRADUATION_REVIEW],
      },
    },
  })

  if (students.length === 0) {
    return c.json({ message: "Không tìm thấy sinh viên chưa tốt nghiệp" }, 400)
  }
  const result = await prisma.studentGraduationApplication.createMany({
    data: students.map((s) => ({
      studentId: s.id,
      sessionId: session.id,
    })),
    skipDuplicates: true,
  })

  return c.json({ message: `Đã tạo ${result.count} đơn xét tốt nghiệp` }, 200)
})

const GraduationCheckResult = z
  .object({
    applicationId: z.string(),
    graduation: z.boolean(),
    reason: z.string(),
    gpa: z.number().nullish(),
    rank: AcademicRankingConvertScalarSchema.nullish(),
    trainingMajor: TrainingMajorScalarSchema.nullable(),
    diplomaType: DiplomaTypeScalarSchema.nullable(),
    downgraded: z
      .object({
        from: AcademicRankingConvertScalarSchema,
        conditions: z.array(GraduationRankDowngradeConditionScalarSchema),
      })
      .optional(),
  })
  .openapi("GraduationCheckResult")

const graduationCheck = createRoute({
  operationId: "graduationCheck",
  tags: ["Graduation"],
  path: "/check",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string(),
            applicationIds: z
              .array(z.string())
              .default([])
              .optional()
              .describe("Không truyền hoặc truyền mảng rỗng sẽ xét hết"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Graduation check successfully",
      content: {
        "application/json": {
          schema: z.object({
            results: GraduationCheckResult.array(),
          }),
        },
      },
    },
    400: {
      description: "Graduation check failed",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(graduationCheck, async (c) => {
  const { sessionId, applicationIds } = c.req.valid("json")

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
        include: { certificates: true },
      },
    },
  })

  const results: z.infer<typeof GraduationCheckResult>[] = []

  const curriculumSelect = {
    requiredCredits: true,
    electiveCredits: true,
    diplomaType: true,
    trainingBlocks: { include: { subjects: { include: { subject: true } } } },
    curriculum: { include: { trainingMajor: true } },
    // outputStandardOnCurriculum: {
    //   include: { outputStandard: { include: { certificates: true } } },
    //   where: { deletedAt: null, active: true, isRequired: true },
    // },
  }

  for (const [idx, application] of session.applications.entries()) {
    const student = await prisma.student.findFirstOrThrow({
      where: { id: application.studentId },
      select: {
        id: true,
        academicWarningLevel: true,
        disciplinaryWarningLevel: true,
        entryScore: true,
        foreignLangPass: true,
        _count: { select: { priorityObject: true } },
        classMonitor: { select: { id: true } },
        studentAcademicDecision: true,
        curriculumVersion: { select: curriculumSelect },
        semesterTrainingScore: {
          take: 1,
          orderBy: { semester: { startDate: "desc" } },
        },
        studentSemesterResult: { take: 1, orderBy: { createdAt: "desc" } },
        studentYearResult: { take: 1, orderBy: { createdAt: "desc" } },
        archivedCertificate: true,
        fixedClass: {
          select: {
            trainingCourse: {
              include: {
                scoreConverts: true,
                academicRankingConvert: {
                  where: {
                    context: RankingContext.GRADUATION,
                    graduated: true,
                  },
                  include: {
                    rankingCondition: true,
                    downgradeRules: {
                      include: { initialRank: true, conditions: true },
                    },
                  },
                  orderBy: { rankOrder: "asc" },
                },
              },
            },
            curriculumVersion: { select: curriculumSelect },
          },
        },
      },
    })

    if (!student.fixedClass) {
      results.push({
        applicationId: application.id,
        graduation: false,
        reason: "Sinh viên không có lớp quản lý",
        trainingMajor: null,
        diplomaType: null,
      })
      continue
    }

    const curriculumVersion = student.curriculumVersion || student.fixedClass.curriculumVersion

    if (!curriculumVersion) {
      results.push({
        applicationId: application.id,
        graduation: false,
        reason: "Sinh viên không có CTĐT",
        trainingMajor: null,
        diplomaType: null,
      })
      continue
    }

    const reasons: string[] = []

    // Kiểm tra chuẩn đầu ra
    const lackOfOutputStandard = session.outputStandard.filter((standard) => {
      const notCompleted = standard.certificates.every((cert) => {
        const archived = student.archivedCertificate.find(
          (archived) => archived.certificateId === cert.id
        )
        return !archived
      })
      return notCompleted
    })

    if (lackOfOutputStandard.length > 0) {
      reasons.push(
        `Chưa đạt chuẩn đầu ra: ${lackOfOutputStandard.map((standard) => standard.name).join(", ")}`
      )
    }

    const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(({ subjects }) => subjects)

    const {
      scoreToPass,
      scoreToPassConditional,
      scoreToPassGraduation,
      baseScore,
      scoreToRetain,
      scoreConverts,
    } = student.fixedClass.trainingCourse

    // Kiểm tra các môn có lỗi (hoãn thi, cấm thi, đình chỉ, học lại)
    const subjectScoresWithIssues = await prisma.studentSubjectScore.findMany({
      where: {
        studentId: application.studentId,
        deletedAt: null,
        OR: [{ examBanned: true }, { suspended: true }, { finalScore: { lt: scoreToPass } }],
      },
      include: { subjectVersion: true },
    })

    const subjectScores = await prisma.studentSubjectScore.findMany({
      where: {
        studentId: application.studentId,
        deletedAt: null,
        examBanned: false,
        suspended: false,
        subjectVersionId: {
          in: subjectScoresWithIssues.map((s) => s.subjectVersionId),
        },
      },
      include: { subjectVersion: true },
    })

    let totalDebtCredit = 0
    for (const score of subjectScoresWithIssues) {
      totalDebtCredit += score.subjectVersion.credit

      const passedScore = subjectScores.find((s) => s.subjectVersionId === score.subjectVersionId)
      if (passedScore?.finalScore && passedScore.finalScore.toNumber() >= scoreToPass) {
        continue
      }

      if (score.examBanned && score.examBannedReason) {
        reasons.push(`Môn ${score.subjectVersion.name}: ${score.examBannedReason}`)
      }

      if (score.suspended && score.suspendedReason) {
        reasons.push(`Môn ${score.subjectVersion.name}: ${score.suspendedReason}`)
      }
    }

    // Lấy toàn bộ điểm môn học (bỏ qua các trạng thái không hợp lệ)
    const rawSubjectScores = await prisma.studentSubjectScore.findMany({
      where: {
        AND: [
          {
            OR: [
              { studentId: application.studentId },
              {
                studentId: application.studentId,
                subjectClass: { cancelled: false },
              },
            ],
          },
          {
            OR: [{ manualFinalScore: { not: null } }, { finalScore: { not: null } }],
          },
        ],
        deletedAt: null,
        examPostponed: false,
        exempted: false,
        withdrew: false,
        suspended: false,
      },
      include: { subjectVersion: true },
      orderBy: { createdAt: "asc" },
    })

    // Chọn điểm cao nhất cho mỗi môn (kết quả môn đạt)
    const subjectScoresMap = new Map<
      string,
      (typeof rawSubjectScores)[number] & {
        scoreBase10: Decimal
        scoreBase4: Decimal
        canImprove: boolean
      }
    >()

    for (const subjectScore of rawSubjectScores) {
      const scoreBase10 = new Decimal(subjectScore.manualFinalScore ?? subjectScore.finalScore!)

      if (subjectScore.repeated && scoreBase10.lt(scoreToRetain)) {
        continue
      }

      const scoreConvert = scoreConverts.find(
        (s) =>
          new Decimal(s.base10Min).lte(scoreBase10) && new Decimal(s.base10Max).gte(scoreBase10)
      )
      const scoreBase4 = new Decimal(scoreConvert?.base4 || 0)

      const subjectInCurriculum = curriculumSubjects.find(
        (subject) => subject.subjectId === subjectScore.subjectVersionId
      )

      if (
        (subjectInCurriculum?.graduation && scoreBase10.gte(scoreToPassGraduation)) ||
        (subjectInCurriculum?.useForFinalScore && scoreBase10.gte(scoreToPassConditional)) ||
        scoreBase10.gte(scoreToPass)
      ) {
        const entry = subjectScoresMap.get(subjectScore.subjectVersionId)
        if (entry && entry.scoreBase10.gte(scoreBase10)) {
          continue
        }

        subjectScoresMap.set(subjectScore.subjectVersionId, {
          ...subjectScore,
          scoreBase10,
          scoreBase4,
          canImprove: scoreConvert?.improvementRegister || false,
        })
      }
    }

    // Xử lý nhóm môn tương đương
    const equivalencyGroups = await prisma.equivalencyGroup.findMany({
      where: {
        deletedAt: null,
        active: true,
        subjects: {
          some: {
            subjectId: {
              in: curriculumSubjects.map(({ subjectId }) => subjectId),
            },
          },
        },
      },
      include: {
        subjects: { include: { subject: { select: { credit: true } } } },
      },
    })

    type SubjectScore = (typeof rawSubjectScores)[number] & {
      scoreBase10: Decimal
      scoreBase4: Decimal
      canImprove: boolean
    }

    // kết quả những môn sẽ dùng để tính điểm tích luỹ
    const finalScores = new Map<string, SubjectScore>()

    // kết quả những môn bổ sung kiến thức (chỉ ghi nhận "Đạt")
    const markDoneScores = new Map<string, SubjectScore>()

    // những môn trong CTĐT chưa đạt nhưng đã được xử lý bởi nhóm tương đương
    const processedSubjects = new Set<string>()
    const processedEquivalencyGroups = new Set<string>()

    for (const subject of curriculumSubjects) {
      if (
        finalScores.has(subject.subjectId) ||
        markDoneScores.has(subject.subjectId) ||
        processedSubjects.has(subject.subjectId)
      ) {
        continue
      }

      const subjectScore = subjectScoresMap.get(subject.subjectId)
      if (subjectScore) {
        // Môn điều kiện (useForFinalScore=false) chỉ ghi nhận Đạt, không tính GPA
        if (!subject.useForFinalScore) {
          markDoneScores.set(subject.subjectId, subjectScore)
        } else {
          finalScores.set(subject.subjectId, subjectScore)
        }
        continue
      }

      const equivGroups = equivalencyGroups
        .filter(({ subjects }) => subjects.some(({ subjectId }) => subjectId === subject.subjectId))
        .filter(({ id }) => !processedEquivalencyGroups.has(id))

      if (!subjectScore && !equivGroups.length) {
        // Môn tự chọn chưa học → bỏ qua, để bước check tín chỉ tự chọn xử lý
        if (subject.type === SubjectRequirementType.Optional) continue

        // Môn bắt buộc chưa đạt
        if (subject.type === SubjectRequirementType.Mandatory) {
          reasons.push(`Chưa đạt môn bắt buộc (${subject.subject.name})`)
        }
        continue
      }

      let hasEquivalencyGroup = false
      for (const equivGroup of equivGroups) {
        processedEquivalencyGroups.add(equivGroup.id)

        const equivalencyGroupSubject = equivGroup.subjects.find(
          ({ subjectId }) => subject.subjectId === subjectId
        )
        if (!equivalencyGroupSubject) continue

        const side = equivalencyGroupSubject.side

        const curriculumSide = equivGroup.subjects.filter((s) => s.side === side)
        const otherSide = equivGroup.subjects.filter((s) => s.side !== side)

        type ScoreResult = (typeof curriculumSide)[number] & {
          score: SubjectScore | undefined
        }

        const curriculumSideResult: ScoreResult[] = curriculumSide.map((s) => ({
          ...s,
          score: subjectScoresMap.get(s.subjectId),
        }))

        const otherSideResult: ScoreResult[] = otherSide
          .map((s) => ({
            ...s,
            score: subjectScoresMap.get(s.subjectId),
          }))
          .filter((r) => r.score)

        if (otherSideResult.length < otherSide.length) {
          continue
        }

        if (curriculumSideResult.some((r) => !r.score)) {
          hasEquivalencyGroup = true
          for (const result of curriculumSideResult) {
            if (result.score) {
              finalScores.delete(result.subjectId)
              markDoneScores.delete(result.subjectId)
            } else {
              processedSubjects.add(result.subjectId)
            }
          }
          for (const result of otherSideResult) {
            if (!result.score) continue
            //Khi equivalency thay thế, cũng phân biệt useForFinalScore
            const otherSubjectInCurriculum = curriculumSubjects.find(
              (s) => s.subjectId === result.subjectId
            )
            if (otherSubjectInCurriculum && !otherSubjectInCurriculum.useForFinalScore) {
              markDoneScores.set(result.subjectId, result.score)
            } else {
              finalScores.set(result.subjectId, result.score)
            }
          }
          break
        }

        const calcScore = (scoreResults: ScoreResult[]) => {
          let totalScore = new Decimal(0)
          let totalCredit = 0
          for (const scoreResult of scoreResults) {
            const credit = scoreResult.subject.credit
            totalScore = totalScore.add(
              (scoreResult.score?.scoreBase10 || new Decimal(0)).mul(credit)
            )
            totalCredit += credit
          }
          return totalScore.div(totalCredit)
        }

        const curriculumSideScore = calcScore(curriculumSideResult)
        const otherSideScore = calcScore(otherSideResult)

        if (curriculumSideScore.lte(otherSideScore)) {
          hasEquivalencyGroup = true
          for (const result of otherSideResult) {
            if (!result.score) continue
            const otherSubjectInCurriculum = curriculumSubjects.find(
              (s) => s.subjectId === result.subjectId
            )
            if (otherSubjectInCurriculum && !otherSubjectInCurriculum.useForFinalScore) {
              markDoneScores.set(result.subjectId, result.score)
            } else {
              finalScores.set(result.subjectId, result.score)
            }
          }
        }

        if (hasEquivalencyGroup) break
      }

      if (!hasEquivalencyGroup && subject.type === SubjectRequirementType.Mandatory) {
        reasons.push(`Chưa đạt môn bắt buộc (${subject.subject.name})`)
      }
    }

    // Kiểm tra & lọc tín chỉ tự chọn
    // Chỉ xét các môn tự chọn trong CTĐT, loại những môn đã được equivalency xử lý
    const electiveSubjects = curriculumSubjects.filter(
      (s) => s.type === SubjectRequirementType.Optional && !processedSubjects.has(s.subjectId)
    )

    // Lấy các môn tự chọn đã đạt, sort theo điểm cao nhất trước
    const passedElectives = electiveSubjects
      .map((s) => ({
        subject: s,
        score: finalScores.get(s.subjectId),
      }))
      .filter(
        (
          s
        ): s is {
          subject: typeof s.subject
          score: NonNullable<typeof s.score>
        } => s.score !== undefined
      )
      .sort((a, b) => b.score.scoreBase10.cmp(a.score.scoreBase10))

    const electiveCreditsRequired = curriculumVersion.trainingBlocks.reduce(
      (pre, cur) => pre + cur.electiveCreditsRequired,
      0
    )
    let accumulatedElectiveCredits = 0

    for (const { subject, score } of passedElectives) {
      if (accumulatedElectiveCredits >= electiveCreditsRequired) {
        // Môn tự chọn vượt quá → chuyển sang markDoneScores, không tính GPA
        finalScores.delete(subject.subjectId)
        markDoneScores.set(subject.subjectId, score)
      } else {
        accumulatedElectiveCredits += subject.subject.credit
      }
    }

    if (accumulatedElectiveCredits < electiveCreditsRequired) {
      reasons.push(
        `Chưa đủ tín chỉ tự chọn (${accumulatedElectiveCredits}/${electiveCreditsRequired} TC)`
      )
    }

    // Tính GPA & tổng tín chỉ tích luỹ (sau khi đã lọc elective)
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

      // Điểm thấp nhất trong tất cả môn tính GPA
      if (score.scoreBase10.lt(courseGradeLowest)) {
        courseGradeLowest = score.scoreBase10.toNumber()
      }

      // Điểm thấp nhất trong các môn tốt nghiệp (graduation = true)
      const subjectInCurriculum = curriculumSubjects.find((s) => s.subjectId === subjectId)
      if (subjectInCurriculum?.graduation && score.scoreBase10.lt(graduationCourseGradeLowest)) {
        graduationCourseGradeLowest = score.scoreBase10.toNumber()
      }
    }

    // Nếu không có môn nào → reset về 0 thay vì Infinity
    if (courseGradeLowest === Number.POSITIVE_INFINITY) courseGradeLowest = 0
    if (graduationCourseGradeLowest === Number.POSITIVE_INFINITY) graduationCourseGradeLowest = 0

    await prisma.studentGraduationApplication.update({
      where: { id: application.id },
      data: {
        gpaScore: {
          set: Array.from(finalScores.values()).map((score) => ({
            id: score.id,
          })),
        },
        supplementaryScore: {
          set: Array.from(markDoneScores.values()).map((score) => ({
            id: score.id,
          })),
        },
      },
    })

    // Kiểm tra tổng tín chỉ tích luỹ
    if (curriculumVersion.requiredCredits && totalPassCredit < curriculumVersion.requiredCredits) {
      reasons.push(
        `Chưa đạt số tín chỉ bắt buộc (${totalPassCredit} < ${curriculumVersion.requiredCredits})`
      )
    }

    if (accumulatedElectiveCredits < electiveCreditsRequired) {
      reasons.push(
        `Chưa đạt số tín chỉ tự chọn (${accumulatedElectiveCredits} < ${electiveCreditsRequired})`
      )
    }

    const cumulativeBase10 = totalPassCredit
      ? totalScoreBase10.div(totalPassCredit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(0)
    const cumulativeBase4 = totalPassCredit
      ? totalScoreBase4.div(totalPassCredit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(0)

    const rankLevels = student.fixedClass?.trainingCourse.academicRankingConvert
    if (!rankLevels?.length) {
      reasons.push("Không có hạng xếp loại")
    }

    const CUMULATIVE_GPA = (baseScore === "Base10" ? cumulativeBase10 : cumulativeBase4).toNumber()

    const semesterRegisteredCredits = student.studentSemesterResult[0]?.passedCredits || 0
    const semesterFailedCredits = student.studentSemesterResult[0]?.failedCredits || 0
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
      SEMESTER_GPA:
        baseScore === "Base10"
          ? student.studentSemesterResult[0]?.gpaBase10.toNumber() || 0
          : student.studentSemesterResult[0]?.gpaBase4.toNumber() || 0,
      YEARLY_GPA:
        baseScore === "Base10"
          ? student.studentYearResult[0]?.gpaBase10.toNumber() || 0
          : student.studentYearResult[0]?.gpaBase4.toNumber() || 0,
      CUMULATIVE_GPA,
      ENTRY_SCORE: student.entryScore || 0,
      COURSE_GRADE_LOWEST: courseGradeLowest,
      GRADUATION_COURSE_GRADE_LOWEST: graduationCourseGradeLowest,

      SEMESTER_REGISTERED_CREDITS: semesterRegisteredCredits,
      SEMESTER_PASSED_CREDITS: student.studentSemesterResult[0]?.passedCredits || 0,
      SEMESTER_FAILED_CREDITS: semesterFailedCredits,
      FAILED_CREDITS_PERCENT: semesterRegisteredCredits
        ? (semesterFailedCredits / semesterRegisteredCredits) * 100
        : 0,
      YEAR_FAILED_CREDITS: student.studentYearResult[0]?.failedCredits || 0,
      CUMULATIVE_PASSED_CREDITS: totalPassCredit,
      CUMULATIVE_DEBT_CREDITS: totalDebtCredit,
      CUMULATIVE_PROGRESS_PERCENT: (totalPassCredit / totalPassCredit) * 100,
      CUMULATIVE_RETAKE_PERCENT: (totalDebtCredit / totalPassCredit) * 100,

      ACADEMIC_WARNING_LEVEL: student.academicWarningLevel,
      DISCIPLINARY_WARNING_LEVEL: student.disciplinaryWarningLevel,
      REPEAT_YEAR_COUNT: repeatYearCount,
      SUSPENSION_COUNT: suspensionCount,

      CONDUCT_SCORE: student.semesterTrainingScore[0]?.score || 0,
      HAS_PASSED_FOREIGN_LANGUAGE: student.foreignLangPass,
      HAS_REGISTERED_FOR_SEMESTER: true,
      IS_PRIORITY_STUDENT: !!student._count.priorityObject,
      IS_CLASS_MONITOR_OR_LEADER: !!student.classMonitor,
      IS_STUDY_DURATION_EXCEEDED: false,
      IS_DEBT_SUBJECT_CONSECUTIVE: false,
      HAS_IMPROVEMENT_REGISTRATION: false,
    }
    // Nếu có lý do thất bại → không xét xếp loại
    if (reasons.length > 0) {
      results.push({
        applicationId: application.id,
        graduation: false,
        gpa: CUMULATIVE_GPA,
        rank: null,
        reason: reasons.join("\n"),
        trainingMajor: curriculumVersion.curriculum.trainingMajor,
        diplomaType: curriculumVersion.diplomaType,
      })
      continue
    }

    // Xếp loại tốt nghiệp
    const sortedRankLevels = student.fixedClass.trainingCourse.academicRankingConvert

    for (const [rankIdx, rank] of sortedRankLevels.entries()) {
      const eligibilityResults = await Promise.all(
        rank.rankingCondition.map(async (rule) => {
          const passed = evaluateCondition(studentDataContext, rule)
          const actualValue = Number(studentDataContext[rule.field])
          try {
            await prisma.applicationCheckResult.upsert({
              where: {
                studentGraduationApplicationId_rankingConditionId: {
                  studentGraduationApplicationId: application.id,
                  rankingConditionId: rule.id,
                },
              },
              create: {
                studentGraduationApplicationId: application.id,
                rankingConditionId: rule.id,
                passed,
                actualValue,
              },
              update: { passed, actualValue },
            })
          } catch (e) {
            console.log(e)
          }
          return passed
        })
      )
      const isEligible = eligibilityResults.every((p) => p)

      const isCorrectScore =
        rank.baseScore === "Base10"
          ? cumulativeBase10.gte(rank.base10Min || 0) && cumulativeBase10.lte(rank.base10Max || 0)
          : cumulativeBase4.gte(rank.base4Min || 0) && cumulativeBase4.lte(rank.base4Max || 0)

      const eligibleRank = isEligible && isCorrectScore ? rank : null

      if (eligibleRank) {
        const downgrade = eligibleRank.downgradeRules.find(({ conditions }) =>
          conditions.every((rule) => evaluateCondition(studentDataContext, rule))
        )

        const rankDowngrade = sortedRankLevels[rankIdx + 1] || null

        if (downgrade) {
          const reason = `Bị hạ bậc: ${downgrade.conditions
            .map((rule) => {
              return `${criteriaFieldLabels[rule.field]} ${criteriaOperatorLabels[rule.operator]} ${rule.value}`
            })
            .join("\n")}`
          results.push({
            applicationId: application.id,
            graduation: !!rankDowngrade,
            gpa: CUMULATIVE_GPA,
            rank: rankDowngrade || null,
            reason,
            trainingMajor: curriculumVersion.curriculum.trainingMajor,
            diplomaType: curriculumVersion.diplomaType,
            downgraded: {
              from: rank,
              conditions: downgrade.conditions,
            },
          })
          break
        }

        results.push({
          applicationId: application.id,
          graduation: true,
          gpa: CUMULATIVE_GPA,
          rank,
          reason: "",
          trainingMajor: curriculumVersion.curriculum.trainingMajor,
          diplomaType: curriculumVersion.diplomaType,
        })
        break
      }
    }

    if (!results[idx]) {
      results.push({
        applicationId: application.id,
        graduation: false,
        gpa: CUMULATIVE_GPA,
        rank: null,
        reason: "Không thoả mãn xếp loại nào",
        trainingMajor: curriculumVersion.curriculum.trainingMajor,
        diplomaType: curriculumVersion.diplomaType,
      })
    }
  }

  // Lưu kết quả tất cả đơn
  for (const result of results) {
    await prisma.studentGraduationApplication.update({
      where: { id: result.applicationId },
      data: {
        graduation: result.graduation,
        diplomaTypeId: result.diplomaType?.id,
        trainingMajorId: result.trainingMajor?.id,
        gpa: result.gpa,
        rankId: result.rank?.id,
        reason: result.reason,
        status: ApplicationStatus.IN_REVIEW,
      },
    })
  }

  return c.json({ results }, 200)
})
const generateDiplomaNumber = createRoute({
  operationId: "generateDiplomaNumber",
  tags: ["Graduation"],
  path: "/generate-diploma-number",
  method: "put",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            field: z.enum(["originalDiplomaNumber", "diplomaNumber"]),
            sessionId: z.string(),
            prefix: z.string().nullish(),
            start: z.number(),
            maxLength: z.number().nullish(),
            suffix: z.string().nullish(),
            rewrite: z.boolean().default(false),
            skip: z
              .string()
              .nullish()
              .transform((val) => {
                if (val == null) return []

                return val
                  .split(/[\s,;]+/)
                  .map((v) => v.trim())
                  .filter(Boolean)
                  .map(Number)
              })
              .refine((arr) => arr.every((n) => !Number.isNaN(n)), {
                message: "Danh sách bỏ qua phải là số",
              }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully",
      content: {
        "application/json": {
          schema: z.object({ count: z.number() }),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            existing: z.array(z.string()).optional(),
            shouldSkip: z.array(z.number()).optional(),
          }),
        },
      },
    },
  },
})

app.openapi(generateDiplomaNumber, async (c) => {
  const { field, sessionId, prefix, suffix, start, maxLength, rewrite, skip } = c.req.valid("json")

  const decisions = await prisma.graduationDecision.findMany({
    where: {
      application: { sessionId },
      ...(rewrite ? {} : { [field]: null }),
    },
    select: { id: true },
    orderBy: [{ [field]: "asc" }, { student: { userProfile: { firstName: "asc" } } }],
  })

  if (decisions.length === 0) {
    return c.json({ count: 0 }, 200)
  }

  const generatedNumbers: string[] = []
  let currentNumber = start
  let i = 0
  while (i < decisions.length) {
    if (skip?.includes(currentNumber)) {
      currentNumber++
      continue
    }

    generatedNumbers.push(
      genOriginalDiplomaNumber({
        prefix,
        suffix,
        currentNumber,
        maxLength,
      })
    )

    currentNumber++
    i++
  }

  const existing = await prisma.graduationDecision.findMany({
    where: {
      [field]: { in: generatedNumbers },
      ...(rewrite ? { application: { sessionId: { not: sessionId } } } : {}),
    },
    select: { [field]: true },
  })

  if (existing.length > 0) {
    return c.json(
      {
        message: "Số hiệu đã tồn tại",
        existing: existing.flatMap((e) => e[field] || []),
        shouldSkip: existing
          .map((e) => e[field])
          .filter((num) => !!num)
          .map((num) => {
            let serialStr = num as unknown as string
            if (prefix) {
              serialStr = serialStr.startsWith(prefix)
                ? serialStr.substring(prefix.length)
                : serialStr
            }
            if (suffix) {
              serialStr = serialStr.endsWith(suffix)
                ? serialStr.slice(0, -suffix.length)
                : serialStr
            }
            return Number.parseInt(serialStr, 10)
          })
          .filter((num) => !Number.isNaN(num)),
      },
      400
    )
  }

  const updates = decisions.map((decision, index) =>
    prisma.graduationDecision.update({
      where: { id: decision.id },
      data: { [field]: generatedNumbers[index] },
    })
  )

  if (rewrite) {
    const result = await prisma.$transaction([
      prisma.graduationDecision.updateMany({
        where: {
          application: { sessionId },
          id: { in: decisions.map((d) => d.id) },
        },
        data: { [field]: null },
      }),
      ...updates,
    ])
    return c.json({ count: result[0]?.count }, 200)
  }

  const result = await prisma.$transaction(updates)
  return c.json({ count: result.length }, 200)
})

const graduationSessionDecision = createRoute({
  operationId: "graduationSessionDecision",
  tags: ["Graduation"],
  path: "/session-decision",
  method: "get",
  request: {
    query: z.object({
      sessionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(graduationSessionDecision, async (c) => {
  const { sessionId } = c.req.valid("query")

  const graduationDecisions = await prisma.graduationDecision.findMany({
    where: { application: { sessionId } },
    include: {
      trainingMajor: true,
      finalRanking: true,
      diplomaType: true,
      student: {
        include: {
          userProfile: { include: { gender: true } },
          curriculumVersion: {
            include: {
              trainingType: true,
            },
          },
          fixedClass: {
            include: {
              curriculumVersion: {
                include: {
                  trainingType: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const data = graduationDecisions.map((graduationDecision, idx) => {
    const curriculumVersion =
      graduationDecision.student.curriculumVersion ||
      graduationDecision.student.fixedClass?.curriculumVersion

    const dateOfBirth = graduationDecision.student.userProfile.dateOfBirth

    return {
      no: idx + 1,
      ...graduationDecision,
      originalDiplomaNumber: graduationDecision.originalDiplomaNumber,
      diplomaNumber: graduationDecision.diplomaNumber,
      diplomaIssueDate: graduationDecision.diplomaIssueDate,
      fullname: graduationDecision.student.userProfile.fullname,
      FULLNAME: graduationDecision.student.userProfile.fullname?.toUpperCase(),
      gender: graduationDecision.student.userProfile.gender?.sTen,
      dayOfBirth: dateOfBirth ? dateOfBirth.getDate().toString().padStart(2, "0") : null,
      monthOfBirth: dateOfBirth ? (dateOfBirth.getMonth() + 1).toString().padStart(2, "0") : null,
      mmmOfBirth: dateOfBirth ? dateOfBirth.toLocaleString("en-US", { month: "short" }) : null,
      yearOfBirth: dateOfBirth ? dateOfBirth.getFullYear() : null,
      trainingMajor: graduationDecision.trainingMajor?.name,
      classification: graduationDecision.finalRanking.classification,
      classificationEnglish: graduationDecision.finalRanking.classificationEnglish,
      trainingType: curriculumVersion?.trainingType?.name,
      diplomaType: graduationDecision.diplomaType?.name,
      diplomaTypeEnglish: graduationDecision.diplomaType?.englishName,
    }
  })

  const buffer = await getTemplateBuffer(prisma, "DANH_SACH_TOT_NGHIEP")

  const template = new XlsxTemplate(buffer)

  template.substitute(1, { data })

  const result = await template.generate({ type: "arraybuffer" })

  const fileName = "DANH_SACH_TOT_NGHIEP.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const statisticsGraduationDecision = createRoute({
  operationId: "statisticsGraduationDecision",
  tags: ["Graduation"],
  path: "/statistics",
  method: "get",
  request: {
    query: z.object({
      trainingObjectTypeId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Successfully",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              count: z.number(),
              year: z.number(),
              classification: z.string(),
            })
          ),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(statisticsGraduationDecision, async (c) => {
  const { trainingObjectTypeId } = c.req.valid("query")
  const res = await prisma.$queryRaw<{ count: number; year: number; classification: string }[]>`
            select count("GraduationDecision"."studentId"),
            date_part('year', "decisionDate") as year,
            ARC."classification"              as classification
        from "ql-dao-tao"."GraduationDecision"
                inner join "ql-dao-tao"."AcademicRankingConvert" ARC on ARC.id = "GraduationDecision"."finalRankingId"
                inner join "ql-dao-tao"."StudentGraduationApplication" SGA on SGA.id = "GraduationDecision"."applicationId"
                inner join "ql-dao-tao"."GraduationSession" GS on GS.id = SGA."sessionId"
        where GS."trainingObjectTypeId" = ${trainingObjectTypeId}
        group by date_part('year', "decisionDate"), classification;
    `
  return c.json(
    res.map((item) => ({
      count: item.count ? Number(item.count) : 0,
      year: item.year ? Number(item.year) : 0,
      classification: item.classification,
    })),
    200
  )
})

const exportGraduationDecisionPptx = createRoute({
  operationId: "exportGraduationDecisionPptx",
  tags: ["Graduation"],
  path: "/export-graduation-decision-pptx",
  method: "post",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.partial().extend({
            sessionId: z.string().optional(),
            timeout: z.coerce.number().default(30),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(exportGraduationDecisionPptx, async (c) => {
  const { sessionId, timeout, file } = c.req.valid("form")

  const decisions = await prisma.graduationDecision.findMany({
    where: { application: { sessionId } },
    include: {
      trainingMajor: { include: { trainingField: true } },
      finalRanking: true,
      diplomaType: true,
      student: {
        include: {
          userProfile: { include: { gender: true } },
          curriculumVersion: {
            include: {
              trainingType: true,
            },
          },
          fixedClass: {
            include: {
              curriculumVersion: {
                include: {
                  trainingType: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const bufferTemplate = await getTemplateBuffer(prisma, "SLIDE_TN")

  const automizer = new Automizer({
    // templateDir: './templates',
    // outputDir: './templates',
    removeExistingSlides: true,
  })

  // automizer.load(bufferTemplate, 'slide_TN')
  // const pres = automizer.loadRoot('slide_TN.pptx').load('slide_TN.pptx', 'main')

  const pres = automizer.loadRoot(bufferTemplate).load(bufferTemplate, "main")

  const info = await pres.getInfo()
  const slideNumbers = info.slidesByTemplate("main").map((s) => s.number)

  const templateBaseIndex = slideNumbers[0]
  const templateIndex = slideNumbers[1]
  const listIndex = slideNumbers[2]
  if (!templateBaseIndex || !templateIndex || !listIndex) {
    return c.json({ message: "Template not found" }, 400)
  }

  pres.addSlide("main", templateBaseIndex)

  const chunkSize = 26
  for (const c of chunk(decisions, chunkSize)) {
    for (const decision of c) {
      pres.addSlide("main", templateIndex, (slide) => {
        const coords = {
          x: 1.5,
          y: 2,
          w: 3,
          h: 4,
        }

        //! some how slide.generate runs before slide.modify

        slide.modify((xml) => {
          // const pic = Array.from(xml.getElementsByTagName('p:pic'))[0]
          // pic?.parentElement?.removeChild(pic)
          // if (pic) {
          //     const spPr = pic.getElementsByTagName('p:spPr')[0]
          //     if (!spPr) {
          //         console.warn('No spPr found for placeholder')
          //         return
          //     }

          //     const xfrm = spPr.getElementsByTagName('a:xfrm')[0]

          //     if (xfrm) {
          //         console.warn('No a:xfrm found in spPr')
          //         const off = xfrm.getElementsByTagName('a:off')[0]
          //         const ext = xfrm.getElementsByTagName('a:ext')[0]

          //         coords.x = Number.parseInt(off?.getAttribute('x') || '0', 10) / 914400
          //         coords.y = Number.parseInt(off?.getAttribute('y') || '0', 10) / 914400
          //         coords.w = Number.parseInt(ext?.getAttribute('cx') || '0', 10) / 914400
          //         coords.h = Number.parseInt(ext?.getAttribute('cy') || '0', 10) / 914400
          //     }
          // }

          const textNodes = xml.getElementsByTagName("a:t")
          for (const t of textNodes) {
            t.textContent = t.textContent
              .replace("{{fullname}}", decision.student.userProfile.fullname?.toUpperCase() || "")
              .replace("{{field}}", decision.trainingMajor?.trainingField.name.toUpperCase() || "")
              .replace(
                "{{classification}}",
                decision.finalRanking?.classification.toUpperCase() || ""
              )
          }
        })

        slide.generate(async (pSlide, pptxGenJs) => {
          const res = await getFilesEmployeeUserIdImage(decision.student.userProfile.id, {
            fullName: decision.student.userProfile.fullname || "",
            tenantCode: "dev",
          })
          const blob = res.data as unknown as Blob

          if (blob && blob.size > 0) {
            const arrayBuffer = await blob.arrayBuffer()

            const buffer = Buffer.from(arrayBuffer).toBase64()
            const data = `image/png;base64,${buffer}`

            // const res = await getFilesDownloadAppCodeFileName(
            //     'lms',
            //     decision.student.userProfile.avatar,
            //     undefined,
            //     {
            //         headers: {
            //             'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
            //             'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
            //         },
            //     }
            // )
            // console.log(res)

            pSlide.addImage({
              data,
              // path: 'https://randomuser.me/api/portraits/lego/6.jpg',
              ...coords,
            })
          }
        })
      })
    }
    pres.addSlide("main", listIndex, (slide) => {
      const list1 = c
        .slice(0, chunkSize / 2)
        .map((d, i) => `${i + 1}. ${d.student.userProfile.fullname?.toUpperCase()}` || "")
        .join("\n")
      const list2 = c
        .slice(chunkSize / 2)
        .map(
          (d, i) =>
            `${chunkSize / 2 + i + 1}. ${d.student.userProfile.fullname?.toUpperCase()}` || ""
        )
        .join("\n")
      slide.modify((xml) => {
        const textNodes = xml.getElementsByTagName("a:t")
        for (const t of textNodes) {
          t.textContent = t.textContent.replace("{{list1}}", list1).replace("{{list2}}", list2)
        }
      })
    })
  }

  const nodeStream = (await pres.stream({
    type: "nodebuffer",
    compression: "DEFLATE",
  })) as Readable
  const webStream = Readable.toWeb(nodeStream)
  // await pres.write('generated.pptx')

  const fileName = "slide_TN.pptx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(webStream as any, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "Content-Disposition": disposition,
  })
})

const exportGraduationRegisterMaster = createRoute({
  operationId: "exportGraduationRegisterMaster",
  tags: ["Graduation"],
  path: "/export-graduation-register-master",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            trainingObjectTypeId: z.string().describe("ID loại đối tượng đào tạo"),
            trainingCourseIds: z.array(z.string()).optional(),
            fixedClassIds: z.array(z.string()).optional(),
            thesisSessionIds: z.array(z.string()).optional(),
            managementOrganizationId: z.string().optional(),
            printDate: z.string().optional().describe("ISO date string"),
            signerName: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Export graduation register master file",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(exportGraduationRegisterMaster, async (c) => {
  const {
    trainingObjectTypeId,
    trainingCourseIds,
    fixedClassIds,
    thesisSessionIds,
    managementOrganizationId,
    printDate,
    signerName,
  } = c.req.valid("json")

  const students = await prisma.student.findMany({
    where: {
      fixedClass: {
        trainingCourse: {
          trainingObjectTypeId,
        },
        ...(trainingCourseIds?.length && {
          trainingCourseId: { in: trainingCourseIds },
        }),
        ...(fixedClassIds?.length && { id: { in: fixedClassIds } }),
        ...(managementOrganizationId && { managementOrganizationId }),
      },
      ...(thesisSessionIds?.length && {
        thesisRegistrations: {
          some: {
            thesisProject: {
              thesisSessionId: { in: thesisSessionIds },
            },
          },
        },
      }),
      deletedAt: null,
    },
    include: {
      userProfile: {
        include: {
          gender: true,
          ethnicity: true,
          nationality: true,
        },
      },
      fixedClass: {
        include: {
          trainingCourse: {
            include: {
              trainingObjectType: {
                include: {
                  trainingForm: true,
                },
              },
            },
          },
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                },
              },
            },
          },
          managementOrganization: true,
        },
      },
      graduationDecision: true,
      graduationApplications: true,
      thesisRegistrations: {
        where: {
          ...(thesisSessionIds?.length && {
            thesisProject: {
              thesisSessionId: { in: thesisSessionIds },
            },
          }),
        },
        include: {
          council: true,
          thesisProject: {
            include: {
              defenseRecord: true,
              thesisSession: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      subjectClassStudent: {
        where: {
          deletedAt: null,
          active: true,
          withdrew: false,
          examBanned: false,
          suspended: false,
        },
        select: {
          subjectVersionId: true,
          finalScore: true,
          manualFinalScore: true,
          subjectClass: {
            select: { type: true },
          },
          subjectVersion: {
            select: { credit: true },
          },
        },
      },
    },
  })
  if (!students.length) {
    return c.json({ message: "Không tìm thấy dữ liệu sinh viên phù hợp" }, 404)
  }

  const [courses, sessions, trainingObjectType] = await Promise.all([
    prisma.trainingCourse.findMany({
      where: { id: { in: trainingCourseIds || [] } },
      select: { name: true },
    }),
    prisma.thesisSession.findMany({
      where: { id: { in: thesisSessionIds || [] } },
      select: { id: true, name: true },
    }),
    prisma.trainingObjectType.findUniqueOrThrow({
      where: { id: trainingObjectTypeId },
      include: { trainingForm: true },
    }),
  ])

  const courseNames = courses.map((e) => e.name).join(", ")
  const trainingForm = trainingObjectType.trainingForm?.name || ""
  let selectedDate = printDate ? dayjs(printDate, "DD/MM/YYYY") : dayjs()
  if (!selectedDate.isValid()) {
    selectedDate = dayjs()
  }
  const ngayInText = `ngày ${selectedDate.date()} tháng ${selectedDate.month() + 1} năm ${selectedDate.year()}`

  const signerInfo = parseSignerInfo(signerName || "")

  const calcTBC = (subjectClassStudent: (typeof students)[number]["subjectClassStudent"]) => {
    if (!subjectClassStudent?.length) return 0
    const bestScoreMap = new Map<string, { score: number; credit: number }>()
    for (const record of subjectClassStudent) {
      const newScore =
        record.manualFinalScore ?? (record.finalScore ? Number(record.finalScore) : null)
      if (newScore === null) continue
      const existing = bestScoreMap.get(record.subjectVersionId)
      const isRetake =
        record.subjectClass?.type === "RETAKE" || record.subjectClass?.type === "REEXAM"
      if (!existing || newScore > existing.score || isRetake) {
        bestScoreMap.set(record.subjectVersionId, {
          score: newScore,
          credit: record.subjectVersion?.credit || 0,
        })
      }
    }
    let totalScore = 0
    let totalCredit = 0
    for (const item of bestScoreMap.values()) {
      totalScore += item.score * item.credit
      totalCredit += item.credit
    }
    return totalCredit > 0 ? totalScore / totalCredit : 0
  }

  const buildRow = (student: (typeof students)[number], index: number) => {
    const gD = student.graduationDecision
    const tR = student.thesisRegistrations?.[0]
    const user = student.userProfile
    const thesisSession = tR?.thesisProject?.thesisSession
    const calculatedTBC = calcTBC(student.subjectClassStudent)
    const tbcFinal = gD?.finalGpa
      ? formatScore(gD.finalGpa, 2)
      : calculatedTBC > 0
        ? formatScore(calculatedTBC, 2)
        : ""
    return {
      stt: index + 1,
      hoTen: user?.fullname || "",
      ngaySinh: user?.dateOfBirth ? dayjs(user.dateOfBirth).format("DD/MM/YYYY") : "",
      soDinhDanh: user?.idCardNumber || "",
      khoa: student.fixedClass?.trainingCourse?.name || "",
      noiSinh: user?.placeOfBirth || "",
      gioiTinh: user?.gender?.sTen || "",
      danToc: user?.ethnicity?.sTen || "",
      quyetDinhTrungTuyen: student?.fixedClass?.trainingCourse?.admissionDecision || "",
      quocTich: user?.nationality?.sTen || "",
      "quyetDinhHDDGLV/ĐATN": thesisSession?.defenseDecisionNumber || "",
      ngayBaoVe: thesisSession?.startDate
        ? dayjs(thesisSession.startDate).format("DD/MM/YYYY")
        : "",
      quyetDinhTotNghiep: gD?.code || "",
      namTN: student.universityGraduationYear || "",
      nganhDaoTao:
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name || "",
      chuyenNganh: student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
      soHieuVanBang: gD?.diplomaNumber || "",
      soVaoSoGoc: gD?.originalDiplomaNumber || "",
      coQuanDonVi: student.fixedClass?.managementOrganization?.sTenVietTat || "",
      diemLVDATN: formatScore(tR?.thesisProject?.defenseRecord?.finalScore, 2),
      diemTBC: tbcFinal || "",
      nguoiNhanVanBang: "",
      ghiChu: "",
    }
  }

  const renderSheet = async (
    sessionName: string,
    sessionStudents: typeof students
  ): Promise<Buffer> => {
    const buf = await getTemplateBuffer(prisma, "SoGocCapPhatVanBangCaoHoc_v6.xlsx")
    const tpl = new XlsxTemplate(buf)
    const rows = sessionStudents.map((s, i) => buildRow(s, i))
    tpl.substitute("PD", {
      khoa: courseNames,
      dot_xet: sessionName,
      hinh_thuc_dao_tao: trainingForm,
      so_van_ban: sessionStudents[0]?.graduationDecision?.code || "",
      ngay_in: ngayInText,
      ...signerInfo,
      data: rows,
    })
    return tpl.generate({ type: "nodebuffer" }) as any
  }

  let sessionGroups: { id: string; name: string; students: typeof students }[]

  if (sessions.length > 0) {
    const studentsBySession = new Map<string, typeof students>()
    for (const session of sessions) {
      studentsBySession.set(session.id, [])
    }
    for (const student of students) {
      const sessionId = student.thesisRegistrations?.[0]?.thesisProject?.thesisSessionId
      if (sessionId && studentsBySession.has(sessionId)) {
        studentsBySession.get(sessionId)!.push(student)
      }
    }
    sessionGroups = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      students: studentsBySession.get(s.id) || [],
    }))
  } else {
    sessionGroups = [{ id: "all", name: "Tất cả", students }]
  }

  const outputWorkbook = new ExcelJS.Workbook()

  for (const group of sessionGroups) {
    if (!group.students.length) continue

    const sheetBuffer = await renderSheet(group.name, group.students)

    const tmpWorkbook = new ExcelJS.Workbook()
    await tmpWorkbook.xlsx.load(sheetBuffer as any)

    const sourceSheet = tmpWorkbook.getWorksheet("PD") ?? tmpWorkbook.worksheets[0]
    if (!sourceSheet) continue

    const sheetName = group.name.substring(0, 31).replace(/[\\\?\*\/\[\]]/g, "")
    const destSheet = outputWorkbook.addWorksheet(sheetName)

    for (let i = 1; i <= sourceSheet.columnCount; i++) {
      const srcCol = sourceSheet.getColumn(i)
      const destCol = destSheet.getColumn(i)
      if (srcCol.width) {
        destCol.width = srcCol.width
      }
    }

    sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const destRow = destSheet.getRow(rowNumber)
      destRow.height = row.height

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const destCell = destRow.getCell(colNumber)

        if (cell.master === cell) {
          destCell.value = cell.value
        }

        if (cell.style) {
          destCell.style = JSON.parse(JSON.stringify(cell.style))
        }
      })
    })

    const merges = sourceSheet.model.merges || []
    merges.forEach((m) => {
      try {
        destSheet.mergeCells(m)
      } catch (err) {}
    })

    destSheet.pageSetup = JSON.parse(JSON.stringify(sourceSheet.pageSetup || {}))
  }

  if (outputWorkbook.worksheets.length === 0) {
    return c.json({ message: "Không có dữ liệu sinh viên trong các đợt xét đã chọn" }, 404)
  }

  const result = await outputWorkbook.xlsx.writeBuffer()

  const fileName = "SoGocCapPhatVanBang.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result as any, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportPhoiBangCaoHoc = createRoute({
  operationId: "exportPhoiBangCaoHoc",
  tags: ["Graduation"],
  path: "/export-phoi-bang-cao-hoc",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            trainingObjectTypeId: z.string().optional(),
            trainingCourseIds: z.array(z.string()).optional(),
            fixedClassIds: z.array(z.string()).optional(),
            thesisSessionIds: z.array(z.string()).optional(),
            managementOrganizationId: z.string().optional(),
            printDate: z.string().optional(),
            signerName: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Export thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(exportPhoiBangCaoHoc, async (c) => {
  const {
    trainingObjectTypeId,
    trainingCourseIds,
    fixedClassIds,
    thesisSessionIds,
    managementOrganizationId,
    signerName,
  } = c.req.valid("json")

  const students = await prisma.student.findMany({
    where: {
      fixedClass: {
        ...(trainingObjectTypeId && {
          trainingCourse: {
            trainingObjectTypeId,
          },
        }),
        ...(trainingCourseIds?.length && {
          trainingCourseId: { in: trainingCourseIds },
        }),
        ...(fixedClassIds?.length && { id: { in: fixedClassIds } }),
        ...(managementOrganizationId && { managementOrganizationId }),
      },
      ...(thesisSessionIds?.length && {
        thesisRegistrations: {
          some: {
            thesisProject: {
              thesisSessionId: { in: thesisSessionIds },
            },
          },
        },
      }),
      deletedAt: null,
      active: true,
    },
    include: {
      userProfile: {
        include: {
          gender: true,
        },
      },
      graduationDecision: true,
      fixedClass: {
        include: {
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingMajor: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!students.length) {
    return c.json({ message: "Không tìm thấy dữ liệu sinh viên phù hợp" }, 404)
  }

  const signerInfo = parseSignerInfo(signerName || "")

  const payload = students.map((student) => {
    const user = student.userProfile
    const major = student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
    const gD = student.graduationDecision

    const dobParts = getReportDateParts(user?.dateOfBirth)
    const graduationDateParts =
      getReportDateParts(gD?.decisionDate) || getReportDateParts(new Date())

    const isFemale = user?.gender?.sTen?.toLowerCase() === "nữ"
    const prefixVi = isFemale ? "Bà" : "Ông"
    const prefixEn = isFemale ? "Ms" : "Mr"

    return {
      data: {
        ho_ten_vi: `${prefixVi} ${user?.fullname?.toUpperCase() || ""}`,
        ho_ten_en: `${prefixEn} ${
          user?.fullname
            ?.toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/Đ/g, "D") || ""
        }`,
        ngay_sinh_vi: dobParts?.day ? `${dobParts.day}/${dobParts.monthVi}/${dobParts.year}` : "",
        ngay_sinh_en: dobParts?.day ? `${dobParts.day} ${dobParts.monthEn} ${dobParts.year}` : "",
        nganh_hoc_vi: major?.name || "",
        nganh_hoc_en: (major as any)?.englishName?.toUpperCase() || "",
        ngay_tn: graduationDateParts?.day || "",
        thang_tn: graduationDateParts?.monthVi || "",
        nam_tn: graduationDateParts?.year || "",
        ngay_tot_nghiep: graduationDateParts?.day
          ? `Ngày ${graduationDateParts.day} tháng ${graduationDateParts.monthVi} năm ${graduationDateParts.year}`
          : "",
        so_quyet_dinh: gD?.diplomaNumber || "",
        ...signerInfo,
        ho_ten_nguoi_ky: signerInfo.ten_day_du,
      },
    }
  })

  try {
    const templateBuffer = await getTemplateBuffer(prisma, "PhoiBangCaoHoc_v1.xlsx")
    const result = await generateExcelFromTemplate(templateBuffer, payload, {
      showGridLines: true,
      wrapText: true,
    })

    const fileName = "PhoiBangCaoHoc.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result as any, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error: any) {
    console.error("Error generating Excel:", error.message)
    return c.json({ message: "Lỗi khi xuất file Excel" }, 500)
  }
})

const exportPhoiBangNganHan = createRoute({
  operationId: "exportPhoiBangNganHan",
  tags: ["Graduation"],
  path: "/export-phoi-bang-ngan-han",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            trainingObjectTypeId: z.string().optional(),
            trainingCourseIds: z.array(z.string()).optional(),
            fixedClassIds: z.array(z.string()).optional(),
            thesisSessionIds: z.array(z.string()).optional(),
            managementOrganizationId: z.string().optional(),
            printDate: z.string().optional(),
            signerName: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Export thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(exportPhoiBangNganHan, async (c) => {
  const {
    trainingObjectTypeId,
    trainingCourseIds,
    fixedClassIds,
    thesisSessionIds,
    managementOrganizationId,
    printDate,
    signerName,
  } = c.req.valid("json")

  const students = await prisma.student.findMany({
    where: {
      fixedClass: {
        ...(trainingObjectTypeId && {
          trainingCourse: {
            trainingObjectTypeId,
          },
        }),
        ...(trainingCourseIds?.length && {
          trainingCourseId: { in: trainingCourseIds },
        }),
        ...(fixedClassIds?.length && { id: { in: fixedClassIds } }),
        ...(managementOrganizationId && { managementOrganizationId }),
      },
      ...(thesisSessionIds?.length && {
        thesisRegistrations: {
          some: {
            thesisProject: {
              thesisSessionId: { in: thesisSessionIds },
            },
          },
        },
      }),
      deletedAt: null,
      active: true,
    },
    include: {
      userProfile: {
        include: {
          gender: true,
        },
      },
      graduationDecision: true,
      fixedClass: {
        include: {
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingMajor: true,
                },
              },
            },
          },
          trainingCourse: {
            include: {
              semesterStart: true,
              scoreConverts: {
                where: { deletedAt: null, active: true },
              },
            },
          },
        },
      },
      subjectClassStudent: {
        where: { deletedAt: null, active: true },
        include: {
          subjectVersion: true,
        },
      },
    },
  })

  if (!students.length) {
    return c.json({ message: "Không tìm thấy dữ liệu sinh viên phù hợp" }, 404)
  }

  const signerInfo = parseSignerInfo(signerName || "")

  const payload = students.map((student) => {
    const user = student.userProfile
    const gD = student.graduationDecision
    const course = student.fixedClass?.trainingCourse

    const dobParts = getReportDateParts(user?.dateOfBirth)
    const startDateParts = getReportDateParts(
      course?.semesterStart?.startDate || student.fixedClass?.createdAt
    )
    const endDateParts = getReportDateParts(
      course?.semesterStart?.endDate || gD?.decisionDate || new Date()
    )
    const pDateParts = getReportDateParts(printDate || new Date())

    const subjectScores = student.subjectClassStudent || []
    const totalCredits = subjectScores.reduce(
      (acc, item) => acc + (item.subjectVersion?.credit || 0),
      0
    )
    const totalPoints = subjectScores.reduce(
      (acc, item) => acc + (Number(item.finalScore) || 0) * (item.subjectVersion?.credit || 0),
      0
    )
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0

    const scoreConverts = course?.scoreConverts || []
    const xepLoaiVi = getScoreClassification(gpa, scoreConverts)

    const classificationMappingEn: Record<string, string> = {
      "Xuất sắc": "Excellent",
      Giỏi: "Very Good",
      Khá: "Good",
      "Trung bình khá": "Fairly Good",
      "Trung bình": "Average",
      Yếu: "Poor",
    }
    const xepLoaiEn = classificationMappingEn[xepLoaiVi] || ""

    const isFemale = user?.gender?.sTen?.toLowerCase() === "nữ"
    const prefixVi = isFemale ? "Bà " : "Ông "
    const prefixEn = isFemale ? "Ms " : "Mr "

    return {
      data: {
        ho_ten_vi: `${prefixVi}${user?.fullname?.toUpperCase() || ""}`,
        ho_ten_en: `${prefixEn}${
          user?.fullname
            ?.toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/Đ/g, "D") || ""
        }`,
        ngay_sinh_vi: dobParts?.day ? `${dobParts.day}/${dobParts.monthVi}/${dobParts.year}` : "",
        ngay_sinh_en: dobParts?.day ? `${dobParts.day} ${dobParts.monthEn} ${dobParts.year}` : "",
        chuyen_nganh_vi:
          student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name?.toUpperCase() ||
          "",
        chuyen_nganh_en:
          student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.englishName?.toUpperCase() ||
          "",
        ngay_bat_dau_vi: startDateParts?.day
          ? `${startDateParts.day}/${startDateParts.monthVi}/${startDateParts.year}`
          : "",
        ngay_bat_dau_en: startDateParts?.day
          ? `${startDateParts.day} ${startDateParts.monthEn} ${startDateParts.year}`
          : "",

        ngay_ket_thuc_vi: endDateParts?.day
          ? `${endDateParts.day}/${endDateParts.monthVi}/${endDateParts.year}`
          : "",
        ngay_ket_thuc_en: endDateParts?.day
          ? `${endDateParts.day} ${endDateParts.monthEn} ${endDateParts.year}`
          : "",

        hoc_luc_vi: xepLoaiVi,
        hoc_luc_en: xepLoaiEn,

        ngay_in_vi: pDateParts?.day
          ? `Ngày ${pDateParts.day} tháng ${pDateParts.monthVi} năm ${pDateParts.year}`
          : "",
        ngay_in_en: pDateParts?.day
          ? `${pDateParts.monthEn} ${pDateParts.day}, ${pDateParts.year}`
          : "",

        ngay_tn: pDateParts?.day || "",
        thang_tn: pDateParts?.monthVi || "",
        nam_tn: pDateParts?.year || "",

        ...signerInfo,
        ho_ten_nguoi_ky: signerInfo.ten_day_du,
      },
    }
  })

  try {
    const templateBuffer = await getTemplateBuffer(prisma, "PhoiBangNganHan_v4.xlsx")
    const result = await generateExcelFromTemplate(templateBuffer, payload, {
      showGridLines: true,
      wrapText: true,
    })

    const fileName = "PhoiBangNganHan.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result as any, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error: any) {
    console.error("Error generating Excel:", error.message)
    return c.json({ message: "Lỗi khi xuất file Excel" }, 500)
  }
})

const exportPhuLucVanBangCaoHoc = createRoute({
  operationId: "exportPhuLucVanBangCaoHoc",
  tags: ["Graduation"],
  path: "/export-phu-luc-van-bang-cao-hoc",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            trainingObjectTypeId: z.string().optional(),
            trainingCourseIds: z.array(z.string()).optional(),
            fixedClassIds: z.array(z.string()).optional(),
            thesisSessionIds: z.array(z.string()).optional(),
            managementOrganizationId: z.string().optional(),
            printDate: z.string().optional(),
            signerName: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Export thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(exportPhuLucVanBangCaoHoc, async (c: any) => {
  const {
    trainingObjectTypeId,
    trainingCourseIds,
    fixedClassIds,
    thesisSessionIds,
    managementOrganizationId,
    printDate,
    signerName,
  } = c.req.valid("json")

  const students = await prisma.student.findMany({
    where: {
      fixedClass: {
        ...(trainingObjectTypeId && {
          trainingCourse: {
            trainingObjectTypeId,
          },
        }),
        ...(trainingCourseIds?.length && {
          trainingCourseId: { in: trainingCourseIds },
        }),
        ...(fixedClassIds?.length && { id: { in: fixedClassIds } }),
        ...(managementOrganizationId && { managementOrganizationId }),
      },
      ...(thesisSessionIds?.length && {
        thesisRegistrations: {
          some: {
            thesisProject: {
              thesisSessionId: { in: thesisSessionIds },
            },
          },
        },
      }),
      deletedAt: null,
      active: true,
    },
    include: {
      userProfile: {
        include: {
          gender: true,
        },
      },
      graduationDecision: true,
      fixedClass: {
        include: {
          trainingCourse: {
            include: {
              trainingObjectType: {
                include: {
                  trainingForm: true,
                },
              },
              scoreConverts: true,
            },
          },
          curriculumVersion: {
            include: {
              trainingTime: true,
              curriculum: {
                include: {
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      thesisRegistrations: {
        where: { deletedAt: null },
        include: {
          thesisProject: {
            include: {
              primarySupervisor: { include: { userProfile: true } },
              secondarySupervisor: { include: { userProfile: true } },
              thirdSupervisor: true,
              defenseRecord: true,
              thesisSession: true,
            },
          },
          council: {
            include: {
              members: {
                include: {
                  expert: {
                    include: {
                      lecturer: { include: { userProfile: true } },
                      academicDegreeType: true,
                      academicRankType: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      subjectClassStudent: {
        where: { deletedAt: null, active: true },
        include: {
          subjectVersion: {
            include: {
              subject: true,
            },
          },
        },
      },
      studentYearResult: {
        where: { deletedAt: null },
        orderBy: { studyYear: "desc" },
      },
    },
  })

  if (!students.length) {
    return c.json({ message: "Không tìm thấy dữ liệu sinh viên phù hợp" }, 404)
  }

  const signerInfo = parseSignerInfo(signerName || "")
  const pDateParts = getReportDateParts(printDate || new Date())

  const councilRoleVi: Record<string, string> = {
    CHAIRMAN: "Chủ tịch",
    SECRETARY: "Thư ký",
    REVIEWER_1: "Phản biện 1",
    REVIEWER_2: "Phản biện 2",
    MEMBER: "Ủy viên",
  }

  const trainingObjectTypeShort: Record<string, string> = {
    "Định hướng ứng dụng": "ƯD",
    "Định hướng nghiên cứu": "NC",
  }

  const groups = new Map<string, typeof students>()
  for (const student of students) {
    const major = student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
    const majorCode = major?.code || "Major"
    const typeName = student.fixedClass?.trainingCourse?.trainingObjectType?.name || ""
    let typeCode = typeName
    for (const [key, value] of Object.entries(trainingObjectTypeShort)) {
      if (typeName.includes(key)) {
        typeCode = value
        break
      }
    }
    const courseName = student.fixedClass?.trainingCourse?.name || "Course"

    const sheetName = `${majorCode}-${typeCode}-${courseName}`
      .substring(0, 31)
      .replace(/[\\\?\*\/\[\]]/g, "")
    if (!groups.has(sheetName)) {
      groups.set(sheetName, [])
    }
    groups.get(sheetName)!.push(student)
  }

  const sheetData = Array.from(groups.entries()).map(([sheetName, groupStudents]) => {
    const payloads = groupStudents.map((student) => {
      const user = student.userProfile
      const gD = student.graduationDecision
      const tR = student.thesisRegistrations?.[0]
      const tP = tR?.thesisProject
      const course = student.fixedClass?.trainingCourse
      const major = student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
      const curriculumVersion = student.fixedClass?.curriculumVersion

      const dobParts = getReportDateParts(user?.dateOfBirth)
      const startDateParts = getReportDateParts(course?.admissionStartDate || student.fixedClass?.createdAt)
      const endDateParts = getReportDateParts(course?.admissionEndDate || gD?.decisionDate || new Date())
      const enrollDateParts = getReportDateParts(student.from || student.fixedClass?.createdAt)
      const defenseDateParts = getReportDateParts(tP?.defenseDate || tP?.thesisSession?.startDate)

      let totalCredits = 0
      let totalPoints10 = 0
      let totalPoints4 = 0

      const subjectRows = (student.subjectClassStudent || []).map((record, idx) => {
        const score = record.manualFinalScore ?? (record.finalScore ? Number(record.finalScore) : null)
        const credits = record.subjectVersion?.credit || 0
        
        const scoreConverts = course?.scoreConverts || []
        const conversion = scoreConverts.find(
          (c) => score !== null && score >= c.base10Min && score <= c.base10Max
        )

        if (credits) {
          totalCredits += credits
          totalPoints10 += (score || 0) * credits
          if (conversion) {
            totalPoints4 += conversion.base4 * credits
          }
        }

        return {
          stt: idx + 1,
          ten_hoc_phan: record.subjectVersion?.subject?.name || "",
          stc: credits,
          diem_he_10: formatScore(score, 1),
          diem_he_4: formatScore(conversion?.base4, 1),
          diem_he_chu: conversion ? conversion.letter : "",
        }
      })

      const lastYearResult = student.studentYearResult?.find((r) => r.isLastStudyYear)
      const gpa10 = lastYearResult
        ? Number(lastYearResult.cumulativeGpaBase10)
        : totalCredits > 0
          ? totalPoints10 / totalCredits
          : 0
      const gpa4 = lastYearResult
        ? Number(lastYearResult.cumulativeGpaBase4)
        : totalCredits > 0
          ? totalPoints4 / totalCredits
          : 0
      const councilMembers = (tR?.council?.members || []).map((m) => {
        const expert = m.expert
        const rank = expert?.academicRankType?.sTen || ""
        const degree = expert?.academicDegreeType?.sTen || ""
        
        const title = [rank, degree].filter(Boolean).join(".")
        
        return {
          chuc_vi: title || "",
          ten_day_du: expert?.name || "",
          don_vi: expert?.organization || "",
          vai_tro_hoi_dong: councilRoleVi[m.role] || m.role,
        }
      })

      const supervisors = [
        tP?.primarySupervisor?.userProfile?.fullname,
        tP?.secondarySupervisor?.userProfile?.fullname,
        tP?.thirdSupervisor?.name,
      ]
        .filter(Boolean)
        .join("; ")

      return {
        data: {
          so_quyet_dinh: gD?.diplomaNumber || "",
          ho_ten_hoc_vien: user?.fullname?.toUpperCase() || "",
          ma_hoc_vien: student.code || "",
          ngay_sinh: dobParts?.dateVi || "",
          gioi_tinh: user?.gender?.sTen || "",
          so_dinh_danh_ca_nhan: user?.idCardNumber || "",
          noi_sinh: user?.placeOfBirth || "",
          khoa: course?.name || "",
          start_date: startDateParts?.dateVi || "",
          end_date: endDateParts?.dateVi || "",
          ngay_nhap_hoc: enrollDateParts?.dateVi || "",
          nganh: major?.trainingField?.name || "",
          chuyen_nganh: major?.name || "",
          thoi_gian_dao_tao: curriculumVersion?.trainingTime?.name || "24 tháng",
          ngon_ngu_dao_tao: "Tiếng Việt",
          hinh_thuc_dao_tao: course?.trainingObjectType?.trainingForm?.name || "",
          dinh_huong: course?.trainingObjectType?.name?.toLowerCase()?.includes("nghiên cứu") 
            ? "nghiên cứu" 
            : course?.trainingObjectType?.name?.toLowerCase()?.includes("ứng dụng") 
              ? "ứng dụng" 
              : "",
          
          data: subjectRows,
          tong_so_tc: totalCredits,
          diem_tb_he_10: formatScore(gpa10, 2),
          diem_tb_he_4: formatScore(gpa4, 2),
          
          ten_de_an_tot_nghiep: tP?.title || "",
          danh_sach_can_bo_huong_dan: supervisors,
          ngay_bao_ve: defenseDateParts?.fullVi || "",
          
          ngay_in: pDateParts?.day || "",
          thang_in: pDateParts?.monthVi || "",
          nam_in: pDateParts?.year || "",
          page_break: "ngắt trang",
          ...signerInfo,
          ten_nguoi_ky: signerInfo.ten_day_du,
          chuc_vi_tl: (signerInfo as any).chuc_vi_ky_thay || "",
        },
        group: councilMembers
      }
    })

    return { sheetName, payload: payloads }
  })

  const templateBuffer = await getTemplateBuffer(prisma, "PhuLucVanBangCaoHoc_v14.xlsx")
  const result = await generateExcelMultiSheet(templateBuffer, sheetData)
  const fileName = "PhuLucVanBangCaoHoc.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result as any, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportPhuLucVanBangNganHan = createRoute({
  operationId: "exportPhuLucVanBangNganHan",
  tags: ["Graduation"],
  path: "/export-phu-luc-van-bang-ngan-han",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            trainingObjectTypeId: z.string().optional(),
            trainingCourseIds: z.array(z.string()).optional(),
            fixedClassIds: z.array(z.string()).optional(),
            thesisSessionIds: z.array(z.string()).optional(),
            managementOrganizationId: z.string().optional(),
            printDate: z.string().optional(),
            signerName: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Export thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(exportPhuLucVanBangNganHan, async (c: any) => {
  const {
    trainingObjectTypeId,
    trainingCourseIds,
    fixedClassIds,
    thesisSessionIds,
    managementOrganizationId,
    printDate,
    signerName,
  } = c.req.valid("json")

  const students = await prisma.student.findMany({
    where: {
      fixedClass: {
        ...(trainingObjectTypeId && {
          trainingCourse: {
            trainingObjectTypeId,
          },
        }),
        ...(trainingCourseIds?.length && {
          trainingCourseId: { in: trainingCourseIds },
        }),
        ...(fixedClassIds?.length && { id: { in: fixedClassIds } }),
        ...(managementOrganizationId && { managementOrganizationId }),
      },
      ...(thesisSessionIds?.length && {
        thesisRegistrations: {
          some: {
            thesisProject: {
              thesisSessionId: { in: thesisSessionIds },
            },
          },
        },
      }),
      deletedAt: null,
      active: true,
    },
    include: {
      userProfile: {
        include: {
          gender: true,
        },
      },
      graduationDecision: true,
      fixedClass: {
        include: {
          trainingCourse: {
            include: {
              trainingObjectType: {
                include: {
                  trainingForm: true,
                },
              },
              scoreConverts: true,
            },
          },
          curriculumVersion: {
            include: {
              trainingTime: true,
              curriculum: {
                include: {
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      subjectClassStudent: {
        where: { deletedAt: null, active: true },
        include: {
          subjectVersion: {
            include: {
              subject: true,
            },
          },
        },
      },
      studentYearResult: {
        where: { deletedAt: null },
        orderBy: { studyYear: "desc" },
      },
    },
  })

  if (!students.length) {
    return c.json({ message: "Không tìm thấy dữ liệu sinh viên phù hợp" }, 404)
  }

  const signerInfo = parseSignerInfo(signerName || "")
  const pDateParts = getReportDateParts(printDate || new Date())

  const trainingObjectTypeShort: Record<string, string> = {
    "Định hướng ứng dụng": "ƯD",
    "Định hướng nghiên cứu": "NC",
  }

  const getClassification = (score: number) => {
    if (score >= 9.0) return "Xuất sắc"
    if (score >= 8.0) return "Giỏi"
    if (score >= 7.0) return "Khá"
    if (score >= 5.0) return "Trung bình"
    return "Yếu"
  }

  const groups = new Map<string, typeof students>()
  for (const student of students) {
    const major = student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
    const majorCode = major?.code || "Major"
    const typeName = student.fixedClass?.trainingCourse?.trainingObjectType?.name || ""
    let typeCode = typeName
    for (const [key, value] of Object.entries(trainingObjectTypeShort)) {
      if (typeName.includes(key)) {
        typeCode = value
        break
      }
    }
    const courseName = student.fixedClass?.trainingCourse?.name || "Course"

    const sheetName = `${majorCode}-${typeCode}-${courseName}`
      .substring(0, 31)
      .replace(/[\\\?\*\/\[\]]/g, "")
    if (!groups.has(sheetName)) {
      groups.set(sheetName, [])
    }
    groups.get(sheetName)!.push(student)
  }

  const sheetData = Array.from(groups.entries()).map(([sheetName, groupStudents]) => {
    const payloads = groupStudents.map((student) => {
      const user = student.userProfile
      const gD = student.graduationDecision
      const course = student.fixedClass?.trainingCourse
      const major = student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
      const curriculumVersion = student.fixedClass?.curriculumVersion

      const dobParts = getReportDateParts(user?.dateOfBirth)
      const startDateParts = getReportDateParts(course?.admissionStartDate || student.fixedClass?.createdAt)
      const enrollDateParts = getReportDateParts(student.from || student.fixedClass?.createdAt)

      let totalCredits = 0
      let totalPoints10 = 0

      const allSubjects = (student.subjectClassStudent || []).map((record) => {
        const score = record.manualFinalScore ?? (record.finalScore ? Number(record.finalScore) : null)
        const credits = record.subjectVersion?.credit || 0
        
        if (credits) {
          totalCredits += credits
          totalPoints10 += (score || 0) * credits
        }

        return {
          ten_hoc_phan: record.subjectVersion?.subject?.name || "",
          stc: credits,
          diem_he_10: formatScore(score, 1),
          type: record.subjectVersion?.type
        }
      })

      const gradTypes = ["Graduation", "Thesis", "Project"]
      const normalSubjectsRaw = allSubjects.filter(s => !gradTypes.includes(s.type || ""))
      const graduationSubjectsRaw = allSubjects.filter(s => gradTypes.includes(s.type || ""))

      const subjectRows = normalSubjectsRaw.map((s, idx) => ({ ...s, stt: idx + 1 }))
      const graduationSubjects = graduationSubjectsRaw.map((s, idx) => ({ ...s, stt: idx + 1 }))

      const lastYearResult = student.studentYearResult?.find((r) => r.isLastStudyYear)
      const gpa10 = lastYearResult
        ? Number(lastYearResult.cumulativeGpaBase10)
        : totalCredits > 0
          ? totalPoints10 / totalCredits
          : 0

      return {
        data: {
          so_quyet_dinh: gD?.diplomaNumber || "",
          ten_hoc_vien: user?.fullname?.toUpperCase() || "",
          ma_hoc_vien: student.code || "",
          ngay_sinh: dobParts?.dateVi || "",
          gioi_tinh: user?.gender?.sTen || "",
          so_dinh_danh_ca_nhan: user?.idCardNumber || "",
          noi_sinh: user?.placeOfBirth || "",
          khoa: course?.name || "",
          start_date: startDateParts?.dateVi || "",
          ngay_nhap_hoc: enrollDateParts?.dateVi || "",
          nganh: major?.trainingField?.name || "",
          chuyen_nganh_chuyen_sau: major?.name || "",
          thoi_gian_dao_tao: curriculumVersion?.trainingTime?.name || "24 tháng",
          ngon_ngu_dao_tao: "Tiếng Việt",
          hinh_thuc_dao_tao: course?.trainingObjectType?.trainingForm?.name || "",
          
          data: subjectRows,
          diem_tb_tn: formatScore(gpa10, 2),
          hoc_luc: getClassification(gpa10),
          
          ngay_in: pDateParts?.day || "",
          thang_in: pDateParts?.monthVi || "",
          nam_in: pDateParts?.year || "",
          page_break: "ngắt trang",
          ...signerInfo,
          ten_nguoi_ky: signerInfo.ten_day_du,
          chuc_vi_tl: (signerInfo as any).chuc_vi_ky_thay || "",
        },
        group: graduationSubjects
      }
    })

    return { sheetName, payload: payloads }
  })

  const templateBuffer = await getTemplateBuffer(prisma, "PhuLucVanBangNganHan_v5.xlsx")
  const result = await generateExcelMultiSheet(templateBuffer, sheetData)
  const fileName = "PhuLucVanBangNganHan.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result as any, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
