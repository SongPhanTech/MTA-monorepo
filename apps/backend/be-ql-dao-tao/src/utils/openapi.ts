import type { OpenAPIHono } from "@hono/zod-openapi"
import { getHtmlDocument } from "@scalar/core/libs/html-rendering"
import { buildOpenApiDocx } from "../services/openapi-docx-export"
import { buildOpenApiDocumentConfig } from "./openapi-info"
import { injectReferenceExportDocx } from "./openapi-reference"

const DOCX_FILENAME = "Tai-lieu-API-Quan-ly-Dao-tao.docx"

export function setupOpenApi(app: OpenAPIHono) {
  app.doc("/openapi", (c) => buildOpenApiDocumentConfig(c))

  app.get("/openapi/export-docx", async (c) => {
    const openApiDoc = app.getOpenAPIDocument(buildOpenApiDocumentConfig(c))
    const buffer = await buildOpenApiDocx(openApiDoc)
    return c.body(new Uint8Array(buffer), 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${DOCX_FILENAME}"`,
    })
  })

  const scalarConfig = {
    theme: "purple" as const,
    pageTitle: "API Quản lý Đào tạo — MTA",
    spec: { url: "./openapi" },
  }

  app.get("/reference", async (c) => {
    const html = getHtmlDocument({ ...scalarConfig, _integration: "hono" })
    return c.html(injectReferenceExportDocx(html))
  })

  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  })
}
