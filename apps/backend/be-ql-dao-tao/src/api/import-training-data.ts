import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono({ strict: false })

const importTrainingDataRequestSchema = z
  .object({
    classRegisterSessionId: z.string().openapi(fieldDesc("ID đợt đăng ký học online.")),
    file: z.instanceof(File).openapi(fieldDesc("File JSON dữ liệu đăng ký từ internet.")),
  })
  .openapi("ImportTrainingDataRequest")

const importTrainingDataResponseSchema = z
  .object({
    message: z.string(),
    imported: z.number().optional(),
    failed: z.number().optional(),
  })
  .openapi("ImportTrainingDataResponse")

const importTrainingDataRoute = createRoute({
  operationId: "importTrainingData",
  tags: ["Nhập dữ liệu"],
  path: "/import",
  method: "post",
  summary: "Nhập dữ liệu đăng ký từ internet",
  description: `Nhập file JSON ghi nhận sinh viên đã đăng ký trên môi trường internet vào đợt đăng ký nội bộ.

**Dự kiến import:** ClassRegisterLogs, StudentSubjectScore (và các bản ghi liên quan trong file export).

**Tham số:** classRegisterSessionId, file (JSON).`,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: importTrainingDataRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Nhập dữ liệu thành công",
      content: {
        "application/json": {
          schema: importTrainingDataResponseSchema,
        },
      },
    },
    501: {
      description: "Chức năng chưa triển khai",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(importTrainingDataRoute, async (c) => {
  const { classRegisterSessionId, file } = c.req.valid("form")

  if (!file || file.size === 0) {
    return c.json({ message: "Vui lòng chọn file JSON" }, 400)
  }

  return c.json(
    {
      message: `Chức năng import đang phát triển (đợt: ${classRegisterSessionId}, file: ${file.name})`,
    },
    501
  )
})

export default app
