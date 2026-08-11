import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  ErrorMessageResponseSchema,
  TemplatePreviewResponseSchema,
} from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { docxSuccess, jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { renderDocxTemplate, TemplateNotFoundError } from "../services/docx-template-render.service"
import { MinIOService } from "../services/minio"

const app = new OpenAPIHono({ strict: false })

const minioService = new MinIOService()

const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const docxTemplateSchema = z
  .object({
    fileName: z.string().openapi(fieldDesc("Tên file khi tải về.")),
    path: z.string().openapi(fieldDesc("Đường dẫn template trên MinIO.")),
    prefix: z.string().nullable().optional().openapi(fieldDesc("Prefix thư mục template.")),
    data: z.record(z.unknown()).openapi(fieldDesc("Dữ liệu điền vào template.")),
  })
  .openapi("DocxTemplateRequest")

const docxPreviewSchema = docxTemplateSchema
  .extend({
    previewKey: z.string().openapi(fieldDesc("Khóa duy nhất cho file preview.")),
  })
  .openapi("DocxTemplatePreviewRequest")

app.openapi(
  createRoute({
    operationId: "docxTemplate",
    tags: ["Mẫu DOCX"],
    summary: "Xuất file DOCX từ template",
    path: "/",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": { schema: docxTemplateSchema },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...docxSuccess("Xuất file DOCX thành công"),
    },
  }),
  async (c) => {
    const logPrefix = "[DOCX-TEMPLATE]"
    const { fileName, path, data, prefix } = c.req.valid("json")
    const items = (data as { items?: unknown[] })?.items
    console.log(`${logPrefix} REQUEST`, {
      fileName,
      path,
      prefix,
      dataKeys: data && typeof data === "object" ? Object.keys(data) : [],
      itemsCount: Array.isArray(items) ? items.length : undefined,
      payloadApproxBytes: (() => {
        try {
          return Buffer.byteLength(JSON.stringify({ fileName, path, prefix, data }))
        } catch {
          return undefined
        }
      })(),
    })
    try {
      const startedAt = Date.now()
      const finalBuffer = await renderDocxTemplate({ path, prefix, data })
      console.log(`${logPrefix} SUCCESS`, {
        fileName,
        path,
        prefix,
        outputBytes: finalBuffer.length,
        durationMs: Date.now() - startedAt,
      })
      const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

      return c.body(new Uint8Array(finalBuffer), 200, {
        "Content-Type": DOCX_CONTENT_TYPE,
        "Content-Disposition": disposition,
      })
    } catch (error: unknown) {
      if (error instanceof TemplateNotFoundError) {
        console.error(`${logPrefix} TEMPLATE_NOT_FOUND`, {
          fileName,
          path,
          prefix,
          message: error.message,
        })
        return c.json({ message: error.message }, 404)
      }
      const msg = error instanceof Error ? error.message : "Lỗi khi xử lý template Docx"
      console.error(`${logPrefix} ERROR`, {
        fileName,
        path,
        prefix,
        message: msg,
        name: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        error,
      })
      return c.json({ message: msg }, 500)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "docxTemplatePreview",
    tags: ["Mẫu DOCX"],
    summary: "Preview template DOCX trên MinIO",
    path: "/preview",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": { schema: docxPreviewSchema },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(TemplatePreviewResponseSchema, "Lưu file preview lên MinIO thành công"),
      404: {
        description: "Không tìm thấy template",
        content: { "application/json": { schema: ErrorMessageResponseSchema } },
      },
    },
  }),
  async (c) => {
    const { path, data, prefix, previewKey } = c.req.valid("json")
    try {
      const finalBuffer = await renderDocxTemplate({ path, prefix, data })

      const safeKey = previewKey.replace(/[^a-zA-Z0-9_-]/g, "_")
      const objectName = `mta/preview/luan-van/${safeKey}.docx`

      const { fileName } = await minioService.putObject(objectName, finalBuffer, DOCX_CONTENT_TYPE)

      return c.json({ path: fileName, fileType: "docx" }, 200)
    } catch (error: unknown) {
      if (error instanceof TemplateNotFoundError) return c.json({ message: error.message }, 404)
      const msg = error instanceof Error ? error.message : "Lỗi khi xử lý template Docx"
      console.error("[DOCX-TEMPLATE-PREVIEW] Error:", error)
      return c.json({ message: msg }, 500)
    }
  }
)

export default app
