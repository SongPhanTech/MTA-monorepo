import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { AcademicActionType, RankingContext, SubjectRequirementType } from '@workspace/db'
import {
    AcademicRankingConvertScalarSchema,
    DiplomaTypeScalarSchema,
    GraduationRankDowngradeConditionScalarSchema,
    TrainingMajorScalarSchema,
} from '@workspace/db/zod/models'
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
    application: for (const [idx, application] of session.applications.entries()) {
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

        // TODO: kiểm tra môn tự chọn từng khối kiến thức

        const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(
            ({ subjects }) => subjects
        )

        const scoreToPass = student.fixedClass?.trainingCourse.scoreToPass || 4
        const scoreToPassGraduation = student.fixedClass?.trainingCourse.scoreToPassGraduation || 5
        const baseScore = student.fixedClass.trainingCourse.baseScore

        // include failed subjects for count
        const subjectScores = await prisma.studentSubjectScore.findMany({
            where: {
                OR: [
                    { studentId: application.studentId },
                    {
                        studentId: application.studentId,
                        subjectClass: { cancelled: false },
                    },
                ],
                deletedAt: null,
            },
            include: { subjectVersion: true },
        })

        let totalScoreBase10 = 0
        let totalScoreBase4 = 0
        let totalCredit = 0
        let totalDebtCredit = 0
        let totalPassCredit = 0
        let courseGradeLowest = Number.POSITIVE_INFINITY
        let graduationCourseGradeLowest = Number.POSITIVE_INFINITY

        console.log(
            subjectScores.map((s) => ({
                name: s.subjectVersion.name,
                score: s.manualFinalScore || s.finalScore,
            }))
        )

        const equivalencyGroups = await prisma.equivalencyGroup.findMany({
            where: {
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

        console.log(JSON.stringify(equivalencyGroups, null, 2))

        // kết quả những môn đạt với điểm cao nhất
        const subjectScoresMap = new Map<
            string,
            { subjectId: string; credit: number; scoreBase10: number; scoreBase4: number }
        >()

        for (const subjectScore of subjectScores) {
            const credit = subjectScore.subjectVersion.credit
            const scoreBase10 =
                subjectScore.manualFinalScore || subjectScore.finalScore?.toNumber() || 0
            const scoreBase4 =
                student.fixedClass?.trainingCourse.scoreConverts.find(
                    ({ base10Min, base10Max }) => base10Min < scoreBase10 && base10Max > scoreBase10
                )?.base4 || 0

            const entry = subjectScoresMap.get(subjectScore.subjectVersionId)
            if (entry) {
                entry.scoreBase10 = Math.max(entry.scoreBase10, scoreBase10)
                entry.scoreBase4 = Math.max(entry.scoreBase4, scoreBase4)
            } else {
                subjectScoresMap.set(subjectScore.subjectVersionId, {
                    subjectId: subjectScore.subjectVersionId,
                    credit,
                    scoreBase10,
                    scoreBase4,
                })
            }

            const subjectInCurriculum = curriculumSubjects.find(
                (subject) => subject.subjectId === subjectScore.subjectVersionId
            )

            if (subjectInCurriculum?.useForFinalScore) {
                totalCredit += credit

                // tín chỉ trượt
                if (
                    (subjectInCurriculum.graduation && scoreBase10 < scoreToPassGraduation) ||
                    scoreBase10 < scoreToPass
                ) {
                    totalDebtCredit += subjectInCurriculum.subject.credit
                    continue
                }

                if (subjectInCurriculum.graduation && scoreBase10 < courseGradeLowest) {
                    graduationCourseGradeLowest = scoreBase10
                }

                if (scoreBase10 < courseGradeLowest) {
                    courseGradeLowest = scoreBase10
                }
            }
        }

        // TODO: Implement logic for check equivalence subject

        const uniqueSubjectScores = Array.from(subjectScoresMap.values())
        for (const trainingBlock of curriculumVersion.trainingBlocks) {
            const requiredSubjects = trainingBlock.subjects.filter(
                (subject) =>
                    subject.type !== SubjectRequirementType.Optional || !subject.useForFinalScore
            )
            for (const subject of requiredSubjects) {
                const subjectScore = uniqueSubjectScores.find(
                    (s) => s.subjectId === subject.subjectId
                )
                if (!subjectScore) {
                    results.push({
                        applicationId: application.id,
                        graduation: false,
                        reason: `Chưa đạt môn bắt buộc (${subject.subject.name})`,
                        trainingMajor: curriculumVersion.curriculum.trainingMajor,
                        diplomaType: curriculumVersion.diplomaType,
                    })
                    continue application
                }
                const { credit, scoreBase10, scoreBase4 } = subjectScore
                totalScoreBase10 += scoreBase10 * credit
                totalScoreBase4 += scoreBase4 * credit
                totalPassCredit += credit
            }

            const optionalSubjects = trainingBlock.subjects.filter(
                (subject) => subject.type === SubjectRequirementType.Optional
            )

            // sort score and take ~ trainingBlock.electiveCreditsRequired
            const optionalSubjectScores = uniqueSubjectScores.filter((s) =>
                optionalSubjects.find((subject) => subject.subjectId === s.subjectId)
            )
            for (const subject of optionalSubjects) {
                const subjectScore = optionalSubjectScores.find(
                    (s) => s.subjectId === subject.subjectId
                )
                if (!subjectScore) {
                    continue
                }
                const { credit, scoreBase10, scoreBase4 } = subjectScore
                totalScoreBase10 += scoreBase10 * credit
                totalScoreBase4 += scoreBase4 * credit
                totalPassCredit += credit
            }
        }

        for (const [subjectVersionId, { credit, scoreBase10, scoreBase4 }] of subjectScoresMap) {
            totalScoreBase10 += scoreBase10 * credit
            totalScoreBase4 += scoreBase4 * credit
            totalPassCredit += credit
        }

        const cumulativeBase10 =
            totalScoreBase10 && totalPassCredit ? totalScoreBase10 / totalPassCredit : 0
        const cumulativeBase4 =
            totalScoreBase4 && totalPassCredit ? totalScoreBase4 / totalPassCredit : 0

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
            CUMULATIVE_PROGRESS_PERCENT: (totalPassCredit / totalCredit) * 100,

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
