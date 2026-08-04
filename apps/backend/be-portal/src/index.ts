import { OpenAPIHono } from "@hono/zod-openapi"
import { jwtAuth } from "@workspace/auth/hono"
import { Prisma, type PrismaClient } from "@workspace/db"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { showRoutes } from "hono/dev"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import AuthApp from "./api/auth"
import ClassRegisterApp from "./api/class-register"
import DataSyncHistoryApp from "./api/data-sync-history"
import ExportRegistrationResultsApp from "./api/export-registration-results"
import ImportTrainingDataApp from "./api/import-training-data"
import { createPrismaClient } from "./config/database"
import { checkIp } from "./middlewares/check-ip"
import { startRegistrationEventsWorker } from "./services/class-registration/events-worker"
import { startRegistrationWorker } from "./services/class-registration/worker"
import { setupOpenApi } from "./utils/openapi"

export const prisma: PrismaClient = createPrismaClient()

// Background worker tiêu thụ course_registration_queue (Kafka) — chạy nền, không block server
startRegistrationWorker(prisma)
// Consumer ghi ClassRegisterAttempt từ topic events (thống kê lỗi đăng ký)
startRegistrationEventsWorker(prisma)

const app = new OpenAPIHono({ strict: false })

const originEnv = process.env.ORIGIN || ""
const originList = originEnv.split(",").map((item) => item.trim())

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://mta.swantech.vn",
      "https://user.mta.swantech.vn",
      "https://am.swantech.vn",
      "https://*.swantech.vn",
      ...originList,
      "*",
    ],
    credentials: true,
  })
)

const config = {
  keycloak: {
    url: process.env.KEYCLOAK_URL || "http://localhost:8080",
    realm: process.env.KEYCLOAK_REALM || "swantech",
    clientId: process.env.KEYCLOAK_CLIENT_ID_PORTAL || "fe-test-local",
  },
}
app.use(contextStorage())
app.use("*", checkIp)
setupOpenApi(app)
// public route
app.route("/api/auth", AuthApp)

const issuer = `${config.keycloak.url}/realms/${config.keycloak.realm}`
const jwksUri = `${issuer}/protocol/openid-connect/certs`
const audience = config.keycloak.clientId

const portalAppCodes = (
  process.env.PORTAL_APP_CODES ||
  process.env.PORTAL_APP_CODE ||
  "congsinhvien,conghocvien"
)
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean)

app.use("/api/*", jwtAuth(portalAppCodes))

app.route("/api/class-register", ClassRegisterApp)
app.route("/api/data-sync", DataSyncHistoryApp)
app.route("/api/data-sync", ImportTrainingDataApp)
app.route("/api/data-sync", ExportRegistrationResultsApp)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status)
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let status: ContentfulStatusCode = 500
    if (err.code === "P2025") status = 404
    if (err.code === "P2002") status = 409
    if (err.code === "P2003") status = 400

    if (status === 500) {
      console.log(err)
      return c.json({ message: "Internal Server Error" }, status)
    }

    return c.json({ message: err.meta?.cause }, status)
  }

  console.log(err)
  return c.json({ message: err.message }, 500)
})

showRoutes(app, { verbose: true })

export default {
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: process.env.PORT || 3000,
}

process.on("SIGINT", () => {
  process.exit()
})
