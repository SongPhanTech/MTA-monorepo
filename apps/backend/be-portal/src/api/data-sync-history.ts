import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import { models } from "@workspace/db/zod"
import { prisma } from "../prisma"
import {
  createDataSyncHistoryPending,
  listDataSyncHistory,
  markDataSyncHistoryFailed,
  markDataSyncHistorySuccess,
} from "../services/data-sync-history"

const app = new OpenAPIHono({ strict: false })

/** Danh sách đợt cho tab Xuất (không lọc theo SV / ngày mở như get-class-register-session) */
const listSyncSessions = createRoute({
  operationId: "list-data-sync-sessions",
  path: "/list-sessions",
  tags: ["DataSync"],
  summary: "Liệt kê đợt đăng ký để xuất kết quả về nội bộ",
  description:
    "Trả mọi đợt chưa xóa (kể cả đã kết thúc). Khác get-class-register-session (chỉ đợt đang mở + khớp khóa của SV).",
  method: "get",
  responses: {
    200: {
      description: "Danh sách đợt",
      content: {
        "application/json": {
          schema: z.array(
            models.ClassRegisterSessionScalarSchema.extend({
              semester: models.SemesterScalarSchema.extend({
                schoolYear: models.SchoolYearScalarSchema.nullable().optional(),
              }).nullable().optional(),
            })
          ),
        },
      },
    },
  },
})

app.openapi(listSyncSessions, async (c) => {
  const sessions = await prisma.classRegisterSession.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      semester: { include: { schoolYear: true } },
    },
  })
  return c.json(sessions, 200)
})

const getDataSyncHistory = createRoute({
  operationId: "get-data-sync-history",
  path: "/get-data-sync-history",
  tags: ["DataSync"],
  summary: "Lấy lịch sử đồng bộ dữ liệu",
  method: "get",
  request: {
    query: z.object({
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .openapi({ description: "Số bản ghi" }),
    }),
  },
  responses: {
    200: {
      description: "Danh sách lịch sử đồng bộ",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              type: z.nativeEnum($Enums.DataSyncType),
              status: z.nativeEnum($Enums.DataSyncStatus),
              sessionName: z.string(),
              fileName: z.string().nullable(),
              fileVersion: z.string().nullable(),
              description: z.string().nullable().optional(),
              errorMessage: z.string().nullable(),
              createdAt: z.coerce.date(),
              updatedAt: z.coerce.date().optional(),
              classRegisterSessionId: z.string().nullable(),
            })
          ),
        },
      },
    },
  },
})

app.openapi(getDataSyncHistory, async (c) => {
  const { limit } = c.req.valid("query")
  const items = await listDataSyncHistory(limit ?? 50)
  return c.json(items, 200)
})

const startDataSync = createRoute({
  operationId: "start-data-sync",
  path: "/start-data-sync",
  tags: ["DataSync"],
  summary: "Ghi nhận bắt đầu đồng bộ dữ liệu",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            type: z.nativeEnum($Enums.DataSyncType),
            sessionName: z.string(),
            classRegisterSessionId: z.string().optional(),
            fileName: z.string().optional(),
            fileVersion: z.string().optional(),
            sourceExportedAt: z.string().datetime().optional(),
            recordCounts: z.record(z.string(), z.number()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Đã tạo bản ghi lịch sử",
      content: {
        "application/json": {
          schema: models.DataSyncHistoryScalarSchema.pick({ id: true, status: true }),
        },
      },
    },
  },
})

app.openapi(startDataSync, async (c) => {
  const session = c.get("user")
  const body = c.req.valid("json")

  const record = await createDataSyncHistoryPending({
    ...body,
    sourceExportedAt: body.sourceExportedAt ? new Date(body.sourceExportedAt) : undefined,
    performedById: session.id,
  })

  return c.json({ id: record.id, status: record.status }, 200)
})

const finishDataSync = createRoute({
  operationId: "finish-data-sync",
  path: "/finish-data-sync",
  tags: ["DataSync"],
  summary: "Cập nhật kết quả đồng bộ dữ liệu",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            status: z.enum(["SUCCESS", "FAILED"]),
            errorMessage: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Đã cập nhật",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(finishDataSync, async (c) => {
  const { id, status, errorMessage } = c.req.valid("json")

  if (status === "SUCCESS") {
    await markDataSyncHistorySuccess(id)
  } else {
    await markDataSyncHistoryFailed(id, errorMessage ?? "Đồng bộ thất bại")
  }

  return c.json({ message: "success" }, 200)
})

export default app
