import { z } from "@hono/zod-openapi"
import { HTTPException } from "hono/http-exception"

export type SyncCursor = { updatedAt: Date; id: string }

export const PAGE_ORDER = [{ updatedAt: "asc" }, { id: "asc" }] as const

const CursorPayloadSchema = z.object({ updatedAt: z.string().datetime(), id: z.string().min(1) })

export const encodeCursor = ({ updatedAt, id }: SyncCursor) =>
  Buffer.from(JSON.stringify({ updatedAt: updatedAt.toISOString(), id })).toString("base64url")

export const decodeCursor = (value: string): SyncCursor => {
  try {
    const raw = JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
    const { updatedAt, id } = CursorPayloadSchema.parse(raw)
    return { updatedAt: new Date(updatedAt), id }
  } catch {
    throw new HTTPException(400, { message: "cursor không hợp lệ" })
  }
}
