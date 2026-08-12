import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { createId } from "@workspace/db"
import { SuccessBooleanResponseSchema } from "../dto/common-response.dto"
import {
  BucketItemDtoSchema,
  ConvertDocumentResponseSchema,
  ListObjectDtoSchema,
  PresignedUrlDtoSchema,
  UrlDtoSchema,
} from "../dto/minio"
import { fieldDesc } from "../dto/openapi-helpers"
import { jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { MinIOService } from "../services/minio"

const app = new OpenAPIHono({ strict: false })

const minioService = new MinIOService()

app.openapi(
  createRoute({
    operationId: "generatePresignedUrl",
    tags: ["Lưu trữ MinIO"],
    summary: "Tạo presigned URL upload",
    path: "/generate-presigned-url",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": { schema: PresignedUrlDtoSchema },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(UrlDtoSchema, "Tạo presigned URL thành công"),
    },
  }),
  async (c) => {
    const presignedUrlDto = c.req.valid("json")
    const url = await minioService.generatePresignedUrl(presignedUrlDto)
    return c.json(url)
  }
)

app.openapi(
  createRoute({
    operationId: "listObjects",
    tags: ["Lưu trữ MinIO"],
    summary: "Liệt kê object trong bucket",
    path: "/",
    method: "get",
    request: {
      query: ListObjectDtoSchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(BucketItemDtoSchema), "Danh sách object"),
    },
  }),
  async (c) => {
    const listObjectDto = c.req.valid("query")
    const items = await minioService.findAll(listObjectDto)
    return c.json(items, 200)
  }
)

app.openapi(
  createRoute({
    operationId: "presignedGetObject",
    tags: ["Lưu trữ MinIO"],
    summary: "Tạo presigned URL download",
    path: "/presigned-url",
    method: "get",
    request: {
      query: z.object({
        objectName: z.string().openapi(fieldDesc("Tên object trên MinIO.")),
      }),
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(UrlDtoSchema, "Tạo presigned URL download thành công"),
    },
  }),
  async (c) => {
    const { objectName } = c.req.valid("query")
    const url = await minioService.presignedGetObject(objectName)
    return c.json(url, 200)
  }
)

app.openapi(
  createRoute({
    operationId: "deleteObject",
    tags: ["Lưu trữ MinIO"],
    summary: "Xóa object trên MinIO",
    path: "/",
    method: "delete",
    request: {
      query: z.object({
        objectName: z.string().openapi(fieldDesc("Tên object cần xóa.")),
      }),
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(SuccessBooleanResponseSchema, "Xóa object thành công"),
    },
  }),
  async (c) => {
    const { objectName } = c.req.valid("query")
    await minioService.remove(objectName)
    return c.json({ success: true }, 200)
  }
)

app.openapi(
  createRoute({
    operationId: "convertDocument",
    tags: ["Lưu trữ MinIO"],
    summary: "Chuyển đổi tài liệu qua OnlyOffice",
    path: "/convert-document",
    method: "get",
    request: {
      query: z
        .object({
          url: z.string().url().openapi(fieldDesc("URL file nguồn.")),
          fileType: z.string().openapi(fieldDesc("Loại file nguồn.", "docx")),
          outputtype: z.string().openapi(fieldDesc("Loại file đích.", "pdf")),
          title: z.string().optional().openapi(fieldDesc("Tiêu đề tài liệu.")),
        })
        .openapi("ConvertDocumentDto"),
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(ConvertDocumentResponseSchema, "Chuyển đổi tài liệu thành công"),
    },
  }),
  async (c) => {
    const { fileType, outputtype, title, url } = c.req.valid("query")
    const raw = JSON.stringify({
      async: false,
      filetype: fileType,
      outputtype: outputtype,
      title,
      key: createId(),
      url,
    })

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    }

    const res = await fetch(`${process?.env?.ONLY_OFFICE_ENDPOINT}/converter`, requestOptions)

    console.log("Convert Document:", res.status)
    if (res.status !== 200) {
      const text = await res.text()
      console.log("Convert Document:", text)
    }

    const resJson = (await res.json()) as {
      fileUrl: string
      fileType: string
      percent: number
      endConvert: boolean
    }

    return c.json({ fileUrl: resJson.fileUrl }, 200)
  }
)

const SURVEY_PRINT_OBJECT_PREFIX = "khao-thi/survey-print/"
const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const normalizeSurveyPrintObjectName = (raw: string): string | null => {
  const trimmed = decodeURIComponent(raw).replace(/^\/+/, "")
  if (trimmed.startsWith(SURVEY_PRINT_OBJECT_PREFIX)) return trimmed
  const idx = trimmed.indexOf(SURVEY_PRINT_OBJECT_PREFIX)
  if (idx > 0 && trimmed[idx - 1] === "/") return trimmed.slice(idx)
  return null
}

/** OnlyOffice Document Server save callback — must stay public (no JWT). */
app.post("/onlyoffice-callback", async (c) => {
  const objectNameParam = c.req.query("objectName") || ""
  const objectName = normalizeSurveyPrintObjectName(objectNameParam)

  if (!objectName) {
    console.error("[onlyoffice-callback] Rejected objectName:", objectNameParam)
    return c.json({ error: 1 }, 400)
  }

  try {
    const body = (await c.req.json()) as {
      status?: number
      url?: string
    }

    // 2 = ready for saving, 6 = force save
    if ((body.status === 2 || body.status === 6) && body.url) {
      const fileRes = await fetch(body.url)
      if (!fileRes.ok) {
        console.error("[onlyoffice-callback] Download failed:", fileRes.status, body.url)
        return c.json({ error: 1 }, 500)
      }
      const buffer = Buffer.from(await fileRes.arrayBuffer())
      await minioService.putObject(objectName, buffer, DOCX_CONTENT_TYPE)
      console.log("[onlyoffice-callback] Saved:", objectName, "status=", body.status)
    }
  } catch (error) {
    console.error("[onlyoffice-callback] Error:", error)
    return c.json({ error: 1 }, 500)
  }

  return c.json({ error: 0 })
})

export default app
