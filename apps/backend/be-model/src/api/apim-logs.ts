import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { PrismaClient } from "@workspace/db"
import {
  ApiKeyCreateSchema,
  ApiKeyListQuerySchema,
  ApiKeyRenewSchema,
  ApiKeyRevokeSchema,
  ApiKeySchema,
  ApimAccessRequestSchema,
  ApimConfigLogsQuerySchema,
  ApimConfigLogsUpdateSchema,
  ApimCountRequestSchema,
  ApimDeployLogCreateSchema,
  ApimDeployLogSchema,
  ApimDeployLogsQuerySchema,
  ApimErrorRateSchema,
  ApimLatencySchema,
  ApimServiceTimeQuerySchema,
  ApimThroughputQuerySchema,
  ApimThroughputSchema,
  OkBooleanResponseSchema,
} from "../dto/apim-logs-openapi.dto"
import { jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"

const prismaApimLogs = new PrismaClient({
  datasourceUrl: process.env.APIM_LOGS_DATABASE_URL,
})

const app = new OpenAPIHono({ strict: false })

// ---- Auto-create api_keys table ----
async function ensureApiKeysTable() {
  await prismaApimLogs.$executeRaw`
    CREATE TABLE IF NOT EXISTS api_keys (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      api_id      TEXT        NOT NULL,
      key_value   TEXT        NOT NULL UNIQUE,
      name        TEXT        NOT NULL,
      description TEXT,
      status      TEXT        NOT NULL DEFAULT 'active',
      expires_at  TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by  TEXT        NOT NULL DEFAULT '',
      revoked_at  TIMESTAMPTZ,
      revoked_by  TEXT
    )
  `
}
ensureApiKeysTable().catch((e) => console.error("[ERROR][ensureApiKeysTable]", e))

app.openapi(
  createRoute({
    operationId: "get-config-logs",
    tags: ["Giám sát APIM"],
    summary: "Kiểm tra cấu hình log FULL cho API",
    path: "/config-logs",
    method: "get",
    request: {
      query: ApimConfigLogsQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(
        z.boolean().openapi({ description: "true = tất cả resource đều log FULL; false khi lỗi." }),
        "Trạng thái log FULL"
      ),
    },
  }),
  async (c) => {
    const { apiId, baseUrl } = c.req.valid("query")
    try {
      const res = await fetch(
        `${baseUrl}/api/am/devops/v0/tenant-logs/carbon.super/apis/${apiId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Basic YWRtaW46YWRtaW4=",
          },
        }
      )
      const data = await res.json()
      const apis = data?.apis || []
      return c.json(
        apis.every((e: any) => e?.logLevel?.toUpperCase() === "FULL"),
        200
      )
    } catch (error) {
      console.log("[ERROR][config-logs]", {
        message: error instanceof Error ? error.message : String(error),
      })
      return c.json(false, 200)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "update-config-logs",
    tags: ["Giám sát APIM"],
    summary: "Bật/tắt log FULL cho tất cả resource của API",
    path: "/config-logs",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ApimConfigLogsUpdateSchema,
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(z.any()), "Kết quả cập nhật từng resource"),
    },
  }),
  async (c) => {
    const { apiId, baseUrl, enabled } = c.req.valid("json")
    const res = await fetch(`${baseUrl}/api/am/devops/v0/tenant-logs/carbon.super/apis/${apiId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic YWRtaW46YWRtaW4=",
      },
    })
    const data = await res.json()
    const apis = data?.apis || []
    const results = await Promise.all(
      apis.map((api: any) =>
        fetch(`${baseUrl}/api/am/devops/v0/tenant-logs/carbon.super/apis/${apiId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Basic YWRtaW46YWRtaW4=",
          },
          body: JSON.stringify({
            logLevel: enabled ? "full" : "off",
            resourceMethod: api?.resourceMethod,
            resourcePath: api?.resourcePath,
          }),
        })
      )
    )
    const allJson = await Promise.all(results.map((res) => res.json()))
    return c.json(allJson, 200)
  }
)

app.openapi(
  createRoute({
    operationId: "access-requests",
    tags: ["Giám sát APIM"],
    summary: "Truy vấn log request/response APIM",
    path: "/access-requests",
    method: "get",
    request: {
      query: ApimServiceTimeQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(
        z.array(ApimAccessRequestSchema),
        "Danh sách log (mảng rỗng khi lỗi truy vấn)"
      ),
    },
  }),
  async (c) => {
    const { from, service, to } = c.req.valid("query")
    try {
      const res = await prismaApimLogs.$queryRaw<
        {
          data: Record<string, any>
        }[]
      >`SELECT data
                FROM apim_logs
                WHERE data ->> 'service' = ${service}
                AND (time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
                AND (data ->> 'flow' = 'RESPONSE_OUT' or data ->> 'flow' = 'REQUEST_OUT')
                ORDER BY time DESC limit 1000;`
      return c.json(
        res.map(
          ({ data }) =>
            ({
              ...data,
            }) as any
        ),
        200
      )
    } catch (error) {
      console.log("[ERROR][access-requests]", error)
      return c.json([], 200)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "count-requests",
    tags: ["Giám sát APIM"],
    summary: "Đếm request theo API",
    path: "/count-requests",
    method: "get",
    request: {
      query: ApimServiceTimeQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(ApimCountRequestSchema), "Thống kê số request (mảng rỗng khi lỗi)"),
    },
  }),
  async (c) => {
    const { from, service, to } = c.req.valid("query")
    try {
      const res = await prismaApimLogs.$queryRaw<
        {
          api: string
          total_requests: bigint
        }[]
      >`SELECT
            data->>'apiTo' AS api,
            COUNT(*) AS total_requests
        FROM apim_logs
        WHERE data->>'service' = ${service}
        AND (data ->> 'flow' = 'REQUEST_OUT')
        AND (time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
        GROUP BY data->>'apiTo'
        ORDER BY total_requests DESC limit 1000;`

      return c.json(
        res.map(({ api, total_requests }) => ({
          api,
          total_requests: Number(total_requests),
        })),
        200
      )
    } catch (error) {
      console.log("[ERROR][count-requests]", error)
      return c.json([], 200)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "latency-average",
    tags: ["Giám sát APIM"],
    summary: "Thống kê độ trễ trung bình theo API",
    path: "/latency-average",
    method: "get",
    request: {
      query: ApimServiceTimeQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(ApimLatencySchema), "Thống kê latency (mảng rỗng khi lỗi)"),
    },
  }),
  async (c) => {
    const { from, service, to } = c.req.valid("query")
    try {
      const res = await prismaApimLogs.$queryRaw<
        {
          api: string
          avg_ms: bigint
          min_ms: bigint
          max_ms: bigint
          p95_ms: bigint
        }[]
      >`
        WITH resp AS (SELECT req.data ->> 'apiTo'                              AS api,
                     EXTRACT(EPOCH FROM (resp.time - req.time)) * 1000 AS response_time_ms
              FROM apim_logs req
                       JOIN apim_logs resp
                            ON req.data ->> 'correlationId' = resp.data ->> 'correlationId'
              WHERE req.data ->> 'flow' = 'REQUEST_IN'
                AND resp.data ->> 'flow' = 'RESPONSE_OUT'
                AND resp.data ->> 'service' = ${service}
        AND (resp.time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
              )
        SELECT api,
            AVG(response_time_ms)                                          AS avg_ms,
            MIN(response_time_ms)                                          AS min_ms,
            MAX(response_time_ms)                                          AS max_ms,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95_ms
        FROM resp
        GROUP BY api limit 1000;`

      return c.json(
        res.map(({ api, avg_ms, min_ms, max_ms, p95_ms }) => ({
          api,
          avg_latency: Number(avg_ms),
          min_latency: Number(min_ms),
          max_latency: Number(max_ms),
          p95_latency: Number(p95_ms),
        })),
        200
      )
    } catch (error) {
      console.log("[ERROR][latency-average]", error)
      return c.json([], 200)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "error-rate",
    tags: ["Giám sát APIM"],
    summary: "Thống kê tỷ lệ lỗi theo API",
    path: "/error-rate",
    method: "get",
    request: {
      query: ApimServiceTimeQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(ApimErrorRateSchema), "Thống kê error rate (mảng rỗng khi lỗi)"),
    },
  }),
  async (c) => {
    const { from, service, to } = c.req.valid("query")
    try {
      const res = await prismaApimLogs.$queryRaw<
        {
          api: string
          error_count: bigint
          total_count: bigint
          error_rate: number
        }[]
      >`
       SELECT
    data->>'apiTo' AS api,
    COUNT(*) FILTER (WHERE (data->>'statusCode')::int >= 400) AS error_count,
    COUNT(*) AS total_count,
    ROUND(
        COUNT(*) FILTER (WHERE (data->>'statusCode')::int >= 400) * 100.0
        / NULLIF(COUNT(*),0),
    2) AS error_rate
    FROM apim_logs
    WHERE data->>'service' = ${service}
    AND (time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
    GROUP BY data->>'apiTo'
    ORDER BY error_rate DESC limit 1000;`

      return c.json(
        res.map(({ api, error_count, total_count, error_rate }) => ({
          api,
          error_count: Number(error_count),
          total_count: Number(total_count),
          error_rate: Number(error_rate),
        })),
        200
      )
    } catch (error) {
      console.log("[ERROR][count-requests]", error)
      return c.json([], 200)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "throughput",
    tags: ["Giám sát APIM"],
    summary: "Thống kê throughput theo thời gian",
    path: "/throughput",
    method: "get",
    request: {
      query: ApimThroughputQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(ApimThroughputSchema), "Thống kê throughput (mảng rỗng khi lỗi)"),
    },
  }),
  async (c) => {
    const { from, service, to, type } = c.req.valid("query")
    try {
      const res = await prismaApimLogs.$queryRaw<
        {
          time: Date
          request_count: bigint
        }[]
      >`
        with RC as (SELECT date_trunc(${type}, time) AS time,
                   COUNT(*)                 AS request_count
            FROM apim_logs
            WHERE data ->> 'service' = ${service}
              AND (time AT TIME ZONE 'UTC') BETWEEN ${from} AND ${to}
            GROUP BY time)
        select time, sum(request_count) as request_count
        from RC
        group by time
        ORDER BY time DESC limit 1000;`

      return c.json(
        res.map(({ time, request_count }) => ({
          time,
          request_count: Number(request_count),
        })),
        200
      )
    } catch (error) {
      console.log("[ERROR][throughput]", error)
      return c.json([], 200)
    }
  }
)

export default app

// ---- Deploy Logs ----

app.openapi(
  createRoute({
    operationId: "insert-deploy-log",
    tags: ["Giám sát APIM"],
    summary: "Ghi log deploy/undeploy API",
    path: "/deploy-logs",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ApimDeployLogCreateSchema,
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(OkBooleanResponseSchema, "Ghi log thành công ({ ok: true/false })"),
    },
  }),
  async (c) => {
    const body = c.req.valid("json")
    try {
      await prismaApimLogs.$executeRaw`
        INSERT INTO apim_logs (time, data)
        VALUES (NOW(), ${JSON.stringify({
          type: "deploy_log",
          apiId: body.apiId,
          apiName: body.apiName,
          apiVersion: body.apiVersion,
          revisionName: body.revisionName,
          environment: body.environment,
          action: body.action,
          status: body.status,
          userName: body.userName ?? "",
        })}::jsonb)
      `
      return c.json({ ok: true }, 200)
    } catch (error) {
      console.log("[ERROR][insert-deploy-log]", error)
      return c.json({ ok: false }, 200)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "get-deploy-logs",
    tags: ["Giám sát APIM"],
    summary: "Lấy lịch sử deploy API",
    path: "/deploy-logs",
    method: "get",
    request: {
      query: ApimDeployLogsQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(ApimDeployLogSchema), "Lịch sử deploy (mảng rỗng khi lỗi)"),
    },
  }),
  async (c) => {
    const { apiId, limit } = c.req.valid("query")
    try {
      const res = await prismaApimLogs.$queryRaw<{ time: Date; data: Record<string, any> }[]>`
        SELECT time, data
        FROM apim_logs
        WHERE data->>'type' = 'deploy_log'
          AND data->>'apiId' = ${apiId}
        ORDER BY time DESC
        LIMIT ${limit}
      `
      return c.json(
        res.map(({ time, data }) => ({
          time: time.toISOString(),
          apiName: data.apiName ?? "",
          apiVersion: data.apiVersion ?? "",
          revisionName: data.revisionName ?? "",
          environment: data.environment ?? "",
          action: data.action ?? "",
          status: data.status ?? "",
          userName: data.userName ?? "",
        })),
        200
      )
    } catch (error) {
      console.log("[ERROR][get-deploy-logs]", error)
      return c.json([], 200)
    }
  }
)

// ---- Key (Token) Management ----

const ApiKeyNullableSchema = ApiKeySchema.nullable()

type ApiKeyRow = {
  id: string
  api_id: string
  key_value: string
  name: string
  description: string | null
  status: string
  expires_at: Date | null
  created_at: Date
  created_by: string
  revoked_at: Date | null
  revoked_by: string | null
}

function mapApiKey(r: ApiKeyRow) {
  return {
    id: r.id,
    apiId: r.api_id,
    keyValue: r.key_value,
    name: r.name,
    description: r.description ?? null,
    status: r.status as "active" | "revoked",
    expiresAt: r.expires_at?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
    createdBy: r.created_by,
    revokedAt: r.revoked_at?.toISOString() ?? null,
    revokedBy: r.revoked_by ?? null,
  }
}

app.openapi(
  createRoute({
    operationId: "list-api-keys",
    tags: ["Giám sát APIM"],
    summary: "Danh sách API key theo API",
    path: "/api-keys",
    method: "get",
    request: {
      query: ApiKeyListQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(ApiKeySchema), "Danh sách API key (mảng rỗng khi lỗi)"),
    },
  }),
  async (c) => {
    const { apiId, status } = c.req.valid("query")
    try {
      await ensureApiKeysTable()
      let rows: ApiKeyRow[]
      if (status) {
        rows = await prismaApimLogs.$queryRaw<ApiKeyRow[]>`
          SELECT id::text, api_id, key_value, name, description, status,
                 expires_at, created_at, created_by, revoked_at, revoked_by
          FROM api_keys
          WHERE api_id = ${apiId} AND status = ${status}
          ORDER BY created_at DESC
        `
      } else {
        rows = await prismaApimLogs.$queryRaw<ApiKeyRow[]>`
          SELECT id::text, api_id, key_value, name, description, status,
                 expires_at, created_at, created_by, revoked_at, revoked_by
          FROM api_keys
          WHERE api_id = ${apiId}
          ORDER BY created_at DESC
        `
      }
      return c.json(rows.map(mapApiKey), 200)
    } catch (error) {
      console.log("[ERROR][list-api-keys]", error)
      return c.json([], 200)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "create-api-key",
    tags: ["Giám sát APIM"],
    summary: "Tạo API key mới",
    path: "/api-keys",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ApiKeyCreateSchema,
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(ApiKeyNullableSchema, "API key vừa tạo (null nếu không insert được)"),
    },
  }),
  async (c) => {
    const { apiId, name, description, keyValue, expiresAt, createdBy } = c.req.valid("json")
    await ensureApiKeysTable()
    const rows = await prismaApimLogs.$queryRaw<ApiKeyRow[]>`
      INSERT INTO api_keys (api_id, key_value, name, description, expires_at, created_by)
      VALUES (
        ${apiId},
        ${keyValue},
        ${name},
        ${description ?? null},
        ${expiresAt ? new Date(expiresAt) : null},
        ${createdBy ?? ""}
      )
      RETURNING id::text, api_id, key_value, name, description, status,
                expires_at, created_at, created_by, revoked_at, revoked_by
    `
    if (!rows[0]) return c.json(null as unknown as ReturnType<typeof mapApiKey>, 200)
    return c.json(mapApiKey(rows[0]), 200)
  }
)

app.openapi(
  createRoute({
    operationId: "renew-api-key",
    tags: ["Giám sát APIM"],
    summary: "Gia hạn API key",
    path: "/api-keys/:id/renew",
    method: "post",
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: {
          "application/json": {
            schema: ApiKeyRenewSchema,
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(ApiKeyNullableSchema, "API key sau gia hạn (null nếu không tìm thấy)"),
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param")
    const { expiresAt } = c.req.valid("json")
    await ensureApiKeysTable()
    const rows = await prismaApimLogs.$queryRaw<ApiKeyRow[]>`
      UPDATE api_keys
      SET expires_at = ${new Date(expiresAt)},
          status     = 'active',
          revoked_at = NULL,
          revoked_by = NULL
      WHERE id = ${id}::uuid
      RETURNING id::text, api_id, key_value, name, description, status,
                expires_at, created_at, created_by, revoked_at, revoked_by
    `
    if (!rows[0]) return c.json(null as unknown as ReturnType<typeof mapApiKey>, 200)
    return c.json(mapApiKey(rows[0]), 200)
  }
)

app.openapi(
  createRoute({
    operationId: "revoke-api-key",
    tags: ["Giám sát APIM"],
    summary: "Thu hồi API key",
    path: "/api-keys/:id/revoke",
    method: "post",
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: {
          "application/json": {
            schema: ApiKeyRevokeSchema,
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(ApiKeyNullableSchema, "API key sau revoke (null nếu không tìm thấy)"),
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param")
    const { revokedBy } = c.req.valid("json")
    await ensureApiKeysTable()
    const rows = await prismaApimLogs.$queryRaw<ApiKeyRow[]>`
      UPDATE api_keys
      SET status     = 'revoked',
          revoked_at = NOW(),
          revoked_by = ${revokedBy ?? null}
      WHERE id = ${id}::uuid
      RETURNING id::text, api_id, key_value, name, description, status,
                expires_at, created_at, created_by, revoked_at, revoked_by
    `
    if (!rows[0]) return c.json(null as unknown as ReturnType<typeof mapApiKey>, 200)
    return c.json(mapApiKey(rows[0]), 200)
  }
)
