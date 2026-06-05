import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  renderDocxTemplate,
  TemplateNotFoundError,
} from "../services/docx-template-render.service"
import { MinIOService } from "../services/minio"

const app = new OpenAPIHono({ strict: false })

const minioService = new MinIOService()

const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const docxTemplateSchema = z.object({
  fileName: z.string(),
  path: z.string(),
  prefix: z.string().nullable().optional(),
  data: z.record(z.unknown()),
})

const docxPreviewSchema = docxTemplateSchema.extend({
  previewKey: z.string(),
})

app.openapi(
  createRoute({
    operationId: "docxTemplate",
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
      200: {
        description: "Export Docx thành công",
        content: {
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
            schema: z.any().openapi({ type: "string", format: "binary" }),
          },
        },
      },
    },
  }),
  async (c) => {
    const { fileName, path, data, prefix } = c.req.valid("json")
    try {
      const finalBuffer = await renderDocxTemplate({ path, prefix, data })
      const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

      return c.body(new Uint8Array(finalBuffer), 200, {
        "Content-Type": DOCX_CONTENT_TYPE,
        "Content-Disposition": disposition,
      })
    } catch (error: unknown) {
      if (error instanceof TemplateNotFoundError) return c.json({ message: error.message }, 404)
      const msg = error instanceof Error ? error.message : "Lỗi khi xử lý template Docx"
      console.error("[DOCX-TEMPLATE] Error:", error)
      return c.json({ message: msg }, 500)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "docxTemplatePreview",
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
      200: {
        description: "Fill template và lưu lên MinIO để preview",
        content: {
          "application/json": {
            schema: z.object({ path: z.string(), fileType: z.string() }),
          },
        },
      },
      404: {
        description: "Không tìm thấy template",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
      500: {
        description: "Lỗi xử lý template",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
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
