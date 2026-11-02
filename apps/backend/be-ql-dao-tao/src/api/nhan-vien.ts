import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { timingSafeEqual } from "node:crypto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const listBody = z
  .object({
    skip: z.number().optional(),
    take: z.number().optional(),
    columns: z.string().optional(),
    sort: z.string().optional(),
    filter: z.string().optional(),
    customParam: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()

const nhanVienItem = z.object({
  Id: z.string(),
  sMa: z.string(),
  sTen: z.string(),
})

const listResponse = z.object({
  Empty: z.boolean(),
  Data: z.array(nhanVienItem),
  Total: z.number(),
  Summary: z.object({
    _Total: z.object({
      sum: z.number(),
    }),
  }),
})

const credentialsError = z.object({
  message: z.string(),
})

const TEST_ROWS = [
  {
    Id: "2515368458",
    sMa: "25150001",
    sTen: "Trần Lê Đức Anh",
  },
]

function credentialsMatch(actual: string, expected: string) {
  if (!actual || !expected || actual.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}

function isAuthorized(clientId: string, clientSecret: string) {
  const expectedId = process.env.NHAN_VIEN_CLIENT_ID ?? ""
  const expectedSecret = process.env.NHAN_VIEN_CLIENT_SECRET ?? ""
  return credentialsMatch(clientId, expectedId) && credentialsMatch(clientSecret, expectedSecret)
}

const AUTH_PATHS = ["/NhanViens/list", "/api/NhanViens/list"] as const

for (const path of AUTH_PATHS) {
  app.use(path, async (c, next) => {
    const clientId = c.req.header("x-clientid") ?? ""
    const clientSecret = c.req.header("x-clientsecret") ?? ""
    if (!isAuthorized(clientId, clientSecret)) {
      return c.json({ message: "Invalid client credentials" }, 401)
    }
    await next()
  })
}

const listNhanVien = createRoute({
  operationId: "listNhanVien",
  tags: ["NhanVien"],
  path: "/NhanViens/list",
  method: "post",
  summary: "Danh sách nhân viên (dữ liệu test)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: listBody,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: listResponse,
        },
      },
    },
    401: {
      description: "Sai hoặc thiếu x-clientid / x-clientsecret",
      content: {
        "application/json": {
          schema: credentialsError,
        },
      },
    },
  },
})

const listHandler = async (c: { json: typeof app.json }) => {
  return c.json(
    {
      Empty: TEST_ROWS.length === 0,
      Data: TEST_ROWS,
      Total: TEST_ROWS.length,
      Summary: { _Total: { sum: TEST_ROWS.length } },
    },
    200
  )
}

app.openapi(listNhanVien, listHandler)
app.post("/api/NhanViens/list", listHandler)

export default app
