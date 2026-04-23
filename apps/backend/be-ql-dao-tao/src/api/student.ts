import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { AcademicActionType, StudentStatus } from "@workspace/db"
import { getTemplateBuffer } from "@workspace/libs/server"
import dayjs from "dayjs"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import {
  CourseStudentAcademicActionResult,
  CourseStudentAcademicWarningResult,
  CourseStudentDecreaseAcademicWarningResult,
  CourseStudentScholarshipResult,
} from "../dto/student-info.dto"
import {
  exportStudentProfile,
  exportStudentScholarship,
  exportStudentAcademicWarning,
} from "../services/student"
import {
  calculateStudentSemesterResult,
  calculateStudentYearResult,
  listStudentResultInfo,
  resultCourseStudentAcademicAction,
  resultCourseStudentAcademicWarning,
  resultCourseStudentDecreaseAcademicWarning,
  resultCourseStudentScholarship,
} from "../services/student-result.service"

const app = new OpenAPIHono({ strict: false })

const tongKetHocKyHVSV = createRoute({
  operationId: "calculateStudentSemesterResultJson",
  path: "/calculate-student-semester-result-json",
  tags: ["Student"],
  summary: "Tổng kết kết quả học kỳ của học viên, sinh viên",
  description: "Trả kết quả học kỳ của học viên, sinh viên dưới dạng JSON",
  method: "post",
  request: {
    query: z.object({
      semesterId: z.string().openapi("semesterId", {
        description: "ID của kỳ học",
      }),
      trainingCourseId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Export list of student semester result as JSON",
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
    },
    400: {
      description: "Invalid semester ID",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Server error during calculation",
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

const tongKetNamHocHVSV = createRoute({
  operationId: "calculateStudentSchoolYearResult",
  path: "/calculate-student-school-year-result",
  tags: ["Student"],
  summary: "Tổng kết kết quả năm học của học viên, sinh viên",
  description: "Trả kết quả năm học của học viên, sinh viên dưới dạng",
  method: "post",
  request: {
    query: z.object({
      semesterId: z.string(),
      trainingCourseId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Export list of student schoolYear result",
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
    },
    400: {
      description: "Invalid",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Server error during calculation",
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

const exportScholarshipJson = createRoute({
  operationId: "exportStudentScholarshipJson",
  path: "/export-json-list-student-scholarship",
  tags: ["Student"],
  summary: "Danh sách học bổng của học viên",
  description: "Xuất danh sách học viên đạt học bổng dưới dạng JSON",
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string().openapi("semesterId", {
        description: "ID của kỳ học",
      }),
      trainingObjectTypeId: z
        .string()
        .openapi("trainingObjectTypeId", { description: "ID loại đối tượng đào tạo" }),
    }),
  },
  responses: {
    200: {
      description: "Export list of student scholarship as JSON",
      content: {
        "application/json": {
          schema: z.array(CourseStudentScholarshipResult),
        },
      },
    },
    404: {
      description: "Not found",
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

const exportScholarshipExcel = createRoute({
  operationId: "exportStudentScholarshipExcel",
  path: "/export-excel-list-student-scholarship",
  tags: ["Student"],
  summary: "Xuất Excel danh sách học bổng của học viên",
  description:
    "Xuất danh sách học viên đạt học bổng dưới dạng file Excel (dữ liệu đã được làm phẳng)",
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string().openapi("semesterId", {
        description: "ID của kỳ học",
      }),
      trainingObjectTypeId: z
        .string()
        .openapi("trainingObjectTypeId", { description: "ID loại đối tượng đào tạo" }),
    }),
  },
  responses: {
    200: {
      description: "Export list of student scholarship as Excel",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.string().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Not found",
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

app.openapi(exportScholarshipExcel, async (c) => {
  const { semesterId, trainingObjectTypeId } = c.req.valid("query")

  const buffer = await exportStudentScholarship({ semesterId, trainingObjectTypeId })

  return c.body(buffer, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="Danh_sach_hoc_bong.xlsx"`,
  })
})

const exportAcademicWarningExcel = createRoute({
  operationId: "exportStudentAcademicWarningExcel",
  path: "/export-excel-list-student-academic-warning",
  tags: ["Student"],
  summary: "Xuất Excel danh sách cảnh báo học tập của học viên",
  description:
    "Xuất danh sách học viên bị cảnh báo học tập dưới dạng file Excel (dữ liệu đã được làm phẳng)",
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string().openapi("semesterId", {
        description: "ID của kỳ học",
      }),
      trainingObjectTypeId: z
        .string()
        .openapi("trainingObjectTypeId", { description: "ID loại đối tượng đào tạo" }),
    }),
  },
  responses: {
    200: {
      description: "Export list of student academic warning as Excel",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.string().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Not found",
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

app.openapi(exportAcademicWarningExcel, async (c) => {
  const { semesterId, trainingObjectTypeId } = c.req.valid("query")

  const buffer = await exportStudentAcademicWarning({ semesterId, trainingObjectTypeId })

  return c.body(buffer, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="Danh_sach_canh_cao_hoc_tap.xlsx"`,
  })
})

const exportAcademicWarningJson = createRoute({
  operationId: "exportStudentAcademicWarningJson",
  path: "/export-json-list-student-academic-warning",
  tags: ["Student"],
  summary: "Danh sách cảnh báo học tập của học viên",
  description: "Xuất danh sách học viên bị cảnh báo học tập dưới dạng JSON",
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string(),
      trainingObjectTypeId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Export list of student academic warning as JSON",
      content: {
        "application/json": {
          schema: z.array(CourseStudentAcademicWarningResult),
        },
      },
    },
    404: {
      description: "Not found",
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

const exportAcademicActionJson = createRoute({
  operationId: "exportStudentAcademicActionJson",
  path: "/export-json-list-student-academic-action",
  tags: ["Student"],
  summary: "Danh sách xử lý học vụ của học viên",
  description: "Xuất danh sách học viên bị xử lý học vụ dưới dạng JSON",
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string().openapi("semesterId", {
        description: "ID của kỳ học",
      }),
      trainingObjectTypeId: z
        .string()
        .openapi("trainingObjectTypeId", { description: "ID loại đối tượng đào tạo" }),
      academicActionType: z
        .enum(["REPEAT_YEAR", "SUSPENSION", "EXPULSION"])
        .optional()
        .openapi("academicActionType", {
          description: "Loại hành động học vụ",
        }),
    }),
  },
  responses: {
    200: {
      description: "Export list of student academic action as JSON",
      content: {
        "application/json": {
          schema: z.array(CourseStudentAcademicActionResult),
        },
      },
    },
    404: {
      description: "Not found",
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

const exportDecreaseAcademicWarningJson = createRoute({
  operationId: "exportStudentDecreaseAcademicWarningJson",
  path: "/export-json-list-student-decrease-academic-warning",
  tags: ["Student"],
  summary: "Danh sách giảm cảnh báo học tập của học viên",
  description: "Xuất danh sách học viên được giảm cảnh báo học tập dưới dạng JSON",
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string(),
      trainingObjectTypeId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Export list of student decrease academic warning as JSON",
      content: {
        "application/json": {
          schema: z.array(CourseStudentDecreaseAcademicWarningResult),
        },
      },
    },
    404: {
      description: "Not found",
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

const PheDuyetLuuBan = createRoute({
  operationId: "updateStudentStatus",
  path: "/update-students-status",
  tags: ["Student"],
  summary: "Cập nhật trạng thái, điểm học viên theo xử lý học tập",
  description: "Cập nhật trạng thái, điểm học viên theo xử lý học tập",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
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
                    path: ["classChanges"],
                    message: "classChanges is required when academicActionType is REPEAT_YEAR",
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
      description: "Cập nhật trạng thái, điểm học viên theo xử lý học tập",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            count: z.number(),
          }),
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

app.openapi(PheDuyetLuuBan, async (c) => {
  const { decisionIds, academicActionType, classChanges } = c.req.valid("json")

  if (
    academicActionType === AcademicActionType.REPEAT_YEAR &&
    decisionIds.length !== classChanges?.length
  ) {
    return c.json(
      { message: "classChanges is required when academicActionType is REPEAT_YEAR" },
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
      data: { status: "APPROVED" },
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
  const { semesterId, trainingObjectTypeId } = c.req.valid("query")
  const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)
  if (!students || students.length === 0) {
    return c.json({ message: "Không có sinh viên nào trong danh sách" }, 404)
  }
  const filteredStudents = await resultCourseStudentScholarship(students, semesterId)
  return c.json(filteredStudents, 200)
})

app.openapi(exportAcademicWarningJson, async (c) => {
  const { semesterId, trainingObjectTypeId } = c.req.valid("query")
  const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)
  if (!students || students.length === 0) {
    return c.json({ message: "Không có sinh viên nào trong danh sách" }, 404)
  }
  const filteredStudents = await resultCourseStudentAcademicWarning(students, semesterId)
  return c.json(filteredStudents, 200)
})

app.openapi(exportAcademicActionJson, async (c) => {
  const { semesterId, academicActionType, trainingObjectTypeId } = c.req.valid("query")
  const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)
  if (!students || students.length === 0) {
    return c.json({ message: "Không có sinh viên nào trong danh sách" }, 404)
  }
  const filteredStudents = await resultCourseStudentAcademicAction(
    students,
    semesterId,
    academicActionType
  )
  return c.json(filteredStudents, 200)
})

app.openapi(exportDecreaseAcademicWarningJson, async (c) => {
  const { semesterId, trainingObjectTypeId } = c.req.valid("query")
  const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)
  if (!students || students.length === 0) {
    return c.json({ message: "Không có sinh viên nào trong danh sách" }, 404)
  }
  const filteredStudents = await resultCourseStudentDecreaseAcademicWarning(students, semesterId)
  return c.json(filteredStudents, 200)
})

app.openapi(tongKetHocKyHVSV, async (c) => {
  const { semesterId, trainingCourseId } = c.req.valid("query")
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
    const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định"
    console.error(`Error calculating semester results for semester ${semesterId}: ${errorMessage}`)
    return c.json({ message: `Lỗi khi tính toán kết quả học kỳ: ${errorMessage}` }, 500)
  }
})

app.openapi(tongKetNamHocHVSV, async (c) => {
  const { semesterId, trainingCourseId } = c.req.valid("query")
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

  return c.json({ message: "success" }, 200)
})

const debtStatistics = createRoute({
  operationId: "debt-statistics",
  tags: ["Student"],
  path: "/debt-statistics",
  method: "get",
  request: {
    query: z.object({
      trainingObjectTypeId: z.string(),
      trainingCourseId: z.string(),
      date: z.coerce.date().optional(),
    }),
  },
  responses: {
    200: {
      description: "Export thống kê nợ",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
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

app.openapi(debtStatistics, async (c) => {
  const { trainingObjectTypeId, trainingCourseId, date = new Date() } = c.req.valid("query")

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
      let type = "THI LẠI"
      let note = "Đã thi trượt 1 lần"

      if (finalScores[finalScores.length - 1] === null) {
        type = "CHƯA THI"
        note = "Chưa thi hoặc GV chưa nhập điểm thi"
      } else if (finalScores.length > 1) {
        type = "HỌC LẠI"
        note = `Đã thi trượt ít nhất ${finalScores.length} lần`
      }

      return {
        studentCode: s.studentCode,
        fullname: s.fullname,
        dateOfBirth: s.dateOfBirth ? dayjs(s.dateOfBirth).format("DD/MM/YYYY") : "",
        fixedClassCode: s.fixedClassCode,
        totalDebtSubject,
        totalDebtCredit,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        subjectCredit: subject.subjectCredit,
        semesters: subject.attempts.map((attempt) => attempt.semesterCode).join("/"),
        finalScores: subject.attempts.map((attempt) => String(attempt.finalScore)).join("/"),
        type,
        note,
      }
    })
  })

  const buffer = await getTemplateBuffer(prisma, "THONG_KE_NO")
  const template = new XlsxTemplate(buffer)
  const sheetName = "DS HV nợ môn"

  template.substitute(sheetName, {
    ĐTĐT: trainingObjectType.name,
    KHOÁ: trainingCourse.name,
    DATE: dayjs(date).format("DD/MM/YYYY"),
    data: rows.map((r, idx) => ({ no: idx + 1, ...r })),
  })

  const result = await template.generate({ type: "arraybuffer" })

  const fileName = `thong_ke_no_${trainingObjectType.name}_${trainingCourse.name}.xlsx`
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const downloadStudentImportTemplate = createRoute({
  operationId: "downloadStudentImportTemplate",
  tags: ["Student"],
  path: "/download-student-import-template",
  method: "get",
  request: {
    query: z.object({
      trainingObjectTypeId: z.string().openapi("trainingObjectTypeId", {
        description: "ID loại đối tượng đào tạo",
      }),
    }),
  },
  responses: {
    200: {
      description: "Download template file with category sheets",
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
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
  operationId: "exportStudentProfiles",
  tags: ["Student"],
  path: "/export-student-profiles",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ trainingCourseId: z.string() }),
        },
      },
    },
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

app.openapi(downloadStudentImportTemplate, async (c) => {
  const { trainingObjectTypeId: _trainingObjectTypeId } = c.req.valid("query")
  const result = await getTemplateBuffer(prisma, "MauImportDSHV.xlsx")
  const fileName = "MauImportDSHV.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

app.openapi(exportStudentProfiles, async (c) => {
  const { trainingCourseId } = c.req.valid("json")

  const result = await exportStudentProfile({ trainingCourseId })

  const fileName = "DANH_SACH_SV.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
