import type { OpenAPIHono } from "@hono/zod-openapi"
import zenstackOpenApi from "@workspace/db/openapi"
import { getHtmlDocument } from "@scalar/core/libs/html-rendering"
import type { Context } from "hono"
import { buildOpenApiDocx } from "../services/openapi-docx-export"
import { buildOpenApiDocumentConfig } from "./openapi-info"
import { mergeOpenApiSpecs } from "./merge-openapi"
import { injectReferenceExportDocx } from "./openapi-reference"

const DOCX_FILENAME = "Tai-lieu-API-Khao-thi.docx"

function getMergedOpenApiDocument(app: OpenAPIHono, c: Context) {
  const honoDoc = app.getOpenAPIDocument(buildOpenApiDocumentConfig(c))
  return mergeOpenApiSpecs(honoDoc, zenstackOpenApi as Record<string, unknown>)
}

export function setupOpenApi(app: OpenAPIHono) {
  app.get("/openapi", (c) => c.json(getMergedOpenApiDocument(app, c)))

  app.get("/openapi/export-docx", async (c) => {
    const openApiDoc = getMergedOpenApiDocument(app, c)
    const buffer = await buildOpenApiDocx(openApiDoc)
    return c.body(new Uint8Array(buffer), 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${DOCX_FILENAME}"`,
    })
  })

  const scalarConfig = {
    theme: "purple" as const,
    pageTitle: "API Khảo thí — MTA",
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
