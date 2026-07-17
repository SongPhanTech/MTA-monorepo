import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { importRegistrationResultsFromJson } from "../services/import-registration-results"

const app = new OpenAPIHono({ strict: false })

const importTrainingDataRequestSchema = z
  .object({
    classRegisterSessionId: z.string().openapi(fieldDesc("ID đợt đăng ký học online.")),
    file: z.instanceof(File).openapi({
      type: "string",
      format: "binary",
      description: "File JSON kết quả đăng ký từ internet.",
    }),
  })
  .openapi("ImportTrainingDataRequest")

const importTrainingDataResponseSchema = z
  .object({
    message: z.string(),
    imported: z.number().optional(),
    failed: z.number().optional(),
    details: z
      .object({
        classRegisterLogs: z.number(),
        studentSubjectScore: z.number(),
        removedLogs: z.number(),
        removedScores: z.number(),
      })
      .optional(),
    warnings: z.array(z.string()).optional(),
  })
  .openapi("ImportTrainingDataResponse")

const importTrainingDataRoute = createRoute({
  operationId: "importTrainingData",
  tags: ["Nhập dữ liệu"],
  path: "/import",
  method: "post",
  summary: "Nhập kết quả đăng ký từ internet",
  description: `Nhập file JSON (type registration-results) xuất từ cổng đăng ký học vào 1 đợt đăng ký online nội bộ.

**Import:** ClassRegisterLogs, StudentSubjectScore.

**Đồng bộ:** đăng ký có trên nội bộ nhưng không còn trong file sẽ bị gỡ (score trống, chưa phát sinh điểm).`,
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
  },
})

app.openapi(importTrainingDataRoute, async (c) => {
  const { classRegisterSessionId, file } = c.req.valid("form")

  if (!file || file.size === 0) {
    return c.json({ message: "Vui lòng chọn file JSON" }, 400)
  }

  try {
    const text = await file.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return c.json({ message: "File không phải JSON hợp lệ" }, 400)
    }

    const result = await importRegistrationResultsFromJson(classRegisterSessionId, parsed)

    return c.json(
      {
        message: result.message,
        imported: result.imported,
        failed: result.failed,
        details: result.details,
        warnings: result.warnings.slice(0, 50),
      },
      200
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nhập dữ liệu đăng ký thất bại"
    return c.json({ message }, 400)
  }
})

export default app
