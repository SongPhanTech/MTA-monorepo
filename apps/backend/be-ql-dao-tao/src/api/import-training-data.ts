import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { jwtAuth } from "@workspace/auth/hono"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import {
  decodeRegistrationResultsFile,
  hashImportFileBytes,
  IMPORT_REGISTRATION_MAX_MB,
  importRegistrationResultsFromJson,
  previewRegistrationResultsImport,
} from "../services/import-registration-results"
import { prisma } from ".."
import { $Enums } from "@workspace/db"
import {
  createDataSyncHistoryFailedDirect,
  createDataSyncHistoryPending,
  markDataSyncHistoryFailed,
  markDataSyncHistorySuccess,
} from "../services/data-sync-history"

const app = new OpenAPIHono({ strict: false })

/** Hỗ trợ xác thực người dùng để lưu vết lịch sử */
app.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization")
  if (authHeader) {
    return jwtAuth("lms")(c, next)
  }
  return next()
})

const fileFieldSchema = z.instanceof(File).openapi({
  type: "string",
  format: "binary",
  description: "Gói .dat (Gzip + AES-256-GCM) kết quả đăng ký từ Portal.",
})

const previewRequestSchema = z
  .object({
    classRegisterSessionId: z.string().openapi(fieldDesc("ID đợt đăng ký học online nội bộ.")),
    file: fileFieldSchema,
  })
  .openapi("ImportRegistrationPreviewRequest")

const previewResponseSchema = z
  .object({
    fileHash: z.string(),
    sessionName: z.string(),
    fileSessionId: z.string().nullable(),
    stats: z.object({
      createLogs: z.number(),
      updateLogs: z.number(),
      createScores: z.number(),
      updateScores: z.number(),
      skipScoresWithGrade: z.number(),
      removeLogs: z.number(),
      removeScores: z.number(),
      failed: z.number(),
    }),
    warnings: z.array(z.string()),
  })
  .openapi("ImportRegistrationPreviewResponse")

const confirmRequestSchema = z
  .object({
    classRegisterSessionId: z.string().openapi(fieldDesc("ID đợt đăng ký học online nội bộ.")),
    fileHash: z
      .string()
      .openapi(fieldDesc("SHA-256 hex của file từ bước preview — bắt buộc khớp.")),
    file: fileFieldSchema,
  })
  .openapi("ImportRegistrationConfirmRequest")

const confirmResponseSchema = z
  .object({
    message: z.string(),
    imported: z.number().optional(),
    failed: z.number().optional(),
    details: z
      .object({
        classRegisterLogs: z.number(),
        studentSubjectScore: z.number(),
        removedLogs: z.number(),
        removedScores: z.number(),
        createdLogs: z.number().optional(),
        updatedLogs: z.number().optional(),
        createdScores: z.number().optional(),
        updatedScores: z.number().optional(),
        skippedScoresWithGrade: z.number().optional(),
      })
      .optional(),
    warnings: z.array(z.string()).optional(),
  })
  .openapi("ImportRegistrationConfirmResponse")

async function readUploadBytes(file: File): Promise<Buffer> {
  if (!file || file.size === 0) {
    throw new Error("Vui lòng chọn file .dat")
  }
  if (file.size > IMPORT_REGISTRATION_MAX_MB * 1024 * 1024) {
    throw new Error(`File vượt giới hạn ${IMPORT_REGISTRATION_MAX_MB} MB`)
  }
  return Buffer.from(await file.arrayBuffer())
}

const previewRoute = createRoute({
  operationId: "previewImportRegistrationResults",
  tags: ["Nhập dữ liệu"],
  path: "/preview",
  method: "post",
  summary: "Xem trước nhập kết quả đăng ký (dry-run)",
  description: `Giải mã gói .dat và trả thống kê sẽ thêm/cập nhật/gỡ (soft-delete) mà chưa ghi DB.
Dùng fileHash trả về khi gọi /confirm.`,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: previewRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Thống kê preview",
      content: {
        "application/json": {
          schema: previewResponseSchema,
        },
      },
    },
  },
})

app.openapi(previewRoute, async (c) => {
  const { classRegisterSessionId, file } = c.req.valid("form")
  try {
    const bytes = await readUploadBytes(file)
    const fileHash = hashImportFileBytes(bytes)
    const parsed = decodeRegistrationResultsFile(bytes)
    const preview = await previewRegistrationResultsImport(
      classRegisterSessionId,
      parsed,
      fileHash
    )
    return c.json(preview, 200)
  } catch {
    return c.json({ message: "Không nhập được dữ liệu" }, 400)
  }
})

const confirmRoute = createRoute({
  operationId: "confirmImportRegistrationResults",
  tags: ["Nhập dữ liệu"],
  path: "/confirm",
  method: "post",
  summary: "Xác nhận nhập kết quả đăng ký sau preview",
  description: `Upload lại cùng file .dat + fileHash từ /preview. Soft-delete các đăng ký không còn trong file.`,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: confirmRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Nhập thành công",
      content: {
        "application/json": {
          schema: confirmResponseSchema,
        },
      },
    },
  },
})

app.openapi(confirmRoute, async (c) => {
  const { classRegisterSessionId, fileHash, file } = c.req.valid("form")
  const user = c.get("user") as { id?: string } | undefined
  let syncHistoryId: string | undefined
  let sessionName = "Đợt đăng ký học"

  try {
    const session = await prisma.classRegisterSession.findFirst({
      where: { id: classRegisterSessionId, deletedAt: null },
      select: { name: true },
    })
    if (session?.name) {
      sessionName = session.name
    }

    try {
      const history = await createDataSyncHistoryPending({
        type: $Enums.DataSyncType.IMPORT,
        sessionName,
        classRegisterSessionId,
        fileName: file?.name,
        performedById: user?.id,
        description: "Đang kiểm tra và nhập kết quả đăng ký...",
      })
      syncHistoryId = history.id
    } catch (createErr) {
      console.error("[import-training-data] Lỗi tạo DataSyncHistory PENDING:", createErr)
    }

    const bytes = await readUploadBytes(file)
    const actualHash = hashImportFileBytes(bytes)
    if (!fileHash || fileHash !== actualHash) {
      const err = "fileHash không khớp — hãy chạy lại preview với đúng file trước khi xác nhận import"
      if (syncHistoryId) {
        await markDataSyncHistoryFailed(syncHistoryId, err)
      }
      return c.json(
        {
          message: err,
        },
        400
      )
    }

    const parsed = decodeRegistrationResultsFile(bytes)

    if (syncHistoryId && (parsed.version || parsed.exportedAt)) {
      await prisma.dataSyncHistory.update({
        where: { id: syncHistoryId },
        data: {
          fileVersion: parsed.version ?? undefined,
          sourceExportedAt: parsed.exportedAt ? new Date(parsed.exportedAt) : undefined,
        },
      }).catch(() => undefined)
    }

    const result = await importRegistrationResultsFromJson(classRegisterSessionId, parsed)

    const total =
      (result.details?.classRegisterLogs ?? 0) +
      (result.details?.studentSubjectScore ?? 0) +
      (result.failed ?? 0)

    if (syncHistoryId) {
      await markDataSyncHistorySuccess(syncHistoryId, {
        classRegisterSessionId,
        fileName: file?.name,
        recordCounts: {
          total,
          success: result.imported,
          failed: result.failed,
          details: result.details,
          warningsCount: result.warnings?.length,
        },
        description: result.message,
      }).catch((err) => console.error("[import-training-data] Lỗi mark SUCCESS:", err))
    }

    return c.json(
      {
        message: result.message,
        imported: result.imported,
        failed: result.failed,
        details: result.details,
        warnings: result.warnings.slice(0, 50),
      },
      200
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Không nhập được dữ liệu"
    if (syncHistoryId) {
      await markDataSyncHistoryFailed(syncHistoryId, errorMsg).catch(() => undefined)
    } else {
      await createDataSyncHistoryFailedDirect({
        type: $Enums.DataSyncType.IMPORT,
        sessionName,
        classRegisterSessionId,
        fileName: file?.name,
        errorMessage: errorMsg,
        performedById: user?.id,
      }).catch(() => undefined)
    }
    return c.json({ message: errorMsg }, 400)
  }
})

/** Giữ route cũ: bắt buộc có bước confirm qua /confirm. Trả hướng dẫn. */
const legacyImportRoute = createRoute({
  operationId: "importTrainingData",
  tags: ["Nhập dữ liệu"],
  path: "/import",
  method: "post",
  summary: "[Deprecated] Dùng /preview rồi /confirm",
  description: "Endpoint cũ đã tắt ghi trực tiếp. Gọi /preview → /confirm.",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: previewRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    400: {
      description: "Hướng dẫn dùng preview/confirm",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(legacyImportRoute, async (c) => {
  return c.json(
    {
      message:
        "API /import đã yêu cầu xác nhận. Hãy gọi POST /api/import-training-data/preview rồi /confirm với fileHash.",
    },
    400
  )
})

export default app
