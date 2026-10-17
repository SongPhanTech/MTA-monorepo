import { OpenAPIHono } from "@hono/zod-openapi"
import { jwtAuth } from "@workspace/auth/hono"
import { enhance, Prisma, PrismaClient } from "@workspace/db"
import { modelApiAppCodes } from "@workspace/db/model-api-app-codes"
import { modelPolicyUser } from "@workspace/db/model-policy-user"
import { createHonoHandler } from "@workspace/db/hono"
import { setupAppTimezone } from "@workspace/libs/timezone"
import type { Context } from "hono"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { showRoutes } from "hono/dev"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import ArchivedScoreApp from "./api/archived-score"
import CurriculumApp from "./api/curriculum"
import CurriculumSubjectApp from "./api/curriculum-subject"
import DiplomaVerificationApp from "./api/diploma-verification"
import ExamApp from "./api/exam"
import ExamScheduleApp from "./api/exam-schedule"
import ExamScoreApp from "./api/exam-score"
import ExportStudentSemesterResultApp from "./api/export-student-result"
import ExportStudentYearResultApp from "./api/export-student-year-result"
import ExportThoiKhoaBieuApp from "./api/export-thoi-khoa-bieu"
import ExportTemplateApp from "./api/export-template"
import ExportTrainingDataApp from "./api/export-training-data"
import ImportTrainingDataApp from "./api/import-training-data"
import InvalidateClassRegisterCacheApp from "./api/invalidate-class-register-cache"
import FixedClassApp from "./api/fixed-class"
import GraduationApp from "./api/graduation"
import GuestTeachingPaymentApp from "./api/guest-teaching-payment"
import ImportApp from "./api/import"
import InternshipApp from "./api/internship"
import LecturerApp from "./api/lecturer"
import PlanTraining from "./api/plan-training"
import RoomApp from "./api/room"
import ScoreCorrectionApp from "./api/score-correction"
import Stats from "./api/stats"
import StudentApp from "./api/student"
import SubjectClassApp from "./api/subject-class"
import ReSubjectClassApp from "./api/re-subject-class"
import TrainingFieldApp from "./api/training-field"
import TrainingScoreApp from "./api/training-score"
import UserPermissionsApp from "./api/user-permissions"
import UserProfileApp from "./api/user-profile"
import { checkIp } from "./middlewares/check-ip"
import { startQuetHanGiangVienCron } from "./cron/quet-han-giang-vien"
import { startQuetNhacLichCaNhanCron } from "./cron/quet-nhac-lich-ca-nhan"
import { startDonDepThongBaoCron } from "./cron/don-dep-thong-bao"
import { setupOpenApi } from "./utils/openapi"

setupAppTimezone()

export const prisma: PrismaClient = new PrismaClient()

const app = new OpenAPIHono({ strict: false })

const originEnv = process.env.ORIGIN || ""
const originList = originEnv
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://user.mta.swantech.vn",
  "https://daotao.swantech.vn",
  "https://daotao.mta.swantech.vn",
  "https://am.swantech.vn",
  "https://api.am.swantech.vn",
  ...originList,
]

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Exact match
      if (allowedOrigins.includes(origin)) return origin
      // Wildcard *.swantech.vn
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
app.use(contextStorage())
// app.use(tracingMiddleware)
app.use("*", checkIp)

const issuer = `${config.keycloak.url}/realms/${config.keycloak.realm}`
const jwksUri = `${issuer}/protocol/openid-connect/certs`
const audience = config.keycloak.clientId
app.route("/api/training-field", TrainingFieldApp)
app.route("/api/room", RoomApp)
app.route("/api/stats", Stats)

// // TODO!: remove `/check`
// app.use("/api/*", jwtAuth("lms"))

setupOpenApi(app)

app.route("/api/user-profile", UserProfileApp)
app.route("/api/user-permissions", UserPermissionsApp)
app.route("/api/fixed-class", FixedClassApp)
app.route("/api/subject-class", SubjectClassApp)
app.route("/api/subject-class", ReSubjectClassApp)
app.route("/api/student", StudentApp)
app.route("/api/lecturer", LecturerApp)
app.route("/api/diploma-verification", DiplomaVerificationApp)
app.route("/api/training-score", TrainingScoreApp)
app.route("/api/curriculum", CurriculumApp)
app.route("/api/curriculum-subject", CurriculumSubjectApp)
app.route("/api/graduation", GraduationApp)
app.route("/api/internship", InternshipApp)
app.route("/api/plan-training", PlanTraining)
app.route("/api/import", ImportApp)
app.route("/api/guest-teaching-payment", GuestTeachingPaymentApp)
app.route("/api/score-correction", ScoreCorrectionApp)
app.route("/api/archived-score", ArchivedScoreApp)
app.route("/api/exam", ExamApp)
app.route("/api/exam-schedules", ExamScheduleApp)
app.route("/api/exam-score", ExamScoreApp)
app.route("/api/student-result", ExportStudentSemesterResultApp)
app.route("/api/student-result", ExportStudentYearResultApp)
app.route("/api/thoi-khoa-bieu", ExportThoiKhoaBieuApp)
app.route("/api/export-template", ExportTemplateApp)
app.route("/api/export-training-data", ExportTrainingDataApp)
app.route("/api/import-training-data", ImportTrainingDataApp)
app.route("/api/class-register-session", InvalidateClassRegisterCacheApp)
app.use("/api/model/*", jwtAuth(modelApiAppCodes()))
app.use(
  "/api/model/*",
  createHonoHandler({
    getPrisma: async (ctx: Context) => {
      return enhance(prisma, { user: modelPolicyUser(ctx.get("user")) })
    },
  })
)

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

    return c.json({ message: err.meta?.cause ?? err.message }, status)
  }

  console.log(err)
  return c.json({ message: err.message }, 500)
})

showRoutes(app, { verbose: true })

startQuetHanGiangVienCron(prisma)
startQuetNhacLichCaNhanCron(prisma)
startDonDepThongBaoCron(prisma)

export default {
  idleTimeout: 255, // giây — tổng kết 500+ SV có thể > 10s (mặc định Bun)
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: process.env.PORT || 3000,
}

process.on("SIGINT", () => {
  process.exit()
})
