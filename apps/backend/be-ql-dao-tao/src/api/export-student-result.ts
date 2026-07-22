import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  exportStudentSemesterResult,
  exportStudentSemesterResultV2,
} from "../services/student-result"
import { exportXetChungChi } from "../services/export-xet-chung-chi"
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
              fixedClassId: z.string().optional().openapi(fieldDesc("ID lớp học (FixedClass).")),
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
  const { semesterId, trainingObjectTypeId, fixedClassId } = c.req.valid("json")

  const result = await exportStudentSemesterResult({
    semesterId,
    trainingObjectTypeId,
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
              fixedClassId: z.string().optional().openapi(fieldDesc("ID lớp học (FixedClass).")),
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
  const { semesterId, trainingObjectTypeId, fixedClassId } = c.req.valid("json")

  const result = await exportStudentSemesterResultV2({
    semesterId,
    trainingObjectTypeId,
    fixedClassId,
  })

  const fileName = "KET_QUA_HOC_TAP_HK_MAU2.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportXetChungChiRoute = createRoute({
  operationId: "exportXetChungChi",
  tags: ["Kết quả học tập"],
  path: "/export-xet-chung-chi",
  method: "post",
  summary: "Xuất danh sách xét chứng chỉ",
  description: `Xuất file Excel danh sách xét chứng chỉ.
Bao gồm điểm các môn học thuộc chứng chỉ, không bao gồm cột ĐK Điểm.
Tự động dùng template từ MinIO.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              certificateId: z.string().openapi(fieldDesc("ID chứng chỉ.")),
              trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
              fixedClassIds: z
                .array(z.string())
                .optional()
                .openapi(fieldDesc("Mảng ID lớp quản lý.")),
            })
            .openapi("ExportXetChungChiRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel danh sách xét chứng chỉ",
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

app.openapi(exportXetChungChiRoute, async (c) => {
  const body = c.req.valid("json")

  const result = await exportXetChungChi({
    certificateId: body.certificateId,
    trainingCourseId: body.trainingCourseId,
    fixedClassIds: body.fixedClassIds,
  })

  const fileName = "DANH_SACH_XET_CHUNG_CHI.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
