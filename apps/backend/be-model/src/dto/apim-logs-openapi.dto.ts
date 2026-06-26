import { z } from "@hono/zod-openapi"
import { OkBooleanResponseSchema } from "./common-response.dto"
import { fieldDesc } from "./openapi-helpers"

export const ApimServiceTimeQuerySchema = z.object({
  service: z.string().openapi(fieldDesc("Tên service APIM cần truy vấn.")),
  from: z.coerce.date().openapi(fieldDesc("Thời điểm bắt đầu (ISO 8601).")),
  to: z.coerce.date().openapi(fieldDesc("Thời điểm kết thúc (ISO 8601).")),
})

export const ApimConfigLogsQuerySchema = z.object({
  apiId: z.string().openapi(fieldDesc("ID API trên WSO2.")),
  baseUrl: z.string().openapi(fieldDesc("Base URL WSO2 API Manager.")),
})

export const ApimConfigLogsUpdateSchema = z
  .object({
    apiId: z.string().openapi(fieldDesc("ID API trên WSO2.")),
    baseUrl: z.string().openapi(fieldDesc("Base URL WSO2 API Manager.")),
    enabled: z.boolean().openapi(fieldDesc("true = bật log FULL, false = tắt.", true)),
  })
  .openapi("ApimConfigLogsUpdate")

export const ApimAccessRequestSchema = z
  .object({
    tag: z.string().openapi(fieldDesc("Tag log.")),
    flow: z.string().openapi(fieldDesc("Luồng (REQUEST_OUT, RESPONSE_OUT).")),
    time: z.number().openapi(fieldDesc("Timestamp.")),
    verb: z.string().openapi(fieldDesc("HTTP method.")),
    apiTo: z.string().openapi(fieldDesc("API đích.")),
    level: z.string().openapi(fieldDesc("Log level.")),
    headers: z.array(z.string()).openapi(fieldDesc("HTTP headers.")),
    payload: z.any().openapi(fieldDesc("Payload log.")),
    service: z.string().openapi(fieldDesc("Tên service.")),
    statusCode: z.number().openapi(fieldDesc("HTTP status code.")),
    correlationId: z.string().openapi(fieldDesc("Correlation ID.")),
  })
  .openapi("ApimAccessRequest")

export const ApimCountRequestSchema = z
  .object({
    api: z.string().openapi(fieldDesc("Tên API.")),
    total_requests: z.number().openapi(fieldDesc("Tổng số request.")),
  })
  .openapi("ApimCountRequest")

export const ApimLatencySchema = z
  .object({
    api: z.string().openapi(fieldDesc("Tên API.")),
    avg_latency: z.number().openapi(fieldDesc("Độ trễ trung bình (ms).")),
    min_latency: z.number().openapi(fieldDesc("Độ trễ tối thiểu (ms).")),
    max_latency: z.number().openapi(fieldDesc("Độ trễ tối đa (ms).")),
    p95_latency: z.number().openapi(fieldDesc("Độ trễ P95 (ms).")),
  })
  .openapi("ApimLatency")

export const ApimErrorRateSchema = z
  .object({
    api: z.string().openapi(fieldDesc("Tên API.")),
    error_count: z.number().openapi(fieldDesc("Số request lỗi (status >= 400).")),
    total_count: z.number().openapi(fieldDesc("Tổng số request.")),
    error_rate: z.number().openapi(fieldDesc("Tỷ lệ lỗi (%).")),
  })
  .openapi("ApimErrorRate")

export const ApimThroughputSchema = z
  .object({
    time: z.union([z.string(), z.date()]).openapi(fieldDesc("Mốc thời gian.")),
    request_count: z.number().openapi(fieldDesc("Số request trong khoảng.")),
  })
  .openapi("ApimThroughput")

export const ApimThroughputQuerySchema = ApimServiceTimeQuerySchema.extend({
  type: z
    .enum(["minute", "hour", "day"])
    .default("minute")
    .openapi(fieldDesc("Đơn vị gom nhóm thời gian.", "minute")),
})

export const ApimDeployLogCreateSchema = z
  .object({
    apiId: z.string().openapi(fieldDesc("ID API.")),
    apiName: z.string().openapi(fieldDesc("Tên API.")),
    apiVersion: z.string().openapi(fieldDesc("Phiên bản API.")),
    revisionName: z.string().openapi(fieldDesc("Tên revision.")),
    environment: z.string().openapi(fieldDesc("Môi trường deploy.")),
    action: z.enum(["deploy", "undeploy"]).openapi(fieldDesc("Hành động deploy.")),
    status: z.enum(["success", "pending", "failed"]).openapi(fieldDesc("Trạng thái deploy.")),
    userName: z.string().optional().openapi(fieldDesc("Người thực hiện.")),
  })
  .openapi("ApimDeployLogCreate")

export const ApimDeployLogSchema = z
  .object({
    time: z.string().openapi(fieldDesc("Thời gian deploy (ISO 8601).")),
    apiName: z.string().openapi(fieldDesc("Tên API.")),
    apiVersion: z.string().openapi(fieldDesc("Phiên bản API.")),
    revisionName: z.string().openapi(fieldDesc("Tên revision.")),
    environment: z.string().openapi(fieldDesc("Môi trường.")),
    action: z.string().openapi(fieldDesc("Hành động.")),
    status: z.string().openapi(fieldDesc("Trạng thái.")),
    userName: z.string().openapi(fieldDesc("Người thực hiện.")),
  })
  .openapi("ApimDeployLog")

export const ApimDeployLogsQuerySchema = z.object({
  apiId: z.string().openapi(fieldDesc("ID API cần lọc.")),
  limit: z.coerce.number().default(50).openapi(fieldDesc("Số bản ghi tối đa.", 50)),
})

export const ApiKeySchema = z
  .object({
    id: z.string().openapi(fieldDesc("ID key.")),
    apiId: z.string().openapi(fieldDesc("ID API.")),
    keyValue: z.string().openapi(fieldDesc("Giá trị key/token.")),
    name: z.string().openapi(fieldDesc("Tên key.")),
    description: z.string().nullable().openapi(fieldDesc("Mô tả.")),
    status: z.enum(["active", "revoked"]).openapi(fieldDesc("Trạng thái key.")),
    expiresAt: z.string().nullable().openapi(fieldDesc("Thời hạn (ISO 8601).")),
    createdAt: z.string().openapi(fieldDesc("Thời gian tạo.")),
    createdBy: z.string().openapi(fieldDesc("Người tạo.")),
    revokedAt: z.string().nullable().openapi(fieldDesc("Thời gian revoke.")),
    revokedBy: z.string().nullable().openapi(fieldDesc("Người revoke.")),
  })
  .openapi("ApiKey")

export const ApiKeyListQuerySchema = z.object({
  apiId: z.string().openapi(fieldDesc("ID API.")),
  status: z.enum(["active", "revoked"]).optional().openapi(fieldDesc("Lọc theo trạng thái.")),
})

export const ApiKeyCreateSchema = z
  .object({
    apiId: z.string().openapi(fieldDesc("ID API.")),
    name: z.string().openapi(fieldDesc("Tên key.")),
    description: z.string().optional().openapi(fieldDesc("Mô tả.")),
    keyValue: z.string().openapi(fieldDesc("Giá trị key.")),
    expiresAt: z.string().datetime().optional().openapi(fieldDesc("Thời hạn (ISO 8601).")),
    createdBy: z.string().optional().openapi(fieldDesc("Người tạo.")),
  })
  .openapi("ApiKeyCreate")

export const ApiKeyRenewSchema = z
  .object({
    expiresAt: z.string().datetime().openapi(fieldDesc("Thời hạn mới (ISO 8601).")),
  })
  .openapi("ApiKeyRenew")

export const ApiKeyRevokeSchema = z
  .object({
    revokedBy: z.string().optional().openapi(fieldDesc("Người revoke.")),
  })
  .openapi("ApiKeyRevoke")

export { OkBooleanResponseSchema }
