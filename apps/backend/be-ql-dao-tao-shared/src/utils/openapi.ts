import type { OpenAPIHono } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"

export function setupOpenApi(app: OpenAPIHono) {
  app.doc("/openapi", (c) => ({
    openapi: "3.0.0",
    info: { version: "1.0.0", title: "My API" },
    servers: [
      {
        url: "https://api.shared.daotao.mta.swantech.vn",
        description: "Dev environment",
      },
      {
        url: new URL(c.req.url).origin,
        description: "Current environment",
      },
    ],
  }))

  app.get(
    "/reference",
    apiReference({
      theme: "purple",
      spec: { url: "/openapi" },
    })
  )

  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  })
}
