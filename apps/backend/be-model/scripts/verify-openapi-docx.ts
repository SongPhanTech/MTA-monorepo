process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "http://localhost:9000"
process.env.MINIO_PORT = process.env.MINIO_PORT || "9000"
process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minio"
process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minio123"
process.env.MINIO_BUCKET = process.env.MINIO_BUCKET || "mta"
process.env.APIM_LOGS_DATABASE_URL =
  process.env.APIM_LOGS_DATABASE_URL || "postgresql://localhost:5432/apim_logs"

const { OpenAPIHono } = await import("@hono/zod-openapi")
const ApimLogsApp = (await import("../src/api/apim-logs")).default
const AuthApp = (await import("../src/api/auth")).default
const DocxTemplateApp = (await import("../src/api/docx-template")).default
const ExcelImportExportApp = (await import("../src/api/excel-import-export")).default
const ExcelTemplateApp = (await import("../src/api/excel-template")).default
const MinIOApp = (await import("../src/api/minio")).default
const WSO2AmApp = (await import("../src/api/wso2am")).default
const { buildOpenApiDocx } = await import("../src/services/openapi-docx-export")
const { buildOpenApiDocumentConfig } = await import("../src/utils/openapi-info")
const { setupOpenApi } = await import("../src/utils/openapi")

const app = new OpenAPIHono({ strict: false })
setupOpenApi(app)
app.route("/api/auth", AuthApp)
app.route("/api/apim-logs", ApimLogsApp)
app.route("/api/wso2am", WSO2AmApp)
app.route("/api/excel-import-export", ExcelImportExportApp)
app.route("/api/excel-template", ExcelTemplateApp)
app.route("/api/docx-template", DocxTemplateApp)
app.route("/api/minio", MinIOApp)

const config = buildOpenApiDocumentConfig({
  req: { url: "http://localhost:3000/reference" },
} as never)

const doc = app.getOpenAPIDocument(config)
const pathCount = Object.keys(doc.paths ?? {}).length
const buffer = await buildOpenApiDocx(doc)

console.log(`OpenAPI paths: ${pathCount}`)
console.log(`DOCX size: ${buffer.byteLength} bytes`)

if (pathCount < 25) {
  throw new Error(`Expected at least 25 paths, got ${pathCount}`)
}
if (buffer.byteLength < 10_000) {
  throw new Error(`DOCX too small: ${buffer.byteLength} bytes`)
}

console.log("verify-openapi-docx: OK")
