import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { AcademicActionType, RankingContext, SubjectRequirementType } from '@workspace/db'
import {
    AcademicRankingConvertScalarSchema,
    DiplomaTypeScalarSchema,
    GraduationRankDowngradeConditionScalarSchema,
    TrainingMajorScalarSchema,
} from '@workspace/db/zod/models'
import Decimal from 'decimal.js'
import { prisma } from '..'
import { evaluateCondition } from '../services/student-result.service'
import type { StudentDataContext } from '../types/student-context'

const app = new OpenAPIHono({ strict: false })

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
    .openapi('GraduationCheckResult')

const graduationCheck = createRoute({
    operationId: 'graduationCheck',
    tags: ['Graduation'],
    path: '/check',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        sessionId: z.string(),
                        applicationIds: z
                            .array(z.string())
                            .default([])
                            .optional()
                            .describe('Không truyền hoặc truyền mảng rỗng sẽ xét hết'),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Graduation check successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        results: GraduationCheckResult.array(),
                    }),
                },
            },
        },
        400: {
            description: 'Graduation check failed',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
        },
    },
})

app.openapi(graduationCheck, async (c) => {
    const { sessionId, applicationIds } = c.req.valid('json')

    const session = await prisma.graduationSession.findUniqueOrThrow({
        where: { id: sessionId },
        include: {
            applications: {
                ...(applicationIds?.length ? { where: { id: { in: applicationIds } } } : {}),
            },
        },
    })

    const results: z.infer<typeof GraduationCheckResult>[] = []
    applicationLoop: for (const [idx, application] of session.applications.entries()) {
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
                curriculumVersion: {
                    select: {
                        requiredCredits: true,
                        electiveCredits: true,
                        trainingBlocks: {
                            include: { subjects: { include: { subject: true } } },
                        },
                        curriculum: {
                            include: { trainingMajor: true },
                        },
                        diplomaType: true,
                    },
                },
                studentTrainingScore: { take: 1, orderBy: { createdAt: 'desc' } },
                studentSemesterResult: { take: 1, orderBy: { createdAt: 'desc' } },
                studentYearResult: { take: 1, orderBy: { createdAt: 'desc' } },
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
                                    orderBy: { rankOrder: 'asc' },
                                },
                            },
                        },
                        curriculumVersion: {
                            select: {
                                requiredCredits: true,
                                electiveCredits: true,
                                trainingBlocks: {
                                    include: { subjects: { include: { subject: true } } },
                                },
                                curriculum: {
                                    include: { trainingMajor: true },
                                },
                                diplomaType: true,
                            },
                        },
                    },
                },
            },
        })

        if (!student.fixedClass) {
            results.push({
                applicationId: application.id,
                graduation: false,
                reason: 'Sinh viên không có lớp quản lý',
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
                reason: 'Sinh viên không có CTĐT',
                trainingMajor: null,
                diplomaType: null,
            })
            continue
        }

        const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(
            ({ subjects }) => subjects
        )

        const {
            scoreToPass,
            scoreToPassConditional,
            scoreToPassGraduation,
            baseScore,
            scoreToRetain,
            scoreConverts,
        } = student.fixedClass.trainingCourse

        // include failed subjects for count
        const rawSubjectScores = await prisma.studentSubjectScore.findMany({
            where: {
                OR: [
                    { studentId: application.studentId },
                    {
                        studentId: application.studentId,
                        subjectClass: { cancelled: false },
                    },
                ],
                deletedAt: null,
                examPostponed: false,
                exempted: false,
                withdrew: false,
                suspended: false,
            },
            include: { subjectVersion: true },
            orderBy: { createdAt: 'asc' },
        })

        let totalDebtCredit = 0

        // kết quả những môn đạt với điểm cao nhất
        const subjectScoresMap = new Map<
            string,
            (typeof rawSubjectScores)[number] & {
                scoreBase10: number
                scoreBase4: number
                canImprove: boolean
            }
        >()

        for (const subjectScore of rawSubjectScores) {
            const scoreBase10 =
                subjectScore.manualFinalScore || subjectScore.finalScore?.toNumber() || 0
            const scoreConvert = scoreConverts.find(
                (s) => s.base10Min <= scoreBase10 && s.base10Max >= scoreBase10
            )
            const scoreBase4 = scoreConvert?.base4 || 0

            const subjectInCurriculum = curriculumSubjects.find(
                (subject) => subject.subjectId === subjectScore.subjectVersionId
            )

            // lưu kết quả môn đạt
            if (
                (subjectInCurriculum?.graduation && scoreBase10 >= scoreToPassGraduation) ||
                (subjectInCurriculum?.useForFinalScore && scoreBase10 >= scoreToPassConditional) ||
                scoreBase10 >= scoreToPass
            ) {
                const entry = subjectScoresMap.get(subjectScore.subjectVersionId)
                // skip if can't improve or score is already higher
                if (entry && (!entry.canImprove || entry.scoreBase10 > scoreBase10)) {
                    continue
                }

                subjectScoresMap.set(subjectScore.subjectVersionId, {
                    ...subjectScore,
                    scoreBase10,
                    scoreBase4,
                    canImprove: scoreConvert?.improvementRegister || false,
                })
            }

            const entry = subjectScoresMap.get(subjectScore.subjectVersionId)
            // tín chỉ trượt
            if (
                !entry && // đã đạt thì bỏ qua
                subjectInCurriculum?.useForFinalScore &&
                ((subjectInCurriculum.graduation && scoreBase10 < scoreToPassGraduation) ||
                    scoreBase10 < scoreToPass)
            ) {
                totalDebtCredit += subjectInCurriculum.subject.credit
            }
        }

        // TODO: Implement logic for check equivalence subject
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
            include: { subjects: { include: { subject: { select: { credit: true } } } } },
        })

        type SubjectScore = (typeof rawSubjectScores)[number] & {
            scoreBase10: number
            scoreBase4: number
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
            if (subjectScore && !subjectScore.canImprove) {
                finalScores.set(subject.subjectId, subjectScore)
                continue
            }

            const equivGroups = equivalencyGroups
                .filter(({ subjects }) =>
                    subjects.some(({ subjectId }) => subjectId === subject.subjectId)
                )
                .filter(({ id }) => !processedEquivalencyGroups.has(id))

            if (!subjectScore && !equivGroups.length) {
                results.push({
                    applicationId: application.id,
                    graduation: false,
                    reason: `Chưa đạt môn bắt buộc (${subject.subject.name})`,
                    diplomaType: null,
                    trainingMajor: curriculumVersion.curriculum.trainingMajor,
                })
                continue applicationLoop
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

                // kết quả những môn trong CTĐT
                const curriculumSideResult: ScoreResult[] = curriculumSide.map((s) => ({
                    ...s,
                    score: subjectScoresMap.get(s.subjectId),
                }))

                // kết quả những môn tương đương
                const otherSideResult: ScoreResult[] = otherSide
                    .map((s) => ({
                        ...s,
                        score: subjectScoresMap.get(s.subjectId),
                    }))
                    .filter((r) => r.score)
                if (otherSideResult.length < otherSide.length) {
                    // không đạt môn tương đương
                    continue
                }

                // nếu môn CTĐT chưa đạt => lấy kết quả môn tương đương
                if (curriculumSideResult.some((r) => !r.score)) {
                    hasEquivalencyGroup = true
                    for (const result of curriculumSideResult) {
                        if (result.score) {
                            // đánh dấu môn bổ sung kiến thức
                            finalScores.delete(result.subjectId)
                        } else {
                            // đánh dấu môn CTĐT chưa đạt nhưng được xử lý bởi nhóm tương đương
                            processedSubjects.add(result.subjectId)
                        }
                    }
                    for (const result of otherSideResult) {
                        if (!result.score) continue
                        finalScores.set(result.subjectId, result.score)
                    }
                    break
                }

                const calcScore = (scoreResults: ScoreResult[]) => {
                    let totalScore = new Decimal(0)
                    let totalCredit = 0
                    for (const scoreResult of scoreResults) {
                        const credit = scoreResult.subject.credit
                        totalScore = totalScore.add(
                            new Decimal(scoreResult.score?.scoreBase10 || 0).mul(credit)
                        )
                        totalCredit += credit
                    }
                    return totalScore.div(totalCredit).toNumber()
                }

                const curriculumSideScore = calcScore(curriculumSideResult)
                const otherSideScore = calcScore(otherSideResult)

                if (curriculumSideScore <= otherSideScore) {
                    hasEquivalencyGroup = true
                    for (const result of otherSideResult) {
                        if (!result.score) continue
                        finalScores.set(result.subjectId, result.score)
                    }
                }

                if (hasEquivalencyGroup) break
            }

            if (
                !hasEquivalencyGroup &&
                subject.useForFinalScore &&
                subject.type === SubjectRequirementType.Mandatory
            ) {
                results.push({
                    applicationId: application.id,
                    graduation: false,
                    reason: `Chưa đạt môn bắt buộc (${subject.subject.name})`,
                    diplomaType: null,
                    trainingMajor: curriculumVersion.curriculum.trainingMajor,
                })
                continue applicationLoop
            }
        }

        // TODO: kiểm tra môn tự chọn từng khối kiến thức

        let totalScoreBase10 = new Decimal(0)
        let totalScoreBase4 = new Decimal(0)
        let totalPassCredit = 0
        const courseGradeLowest = Number.POSITIVE_INFINITY
        const graduationCourseGradeLowest = Number.POSITIVE_INFINITY

        for (const [subjectId, score] of finalScores) {
            const credit = score.subjectVersion.credit
            totalScoreBase10 = totalScoreBase10.add(new Decimal(score.scoreBase10).mul(credit))
            totalScoreBase4 = totalScoreBase4.add(new Decimal(score.scoreBase4).mul(credit))
            totalPassCredit += credit
        }

        if (
            curriculumVersion.requiredCredits &&
            totalPassCredit < curriculumVersion.requiredCredits
        ) {
            results.push({
                applicationId: application.id,
                graduation: false,
                reason: `Chưa đạt số tín chỉ (${totalPassCredit} < ${curriculumVersion.requiredCredits})`,
                trainingMajor: curriculumVersion.curriculum.trainingMajor,
                diplomaType: curriculumVersion.diplomaType,
            })
            continue
        }

        const cumulativeBase10 = totalPassCredit
            ? totalScoreBase10.div(totalPassCredit).toNumber()
            : 0
        const cumulativeBase4 = totalPassCredit
            ? totalScoreBase4.div(totalPassCredit).toNumber()
            : 0

        const rankLevels = student.fixedClass?.trainingCourse.academicRankingConvert
        if (!rankLevels?.length) {
            results.push({
                applicationId: application.id,
                graduation: false,
                reason: 'Không có hạng xếp loại',
                trainingMajor: curriculumVersion.curriculum.trainingMajor,
                diplomaType: curriculumVersion.diplomaType,
            })
            continue
        }

        const CUMULATIVE_GPA = Number(
            (baseScore === 'Base10' ? cumulativeBase10 : cumulativeBase4).toFixed(2)
        )

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
                baseScore === 'Base10'
                    ? student.studentSemesterResult[0]?.gpaBase10.toNumber() || 0
                    : student.studentSemesterResult[0]?.gpaBase4.toNumber() || 0,
            YEARLY_GPA:
                baseScore === 'Base10'
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

            ACADEMIC_WARNING_LEVEL: student.academicWarningLevel,
            DISCIPLINARY_WARNING_LEVEL: student.disciplinaryWarningLevel,
            REPEAT_YEAR_COUNT: repeatYearCount,
            SUSPENSION_COUNT: suspensionCount,

            CONDUCT_SCORE: student.studentTrainingScore[0]?.score || 0,
            HAS_PASSED_FOREIGN_LANGUAGE: student.foreignLangPass,
            HAS_REGISTERED_FOR_SEMESTER: true,
            IS_PRIORITY_STUDENT: !!student._count.priorityObject,
            IS_CLASS_MONITOR_OR_LEADER: !!student.classMonitor,
            IS_STUDY_DURATION_EXCEEDED: false,
            IS_DEBT_SUBJECT_CONSECUTIVE: false,
            HAS_IMPROVEMENT_REGISTRATION: false,
        }

        for (const [
            rankIdx,
            rank,
        ] of student.fixedClass.trainingCourse.academicRankingConvert.entries()) {
            const isEligible = rank.rankingCondition.every(async (rule) => {
                const passed = evaluateCondition(studentDataContext, rule)
                const actualValue = Number(studentDataContext[rule.field])
                await prisma.applicationCheckResult
                    .upsert({
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
                    .catch((e) => {
                        console.log(e)
                    })

                return passed
            })

            const isCorrectScore =
                rank.baseScore === 'Base10'
                    ? cumulativeBase10 >= (rank.base10Min || 0) &&
                      cumulativeBase10 <= (rank.base10Max || 0)
                    : cumulativeBase4 >= (rank.base4Min || 0) &&
                      cumulativeBase4 <= (rank.base4Max || 0)

            const eligibleRank = isEligible && isCorrectScore ? rank : null

            // check downgrade or not
            if (eligibleRank) {
                const downgrade = eligibleRank.downgradeRules.find(({ conditions }) =>
                    conditions.every((rule) => evaluateCondition(studentDataContext, rule))
                )

                const rankDowngrade =
                    student.fixedClass.trainingCourse.academicRankingConvert[rankIdx + 1] || null

                if (downgrade) {
                    results.push({
                        applicationId: application.id,
                        graduation: !!rankDowngrade,
                        gpa: CUMULATIVE_GPA,
                        rank: rankDowngrade || null,
                        reason: '',
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
                    reason: '',
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
                reason: 'Không thoả mãn xếp loại nào',
                trainingMajor: curriculumVersion.curriculum.trainingMajor,
                diplomaType: curriculumVersion.diplomaType,
            })
        }
    }

    return c.json({ results }, 200)
})

export default app
