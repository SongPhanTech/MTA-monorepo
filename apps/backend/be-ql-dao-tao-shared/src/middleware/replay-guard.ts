import type { MiddlewareHandler } from "hono"
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import { setNonceOnce } from "../services/redis"

const AUTH_DISABLED = process.env.SHARED_API_AUTH_DISABLED === "true"
const WINDOW_MS = Number(process.env.SHARED_API_REPLAY_WINDOW_MS || 5 * 60 * 1000)
const TTL_SEC = Math.max(60, Math.ceil(WINDOW_MS / 1000))

export const replayGuard: MiddlewareHandler = createMiddleware(async (c, next) => {
  if (AUTH_DISABLED) {
    await next()
    return
  }

  const tsRaw = c.req.header("x-timestamp") || c.req.header("X-Timestamp")
  const nonce = c.req.header("x-nonce") || c.req.header("X-Nonce")

  if (!tsRaw || !nonce) {
    throw new HTTPException(400, {
      message: "Thiếu header X-Timestamp hoặc X-Nonce",
    })
  }

  const ts = Number(tsRaw)
  if (!Number.isFinite(ts)) {
    throw new HTTPException(400, { message: "X-Timestamp không hợp lệ" })
  }

  // Hỗ trợ cả giây và mili-giây
  const tsMs = ts < 1e12 ? ts * 1000 : ts
  const skew = Math.abs(Date.now() - tsMs)
  if (skew > WINDOW_MS) {
    throw new HTTPException(401, {
      message: "X-Timestamp ngoài cửa sổ cho phép (±5 phút)",
    })
  }

  if (nonce.length < 8 || nonce.length > 128) {
    throw new HTTPException(400, { message: "X-Nonce không hợp lệ" })
  }

  const setOk = await setNonceOnce(nonce, TTL_SEC)
  if (setOk === null) {
    throw new HTTPException(503, {
      message: "Redis chưa sẵn sàng — không thể chống replay",
    })
  }
  if (!setOk) {
    throw new HTTPException(409, { message: "Nonce đã được sử dụng (replay)" })
  }

  await next()
})
