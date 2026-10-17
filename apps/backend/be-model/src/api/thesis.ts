import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { excelSuccess, jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { ThesisExportFilterSchema } from "../dto/thesis-export.dto"
import { batchUpdateThesisProjects } from "../services/thesis-batch-update.service"
import { exportCouncilImportTemplate } from "../services/thesis-council-export.service"
import { importCouncilFromExcel } from "../services/thesis-council-import.service"
import { deleteStudentThesis } from "../services/thesis-delete.service"
import {
  buildThesisExport,
  thesisExportTemplateKinds,
} from "../services/thesis-export-builders.service"
import { createSampleThesisData } from "../services/thesis-sample-data.service"

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const app = new OpenAPIHono({ strict: false })

const optionalIdSchema = z.string().nullable().optional()
const ThesisExportKindSchema = z
  .enum(thesisExportTemplateKinds as unknown as [string, ...string[]])
  .openapi({
    description: "Mã mẫu in/xuất luận văn.",
  })

const BatchUpdateThesisItemSchema = z.object({
  thesisProjectId: z.string().min(1).openapi({ description: "ID đề tài/luận văn." }),
  studentCode: z
    .string()
    .nullable()
    .optional()
    .openapi({ description: "Mã học viên (hiển thị lỗi)." }),
  title: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  defenseDate: z.union([z.string(), z.null()]).optional(),
  researchTopicAssociated: z.string().nullable().optional(),
  organizationId: optionalIdSchema,
  supervisorId: optionalIdSchema,
  coSupervisorId: optionalIdSchema,
  roomId: optionalIdSchema,
  defenseSessionId: optionalIdSchema,
  score: z.union([z.string(), z.number(), z.null()]).optional(),
  councilChairman: optionalIdSchema,
  councilSecretary: optionalIdSchema,
  reviewer1: optionalIdSchema,
  reviewer2: optionalIdSchema,
  councilMember: optionalIdSchema,
})

const BatchUpdateThesisProjectsSchema = z.object({
  thesisSessionId: z.string().min(1).openapi({ description: "ID đợt xét luận văn." }),
  allowSupervisorEdit: z
    .boolean()
    .optional()
    .openapi({ description: "true = cho phép cập nhật GVHD (role Khoa/P7)." }),
  items: z
    .array(BatchUpdateThesisItemSchema)
    .min(1)
    .openapi({ description: "Danh sách đề tài cần cập nhật." }),
})

const BatchUpdateThesisProjectsResponseSchema = z
  .object({
    updatedCount: z.number().openapi({ description: "Số đề tài đã cập nhật." }),
  })
  .openapi("BatchUpdateThesisProjectsResponse")

const batchUpdateThesisProjectsRoute = createRoute({
  operationId: "batchUpdateThesisProjects",
  tags: ["Luận văn"],
  path: "/batch-update",
  method: "post",
  summary: "Cập nhật hàng loạt luận văn/đề án",
  request: {
    body: {
      content: { "application/json": { schema: BatchUpdateThesisProjectsSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...jsonSuccess(BatchUpdateThesisProjectsResponseSchema, "Cập nhật hàng loạt thành công"),
    400: {
      description: "Lỗi nghiệp vụ khi cập nhật hàng loạt",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

app.openapi(batchUpdateThesisProjectsRoute, async (c) => {
  const body = c.req.valid("json")
  try {
    const result = await batchUpdateThesisProjects({
      thesisSessionId: body.thesisSessionId,
      allowSupervisorEdit: body.allowSupervisorEdit,
      items: body.items,
    })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cập nhật hàng loạt thất bại."
    return c.json({ message }, 400)
  }
})

const CreateSampleThesisDataSchema = z.object({
  thesisSessionId: z.string().min(1).openapi({ description: "ID đợt xét luận văn." }),
  studentIds: z
    .array(z.string().min(1))
    .min(1)
    .openapi({ description: "Danh sách ID học viên cần tạo dữ liệu mẫu." }),
})

const CreateSampleThesisDataResponseSchema = z
  .object({
    createdCount: z.number().openapi({ description: "Số học viên đã tạo dữ liệu mẫu." }),
  })
  .openapi("CreateSampleThesisDataResponse")

const createSampleThesisDataRoute = createRoute({
  operationId: "createSampleThesisData",
  tags: ["Luận văn"],
  path: "/create-sample-data",
  method: "post",
  summary: "Tạo dữ liệu mẫu luận văn/đề án cho học viên",
  request: {
    body: {
      content: { "application/json": { schema: CreateSampleThesisDataSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...jsonSuccess(CreateSampleThesisDataResponseSchema, "Tạo dữ liệu mẫu thành công"),
    400: {
      description: "Lỗi nghiệp vụ khi tạo dữ liệu mẫu",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

app.openapi(createSampleThesisDataRoute, async (c) => {
  const body = c.req.valid("json")
  try {
    const result = await createSampleThesisData({
      thesisSessionId: body.thesisSessionId,
      studentIds: body.studentIds,
    })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tạo dữ liệu mẫu thất bại."
    return c.json({ message }, 400)
  }
})

const DeleteStudentThesisSchema = z.object({
  thesisSessionId: z.string().min(1).openapi({ description: "ID đợt xét luận văn." }),
  studentId: z.string().min(1).openapi({ description: "ID học viên cần xóa luận văn." }),
})

const DeleteStudentThesisResponseSchema = z
  .object({
    deleted: z.literal(true).openapi({ description: "true = đã xóa thành công." }),
  })
  .openapi("DeleteStudentThesisResponse")

const deleteStudentThesisRoute = createRoute({
  operationId: "deleteStudentThesis",
  tags: ["Luận văn"],
  path: "/delete-student-thesis",
  method: "post",
  summary: "Xóa luận văn/đề án của học viên trong đợt xét",
  request: {
    body: {
      content: { "application/json": { schema: DeleteStudentThesisSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...jsonSuccess(DeleteStudentThesisResponseSchema, "Xóa luận văn thành công"),
    400: {
      description: "Lỗi nghiệp vụ khi xóa luận văn",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

app.openapi(deleteStudentThesisRoute, async (c) => {
  const body = c.req.valid("json")
  try {
    const result = await deleteStudentThesis({
      thesisSessionId: body.thesisSessionId,
      studentId: body.studentId,
    })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xóa luận văn thất bại."
    return c.json({ message }, 400)
  }
})

const ExportCouncilImportTemplateSchema = z.object({
  thesisSessionId: z.string().min(1).openapi({ description: "ID đợt xét luận văn." }),
})

const exportCouncilImportTemplateRoute = createRoute({
  operationId: "exportCouncilImportTemplate",
  tags: ["Luận văn"],
  path: "/export-council-import-template",
  method: "post",
  summary: "Xuất Excel mẫu nhập hội đồng bảo vệ theo đợt xét",
  request: {
    body: {
      content: { "application/json": { schema: ExportCouncilImportTemplateSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...excelSuccess("File Excel mẫu nhập hội đồng"),
    400: {
      description: "Lỗi nghiệp vụ khi xuất file",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

app.openapi(exportCouncilImportTemplateRoute, async (c) => {
  const body = c.req.valid("json")
  try {
    const result = await exportCouncilImportTemplate({
      thesisSessionId: body.thesisSessionId,
    })
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`
    return c.body(new Uint8Array(result.buffer), 200, {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": disposition,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất file thất bại."
    return c.json({ message }, 400)
  }
})

const exportThesisTemplateRoute = createRoute({
  operationId: "exportThesisTemplate",
  tags: ["Luận văn"],
  path: "/export/{kind}",
  method: "post",
  summary: "Xuất mẫu in luận văn theo bộ lọc",
  request: {
    params: z.object({ kind: ThesisExportKindSchema }),
    body: {
      content: { "application/json": { schema: ThesisExportFilterSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...excelSuccess("File xuất luận văn"),
    400: {
      description: "Chưa có dữ liệu hoặc lỗi xuất file",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

app.openapi(exportThesisTemplateRoute, async (c) => {
  const { kind } = c.req.valid("param")
  const body = c.req.valid("json")
  try {
    const result = await buildThesisExport(kind, body)
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`
    return c.body(new Uint8Array(result.buffer), 200, {
      "Content-Type": result.contentType,
      "Content-Disposition": disposition,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất file thất bại."
    return c.json({ message }, 400)
  }
})

const ImportCouncilFromExcelSchema = z
  .object({
    file: z.instanceof(File).openapi({ type: "string", format: "binary" }),
    thesisSessionId: z.string().min(1).openapi({ description: "ID đợt xét luận văn." }),
  })
  .openapi("ImportCouncilFromExcelRequest")

const ImportCouncilFromExcelResponseSchema = z
  .object({
    updatedCount: z.number().openapi({ description: "Số đề tài đã cập nhật." }),
  })
  .openapi("ImportCouncilFromExcelResponse")

const importCouncilFromExcelRoute = createRoute({
  operationId: "importCouncilFromExcel",
  tags: ["Luận văn"],
  path: "/import-council-from-excel",
  method: "post",
  summary: "Import hội đồng bảo vệ từ file Excel mẫu",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: ImportCouncilFromExcelSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...jsonSuccess(ImportCouncilFromExcelResponseSchema, "Import hội đồng thành công"),
    400: {
      description: "Lỗi nghiệp vụ khi import",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

app.openapi(importCouncilFromExcelRoute, async (c) => {
  const { file, thesisSessionId } = c.req.valid("form")
  const maxFileSize = 50 * 1024 * 1024
  if (file.size > maxFileSize) {
    return c.json({ message: "File vượt quá 50MB." }, 400)
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return c.json({ message: "Vui lòng chọn file Excel (.xlsx)." }, 400)
  }

  try {
    const fileBuffer = await file.arrayBuffer()
    const result = await importCouncilFromExcel({
      thesisSessionId,
      fileBuffer,
    })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import hội đồng thất bại."
    return c.json({ message }, 400)
  }
})

export default app
