import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { jwtAuth } from "@workspace/auth/hono"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { exportTrainingData } from "../services/export-training-data"
import { enqueueExportJob, startExportConsumer } from "../services/export-kafka-queue"
import { getExportPayloadBinary } from "../services/export-payload-store"
import { SYNC_CONTENT_TYPE, SYNC_FILE_EXT } from "../services/data-sync-pack"
import dayjs from "dayjs"
import {
  countActiveExportJobs,
  EXPORT_MAX_CONCURRENT,
  getExportJob,
  setExportJob,
} from "../services/export-redis-store"
import { processExportJob } from "../services/export-worker"
import { prisma } from ".."
import { $Enums } from "@workspace/db"
import {
  createDataSyncHistoryPending,
  markDataSyncHistoryFailed,
  markDataSyncHistorySuccess,
} from "../services/data-sync-history"
import { buildSyncCategories } from "@workspace/constant"

// Khởi chạy Kafka Consumer lắng nghe job xuất dữ liệu (nếu Kafka khả dụng)
startExportConsumer(async (job) => {
  await processExportJob(job.jobId, job.classRegisterSessionId, job.syncHistoryId)
})

const app = new OpenAPIHono()

/** Bắt buộc đăng nhập cho mọi API xuất / tải gói đồng bộ */
app.use("*", jwtAuth("lms"))

type AuthUser = { id?: string; userName?: string }

function currentUserId(c: { get: (k: "user") => AuthUser | undefined }): string | undefined {
  return c.get("user")?.id
}

function assertJobOwner(
  state: { createdByUserId?: string },
  userId: string | undefined
): string | null {
  if (!state.createdByUserId) return null
  if (!userId) return "Unauthorized"
  if (state.createdByUserId !== userId) return "Bạn không có quyền truy cập tác vụ xuất này"
  return null
}

export function buildExportFileName(
  sessionName?: string | null,
  classRegisterSessionId?: string | null,
  jobId?: string
): string {
  const stamp = dayjs().format("YYYYMMDD-HHmm")
  const idSuffix = jobId ? `-${jobId.slice(0, 8)}` : ""
  if (classRegisterSessionId && sessionName) {
    const safeName =
      sessionName
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60) || "dot"
    return `export-dot-dang-ky-${safeName}-${stamp}${idSuffix}${SYNC_FILE_EXT}`
  }
  return `export-toan-bo-du-lieu-${stamp}${idSuffix}${SYNC_FILE_EXT}`
}

const exportTrainingDataRequestSchema = z
  .object({
    classRegisterSessionId: z
      .string()
      .optional()
      .openapi(
        fieldDesc("Tùy chọn: xuất theo đợt. Bỏ trống = xuất toàn bộ (có giới hạn kích thước Redis).")
      ),
  })
  .openapi("ExportTrainingDataRequest")

const exportTrainingDataResponseSchema = z
  .object({
    version: z.string(),
    exportedAt: z.string(),
    signature: z.string().optional(),
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
  const createdByUserId = currentUserId(c)
  let classRegisterSessionId: string | undefined
  try {
    const body = c.req.valid("json") as { classRegisterSessionId?: string }
    classRegisterSessionId = body?.classRegisterSessionId
  } catch {
    // Body optional
  }

  let sessionName = "Toàn bộ dữ liệu"
  if (classRegisterSessionId) {
    try {
      const session = await prisma.classRegisterSession.findFirst({
        where: { id: classRegisterSessionId, deletedAt: null },
        select: { name: true },
      })
      if (session?.name) sessionName = session.name
    } catch {}
  }

  const fileName = buildExportFileName(sessionName, classRegisterSessionId)

  let syncHistoryId: string | undefined
  try {
    const history = await createDataSyncHistoryPending({
      type: $Enums.DataSyncType.EXPORT,
      sessionName,
      classRegisterSessionId,
      fileName,
      performedById: createdByUserId,
    })
    syncHistoryId = history.id
  } catch {}

  try {
    const result = await exportTrainingData({ classRegisterSessionId })
    if (syncHistoryId) {
      const totalCount = Object.values(result.counts || {}).reduce(
        (sum, n) => sum + (typeof n === "number" ? n : 0),
        0
      )
      await markDataSyncHistorySuccess(syncHistoryId, {
        classRegisterSessionId,
        fileName,
        recordCounts: {
          total: totalCount,
          success: totalCount,
          failed: 0,
          counts: result.counts,
          categories: buildSyncCategories(result.counts || {}),
        },
        description: `Đã xuất thành công ${totalCount} bản ghi dữ liệu.`,
      })
    }
    return c.json(result, 200)
  } catch (error) {
    const message = "Không xuất được dữ liệu"
    if (syncHistoryId) {
      await markDataSyncHistoryFailed(syncHistoryId, message)
    }
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
  description:
    "Tạo tác vụ nền, đẩy vào Kafka Queue / Worker, lưu trạng thái trong Redis và trả về mã tiến trình ngay lập tức.",
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
    429: {
      description: "Quá nhiều job xuất đang chạy",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    ...standardErrorResponses(),
  },
})

app.openapi(exportAsyncRoute, async (c) => {
  let classRegisterSessionId: string | undefined
  try {
    const body = c.req.valid("json") as { classRegisterSessionId?: string }
    classRegisterSessionId = body?.classRegisterSessionId
  } catch {
    // optional body
  }

  const active = await countActiveExportJobs()
  if (active >= EXPORT_MAX_CONCURRENT) {
    return c.json(
      {
        message: `Đang có ${active} tiến trình xuất (tối đa ${EXPORT_MAX_CONCURRENT}). Vui lòng đợi hoàn tất rồi thử lại.`,
      },
      429
    )
  }

  const jobId = crypto.randomUUID()
  const now = new Date().toISOString()
  const createdByUserId = currentUserId(c)

  let sessionName = "Toàn bộ dữ liệu"
  if (classRegisterSessionId) {
    try {
      const session = await prisma.classRegisterSession.findFirst({
        where: { id: classRegisterSessionId, deletedAt: null },
        select: { name: true },
      })
      if (session?.name) sessionName = session.name
    } catch {}
  }

  const fileName = buildExportFileName(sessionName, classRegisterSessionId, jobId)

  let syncHistoryId: string | undefined
  try {
    const history = await createDataSyncHistoryPending({
      type: $Enums.DataSyncType.EXPORT,
      sessionName,
      classRegisterSessionId,
      fileName,
      performedById: createdByUserId,
    })
    syncHistoryId = history.id
  } catch (err) {
    console.error("[export-training-data] Lỗi tạo DataSyncHistory PENDING:", err)
  }

  await setExportJob({
    jobId,
    status: "PENDING",
    progress: 0,
    message: "Đã xếp hàng đợi xuất dữ liệu",
    classRegisterSessionId,
    createdByUserId,
    syncHistoryId,
    fileName,
    createdAt: now,
    updatedAt: now,
  })

  const enqueued = await enqueueExportJob({
    jobId,
    classRegisterSessionId,
    syncHistoryId,
    timestamp: now,
  })

  if (!enqueued) {
    setTimeout(() => {
      processExportJob(jobId, classRegisterSessionId, syncHistoryId)
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
    403: {
      description: "Không đúng chủ sở hữu job",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
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

  const ownerErr = assertJobOwner(state, currentUserId(c))
  if (ownerErr) {
    return c.json({ message: ownerErr }, 403)
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
      downloadUrl:
        state.status === "SUCCESS" ? `/api/export-training-data/download/${jobId}` : undefined,
    },
    200
  )
})

// 4. Tải JSON thành phẩm từ Redis — bắt buộc auth + đúng chủ job
app.get("/download/:jobId", async (c) => {
  const jobId = c.req.param("jobId")
  const state = await getExportJob(jobId)

  if (!state || state.status !== "SUCCESS") {
    return c.text("File chưa hoàn tất, đã hết hạn, hoặc không còn trên Redis", 404)
  }

  const ownerErr = assertJobOwner(state, currentUserId(c))
  if (ownerErr) {
    return c.text(ownerErr, 403)
  }

  const payload = await getExportPayloadBinary(jobId)
  if (!payload) {
    return c.text("File chưa hoàn tất, đã hết hạn, hoặc không còn trên Redis", 404)
  }

  const fileName =
    payload.fileName || state.fileName || `export-toan-bo-du-lieu-${jobId.slice(0, 8)}.dat`
  const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_")
  const encodedName = encodeURIComponent(fileName)
  c.header(
    "Content-Disposition",
    `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`
  )
  c.header("Content-Type", payload.contentType || SYNC_CONTENT_TYPE)
  c.header("Content-Length", String(payload.fileSize))

  return c.body(new Uint8Array(payload.bytes))
})

export default app
