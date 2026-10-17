import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { AcademicActionType, StudentStatus } from "@workspace/db"
import { getTemplateBuffer } from "@workspace/libs/server"
import { formatDateVn } from "@workspace/libs/timezone"
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
  _generateStudentImportTemplate,
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
import {
  CountMessageResponseSchema,
  ErrorDetailResponseSchema,
  ErrorMessageResponseSchema,
  ExcelBinaryResponseSchema,
  SuccessMessageResponseSchema,
} from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { CalculateSemesterResultResponseSchema } from "../dto/student-result-openapi.dto"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { queryDebtExportRows, type DebtExportRow } from "../services/student-debt"
import { deleteStudent, DeleteStudentError } from "../services/delete-student"
import { syncStudentsDonViFromFixedClass } from "../services/sync-student-don-vi"

const app = new OpenAPIHono({ strict: false })

const tongKetHocKyHVSV = createRoute({
  operationId: "calculateStudentSemesterResultJson",
  path: "/calculate-student-semester-result-json",
  tags: ["Học viên / Sinh viên"],
  summary: "Tổng kết kết quả học kỳ của học viên, sinh viên",
  description: `Tổng kết kết quả học kỳ học viên/sinh viên (JSON).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, Semester.

**Tham số:** semesterId, trainingCourseId (query).`,
  method: "post",
  request: {
    query: z.object({
      semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
      trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Tính toán kết quả học kỳ thành công",
      content: {
        "application/json": {
          schema: CalculateSemesterResultResponseSchema,
        },
      },
    },
    400: {
      description: "Học kỳ không tồn tại hoặc dữ liệu không hợp lệ",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    500: {
      description: "Lỗi khi tính toán kết quả học kỳ",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

const tongKetNamHocHVSV = createRoute({
  operationId: "calculateStudentSchoolYearResult",
  path: "/calculate-student-school-year-result",
  tags: ["Học viên / Sinh viên"],
  summary: "Tổng kết kết quả năm học của học viên, sinh viên",
  description: `Tổng kết kết quả năm học (JSON).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SchoolYear.

**Tham số:** semesterId, trainingCourseId (query).`,
  method: "post",
  request: {
    query: z.object({
      semesterId: z.string().openapi(fieldDesc("ID học kỳ (cuối năm).")),
      trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Đã khởi chạy tính toán kết quả năm học (xử lý nền)",
      content: {
        "application/json": {
          schema: SuccessMessageResponseSchema,
        },
      },
    },
    400: {
      description: "Học kỳ không tồn tại",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

const exportScholarshipJson = createRoute({
  operationId: "exportStudentScholarshipJson",
  path: "/export-json-list-student-scholarship",
  tags: ["Học viên / Sinh viên"],
  summary: "Danh sách học bổng của học viên",
  description: `Danh sách học viên đạt học bổng (JSON).

**Bảng dữ liệu nguồn:** Student, ScholarshipDecision.

**Tham số:** semesterId, trainingObjectTypeId.`,
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
    ...standardErrorResponses(),
    200: {
      description: "Export list of student scholarship as JSON",
      content: {
        "application/json": {
          schema: z.array(CourseStudentScholarshipResult),
        },
      },
    },
  },
})

const exportScholarshipExcel = createRoute({
  operationId: "exportStudentScholarshipExcel",
  path: "/export-excel-list-student-scholarship",
  tags: ["Học viên / Sinh viên"],
  summary: "Xuất Excel danh sách học bổng của học viên",
  description: `Xuất Excel học viên đạt học bổng.

**Bảng dữ liệu nguồn:** Student, ScholarshipDecision.

**Tham số:** semesterId, trainingObjectTypeId.`,
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
    ...standardErrorResponses(),
    200: {
      description: "Export list of student scholarship as Excel",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.string().openapi({ type: "string", format: "binary" }),
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
  tags: ["Học viên / Sinh viên"],
  summary: "Xuất Excel danh sách cảnh báo học tập của học viên",
  description: `Xuất Excel học viên bị cảnh báo học tập.

**Bảng dữ liệu nguồn:** Student, AcademicWarning.

**Tham số:** semesterId, trainingObjectTypeId.`,
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
    ...standardErrorResponses(),
    200: {
      description: "Export list of student academic warning as Excel",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.string().openapi({ type: "string", format: "binary" }),
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
  tags: ["Học viên / Sinh viên"],
  summary: "Danh sách cảnh báo học tập của học viên",
  description: `Danh sách cảnh báo học tập (JSON).

**Bảng dữ liệu nguồn:** Student, AcademicWarning.

**Tham số:** semesterId, trainingObjectTypeId.`,
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string(),
      trainingObjectTypeId: z.string(),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Export list of student academic warning as JSON",
      content: {
        "application/json": {
          schema: z.array(CourseStudentAcademicWarningResult),
        },
      },
    },
  },
})

const exportAcademicActionJson = createRoute({
  operationId: "exportStudentAcademicActionJson",
  path: "/export-json-list-student-academic-action",
  tags: ["Học viên / Sinh viên"],
  summary: "Danh sách xử lý học vụ của học viên",
  description: `Danh sách xử lý học vụ (JSON).

**Bảng dữ liệu nguồn:** Student, AcademicAction, AcademicDecision.

**Tham số:** semesterId, trainingObjectTypeId, academicActionType.`,
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
    ...standardErrorResponses(),
    200: {
      description: "Export list of student academic action as JSON",
      content: {
        "application/json": {
          schema: z.array(CourseStudentAcademicActionResult),
        },
      },
    },
  },
})

const exportDecreaseAcademicWarningJson = createRoute({
  operationId: "exportStudentDecreaseAcademicWarningJson",
  path: "/export-json-list-student-decrease-academic-warning",
  tags: ["Học viên / Sinh viên"],
  summary: "Danh sách giảm cảnh báo học tập của học viên",
  description: `Danh sách giảm cảnh báo học tập (JSON).

**Bảng dữ liệu nguồn:** Student, AcademicWarning.

**Tham số:** semesterId, trainingObjectTypeId.`,
  method: "get",
  request: {
    query: z.object({
      semesterId: z.string(),
      trainingObjectTypeId: z.string(),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Export list of student decrease academic warning as JSON",
      content: {
        "application/json": {
          schema: z.array(CourseStudentDecreaseAcademicWarningResult),
        },
      },
    },
  },
})

const PheDuyetLuuBan = createRoute({
  operationId: "updateStudentStatus",
  path: "/update-students-status",
  tags: ["Học viên / Sinh viên"],
  summary: "Cập nhật trạng thái, điểm học viên theo xử lý học tập",
  description: `Phê duyệt / cập nhật trạng thái học viên theo quyết định học vụ.

**Bảng dữ liệu nguồn:** AcademicDecision, Student, FixedClass.

**Tham số:** decisionIds, academicActionType, classChanges.`,
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
    ...standardErrorResponses(),
    200: {
      description: "Cập nhật trạng thái, điểm học viên theo xử lý học tập",
      content: {
        "application/json": {
          schema: CountMessageResponseSchema,
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

  if (academicActionType === AcademicActionType.REPEAT_YEAR && studentIds.length) {
    await syncStudentsDonViFromFixedClass({ studentIds })
  }

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
  const filteredStudents = await resultCourseStudentDecreaseAcademicWarning(
    students,
    semesterId,
    trainingObjectTypeId
  )
  return c.json(filteredStudents, 200)
})

app.openapi(tongKetHocKyHVSV, async (c) => {
  const { semesterId, trainingCourseId } = c.req.valid("query")
  const startedAt = Date.now()
  console.log(
    `[tong-ket-hoc-ky] Bắt đầu — semesterId=${semesterId}, trainingCourseId=${trainingCourseId}`
  )

  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
  })
  if (!semester) {
    console.warn(`[tong-ket-hoc-ky] Học kỳ không tồn tại — semesterId=${semesterId}`)
    return c.json({ message: `Kỳ học với ID ${semesterId} không tồn tại` }, 400)
  }

  console.log(
    `[tong-ket-hoc-ky] Học kỳ: ${semester.name ?? semester.id} | ${semester.startDate?.toISOString() ?? "?"} → ${semester.endDate?.toISOString() ?? "?"}`
  )

  try {
    const studentResults = await calculateStudentSemesterResult(semesterId, trainingCourseId)
    console.log(`[tong-ket-hoc-ky] Hoàn tất trong ${Date.now() - startedAt}ms — ${studentResults}`)
    return c.json(studentResults, 200)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định"
    console.error(
      `[tong-ket-hoc-ky] Lỗi sau ${Date.now() - startedAt}ms — semesterId=${semesterId}, trainingCourseId=${trainingCourseId}: ${errorMessage}`,
      error
    )
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

  setTimeout(async () => {
    const chunkSize = 10
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize)
      await Promise.allSettled(
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
  tags: ["Học viên / Sinh viên"],
  path: "/debt-statistics",
  method: "get",
  summary: "Xuất thống kê nợ môn",
  description: `Xuất Excel học viên nợ học phần / tín chỉ.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SubjectVersion.

**Tham số:** trainingObjectTypeId, trainingCourseId, semesterId, date, trainingMajorId.`,
  request: {
    query: z.object({
      trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
      trainingCourseId: z.string().optional().openapi(fieldDesc("ID khóa (tùy chọn).")),
      semesterId: z.string().optional().openapi(fieldDesc("ID HK — lấy ngày cuối kỳ.")),
      date: z.coerce.date().optional().openapi(fieldDesc("Ngày chốt nợ (mặc định hôm nay).")),
      trainingMajorId: z.string().optional().openapi(fieldDesc("ID chuyên ngành (tùy chọn).")),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Export thống kê nợ",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(debtStatistics, async (c) => {
  const {
    trainingObjectTypeId,
    trainingCourseId: rawCourseId,
    semesterId,
    date: queryDate,
    trainingMajorId,
  } = c.req.valid("query")

  const trainingCourseId = rawCourseId || null

  let date = queryDate || new Date()
  if (semesterId) {
    const sem = await prisma.semester.findUnique({
      where: { id: semesterId },
      select: { endDate: true },
    })
    if (sem?.endDate) date = sem.endDate
  }

  const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
    where: { id: trainingObjectTypeId },
    select: { name: true },
  })

  const trainingCourse = trainingCourseId
    ? await prisma.trainingCourse.findUnique({
        where: { id: trainingCourseId },
        select: { name: true },
      })
    : null

  const debtRows = await queryDebtExportRows(prisma, {
    trainingObjectTypeId,
    trainingCourseId,
    trainingMajorId,
  })

  const toExcelRow = (r: DebtExportRow, idx: number) => {
    let note = "Đã thi trượt 1 lần"
    if (r.type === "THI LẠI") {
      note = r.examPostponed ? "Hoãn thi" : "Đã thi trượt 1 lần"
    } else if (r.examBanned) {
      note = `Bị cấm thi${r.examBannedReason ? `: ${r.examBannedReason}` : ""}`
    } else if (r.suspended) {
      note = "Đình chỉ thi"
    } else if (r.attempt_count > 1) {
      note = `Đã thi trượt ít nhất ${r.attempt_count} lần`
    } else {
      note = "Không thuộc đối tượng được thi lại"
    }

    return {
      no: idx + 1,
      studentCode: r.studentCode || "",
      fullname: r.fullname || "",
      birthday: r.dateOfBirth ? formatDateVn(r.dateOfBirth) : "",
      dateOfBirth: r.dateOfBirth ? formatDateVn(r.dateOfBirth) : "",
      fixedClassCode: r.fixedClassCode || "",
      totalDebtSubject: r.totalDebtSubject,
      totalDebtCredit: r.totalDebtCredit,
      subjectCode: r.subjectCode,
      subjectName: r.subjectName,
      subjectCredit: r.subjectCredit,
      semesters: r.semesterCode || "",
      finalScores: r.finalScore === null ? "Chưa có điểm" : String(r.finalScore),
      examScores: r.examScore === null ? "Chưa có" : String(r.examScore),
      type: r.type,
      note,
    }
  }

  const hocLaiRows = debtRows.filter((r) => r.type === "HỌC LẠI").map(toExcelRow)
  const thiLaiRows = debtRows.filter((r) => r.type === "THI LẠI").map(toExcelRow)

  const buffer = await getTemplateBuffer(prisma, "thong_ke_no")
  const template = new XlsxTemplate(buffer)

  template.substitute("Học lại", {
    ĐTĐT: trainingObjectType.name,
    KHOÁ: trainingCourse?.name || "Tất cả các khoá",
    DATE: formatDateVn(date),
    data: hocLaiRows,
  })

  template.substitute("Thi lại", {
    ĐTĐT: trainingObjectType.name,
    KHOÁ: trainingCourse?.name || "Tất cả các khoá",
    DATE: formatDateVn(date),
    data: thiLaiRows,
  })

  const result = await template.generate({ type: "arraybuffer" })

  const fileName = `thong_ke_no_${trainingObjectType.name}_${trainingCourse?.name || "tat_ca"}.xlsx`
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const downloadStudentImportTemplate = createRoute({
  operationId: "downloadStudentImportTemplate",
  tags: ["Học viên / Sinh viên"],
  path: "/download-student-import-template",
  method: "get",
  summary: "Tải mẫu import học viên",
  description: `Tải file Excel mẫu import học viên.

**Bảng dữ liệu nguồn:** (file mẫu, không ghi DB).

**Tham số:** trainingObjectTypeId (query).`,
  request: {
    query: z.object({
      trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File mẫu Excel import học viên",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorDetailResponseSchema,
        },
      },
    },
  },
})

const exportStudentProfiles = createRoute({
  operationId: "exportStudentProfiles",
  tags: ["Học viên / Sinh viên"],
  path: "/export-student-profiles",
  method: "post",
  summary: "Xuất hồ sơ học viên",
  description: `Xuất Excel hồ sơ học viên theo khóa.

**Bảng dữ liệu nguồn:** Student, UserProfile, FixedClass.

**Tham số:** trainingCourseId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
            })
            .openapi("ExportStudentProfilesRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel hồ sơ học viên",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(downloadStudentImportTemplate, async (c) => {
  const { trainingObjectTypeId } = c.req.valid("query")
  try {
    const result = await _generateStudentImportTemplate(trainingObjectTypeId)
    const fileName = "MauImportDSHV_v5.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : "Không thể tạo file mẫu",
      },
      400
    )
  }
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

const syncDonViFromFixedClass = createRoute({
  operationId: "syncStudentDonViFromFixedClass",
  tags: ["Học viên / Sinh viên"],
  path: "/sync-don-vi-from-fixed-class",
  method: "post",
  summary: "Đồng bộ đơn vị quản lý từ lớp niên chế",
  description: `Cập nhật UserProfile.sDM_DonViId theo FixedClass.managementOrganizationId và đồng bộ LSB.

**Bảng dữ liệu nguồn:** Student, FixedClass, UserProfile, DM_NhanVien.

**Tham số:** studentIds hoặc fixedClassId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              studentIds: z
                .array(z.string())
                .optional()
                .openapi(fieldDesc("Danh sách ID sinh viên cần đồng bộ.")),
              fixedClassId: z
                .string()
                .optional()
                .openapi(fieldDesc("ID lớp quản lý — đồng bộ toàn bộ sinh viên trong lớp.")),
            })
            .openapi("SyncStudentDonViFromFixedClassRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Đồng bộ đơn vị thành công",
      content: {
        "application/json": {
          schema: z
            .object({
              message: z.string().openapi(fieldDesc("Thông báo kết quả.")),
              synced: z.number().openapi(fieldDesc("Số hồ sơ đã đồng bộ LSB.")),
              failed: z
                .array(
                  z.object({
                    studentId: z.string(),
                    message: z.string(),
                  })
                )
                .openapi(fieldDesc("Danh sách hồ sơ đồng bộ LSB thất bại.")),
            })
            .openapi("SyncStudentDonViFromFixedClassResponse"),
        },
      },
    },
  },
})

app.openapi(syncDonViFromFixedClass, async (c) => {
  const { studentIds, fixedClassId } = c.req.valid("json")
  try {
    const result = await syncStudentsDonViFromFixedClass({ studentIds, fixedClassId })
    return c.json(
      {
        message: `Đã đồng bộ ${result.synced} hồ sơ`,
        synced: result.synced,
        failed: result.failed,
      },
      200
    )
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : "Đồng bộ đơn vị thất bại",
      },
      500
    )
  }
})

const deleteStudentRoute = createRoute({
  operationId: "deleteStudent",
  tags: ["Học viên / Sinh viên"],
  path: "/{id}",
  method: "delete",
  summary: "Xóa sinh viên",
  description: `Xóa hồ sơ sinh viên trên QL đào tạo. Nếu hồ sơ không còn gắn giảng viên, cán bộ hoặc sinh viên khác thì gọi DELETE hồ sơ trên LSB.

**Bảng dữ liệu nguồn:** Student, UserProfile, DM_NhanVien.`,
  request: {
    params: z.object({
      id: z.string().openapi(fieldDesc("ID sinh viên.")),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Đã xóa thành công",
      content: {
        "application/json": {
          schema: SuccessMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(deleteStudentRoute, async (c) => {
  const { id } = c.req.valid("param")
  try {
    await deleteStudent(id)
    return c.json({ message: "Xóa thành công" }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xóa sinh viên thất bại"
    const status = error instanceof DeleteStudentError ? error.status : 500
    if (status === 500) {
      console.error("[student] delete failed", message, error)
    }
    if (status === 404) return c.json({ message }, 404)
    if (status === 409) return c.json({ message }, 409)
    if (status === 400) return c.json({ message }, 400)
    return c.json({ message }, 500)
  }
})

export default app
