import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { AcademicActionType, StudentStatus } from '@workspace/db'
import { getTemplateBuffer } from '@workspace/libs/server'
import dayjs from 'dayjs'
import ExcelJS from 'exceljs'
import XlsxTemplate from 'xlsx-template'
import { prisma } from '..'
import {
    CourseStudentAcademicActionResult,
    CourseStudentAcademicWarningResult,
    CourseStudentDecreaseAcademicWarningResult,
    CourseStudentScholarshipResult,
} from '../dto/student-info.dto'
import { exportStudentProfile } from '../services/student'
import {
    calculateStudentSemesterResult,
    calculateStudentYearResult,
    listStudentResultInfo,
    resultCourseStudentAcademicAction,
    resultCourseStudentAcademicWarning,
    resultCourseStudentDecreaseAcademicWarning,
    resultCourseStudentScholarship,
} from '../services/student-result.service'

const app = new OpenAPIHono({ strict: false })

const tongKetHocKyHVSV = createRoute({
    operationId: 'calculateStudentSemesterResultJson',
    path: '/calculate-student-semester-result-json',
    tags: ['Student'],
    summary: 'Tổng kết kết quả học kỳ của học viên, sinh viên',
    description: 'Trả kết quả học kỳ của học viên, sinh viên dưới dạng JSON',
    method: 'post',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của kỳ học',
            }),
            trainingCourseId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student semester result as JSON',
            content: {
                'application/json': {
                    schema: z.any(),
                },
            },
        },
        400: {
            description: 'Invalid semester ID',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        500: {
            description: 'Server error during calculation',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

const tongKetNamHocHVSV = createRoute({
    operationId: 'calculateStudentSchoolYearResult',
    path: '/calculate-student-school-year-result',
    tags: ['Student'],
    summary: 'Tổng kết kết quả năm học của học viên, sinh viên',
    description: 'Trả kết quả năm học của học viên, sinh viên dưới dạng',
    method: 'post',
    request: {
        query: z.object({
            semesterId: z.string(),
            trainingCourseId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student schoolYear result',
            content: {
                'application/json': {
                    schema: z.any(),
                },
            },
        },
        400: {
            description: 'Invalid',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        500: {
            description: 'Server error during calculation',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

const exportScholarshipJson = createRoute({
    operationId: 'exportStudentScholarshipJson',
    path: '/export-json-list-student-scholarship',
    tags: ['Student'],
    summary: 'Danh sách học bổng của học viên',
    description: 'Xuất danh sách học viên đạt học bổng dưới dạng JSON',
    method: 'get',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của kỳ học',
            }),
            trainingObjectTypeId: z
                .string()
                .openapi('trainingObjectTypeId', { description: 'ID loại đối tượng đào tạo' }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student scholarship as JSON',
            content: {
                'application/json': {
                    schema: z.array(CourseStudentScholarshipResult),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

const exportAcademicWarningJson = createRoute({
    operationId: 'exportStudentAcademicWarningJson',
    path: '/export-json-list-student-academic-warning',
    tags: ['Student'],
    summary: 'Danh sách cảnh cáo học tập của học viên',
    description: 'Xuất danh sách học viên bị cảnh cáo học tập dưới dạng JSON',
    method: 'get',
    request: {
        query: z.object({
            semesterId: z.string(),
            trainingObjectTypeId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student academic warning as JSON',
            content: {
                'application/json': {
                    schema: z.array(CourseStudentAcademicWarningResult),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

const exportAcademicActionJson = createRoute({
    operationId: 'exportStudentAcademicActionJson',
    path: '/export-json-list-student-academic-action',
    tags: ['Student'],
    summary: 'Danh sách xử lý học vụ của học viên',
    description: 'Xuất danh sách học viên bị xử lý học vụ dưới dạng JSON',
    method: 'get',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của kỳ học',
            }),
            trainingObjectTypeId: z
                .string()
                .openapi('trainingObjectTypeId', { description: 'ID loại đối tượng đào tạo' }),
            academicActionType: z
                .enum(['REPEAT_YEAR', 'SUSPENSION', 'EXPULSION'])
                .optional()
                .openapi('academicActionType', {
                    description: 'Loại hành động học vụ',
                }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student academic action as JSON',
            content: {
                'application/json': {
                    schema: z.array(CourseStudentAcademicActionResult),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

const exportDecreaseAcademicWarningJson = createRoute({
    operationId: 'exportStudentDecreaseAcademicWarningJson',
    path: '/export-json-list-student-decrease-academic-warning',
    tags: ['Student'],
    summary: 'Danh sách giảm cảnh cáo học tập của học viên',
    description: 'Xuất danh sách học viên được giảm cảnh cáo học tập dưới dạng JSON',
    method: 'get',
    request: {
        query: z.object({
            semesterId: z.string(),
            trainingObjectTypeId: z.string(),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student decrease academic warning as JSON',
            content: {
                'application/json': {
                    schema: z.array(CourseStudentDecreaseAcademicWarningResult),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

const PheDuyetLuuBan = createRoute({
    operationId: 'updateStudentStatus',
    path: '/update-students-status',
    tags: ['Student'],
    summary: 'Cập nhật trạng thái, điểm học viên theo xử lý học tập',
    description: 'Cập nhật trạng thái, điểm học viên theo xử lý học tập',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            decisionIds: z.string().array(),
                            academicActionType: z.nativeEnum(AcademicActionType),
                            classChanges: z
                                .array(
                                    z.object({
                                        decisionId: z.string(),
                                        fixedClassId: z.string(),
                                        changeCurriculumVersion: z.boolean(),
                                    })
                                )
                                .optional(),
                        })
                        .superRefine((data, ctx) => {
                            if (data.academicActionType === AcademicActionType.REPEAT_YEAR) {
                                if (!data.classChanges || data.classChanges.length === 0) {
                                    ctx.addIssue({
                                        code: z.ZodIssueCode.custom,
                                        path: ['classChanges'],
                                        message:
                                            'classChanges is required when academicActionType is REPEAT_YEAR',
                                    })
                                }
                            }
                        }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Cập nhật trạng thái, điểm học viên theo xử lý học tập',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                        count: z.number(),
                    }),
                },
            },
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

app.openapi(PheDuyetLuuBan, async (c) => {
    const { decisionIds, academicActionType, classChanges } = c.req.valid('json')

    if (
        academicActionType === AcademicActionType.REPEAT_YEAR &&
        decisionIds.length !== classChanges?.length
    ) {
        return c.json(
            { message: 'classChanges is required when academicActionType is REPEAT_YEAR' },
            400
        )
    }

    const decisions = await prisma.studentAcademicDecision.findMany({
        where: {
            id: { in: decisionIds },
            actionTaken: academicActionType,
            updatedResult: false,
        },
        select: { studentId: true },
    })

    const studentIds = decisions.map((decision) => decision.studentId)

    const actionMap = {
        [AcademicActionType.REPEAT_YEAR]: StudentStatus.REPEATED,
        [AcademicActionType.SUSPENSION]: StudentStatus.ACADEMIC_SUSPENSION,
        [AcademicActionType.EXPULSION]: StudentStatus.WITHDRAWN,
    }

    const { count } = await prisma.$transaction(async (tx) => {
        await tx.studentAcademicDecision.updateMany({
            where: { id: { in: decisionIds } },
            data: { updatedResult: true },
        })

        const { count } = await tx.student.updateMany({
            where: {
                id: { in: studentIds },
                status: { not: StudentStatus.GRADUATED },
            },
            data: {
                status: actionMap[academicActionType],
            },
        })

        await tx.studentAcademicDecision.updateMany({
            where: { id: { in: decisionIds } },
            data: { status: 'APPROVED' },
        })

        if (academicActionType === AcademicActionType.REPEAT_YEAR && classChanges) {
            // update student fixedClassId independently based on classChanges
            for (const classChange of classChanges) {
                await tx.student.updateMany({
                    where: {
                        studentAcademicDecision: {
                            some: { id: classChange.decisionId },
                        },
                    },
                    data: {
                        fixedClassId: classChange.fixedClassId,
                        curriculumVersionId: classChange.changeCurriculumVersion ? null : undefined,
                    },
                })
            }

            await tx.studentSubjectScore.updateMany({
                where: { studentId: { in: studentIds }, repeated: false },
                data: { repeated: true },
            })
        }

        return { count }
    })

    // const listStudentRepeatGrade = await StudentRepeatGradeService(studentIds, semesterId)

    return c.json({ message: `Đã cập nhật ${count} trạng thái sinh viên`, count }, 200)
})

app.openapi(exportScholarshipJson, async (c) => {
    const { semesterId, trainingObjectTypeId } = c.req.valid('query')
    const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)
    if (!students || students.length === 0) {
        return c.json({ message: 'Không có sinh viên nào trong danh sách' }, 404)
    }
    const filteredStudents = await resultCourseStudentScholarship(students, semesterId)
    return c.json(filteredStudents, 200)
})

app.openapi(exportAcademicWarningJson, async (c) => {
    const { semesterId, trainingObjectTypeId } = c.req.valid('query')
    const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)
    if (!students || students.length === 0) {
        return c.json({ message: 'Không có sinh viên nào trong danh sách' }, 404)
    }
    const filteredStudents = await resultCourseStudentAcademicWarning(students, semesterId)
    return c.json(filteredStudents, 200)
})

app.openapi(exportAcademicActionJson, async (c) => {
    const { semesterId, academicActionType, trainingObjectTypeId } = c.req.valid('query')
    const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)
    if (!students || students.length === 0) {
        return c.json({ message: 'Không có sinh viên nào trong danh sách' }, 404)
    }
    const filteredStudents = await resultCourseStudentAcademicAction(
        students,
        semesterId,
        academicActionType
    )
    return c.json(filteredStudents, 200)
})

app.openapi(exportDecreaseAcademicWarningJson, async (c) => {
    const { semesterId, trainingObjectTypeId } = c.req.valid('query')
    const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)
    if (!students || students.length === 0) {
        return c.json({ message: 'Không có sinh viên nào trong danh sách' }, 404)
    }
    const filteredStudents = await resultCourseStudentDecreaseAcademicWarning(students, semesterId)
    return c.json(filteredStudents, 200)
})

app.openapi(tongKetHocKyHVSV, async (c) => {
    const { semesterId, trainingCourseId } = c.req.valid('query')
    // Validate semester existence
    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
    })
    if (!semester) {
        return c.json({ message: `Kỳ học với ID ${semesterId} không tồn tại` }, 400)
    }
    try {
        const studentResults = await calculateStudentSemesterResult(semesterId, trainingCourseId)
        return c.json(studentResults, 200)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
        console.error(
            `Error calculating semester results for semester ${semesterId}: ${errorMessage}`
        )
        return c.json({ message: `Lỗi khi tính toán kết quả học kỳ: ${errorMessage}` }, 500)
    }
})

app.openapi(tongKetNamHocHVSV, async (c) => {
    const { semesterId, trainingCourseId } = c.req.valid('query')
    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
    })
    if (!semester) {
        return c.json({ message: `Kỳ học với ID ${semesterId} không tồn tại` }, 400)
    }

    const students = await prisma.student.findMany({
        select: { id: true },
        where: {
            fixedClass: { trainingCourseId },
            status: {
                notIn: [
                    StudentStatus.GRADUATED,
                    StudentStatus.DEFERRED_STUDY,
                    StudentStatus.WITHDRAWN,
                    StudentStatus.TRANSFERRED,
                ],
            },
            deletedAt: null,
            active: true,
        },
    })

    setTimeout(() => {
        const chunkSize = 10
        for (let i = 0; i < students.length; i += chunkSize) {
            const chunk = students.slice(i, i + chunkSize)
            Promise.allSettled(
                chunk.map((s) =>
                    calculateStudentYearResult({
                        studentId: s.id,
                        schoolYearId: semester.schoolYearId,
                    })
                )
            )
        }
    }, 100)

    return c.json({ message: 'success' }, 200)
})

const debtStatistics = createRoute({
    operationId: 'debt-statistics',
    tags: ['Student'],
    path: '/debt-statistics',
    method: 'get',
    request: {
        query: z.object({
            trainingObjectTypeId: z.string(),
            trainingCourseId: z.string(),
            date: z.coerce.date().optional(),
        }),
    },
    responses: {
        200: {
            description: 'Export thống kê nợ',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
                },
            },
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

app.openapi(debtStatistics, async (c) => {
    const { trainingObjectTypeId, trainingCourseId, date = new Date() } = c.req.valid('query')

    const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
        where: { id: trainingObjectTypeId },
        select: { name: true },
    })

    const trainingCourse = await prisma.trainingCourse.findUniqueOrThrow({
        where: { id: trainingCourseId },
        select: { name: true },
    })

    type Result = {
        studentId: string
        studentCode: string
        fullname: string
        dateOfBirth: string
        fixedClassCode: string
        subjectCode: string
        subjectName: string
        subjectCredit: number
        semesterCode: string
        finalScore: number | null
    }[]

    const res = await prisma.$queryRaw<Result>`
                    select
                        SSS."studentId",
                        S."code" as "studentCode",
                        "UP"."fullname" as "fullname",
                        "UP"."dateOfBirth" as "dateOfBirth",
                        FC.code as "fixedClassCode",
                        sv.code as "subjectCode",
                        sv.name as "subjectName",
                        sv.credit as "subjectCredit",
                        SEM.code as "semesterCode",
                        SSS."finalScore" as "finalScore"
                    from "ql-dao-tao"."StudentSubjectScore" as SSS
                        inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                        inner join "ql-nguoi-dung"."UserProfile" "UP" on "UP".id = S."userProfileId"
                        inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                        inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                        inner join "ql-dao-tao"."Semester" SEM on SEM.id = SC."semesterId"
                        inner join "ql-dao-tao"."SubjectVersion" sv on sv.id = SSS."subjectVersionId"
                        inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                        inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV on CV.id = TBOCV."curriculumVersionId"
                        inner join "ql-dao-tao"."TrainingBlockSubject" TBS on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId" and TBS."subjectId" = sv.id
                    where
                        SC.cancelled = false and
                        SEM."endDate" <= ${date} and
                        (
                            SSS."finalScore" is null or
                            (TBS.graduation = true and SSS."finalScore" < TC."scoreToPassGraduation") or
                            (TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass") or
                            (TBS."useForFinalScore" = false and SSS."finalScore" < TC."scoreToPassConditional") or
                            SSS."examBanned" = true or
                            SSS.suspended = true
                        )
                        and SSS.withdrew = false
                        and SSS.exempted = false
                        and SSS."examPostponed" = false
                        and (
                            ${trainingObjectTypeId}::TEXT IS NULL
                            OR sv."trainingObjectTypeId" = ${trainingObjectTypeId}
                        )
                        and (
                            ${trainingCourseId}::TEXT IS NULL
                            OR TC.id = ${trainingCourseId}
                        )
                        and not exists (
                            select 1
                            from "ql-dao-tao"."StudentSubjectScore" as SSS_pass
                                inner join "ql-dao-tao"."Student" S_pass on S_pass.id = SSS_pass."studentId"
                                inner join "ql-dao-tao"."SubjectVersion" sv_pass on sv_pass.id = SSS_pass."subjectVersionId"
                                inner join "ql-dao-tao"."FixedClass" FC_pass on FC_pass.id = S_pass."fixedClassId"
                                inner join "ql-dao-tao"."TrainingCourse" TC_pass on TC_pass.id = FC_pass."trainingCourseId"
                                inner join "ql-dao-tao"."CurriculumVersion" CV_pass on CV_pass.id = S_pass."curriculumVersionId"
                                inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV_pass on CV_pass.id = TBOCV_pass."curriculumVersionId"
                                inner join "ql-dao-tao"."TrainingBlockSubject" TBS_pass on TBOCV_pass.id = TBS_pass."trainingBlockOnCurriculumVersionId" and TBS_pass."subjectId" = sv_pass.id
                            where
                                SSS_pass."studentId" = SSS."studentId" and sv_pass.id = sv.id
                                and SSS_pass.withdrew = false
                                and SSS_pass.exempted = false
                                and SSS_pass."examPostponed" = false
                                and SSS_pass."examBanned" = false
                                and SSS_pass.suspended = false
                                and (
                                    (TBS_pass.graduation = true and SSS_pass."finalScore" >= TC_pass."scoreToPassGraduation" or SSS_pass."manualFinalScore" >= TC_pass."scoreToPassGraduation") or
                                    (TBS_pass."useForFinalScore" = true and SSS_pass."finalScore" >= TC_pass."scoreToPass" or SSS_pass."manualFinalScore" >= TC_pass."scoreToPass") or
                                    (TBS_pass."useForFinalScore" = false and SSS_pass."finalScore" >= TC_pass."scoreToPassConditional" or SSS_pass."manualFinalScore" >= TC_pass."scoreToPassConditional")
                                )
                        )
                    order by SSS."studentId", sv.id
                    `

    type SubjectAttempt = {
        semesterCode: string
        finalScore: number | null
    }

    type DebtSubject = {
        subjectCode: string
        subjectName: string
        subjectCredit: number
        attempts: SubjectAttempt[]
    }

    type StudentDebtSummary = {
        studentId: string
        studentCode: string
        fullname: string
        dateOfBirth: string
        fixedClassCode: string
        subjects: DebtSubject[]
    }

    const studentDebtMap = res.reduce(
        (acc, record) => {
            const {
                studentId,
                studentCode,
                fullname,
                dateOfBirth,
                fixedClassCode,
                subjectCode,
                subjectName,
                subjectCredit,
                semesterCode,
                finalScore,
            } = record

            if (!acc[studentId]) {
                acc[studentId] = {
                    studentId,
                    studentCode,
                    fullname,
                    dateOfBirth,
                    fixedClassCode,
                    subjects: {},
                }
            }

            if (!acc[studentId].subjects[subjectCode]) {
                acc[studentId].subjects[subjectCode] = {
                    subjectCode,
                    subjectName,
                    subjectCredit,
                    attempts: [],
                }
            }

            acc[studentId].subjects[subjectCode].attempts.push({ semesterCode, finalScore })

            return acc
        },
        {} as Record<
            string,
            {
                studentId: string
                studentCode: string
                fullname: string
                dateOfBirth: string
                fixedClassCode: string
                subjects: Record<string, DebtSubject>
            }
        >
    )

    const debtSummary: StudentDebtSummary[] = Object.values(studentDebtMap).map((student) => ({
        ...student,
        subjects: Object.values(student.subjects),
    }))

    const rows = debtSummary.flatMap((s) => {
        const totalDebtSubject = s.subjects.length
        const totalDebtCredit = Object.values(s.subjects).reduce(
            (acc, subject) => acc + subject.subjectCredit,
            0
        )

        return s.subjects.map((subject) => {
            const finalScores = subject.attempts.map((attempt) => attempt.finalScore)
            let type = 'THI LẠI'
            let note = 'Đã thi trượt 1 lần'

            if (finalScores[finalScores.length - 1] === null) {
                type = 'CHƯA THI'
                note = 'Chưa thi hoặc GV chưa nhập điểm thi'
            } else if (finalScores.length > 1) {
                type = 'HỌC LẠI'
                note = `Đã thi trượt ít nhất ${finalScores.length} lần`
            }

            return {
                studentCode: s.studentCode,
                fullname: s.fullname,
                dateOfBirth: s.dateOfBirth ? dayjs(s.dateOfBirth).format('DD/MM/YYYY') : '',
                fixedClassCode: s.fixedClassCode,
                totalDebtSubject,
                totalDebtCredit,
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                subjectCredit: subject.subjectCredit,
                semesters: subject.attempts.map((attempt) => attempt.semesterCode).join('/'),
                finalScores: subject.attempts
                    .map((attempt) => String(attempt.finalScore))
                    .join('/'),
                type,
                note,
            }
        })
    })

    const buffer = await getTemplateBuffer(prisma, 'THONG_KE_NO')
    const template = new XlsxTemplate(buffer)
    const sheetName = 'DS HV nợ môn'

    template.substitute(sheetName, {
        ĐTĐT: trainingObjectType.name,
        KHOÁ: trainingCourse.name,
        DATE: dayjs(date).format('DD/MM/YYYY'),
        data: rows.map((r, idx) => ({ no: idx + 1, ...r })),
    })

    const result = await template.generate({ type: 'arraybuffer' })

    const fileName = `thong_ke_no_${trainingObjectType.name}_${trainingCourse.name}.xlsx`
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': disposition,
    })
})

const downloadStudentImportTemplate = createRoute({
    operationId: 'downloadStudentImportTemplate',
    tags: ['Student'],
    path: '/download-student-import-template',
    method: 'get',
    responses: {
        200: {
            description: 'Download template file with category sheets',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
        },
        500: {
            description: 'Internal server error',
            content: {
                'application/json': {
                    schema: z.object({ 
                        message: z.string(),
                        error: z.string().optional(),
                    }),
                },
            },
        },
    },
})

const exportStudentProfiles = createRoute({
    operationId: 'exportStudentProfiles',
    tags: ['Student'],
    path: '/export-student-profiles',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({ trainingCourseId: z.string() }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Success',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string() }),
                },
            },
        },
    },
})

app.openapi(downloadStudentImportTemplate, async (c) => {
    try {
        // Tạo workbook mới
        const workbook = new ExcelJS.Workbook()

        // Query danh sách tỉnh
        const provinces = await prisma.dM_Tinh.findMany({
            where: {
                bActive: true,
                bDeleted: false,
            },
            select: {
                sMa: true,
                sTen: true,
            },
            orderBy: {
                sTen: 'asc',
            },
        })

        // Query danh sách khoá học
        const trainingCourses = await prisma.trainingCourse.findMany({
            where: {
                active: true,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                code: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Query danh sách ngành
        const trainingFields = await prisma.trainingField.findMany({
            select: {
                id: true,
                name: true,
                code: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Query danh sách chuyên ngành
        const trainingMajors = await prisma.trainingMajor.findMany({
            select: {
                id: true,
                name: true,
                code: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Query danh sách CTĐT
        const curriculumVersions = await prisma.curriculumVersion.findMany({
            select: {
                id: true,
                name: true,
                code: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Sheet 1: IMPORT - Sheet chính
        const importSheet = workbook.addWorksheet('IMPORT')

        const headers = [
            'STT',
            'Mã sinh viên',
            'Họ và tên đệm',
            'Tên',
            'Ngày sinh',
            'Giới tính',
            'CCCD',
            'Nơi sinh',
            'Quê quán',
            'Tỉnh thường trú',
            'Số điện thoại',
            'Email',
            'Khoá học',
            'Ngành',
            'Chuyên ngành',
            'CTĐT',
            'Ghi chú',
        ]

        importSheet.addRow(headers)

        // Style cho header
        const headerRow = importSheet.getRow(1)
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        }
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
        headerRow.height = 30

        // Set width cho các cột
        importSheet.columns = [
            { width: 6 }, // STT
            { width: 15 }, // Mã sinh viên
            { width: 20 }, // Họ và tên đệm
            { width: 12 }, // Tên
            { width: 12 }, // Ngày sinh
            { width: 10 }, // Giới tính
            { width: 15 }, // CCCD
            { width: 20 }, // Nơi sinh
            { width: 20 }, // Quê quán
            { width: 15 }, // Tỉnh thường trú
            { width: 13 }, // Số điện thoại
            { width: 25 }, // Email
            { width: 12 }, // Khoá học
            { width: 30 }, // Ngành
            { width: 30 }, // Chuyên ngành
            { width: 30 }, // CTĐT
            { width: 25 }, // Ghi chú
        ]

        // Sheet 2: DanhMucTinh
        const provinceSheet = workbook.addWorksheet('DanhMucTinh')
        provinceSheet.addRow(['STT', 'Mã', 'Tên'])
        provinceSheet.getRow(1).font = { bold: true }
        provinceSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
        }
        provinceSheet.columns = [{ width: 6 }, { width: 10 }, { width: 30 }]

        provinces.forEach((p, idx) => {
            provinceSheet.addRow([idx + 1, p.sMa || '', p.sTen || ''])
        })

        // Sheet 3: DanhMucKhoaHoc
        const courseSheet = workbook.addWorksheet('DanhMucKhoaHoc')
        courseSheet.addRow(['STT', 'Mã', 'Tên'])
        courseSheet.getRow(1).font = { bold: true }
        courseSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
        }
        courseSheet.columns = [{ width: 6 }, { width: 10 }, { width: 30 }]

        trainingCourses.forEach((c, idx) => {
            courseSheet.addRow([idx + 1, c.code || '', c.name || ''])
        })

        // Sheet 4: DanhMucNganh
        const fieldSheet = workbook.addWorksheet('DanhMucNganh')
        fieldSheet.addRow(['STT', 'Mã', 'Tên'])
        fieldSheet.getRow(1).font = { bold: true }
        fieldSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
        }
        fieldSheet.columns = [{ width: 6 }, { width: 10 }, { width: 40 }]

        trainingFields.forEach((f, idx) => {
            fieldSheet.addRow([idx + 1, f.code || '', f.name || ''])
        })

        // Sheet 5: DanhMucChuyenNganh
        const majorSheet = workbook.addWorksheet('DanhMucChuyenNganh')
        majorSheet.addRow(['STT', 'Mã', 'Tên'])
        majorSheet.getRow(1).font = { bold: true }
        majorSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
        }
        majorSheet.columns = [{ width: 6 }, { width: 10 }, { width: 40 }]

        trainingMajors.forEach((m, idx) => {
            majorSheet.addRow([idx + 1, m.code || '', m.name || ''])
        })

        // Sheet 6: DanhMucCTDT
        const curriculumSheet = workbook.addWorksheet('DanhMucCTDT')
        curriculumSheet.addRow(['STT', 'Mã', 'Tên'])
        curriculumSheet.getRow(1).font = { bold: true }
        curriculumSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
        }
        curriculumSheet.columns = [{ width: 6 }, { width: 10 }, { width: 40 }]

        curriculumVersions.forEach((cv, idx) => {
            curriculumSheet.addRow([idx + 1, cv.code || '', cv.name || ''])
        })

        // Thêm Data Validation cho sheet IMPORT
        // Validation cho Giới tính
        importSheet.dataValidations.add('F2:F1000', {
            type: 'list',
            allowBlank: true,
            formulae: ['"Nam,Nữ"'],
        })

        // Validation cho Tỉnh thường trú (từ sheet DanhMucTinh)
        if (provinces.length > 0) {
            importSheet.dataValidations.add('J2:J1000', {
                type: 'list',
                allowBlank: true,
                formulae: [`DanhMucTinh!$C$2:$C$${provinces.length + 1}`],
            })
        }

        // Validation cho Khoá học
        if (trainingCourses.length > 0) {
            importSheet.dataValidations.add('M2:M1000', {
                type: 'list',
                allowBlank: true,
                formulae: [`DanhMucKhoaHoc!$C$2:$C$${trainingCourses.length + 1}`],
            })
        }

        // Validation cho Ngành
        if (trainingFields.length > 0) {
            importSheet.dataValidations.add('N2:N1000', {
                type: 'list',
                allowBlank: true,
                formulae: [`DanhMucNganh!$C$2:$C$${trainingFields.length + 1}`],
            })
        }

        // Validation cho Chuyên ngành
        if (trainingMajors.length > 0) {
            importSheet.dataValidations.add('O2:O1000', {
                type: 'list',
                allowBlank: true,
                formulae: [`DanhMucChuyenNganh!$C$2:$C$${trainingMajors.length + 1}`],
            })
        }

        // Validation cho CTĐT
        if (curriculumVersions.length > 0) {
            importSheet.dataValidations.add('P2:P1000', {
                type: 'list',
                allowBlank: true,
                formulae: [`DanhMucCTDT!$C$2:$C$${curriculumVersions.length + 1}`],
            })
        }

        // Ẩn các sheet danh mục
        provinceSheet.state = 'hidden'
        courseSheet.state = 'hidden'
        fieldSheet.state = 'hidden'
        majorSheet.state = 'hidden'
        curriculumSheet.state = 'hidden'

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer()

        const fileName = 'MauImportDSHV.xlsx'
        const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

        return c.body(buffer, 200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': disposition,
        })
    } catch (error) {
        console.error('Error generating template:', error)
        return c.json(
            {
                message:
                    'Lỗi khi tạo file template. Vui lòng liên hệ quản trị viên.',
                error: error instanceof Error ? error.message : String(error),
            },
            500
        )
    }
})
            name: 'asc',
        },
    })

    // Query danh sách CTĐT
    const curriculumVersions = await prisma.curriculumVersion.findMany({
        where: {
            // trainingObjectTypeId,
        },
        select: {
            id: true,
            name: true,
            code: true,
        },
        orderBy: {
            name: 'asc',
        },
    })

    // Substitute data vào sheet DanhMucTinh
    template.substitute('DanhMucTinh', {
        provinces: provinces.map((p, idx) => ({
            STT: idx + 1,
            Ma: p.sMa || '',
            Ten: p.sTen || '',
        })),
    })

    // Substitute data vào sheet DanhMucKhoaHoc
    template.substitute('DanhMucKhoaHoc', {
        courses: trainingCourses.map((c, idx) => ({
            STT: idx + 1,
            Ma: c.code || '',
            Ten: c.name || '',
        })),
    })

    // Substitute data vào sheet DanhMucLop (nếu có)
    // if (fixedClasses.length > 0) {
    //     template.substitute('DanhMucLop', {
    //         classes: fixedClasses.map((fc, idx) => ({
    //             STT: idx + 1,
    //             Ma: fc.code || '',
    //             Ten: fc.name || '',
    //         })),
    //     })
    // }

    // Substitute data vào sheet DanhMucNganh
    template.substitute('DanhMucNganh', {
        fields: trainingFields.map((f, idx) => ({
            STT: idx + 1,
            Ma: f.code || '',
            Ten: f.name || '',
        })),
    })

    // Substitute data vào sheet DanhMucChuyenNganh
    template.substitute('DanhMucChuyenNganh', {
        majors: trainingMajors.map((m, idx) => ({
            STT: idx + 1,
            Ma: m.code || '',
            Ten: m.name || '',
        })),
    })

    // Substitute data vào sheet DanhMucCTDT
    template.substitute('DanhMucCTDT', {
        curriculums: curriculumVersions.map((cv, idx) => ({
            STT: idx + 1,
            Ma: cv.code || '',
            Ten: cv.name || '',
        })),
    })

    const result = (await template.generate({ type: 'arraybuffer' })) as ArrayBuffer

    const fileName = 'MauImportDSHV.xlsx'
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': disposition,
    })
    } catch (error) {
        console.error('Error generating template:', error)
        return c.json(
            { 
                message: 'Lỗi khi tạo file template. Vui lòng kiểm tra template MAU_IMPORT_DSHV đã được upload vào hệ thống chưa.',
                error: error instanceof Error ? error.message : String(error)
            },
            500
        )
    }
})

app.openapi(exportStudentProfiles, async (c) => {
    const { trainingCourseId } = c.req.valid('json')

    const result = await exportStudentProfile({ trainingCourseId })

    const fileName = 'DANH_SACH_SV.xlsx'
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': disposition,
    })
})

export default app
