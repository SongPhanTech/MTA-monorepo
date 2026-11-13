import { Prisma } from "@workspace/db"
import { HTTPException } from "hono/http-exception"
import { prisma } from ".."
import { dwhConfig } from "./config"
import { decodeCursor, encodeCursor, PAGE_ORDER, type SyncCursor } from "./cursor"
import { DWH_EVENT_NAMES, type DwhEventName } from "./event-names"

export type DwhPullParams = { id?: string; limit?: number; cursor?: string }

type SyncRow = Record<string, unknown> & { id: string; updatedAt: Date }

/** Mọi bảng ql-dao-tao đều có id/updatedAt/deletedAt nên chỉ cần phần chung của Prisma delegate. */
type SyncDelegate = {
  count: (args: { where: object }) => Promise<number>
  findMany: (args: { where: object; orderBy: typeof PAGE_ORDER; take: number }) => Promise<SyncRow[]>
}

const EVENT_NAME_BY_LOWER = new Map<string, DwhEventName>(
  DWH_EVENT_NAMES.map((name) => [name.toLowerCase(), name])
)

/** Nhận tên bảng không phân biệt hoa thường, trả tên chuẩn hoặc undefined. */
export const parseDwhEventName = (value: unknown): DwhEventName | undefined =>
  typeof value === "string" ? EVENT_NAME_BY_LOWER.get(value.trim().toLowerCase()) : undefined

const getDelegate = (eventName: DwhEventName): SyncDelegate => {
  const delegateName = eventName.charAt(0).toLowerCase() + eventName.slice(1)
  const delegate = (prisma as unknown as Record<string, SyncDelegate | undefined>)[delegateName]
  if (!delegate?.findMany) {
    throw new HTTPException(500, { message: `Không tìm thấy model ${eventName}` })
  }
  return delegate
}

const serializeValue = (value: unknown): unknown => {
  if (value instanceof Date) return value.toISOString()
  if (Prisma.Decimal.isDecimal(value)) return (value as Prisma.Decimal).toNumber()
  if (typeof value === "bigint") return Number(value)
  return value ?? null
}

const serializeRecord = (row: SyncRow) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [key, serializeValue(value)]))

const buildWhere = (windowEnd: Date, cursor: SyncCursor | null) => ({
  deletedAt: null,
  updatedAt: { lte: windowEnd },
  ...(cursor && {
    OR: [
      { updatedAt: { gt: cursor.updatedAt } },
      { updatedAt: cursor.updatedAt, id: { gt: cursor.id } },
    ],
  }),
})

const loadRecord = async (delegate: SyncDelegate, id: string) => {
  const rows = await delegate.findMany({ where: { id, deletedAt: null }, orderBy: PAGE_ORDER, take: 1 })
  if (!rows.length) throw new HTTPException(404, { message: "Không tìm thấy bản ghi" })
  return { totalRecords: 1, hasMore: false, nextCursor: null, data: rows.map(serializeRecord) }
}

const loadPage = async (delegate: SyncDelegate, limit: number, rawCursor?: string) => {
  const cursor = rawCursor ? decodeCursor(rawCursor) : null
  const where = buildWhere(new Date(Date.now() - dwhConfig.lagSeconds * 1000), cursor)
  const [totalRecords, rows] = await Promise.all([
    delegate.count({ where }),
    delegate.findMany({ where, orderBy: PAGE_ORDER, take: limit }),
  ])
  const last = rows.at(-1)
  const nextCursor: SyncCursor | null = last ? { updatedAt: last.updatedAt, id: last.id } : cursor
  return {
    totalRecords,
    hasMore: totalRecords > rows.length,
    nextCursor: nextCursor && encodeCursor(nextCursor),
    data: rows.map(serializeRecord),
  }
}

export const loadEventData = async (
  eventName: DwhEventName,
  { id, limit, cursor }: DwhPullParams & { limit: number }
) => {
  const syncedAt = new Date().toISOString()
  const delegate = getDelegate(eventName)
  const result = id ? await loadRecord(delegate, id) : await loadPage(delegate, limit, cursor)
  return {
    entityName: eventName,
    action: "upsert" as const,
    source: dwhConfig.sourceAppCode,
    syncedAt,
    ...result,
  }
}
