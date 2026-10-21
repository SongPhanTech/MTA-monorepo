import fs from "node:fs/promises"
import { existsSync, createReadStream } from "node:fs"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { exportTrainingData } from "../services/export-training-data"
import { enqueueExportJob, startExportConsumer } from "../services/export-kafka-queue"
import { getExportJob, setExportJob } from "../services/export-redis-store"
import { processExportJob } from "../services/export-worker"

// Khởi chạy Kafka Consumer lắng nghe job xuất dữ liệu (nếu Kafka khả dụng)
startExportConsumer(async (job) => {
  await processExportJob(job.jobId, job.classRegisterSessionId)
})

const app = new OpenAPIHono()

const exportTrainingDataRequestSchema = z
  .object({
    classRegisterSessionId: z
      .string()
      .optional()
      .openapi(
        fieldDesc("Tùy chọn, giữ tương thích. Xuất luôn toàn bộ dữ liệu, không lọc theo đợt.")
      ),
  })
  .openapi("ExportTrainingDataRequest")

const exportTrainingDataResponseSchema = z
  .object({
    version: z.string(),
    exportedAt: z.string(),
    filters: z.object({
      scope: z.enum(["full", "session"]),
      classRegisterSessionIds: z.array(z.string()),
      semesterIds: z.array(z.string()),
      trainingCourseIds: z.array(z.string()),
    }),
    counts: z.object({}).catchall(z.number()),
    data: z.object({}).catchall(z.array(z.object({}).catchall(z.any()))),
  })
  .openapi("ExportTrainingDataResponse")

// 1. Tuyến cũ: Đồng bộ (Giữ nguyên để tương thích)
const exportTrainingDataRoute = createRoute({
  operationId: "exportTrainingData",
  tags: ["Xuất dữ liệu"],
  path: "/export",
  method: "post",
  summary: "Xuất toàn bộ dữ liệu thô sang môi trường internet (Đồng bộ)",
  request: {
    body: {
      required: false,
      content: {
        "application/json": {
          schema: exportTrainingDataRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Gói dữ liệu JSON toàn bộ",
      content: {
        "application/json": {
          schema: exportTrainingDataResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportTrainingDataRoute, async (c) => {
  try {
    let classRegisterSessionId: string | undefined
    try {
      const body = c.req.valid("json") as any
      classRegisterSessionId = body?.classRegisterSessionId
    } catch {
      // Body optional
    }
    const result = await exportTrainingData({ classRegisterSessionId })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất dữ liệu thất bại"
    return c.json({ message }, 500)
  }
})

// 2. Tuyến mới: Bất đồng bộ (Kafka + Redis + Worker)
const exportAsyncRoute = createRoute({
  operationId: "exportTrainingDataAsync",
  tags: ["Xuất dữ liệu"],
  path: "/export-async",
  method: "post",
  summary: "Khởi tạo tiến trình xuất dữ liệu đào tạo nền (Bất đồng bộ - Asynchronous)",
  description: "Tạo tác vụ nền, đẩy vào Kafka Queue / Worker, lưu trạng thái trong Redis và trả về mã tiến trình ngay lập tức.",
  request: {
    body: {
      required: false,
      content: {
        "application/json": {
          schema: exportTrainingDataRequestSchema,
        },
      },
    },
  },
  responses: {
    202: {
      description: "Đã nhận tác vụ, đang xử lý ngầm",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            jobId: z.string(),
            status: z.literal("PENDING"),
          }),
        },
      },
    },
    ...standardErrorResponses(),
  },
})

app.openapi(exportAsyncRoute, async (c) => {
  let classRegisterSessionId: string | undefined
  try {
    const body = c.req.valid("json") as any
    classRegisterSessionId = body?.classRegisterSessionId
  } catch {
    // optional body
  }
  const jobId = crypto.randomUUID()
  const now = new Date().toISOString()

  // 1. Lưu trạng thái PENDING vào Redis
  await setExportJob({
    jobId,
    status: "PENDING",
    progress: 0,
    message: "Đã xếp hàng đợi xuất dữ liệu",
    classRegisterSessionId,
    createdAt: now,
    updatedAt: now,
  })

  // 2. Đẩy job vào Kafka (hoặc fallback chạy ngầm in-process)
  const enqueued = await enqueueExportJob({
    jobId,
    classRegisterSessionId,
    timestamp: now,
  })

  if (!enqueued) {
    // Chạy ngầm bất đồng bộ qua Worker
    setTimeout(() => {
      processExportJob(jobId, classRegisterSessionId)
    }, 20)
  }

  return c.json(
    {
      message: "Đã khởi tạo tiến trình xuất dữ liệu nền.",
      jobId,
      status: "PENDING" as const,
    },
    202
  )
})

// 3. Tuyến Polling: Lấy trạng thái tiến độ từ Redis
const getStatusRoute = createRoute({
  operationId: "getExportStatus",
  tags: ["Xuất dữ liệu"],
  path: "/status/{jobId}",
  method: "get",
  summary: "Thăm dò (Polling) tiến độ xuất dữ liệu đào tạo từ Redis",
  request: {
    params: z.object({
      jobId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Thông tin tiến trình hiện tại",
      content: {
        "application/json": {
          schema: z.object({
            jobId: z.string(),
            status: z.enum(["PENDING", "PROCESSING", "SUCCESS", "FAILED"]),
            progress: z.number(),
            message: z.string(),
            fileName: z.string().optional(),
            fileSize: z.number().optional(),
            recordCounts: z.record(z.string(), z.number()).optional(),
            error: z.string().optional(),
            downloadUrl: z.string().optional(),
          }),
        },
      },
    },
    404: {
      description: "Không tìm thấy tác vụ",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getStatusRoute, async (c) => {
  const { jobId } = c.req.valid("param")
  const state = await getExportJob(jobId)

  if (!state) {
    return c.json({ message: "Không tìm thấy tác vụ xuất dữ liệu" }, 404)
  }

  return c.json(
    {
      jobId: state.jobId,
      status: state.status,
      progress: state.progress,
      message: state.message,
      fileName: state.fileName,
      fileSize: state.fileSize,
      recordCounts: state.recordCounts,
      error: state.error,
      downloadUrl: state.status === "SUCCESS" ? `/api/export-training-data/download/${jobId}` : undefined,
    },
    200
  )
})

// 4. Tuyến tải file JSON thành phẩm
app.get("/download/:jobId", async (c) => {
  const jobId = c.req.param("jobId")
  const state = await getExportJob(jobId)

  if (!state || state.status !== "SUCCESS" || !state.filePath) {
    return c.text("File chưa hoàn tất hoặc không tồn tại", 404)
  }

  if (!existsSync(state.filePath)) {
    return c.text("Không tìm thấy file trên máy chủ", 404)
  }

  const fileName = state.fileName || `export-toan-bo-du-lieu-${jobId.slice(0, 8)}.json`
  c.header("Content-Disposition", `attachment; filename="${fileName}"`)
  c.header("Content-Type", "application/json; charset=utf-8")

  const file = Bun.file(state.filePath)
  return c.body(file.stream())
})

export default app
