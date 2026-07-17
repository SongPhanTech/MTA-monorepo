import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { docxSuccess, excelSuccess, jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { renderThesisPaymentDocx } from "../services/thesis-docx-render.service"
import { renderThesisPaymentXlsx } from "../services/thesis-excel-render.service"
import {
  buildCouncilPaymentExportPayload,
  buildSupervisorPaymentExportPayload,
} from "../services/thesis-payment-export.service"
import { syncCouncilPaymentsForThesisSession, syncSupervisorPaymentsForThesisSession } from "../services/thesis-payment-sync.service"

const app = new OpenAPIHono({ strict: false })

const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const ThesisPaymentScopeSchema = z.object({
  thesisSessionId: z.string().openapi({ description: "ID đợt xét luận văn." }),
  studentIds: z
    .array(z.string())
    .optional()
    .openapi({ description: "Danh sách ID học viên trong phạm vi lọc hiện tại." }),
})

const SyncCouncilPaymentsSchema = ThesisPaymentScopeSchema.extend({
  recreateAll: z.boolean().default(false).openapi({
    description: "true = cập nhật lại toàn bộ bản ghi thanh toán hội đồng.",
  }),
})

const SyncSupervisorPaymentsSchema = ThesisPaymentScopeSchema.extend({
  recreateAll: z.boolean().default(false).openapi({
    description: "true = cập nhật lại toàn bộ bản ghi thanh toán GVHD.",
  }),
})

const SyncResponseSchema = z
  .object({
    syncedCount: z.number().openapi({ description: "Số bản ghi thanh toán đã đồng bộ." }),
    projectCount: z.number().openapi({ description: "Số đề tài/luận văn trong phạm vi." }),
  })
  .openapi("ThesisPaymentSyncResponse")

const syncCouncilPaymentsRoute = createRoute({
  operationId: "syncThesisCouncilPayments",
  tags: ["Luận văn - Thanh toán"],
  path: "/sync-council-payments",
  method: "post",
  summary: "Đồng bộ thanh toán hội đồng bảo vệ",
  request: {
    body: {
      content: { "application/json": { schema: SyncCouncilPaymentsSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...jsonSuccess(SyncResponseSchema, "Đồng bộ thành công"),
    400: {
      description: "Lỗi nghiệp vụ khi đồng bộ",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

const syncSupervisorPaymentsRoute = createRoute({
  operationId: "syncThesisSupervisorPayments",
  tags: ["Luận văn - Thanh toán"],
  path: "/sync-supervisor-payments",
  method: "post",
  summary: "Đồng bộ thanh toán hướng dẫn",
  request: {
    body: {
      content: { "application/json": { schema: SyncSupervisorPaymentsSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...jsonSuccess(SyncResponseSchema, "Đồng bộ thành công"),
    400: {
      description: "Lỗi nghiệp vụ khi đồng bộ",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

const exportCouncilPaymentsRoute = createRoute({
  operationId: "exportThesisCouncilPayments",
  tags: ["Luận văn - Thanh toán"],
  path: "/export-council-payments",
  method: "post",
  summary: "Xuất file thanh toán hội đồng bảo vệ",
  request: {
    body: {
      content: { "application/json": { schema: ThesisPaymentScopeSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...excelSuccess("File XLSX thanh toán hội đồng"),
    400: {
      description: "Chưa có dữ liệu hoặc lỗi xuất file",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

const exportSupervisorPaymentsRoute = createRoute({
  operationId: "exportThesisSupervisorPayments",
  tags: ["Luận văn - Thanh toán"],
  path: "/export-supervisor-payments",
  method: "post",
  summary: "Xuất file thanh toán hướng dẫn",
  request: {
    body: {
      content: { "application/json": { schema: ThesisPaymentScopeSchema } },
    },
  },
  responses: {
    ...standardErrorResponses(),
    ...docxSuccess("File DOCX thanh toán hướng dẫn"),
    400: {
      description: "Chưa có dữ liệu hoặc lỗi xuất file",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

app.openapi(syncCouncilPaymentsRoute, async (c) => {
  const body = c.req.valid("json")
  try {
    const result = await syncCouncilPaymentsForThesisSession({
      thesisSessionId: body.thesisSessionId,
      studentIds: body.studentIds,
      recreateAll: body.recreateAll,
    })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đồng bộ thanh toán thất bại."
    return c.json({ message }, 400)
  }
})

app.openapi(syncSupervisorPaymentsRoute, async (c) => {
  const body = c.req.valid("json")
  try {
    const result = await syncSupervisorPaymentsForThesisSession({
      thesisSessionId: body.thesisSessionId,
      studentIds: body.studentIds,
      recreateAll: body.recreateAll,
    })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đồng bộ thanh toán thất bại."
    return c.json({ message }, 400)
  }
})

app.openapi(exportCouncilPaymentsRoute, async (c) => {
  const body = c.req.valid("json")
  try {
    const payload = await buildCouncilPaymentExportPayload({
      thesisSessionId: body.thesisSessionId,
      studentIds: body.studentIds,
    })
    if (!payload) {
      return c.json({ message: "Chưa có dữ liệu để tạo thanh toán hội đồng bảo vệ" }, 400)
    }
    const buffer = await renderThesisPaymentXlsx(payload)

    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(payload.downloadName)}`
    return c.body(new Uint8Array(buffer), 200, {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": disposition,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất file thất bại."
    return c.json({ message }, 400)
  }
})

app.openapi(exportSupervisorPaymentsRoute, async (c) => {
  const body = c.req.valid("json")
  try {
    const payload = await buildSupervisorPaymentExportPayload({
      thesisSessionId: body.thesisSessionId,
      studentIds: body.studentIds,
    })
    if (payload.empty) {
      if (payload.studentsInSession > 0 && payload.studentsWithSupervisor === 0) {
        return c.json(
          {
            message: `Có ${payload.studentsInSession} học viên trong đợt đã chọn nhưng chưa gán GVHD để xuất file.`,
          },
          400
        )
      }
      return c.json({ message: "Chưa có dữ liệu để xuất thanh toán hướng dẫn" }, 400)
    }
    const buffer = await renderThesisPaymentDocx(payload)
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(payload.downloadName)}`
    return c.body(new Uint8Array(buffer), 200, {
      "Content-Type": DOCX_CONTENT_TYPE,
      "Content-Disposition": disposition,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất file thất bại."
    return c.json({ message }, 400)
  }
})

export default app
