import { OpenAPIHono } from "@hono/zod-openapi"
import { Prisma, PrismaClient } from "@workspace/db"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { showRoutes } from "hono/dev"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import FixedClassApp from "./api/fixed-class"
import SchoolYearApp from "./api/school-year"
import SemesterApp from "./api/semester"
import TrainingCourseApp from "./api/training-course"
import TrainingFieldApp from "./api/training-field"
import TrainingMajorApp from "./api/training-major"
import TrainingObjectTypeApp from "./api/training-object-type"
import { setupOpenApi } from "./utils/openapi"

export const prisma: PrismaClient = new PrismaClient()

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const originEnv = process.env.ORIGIN || ""
const originList = originEnv.split(",").map((item) => item.trim())

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://user.mta.swantech.vn",
      "https://mta.swantech.vn",
      "https://daotao.mta.swantech.vn",
      "https://am.swantech.vn",
      "https://api.am.swantech.vn",
      "https://*.swantech.vn",
      ...originList,
      "*",
    ],
    credentials: true,
  })
)

app.use(contextStorage())

setupOpenApi(app)

app.route("", FixedClassApp)
app.route("", SchoolYearApp)
app.route("", SemesterApp)
app.route("", TrainingCourseApp)
app.route("", TrainingFieldApp)
app.route("", TrainingMajorApp)
app.route("", TrainingObjectTypeApp)
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
  port: process.env.PORT || 3000,
}

process.on("SIGINT", () => {
  process.exit()
})
