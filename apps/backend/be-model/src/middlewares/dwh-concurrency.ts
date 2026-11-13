import { createMiddleware } from "hono/factory"

type ConcurrencyGateOptions = {
  name: string
  maxConcurrent: number
  maxQueued: number
  maxWaitMs: number
  retryAfterSeconds?: number
}

/** Giới hạn số request chạy cùng lúc, phần dư xếp hàng; hết chỗ hoặc chờ quá lâu thì trả 503. */
export const createConcurrencyGate = ({
  name,
  maxConcurrent,
  maxQueued,
  maxWaitMs,
  retryAfterSeconds = 5,
}: ConcurrencyGateOptions) => {
  let active = 0
  const waiters: (() => void)[] = []

  const acquire = () =>
    new Promise<boolean>((resolve) => {
      if (active < maxConcurrent) {
        active += 1
        resolve(true)
        return
      }
      if (waiters.length >= maxQueued) {
        resolve(false)
        return
      }
      const grant = () => {
        clearTimeout(timer)
        resolve(true)
      }
      const timer = setTimeout(() => {
        waiters.splice(waiters.indexOf(grant), 1)
        resolve(false)
      }, maxWaitMs)
      waiters.push(grant)
    })

  const release = () => {
    const next = waiters.shift()
    if (next) next()
    else active -= 1
  }

  return createMiddleware(async (c, next) => {
    if (!(await acquire())) {
      console.warn(
        `[${name}] Quá tải, từ chối ${c.req.method} ${c.req.path}`,
        JSON.stringify({ active, queued: waiters.length })
      )
      c.header("Retry-After", String(retryAfterSeconds))
      return c.json({ message: "Hệ thống đang bận, thử lại sau" }, 503)
    }
    try {
      await next()
    } finally {
      release()
    }
  })
}
