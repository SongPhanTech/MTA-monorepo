import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { jwtAuth } from "@workspace/auth/hono"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { prisma } from ".."
import { $Enums, type Prisma } from "@workspace/db"
import dayjs from "dayjs"

const app = new OpenAPIHono({ strict: false })

app.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization")
  if (authHeader) {
    return jwtAuth("lms")(c, next)
  }
  return next()
})

const querySchema = z.object({
  classRegisterSessionId: z.string().optional(),
  type: z.enum(["IMPORT", "EXPORT"]).optional(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

const listHistoryRoute = createRoute({
  operationId: "listDataSyncHistory",
  tags: ["Lịch sử đồng bộ"],
  path: "/",
  method: "get",
  summary: "Tra cứu danh sách lịch sử đồng bộ dữ liệu Import/Export",
  request: {
    query: querySchema,
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Danh sách lịch sử đồng bộ",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(z.any()),
            total: z.number(),
            page: z.number(),
            pageSize: z.number(),
            summary: z.object({
              total: z.number(),
              importCount: z.number(),
              exportCount: z.number(),
              successCount: z.number(),
              failedCount: z.number(),
              lastSyncAt: z.string().nullable(),
            }),
          }),
        },
      },
    },
  },
})

app.openapi(listHistoryRoute, async (c) => {
  const query = c.req.valid("query")
  const { classRegisterSessionId, type, status, startDate, endDate, search, page, pageSize } = query

  const where: Prisma.DataSyncHistoryWhereInput = {
    deletedAt: null,
    ...(classRegisterSessionId ? { classRegisterSessionId } : {}),
    ...(type ? { type: type as $Enums.DataSyncType } : {}),
    ...(status ? { status: status as $Enums.DataSyncStatus } : {}),
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      const parsedStart = dayjs(startDate, ["DD/MM/YYYY", "YYYY-MM-DD"]).startOf("day")
      if (parsedStart.isValid()) {
        where.createdAt.gte = parsedStart.toDate()
      }
    }
    if (endDate) {
      const parsedEnd = dayjs(endDate, ["DD/MM/YYYY", "YYYY-MM-DD"]).endOf("day")
      if (parsedEnd.isValid()) {
        where.createdAt.lte = parsedEnd.toDate()
      }
    }
  }

  if (search && search.trim()) {
    const keyword = search.trim()
    where.OR = [
      { fileName: { contains: keyword, mode: "insensitive" } },
      { sessionName: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { errorMessage: { contains: keyword, mode: "insensitive" } },
      {
        performedBy: {
          OR: [
            { fullname: { contains: keyword, mode: "insensitive" } },
            { code: { contains: keyword, mode: "insensitive" } },
          ],
        },
      },
    ]
  }

  const [items, total, summaryAggregate, lastItem] = await Promise.all([
    prisma.dataSyncHistory.findMany({
      where,
      include: {
        performedBy: {
          select: {
            id: true,
            fullname: true,
            code: true,
          },
        },
        classRegisterSession: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dataSyncHistory.count({ where }),
    prisma.dataSyncHistory.groupBy({
      by: ["type", "status"],
      where: classRegisterSessionId
        ? { classRegisterSessionId, deletedAt: null }
        : { deletedAt: null },
      _count: true,
    }),
    prisma.dataSyncHistory.findFirst({
      where: classRegisterSessionId
        ? { classRegisterSessionId, deletedAt: null }
        : { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ])

  let totalAll = 0
  let importCount = 0
  let exportCount = 0
  let successCount = 0
  let failedCount = 0

  for (const grp of summaryAggregate) {
    const count = grp._count
    totalAll += count
    if (grp.type === $Enums.DataSyncType.IMPORT) importCount += count
    if (grp.type === $Enums.DataSyncType.EXPORT) exportCount += count
    if (grp.status === $Enums.DataSyncStatus.SUCCESS) successCount += count
    if (grp.status === $Enums.DataSyncStatus.FAILED) failedCount += count
  }

  return c.json(
    {
      items,
      total,
      page,
      pageSize,
      summary: {
        total: totalAll,
        importCount,
        exportCount,
        successCount,
        failedCount,
        lastSyncAt: lastItem?.createdAt ? lastItem.createdAt.toISOString() : null,
      },
    },
    200
  )
})

const getHistoryDetailRoute = createRoute({
  operationId: "getDataSyncHistoryDetail",
  tags: ["Lịch sử đồng bộ"],
  path: "/:id",
  method: "get",
  summary: "Lấy chi tiết một bản ghi lịch sử đồng bộ",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Chi tiết bản ghi lịch sử đồng bộ",
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
    },
  },
})

app.openapi(getHistoryDetailRoute, async (c) => {
  const { id } = c.req.valid("param")
  const record = await prisma.dataSyncHistory.findUnique({
    where: { id },
    include: {
      performedBy: {
        select: {
          id: true,
          fullname: true,
          code: true,
        },
      },
      classRegisterSession: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!record || record.deletedAt) {
    return c.json({ message: "Không tìm thấy bản ghi lịch sử đồng bộ" }, 404)
  }

  return c.json(record, 200)
})

export default app

