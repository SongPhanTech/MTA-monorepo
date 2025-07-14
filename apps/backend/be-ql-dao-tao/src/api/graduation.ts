import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { AcademicActionType } from '@workspace/db'
import {
    AcademicRankingConvertScalarSchema,
    GraduationRankDowngradeConditionScalarSchema,
} from '@workspace/db/zod/models'
import { prisma } from '..'
import { evaluateCondition } from '../services/studen-result.service'
import type { StudentDataContext } from '../types/student-context'

const app = new OpenAPIHono({ strict: false })

const GraduationCheckResult = z
    .object({
        applicationId: z.string(),
        graduation: z.boolean(),
        reason: z.string(),
        gpa: z.number().nullish(),
        rank: AcademicRankingConvertScalarSchema.nullish(),
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
                        applicationIds: z.array(z.string()),
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
                ...(applicationIds.length ? { where: { id: { in: applicationIds } } } : {}),
            },
        },
    })

    const results: z.infer<typeof GraduationCheckResult>[] = []
    for (const application of session.applications) {
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
                                    where: { graduated: true },
                                    include: {
                                        rankingCondition: true,
                                        downgradeRules: { include: { conditions: true } },
                                    },
                                    orderBy: { rankOrder: 'asc' },
                                },
                                trainingObjectType: { select: { baseScore: true } },
                            },
                        },
                        curriculumVersion: {
                            select: {
                                trainingBlocks: {
                                    include: { subjects: { include: { subject: true } } },
                                },
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
            })
            continue
        }

        const curriculumVersion = student.curriculumVersion || student.fixedClass.curriculumVersion
        if (!curriculumVersion) {
            results.push({
                applicationId: application.id,
                graduation: false,
                reason: 'Sinh viên không có CTĐT',
            })
            continue
        }

        // TODO: kiểm tra môn tự chọn từng khối kiến thức

        const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(
            ({ subjects }) => subjects
        )

        const scoreToPass = student.fixedClass?.trainingCourse.scoreToPass || 4
        const scoreToPassGraduation = student.fixedClass?.trainingCourse.scoreToPassGraduation || 5
        const baseScore = student.fixedClass.trainingCourse.trainingObjectType.baseScore

        const subjectScores = await prisma.studentSubjectScore.findMany({
            where: {
                OR: [
                    {
                        studentId: application.studentId,
                    },
                    {
                        studentId: application.studentId,
                        subjectClass: { cancelled: false },
                    },
                ],
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
        console.log(111, application.studentId, subjectScores)

        for (const subjectScore of subjectScores) {
            const subjectInCurriculum = curriculumSubjects.find(
                (subject) => subject.subjectId === subjectScore.subjectVersionId
            )

            if (subjectInCurriculum?.useForFinalScore) {
                const credit = subjectInCurriculum.subject.credit
                totalCredit += credit
                const scoreBase10 = (subjectScore.manualFinalScore ||
                    subjectScore.finalScore) as number

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

                const scoreBase4 =
                    student.fixedClass?.trainingCourse.scoreConverts.find(
                        ({ base10Min, base10Max }) =>
                            base10Min < scoreBase10 && base10Max > scoreBase10
                    )?.base4 || 0

                // const credit = subjectInCurriculum.subject.credit
                totalScoreBase10 += scoreBase10 * credit
                totalScoreBase4 += scoreBase4 * credit
                totalPassCredit += credit
            }
        }

        const cumulativeBase10 =
            totalScoreBase10 && totalPassCredit ? totalScoreBase10 / totalPassCredit : 0
        const cumulativeBase4 =
            totalScoreBase4 && totalPassCredit ? totalScoreBase4 / totalPassCredit : 0

        const rankLevels = student.fixedClass?.trainingCourse.academicRankingConvert
        if (!rankLevels || !rankLevels.length) {
            results.push({
                applicationId: application.id,
                graduation: false,
                reason: 'Không có hạng xếp loại',
            })
            continue
        }

        const CUMULATIVE_GPA = baseScore === 'Base10' ? cumulativeBase10 : cumulativeBase4

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
                    ? student.studentSemesterResult[0]?.gpaBase10 || 0
                    : student.studentSemesterResult[0]?.gpaBase4 || 0,
            YEARLY_GPA:
                baseScore === 'Base10'
                    ? student.studentYearResult[0]?.gpaBase10 || 0
                    : student.studentYearResult[0]?.gpaBase4 || 0,
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
            idx,
            rank,
        ] of student.fixedClass.trainingCourse.academicRankingConvert.entries()) {
            const isEligible = rank.rankingCondition.every((rule) =>
                evaluateCondition(studentDataContext, rule)
            )

            const isCorrectScore =
                rank.baseScore === 'Base10'
                    ? cumulativeBase10 >= (rank.base10Min || 0) &&
                      cumulativeBase10 <= (rank.base10Max || 0)
                    : cumulativeBase4 >= (rank.base4Min || 0) &&
                      cumulativeBase4 <= (rank.base4Max || 0)

            const eligibleRank = isEligible && isCorrectScore ? rank : null

            // check downgrade or not
            if (eligibleRank) {
                const rankDowngrade =
                    student.fixedClass.trainingCourse.academicRankingConvert[idx + 1] || null
                const downgrade = eligibleRank.downgradeRules.find(({ conditions }) =>
                    conditions.every((rule) => evaluateCondition(studentDataContext, rule))
                )
                if (downgrade) {
                    results.push({
                        applicationId: application.id,
                        graduation: !!rankDowngrade,
                        gpa: CUMULATIVE_GPA,
                        rank: rankDowngrade || null,
                        reason: '',
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
                })
                break
            }
        }

        results.push({
            applicationId: application.id,
            graduation: false,
            gpa: CUMULATIVE_GPA,
            rank: null,
            reason: 'Không thoả mãn xếp loại nào',
        })
    }

    return c.json({ results }, 200)
})

export default app
