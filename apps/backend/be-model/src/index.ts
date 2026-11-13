import { OpenAPIHono } from "@hono/zod-openapi"
import { jwtAuth } from "@workspace/auth/hono"
import { enhance, Prisma, type PrismaClient } from "@workspace/db"
import { createHonoHandler } from "@workspace/db/hono"
import { setupAppTimezone } from "@workspace/libs/timezone"
import type { Context } from "hono"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { showRoutes } from "hono/dev"
import { HTTPException } from "hono/http-exception"
import { proxy } from "hono/proxy"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import ApimLogsApp from "./api/apim-logs"
import AuthApp from "./api/auth"
import ExcelImportExportApp from "./api/excel-import-export"
import ExcelTemplateApp from "./api/excel-template"
import DocxTemplateApp from "./api/docx-template"
import DwhApp from "./api/dwh"
import ThesisApp from "./api/thesis"
import ThesisPaymentApp from "./api/thesis-payment"
import MinIOApp from "./api/minio"
import SqlTransactionApp from "./api/transaction"
import SystemStatusApp from "./api/system-status"
import GetPermissionApp from "./api/get-permission"
import WSO2AmApp from "./api/wso2am"
import { startPreviewCleanupCron } from "./cron/cleanup-preview"
import { checkIp } from "./middlewares/check-ip"
import { dwhConfig } from "./dwh/config"
import { dwhAuth } from "./middlewares/dwh-auth"
import { createConcurrencyGate } from "./middlewares/dwh-concurrency"
import { createPrismaClient } from "./utils/db-pool"
import { setupOpenApi } from "./utils/openapi"
import { releaseSoftDeletedSurveyObjectCode } from "./utils/release-soft-deleted-survey-object-code"
import { getSystemClientCredentials, getSystemOrigin } from "./utils/system-client"

setupAppTimezone()

export const prisma: PrismaClient = createPrismaClient()
const app = new OpenAPIHono({ strict: false })

const originEnv = process.env.ORIGIN || ""
const originList = originEnv
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:8081",
  "https://localhost:8081",
  "https://daotao.swantech.vn",
  "https://user.mta.swantech.vn",
  "https://daotao.mta.swantech.vn",
  "https://chatbot.mta.swantech.vn",
  "https://khaothi.mta.swantech.vn",
  "https://am.swantech.vn",
  "https://14.224.217.69:8243",
  ...originList,
]

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (allowedOrigins.includes(origin)) return origin
      if (/^https:\/\/[a-zA-Z0-9-]+\.swantech\.vn$/.test(origin)) return origin
      return null
    },
    credentials: true,
  })
)

const config = {
  keycloak: {
    url: process.env.KEYCLOAK_URL || "http://localhost:8080",
    realm: process.env.KEYCLOAK_REALM || "swantech",
    clientId: process.env.KEYCLOAK_CLIENT_ID || "fe-test-local",
  },
}
const issuer = `${config.keycloak.url}/realms/${config.keycloak.realm}`
const jwksUri = `${issuer}/protocol/openid-connect/certs`
const audience = config.keycloak.clientId
console.log("[be-model] Keycloak Config:", {
  issuer,
  jwksUri,
  audience,
})
app.use(contextStorage())
app.use("*", checkIp)

// public route
setupOpenApi(app)
app.route("/api/system-status", SystemStatusApp)
app.route("/api/getPermission", GetPermissionApp)
app.route("/api/auth", AuthApp)
app.route("/api/apim-logs", ApimLogsApp)
app.route("/api/wso2am", WSO2AmApp)
app.route("/api/excel-import-export", ExcelImportExportApp)
app.route("/api/excel-template", ExcelTemplateApp)
app.route("/api/docx-template", DocxTemplateApp)
app.route("/api/thesis", ThesisApp)
app.route("/api/thesis-payment", ThesisPaymentApp)
// TODO!: remove `/check`
app.use("/api/check/*", jwtAuth("lms"))
// setupAuth(app)
// Hỗ trợ cả 2 kiểu mount nginx của be-model:
// - `/api/model/` → `be-model/api/`  : FE gọi `{MODEL_BASE}/system/...` → be-model nhận `/api/system/...`
// - `/api/model/` → `be-model/`      : (vd. daotao.swantech.vn) be-model nhận `/system/...`
const systemProxyHandler = async (c: Context) => {
  const appCode = c.req.param("appcode")!.toLowerCase()
  const pathProxy = c.req.path.replace(new RegExp(`^(/api)?/system/${appCode}/`, "i"), "")
  const { clientId, clientSecret } = getSystemClientCredentials(appCode)
  const systemOrigin = getSystemOrigin()
  if (!systemOrigin) {
    console.error("[system-proxy] thiếu SYSTEM_BASE_URL")
    return c.json({ message: "SYSTEM_BASE_URL chưa cấu hình" }, 500)
  }
  if (!clientId || !clientSecret) {
    console.error("[system-proxy] thiếu client credentials", appCode)
    return c.json({ message: `Thiếu x-clientid/secret cho app ${appCode}` }, 401)
  }

  // Upstream: /api/system/{scope}/... (public | share | storage) — nginx không có /api/system/{appCode}/
  // Giữ nguyên query string (c.req.path không chứa query)
  const urlProxy = new URL(`${pathProxy}${new URL(c.req.url).search}`, `${systemOrigin}/api/system/`)
  const headers = {
    ...c.req.header(),
    "x-clientid": clientId,
    "x-clientsecret": clientSecret,
  }
  console.log("[system-proxy]", appCode, urlProxy.toString())

  const res = await proxy(urlProxy, {
    ...c.req,
    headers,
  })
  return res
}
app.all("/api/system/:appcode/*", systemProxyHandler)
app.all("/system/:appcode/*", systemProxyHandler)

app.route("/api/minio", MinIOApp)
app.route("/api/sql", SqlTransactionApp)

// Tích hợp trục MTA-SSO: trục lấy dữ liệu các bảng schema ql-dao-tao.
// Webhook tự kiểm khoá trong handler; /events qua dwhAuth + cổng giới hạn số request đọc DB cùng lúc.
app.use(
  "/api/dwh/events/*",
  dwhAuth,
  createConcurrencyGate({
    name: "dwh",
    maxConcurrent: dwhConfig.maxConcurrentRequests,
    maxQueued: dwhConfig.maxQueuedRequests,
    maxWaitMs: dwhConfig.queueTimeoutMs,
  })
)
app.route("/api/dwh", DwhApp)

const mockProfileId = process.env.MOCK_USER_PROFILE_ID?.trim()
const nv = mockProfileId
  ? await prisma.userProfile.findUniqueOrThrow({ where: { id: mockProfileId } })
  : await prisma.userProfile.findFirstOrThrow({})

if (mockProfileId) {
  console.log(`[be-model] Using mock user profile: ${nv.fullname} (${nv.id})`)
}

const TargetMap = {
  name: "Tên",
  englishName: "Tên tiếng Anh",
  code: "Mã",
  idCardNumber: "CCCD",
  studentId: "HV/SV",
  evidenceId: "Minh chứng",
  level: "Bậc",
  order: "Thứ tự",
  rankOrder: "Thứ tự",
  correctOrder: "Thứ tự đúng",
  examCode: "Mã đề thi",
  fax: "Phách",
  examFaxId: "Fax",
  questionType: "Loại",
  trainingBlockId: "Khối kiến thức",
  lectureID: "ID giảng viên",
  archivedCertificateId: "Chứng chỉ",
  archivedAwardId: "Thành tích",
  semesterType: "Học kỳ",
  originalDiplomaNumber: "Số vào sổ gốc",
  diplomaNumber: "Số hiệu văn bằng",
}

const TargetKeys = Object.keys(TargetMap) as (keyof typeof TargetMap)[]

const errorTransformer = (err: unknown) => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
    return err
  }

  if (err.code === "P2025") {
    return new HTTPException(404, { message: "Dữ liệu không tồn tại" })
  }
  if (err.code === "P2002") {
    const targets = err.meta ? (err.meta.target as string[]) : []

    const target = targets.find((t) => TargetKeys.includes(t as keyof typeof TargetMap))

    if (target) {
      return new HTTPException(409, {
        message: `${TargetMap[target as keyof typeof TargetMap]} bị trùng`,
      })
    }

    return new HTTPException(409, { message: "Dữ liệu bị trùng" })
  }

  return err
}

async function releaseDeletedSurveyObjectCode(c: Context) {
  try {
    const body = (await c.req.raw.clone().json()) as { data?: { code?: unknown } }
    await releaseSoftDeletedSurveyObjectCode(prisma, body?.data?.code)
  } catch {
    // Body không phải JSON thì để handler model xử lý.
  }
}

app.use("/api/model/surveyObjectType/create", async (c, next) => {
  if (c.req.method === "POST") await releaseDeletedSurveyObjectCode(c)
  await next()
})
app.use("/api/model/surveyObjectType/update", async (c, next) => {
  if (c.req.method === "PUT") await releaseDeletedSurveyObjectCode(c)
  await next()
})

app.use(
  "/api/model/*",
  createHonoHandler({
    getPrisma: async (ctx: Context) => {
      return enhance(prisma, { user: nv }, { errorTransformer })
      // return enhance(prisma, { user: ctx.get('user') })
    },
  })
)

app.onError((err, c) => {
  console.log("[BE-MODEL] Error: ", err)
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let status: ContentfulStatusCode = 500
    if (err.code === "P2025") status = 404
    if (err.code === "P2002") status = 409
    if (err.code === "P2003") status = 400
    if (err.code === "P2028") status = 400 // transaction timeout

    if (status === 500) {
      return c.json({ message: "Internal Server Error" }, status)
    }

    const cause =
      (typeof err.meta?.cause === "string" && err.meta.cause) ||
      (typeof err.meta?.field_name === "string" && `Vi phạm ràng buộc: ${err.meta.field_name}`) ||
      err.message

    return c.json({ message: cause }, status)
  }

  return c.json({ message: err.message }, 500)
})

showRoutes(app, { verbose: true })

Bun.serve({
  idleTimeout: 60,
  fetch: app.fetch,
  hostname: "0.0.0.0",
  // port: Number(process.env.PORT || 3041),
  port: process.env.PORT || 3000,
})

startPreviewCleanupCron()

process.on("SIGINT", () => {
  process.exit()
})
