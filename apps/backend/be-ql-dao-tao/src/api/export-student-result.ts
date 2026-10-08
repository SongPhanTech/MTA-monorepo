import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  exportStudentSemesterResult,
  exportStudentSemesterResultV2,
  exportStudentSemesterResultV3,
} from "../services/student-result"
import { exportBangDiemCaNhan, exportBangDiemQuaTrinh } from "../services/export-bang-diem-ca-nhan"
import {
  exportBangDiemCaNhanP2,
  exportBangDiemCaNhanP7,
} from "../services/export-bang-diem-ca-nhan-p2"
import { exportBangDiemQuaTrinhHocVien } from "../services/export-bang-diem-qua-trinh-hoc-vien"
import { exportBangDiemNganDaiHan } from "../services/export-bang-diem-ngan-dai-han"
import { exportBangDiemTheoLop } from "../services/export-bang-diem-theo-lop"
import { ErrorMessageResponseSchema, ExcelBinaryResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono()

const exportStudentSemesterResultRoute = createRoute({
  operationId: "exportStudentSemesterResult",
  tags: ["Kết quả học tập"],
  path: "/export-student-semester-result",
  method: "post",
  summary: "Xuất KQHT theo học kỳ",
  description: `Xuất file Excel kết quả học tập học kỳ.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, Semester, TrainingObjectType.

**Tham số:** semesterId, trainingObjectTypeId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              semesterId: z.string().openapi(fieldDesc("ID học kỳ (Semester).")),
              trainingObjectTypeId: z
                .string()
                .openapi(fieldDesc("ID hệ đào tạo (TrainingObjectType).")),
              trainingCourseId: z
                .string()
                .optional()
                .openapi(fieldDesc("ID khoá đào tạo (TrainingCourse). Bỏ trống để xuất mọi khoá.")),
              fixedClassId: z
                .string()
                .optional()
                .openapi(fieldDesc("ID lớp quản lý (FixedClass). Bỏ trống để xuất mọi lớp.")),
            })
            .openapi("ExportStudentSemesterResultRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel kết quả học tập",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportStudentSemesterResultRoute, async (c) => {
  const { semesterId, trainingObjectTypeId, trainingCourseId, fixedClassId } = c.req.valid("json")

  const result = await exportStudentSemesterResult({
    semesterId,
    trainingObjectTypeId,
    trainingCourseId,
    fixedClassId,
  })

  const fileName = "KET_QUA_HOC_TAP_HK.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportStudentSemesterResultV2Route = createRoute({
  operationId: "exportStudentSemesterResultV2",
  tags: ["Kết quả học tập"],
  path: "/export-student-semester-result-v2",
  method: "post",
  summary: "Xuất KQHT theo học kỳ - Mẫu 2",
  description: `Xuất file Excel kết quả học tập học kỳ theo mẫu 2.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, Semester, TrainingObjectType.

**Tham số:** semesterId, trainingObjectTypeId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              semesterId: z.string().openapi(fieldDesc("ID học kỳ (Semester).")),
              trainingObjectTypeId: z
                .string()
                .openapi(fieldDesc("ID hệ đào tạo (TrainingObjectType).")),
              trainingCourseId: z
                .string()
                .optional()
                .openapi(fieldDesc("ID khoá đào tạo (TrainingCourse). Bỏ trống để xuất mọi khoá.")),
              fixedClassId: z
                .string()
                .optional()
                .openapi(fieldDesc("ID lớp quản lý (FixedClass). Bỏ trống để xuất mọi lớp.")),
            })
            .openapi("ExportStudentSemesterResultV2Request"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel kết quả học tập - Mẫu 2",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportStudentSemesterResultV2Route, async (c) => {
  const { semesterId, trainingObjectTypeId, trainingCourseId, fixedClassId } = c.req.valid("json")

  const result = await exportStudentSemesterResultV2({
    semesterId,
    trainingObjectTypeId,
    trainingCourseId,
    fixedClassId,
  })

  const fileName = "KET_QUA_HOC_TAP_HK_MAU2.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportStudentSemesterResultV3Route = createRoute({
  operationId: "exportStudentSemesterResultV3",
  tags: ["Kết quả học tập"],
  path: "/export-student-semester-result-v3",
  method: "post",
  summary: "Xuất thống kê KQHT theo % - Mẫu 3",
  description: `Xuất file Excel thống kê số lượng và tỷ lệ % sinh viên theo xếp loại học lực của từng lớp, gồm 3 sheet: tích lũy, năm học, học kỳ.

**Bảng dữ liệu nguồn:** StudentSemesterResult, StudentYearResult, AcademicRankingConvert, FixedClass.

**Tham số:** semesterId, trainingObjectTypeId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              semesterId: z.string().openapi(fieldDesc("ID học kỳ (Semester).")),
              trainingObjectTypeId: z
                .string()
                .openapi(fieldDesc("ID hệ đào tạo (TrainingObjectType).")),
              trainingCourseId: z
                .string()
                .optional()
                .openapi(fieldDesc("ID khoá đào tạo (TrainingCourse). Bỏ trống để xuất mọi khoá.")),
              fixedClassId: z
                .string()
                .optional()
                .openapi(fieldDesc("ID lớp quản lý (FixedClass). Bỏ trống để xuất mọi lớp.")),
            })
            .openapi("ExportStudentSemesterResultV3Request"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel thống kê KQHT theo % - Mẫu 3",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportStudentSemesterResultV3Route, async (c) => {
  const { semesterId, trainingObjectTypeId, trainingCourseId, fixedClassId } = c.req.valid("json")

  const result = await exportStudentSemesterResultV3({
    semesterId,
    trainingObjectTypeId,
    trainingCourseId,
    fixedClassId,
  })

  const fileName = "TK_KQHT_THEO_PHAN_TRAM.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportBangDiemCaNhanRoute = createRoute({
  operationId: "exportBangDiemCaNhan",
  tags: ["Kết quả học tập"],
  path: "/export-bang-diem-ca-nhan",
  method: "post",
  summary: "Xuất bảng điểm cá nhân",
  description: `Xuất file Excel bảng điểm cá nhân (mẫu quatrinh.xlsx / BDCN).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SubjectVersion, Semester, ScoreConvert.

**Tham số:** studentIds — danh sách ID học viên cần xuất (theo thứ tự bảng).`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              studentIds: z
                .array(z.string())
                .min(1)
                .openapi(fieldDesc("Danh sách ID học viên (Student).")),
            })
            .openapi("ExportBangDiemCaNhanRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel bảng điểm cá nhân",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportBangDiemCaNhanRoute, async (c) => {
  const { studentIds } = c.req.valid("json")

  const result = await exportBangDiemCaNhan({ studentIds })

  const fileName = "BDCN.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportBangDiemQuaTrinhRoute = createRoute({
  operationId: "exportBangDiemQuaTrinh",
  tags: ["Kết quả học tập"],
  path: "/export-bang-diem-qua-trinh",
  method: "post",
  summary: "Xuất bảng điểm quá trình",
  description: `Xuất file Excel bảng điểm quá trình (mẫu quatrinh.xlsx / BDQT).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SubjectVersion, Semester, ScoreConvert.

**Tham số:** studentIds — danh sách ID học viên cần xuất (theo thứ tự bảng).`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              studentIds: z
                .array(z.string())
                .min(1)
                .openapi(fieldDesc("Danh sách ID học viên (Student).")),
            })
            .openapi("ExportBangDiemQuaTrinhRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel bảng điểm quá trình",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportBangDiemQuaTrinhRoute, async (c) => {
  const { studentIds } = c.req.valid("json")

  const result = await exportBangDiemQuaTrinh({ studentIds })

  const fileName = "BDQT.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportBangDiemCaNhanP2Route = createRoute({
  operationId: "exportBangDiemCaNhanP2",
  tags: ["Kết quả học tập"],
  path: "/export-bang-diem-ca-nhan-p2",
  method: "post",
  summary: "Xuất bảng điểm cá nhân (Mẫu P2)",
  description: `Xuất file Excel bảng điểm cá nhân theo mẫu P2 (BangDiemCaNhan(P2).xlsx).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SubjectVersion, Semester, StudentSemesterResult, StudentYearResult, ScoreConvert.

**Tham số:** studentId — ID học viên.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              studentId: z.string().openapi(fieldDesc("ID học viên (Student).")),
            })
            .openapi("ExportBangDiemCaNhanP2Request"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel bảng điểm cá nhân mẫu P2",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportBangDiemCaNhanP2Route, async (c) => {
  const { studentId } = c.req.valid("json")

  const { buffer, fileName } = await exportBangDiemCaNhanP2({ studentId })
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(buffer, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportBangDiemCaNhanP7Route = createRoute({
  operationId: "exportBangDiemCaNhanP7",
  tags: ["Kết quả học tập"],
  path: "/export-bang-diem-ca-nhan-p7",
  method: "post",
  summary: "Xuất bảng điểm cá nhân (Mẫu P7)",
  description: `Xuất file Excel bảng điểm cá nhân theo mẫu P7 (BangDiemCaNhan(P7).xlsx).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SubjectVersion, Semester, StudentSemesterResult, StudentYearResult, ScoreConvert.

**Tham số:** studentId — ID học viên.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              studentId: z.string().openapi(fieldDesc("ID học viên (Student).")),
            })
            .openapi("ExportBangDiemCaNhanP7Request"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel bảng điểm cá nhân mẫu P7",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportBangDiemCaNhanP7Route, async (c) => {
  const { studentId } = c.req.valid("json")

  const { buffer, fileName } = await exportBangDiemCaNhanP7({ studentId })
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(buffer, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportBangDiemQuaTrinhHocVienRoute = createRoute({
  operationId: "exportBangDiemQuaTrinhHocVien",
  tags: ["Kết quả học tập"],
  path: "/export-bang-diem-qua-trinh-hoc-vien",
  method: "post",
  summary: "Xuất bảng điểm quá trình học viên",
  description: `Xuất file Excel bảng điểm quá trình của một học viên (mẫu BangDiemQuaTrinh.xlsx).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SubjectVersion, Semester, ScoreConvert.

**Tham số:** studentId — ID học viên. Điểm lấy lần học mới nhất của mỗi môn.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              studentId: z.string().openapi(fieldDesc("ID học viên (Student).")),
            })
            .openapi("ExportBangDiemQuaTrinhHocVienRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel bảng điểm quá trình học viên",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportBangDiemQuaTrinhHocVienRoute, async (c) => {
  const { studentId } = c.req.valid("json")

  const { buffer, fileName } = await exportBangDiemQuaTrinhHocVien({ studentId })
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(buffer, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportBangDiemNganDaiHanRoute = createRoute({
  operationId: "exportBangDiemNganDaiHan",
  tags: ["Kết quả học tập"],
  path: "/export-bang-diem-ngan-dai-han",
  method: "post",
  summary: "Xuất bảng điểm ngắn hạn, dài hạn",
  description: `Xuất file Excel bảng điểm ngắn hạn / dài hạn (mẫu bang-diem-ngan-dai-han.xlsx).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, Semester.

**Tham số:** studentIds — danh sách ID học viên cần xuất (theo thứ tự bảng).`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              studentIds: z
                .array(z.string())
                .min(1)
                .openapi(fieldDesc("Danh sách ID học viên (Student).")),
            })
            .openapi("ExportBangDiemNganDaiHanRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel bảng điểm ngắn hạn, dài hạn",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportBangDiemNganDaiHanRoute, async (c) => {
  const { studentIds } = c.req.valid("json")

  const { buffer, fileName } = await exportBangDiemNganDaiHan({ studentIds })
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(buffer, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportBangDiemTheoLopRoute = createRoute({
  operationId: "exportBangDiemTheoLop",
  tags: ["Kết quả học tập"],
  path: "/export-bang-diem-theo-lop",
  method: "post",
  summary: "Xuất bảng điểm theo lớp, kết quả đào tạo toàn khoá",
  description: `Xuất file Excel bảng điểm theo lớp / toàn khoá (mẫu BangdiemTheoLop_v3.xlsx).

**Bảng dữ liệu nguồn:** FixedClass, Student, StudentSubjectScore, TrainingBlockSubject.

**Tham số:** trainingCourseId — ID khóa học. Xuất tất cả lớp biên chế đang hoạt động trong khóa.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              trainingCourseId: z.string().openapi(fieldDesc("ID khóa học (TrainingCourse).")),
            })
            .openapi("ExportBangDiemTheoLopRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel bảng điểm theo lớp toàn khoá",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportBangDiemTheoLopRoute, async (c) => {
  const { trainingCourseId } = c.req.valid("json")

  const { buffer, fileName } = await exportBangDiemTheoLop({ trainingCourseId })
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(buffer, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
