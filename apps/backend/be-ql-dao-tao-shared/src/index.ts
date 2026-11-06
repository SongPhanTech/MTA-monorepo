import { OpenAPIHono } from "@hono/zod-openapi"
import { Prisma, PrismaClient } from "@workspace/db"
import { setupAppTimezone } from "@workspace/libs/timezone"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { showRoutes } from "hono/dev"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import ClassFixedApp from "./api/class-fixed"
import CourseApp from "./api/courses"
import DepartmentApp from "./api/get-department"
import GetRegistrationApp from "./api/get-registration"
import TeacherApp from "./api/lecturer"
import RegistrationApp from "./api/registration"
import RegistrationSessionApp from "./api/registration-session"
import SemesterApp from "./api/semester"
import SpecializedApp from "./api/specialized"
import SchedulesApp from "./api/student-schedule"
import StudentScoreApp from "./api/student-score"
import SubjectApp from "./api/subject"
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
  "http://localhost:3002",
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
      if (allowedOrigins.includes(origin)) return origin
      if (/^https:\/\/[a-zA-Z0-9-]+\.swantech\.vn$/.test(origin)) return origin
      return null
    },
    credentials: true,
  })
)

app.use(contextStorage())

setupOpenApi(app)

app.route("/", SubjectApp)
app.route("/", ClassFixedApp)
app.route("/", TeacherApp)
app.route("/", GetRegistrationApp)
app.route("/", RegistrationApp)
app.route("/", RegistrationSessionApp)
app.route("/", SemesterApp)
app.route("/", CourseApp)
app.route("/", SchedulesApp)
app.route("/", DepartmentApp)
app.route("/", SpecializedApp)
app.route("/", StudentScoreApp)

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

export default {
  fetch: app.fetch,
  hostname: "0.0.0.0",
  // port: Number(process.env.PORT || 3045),
  port: process.env.PORT || 3000,
}

process.on("SIGINT", () => {
  process.exit()
})
