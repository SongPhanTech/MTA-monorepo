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
import { getOnlyOfficeJwtHeader, signOnlyOfficeJwt } from "../utils/onlyoffice-jwt"

const ONLYOFFICE_CONVERT_ERROR_MESSAGE: Record<number, string> = {
  [-1]: "Lỗi không xác định từ OnlyOffice",
  [-2]: "Hết thời gian chuyển đổi tài liệu",
  [-3]: "OnlyOffice không chuyển đổi được file",
  [-4]: "OnlyOffice không tải được file nguồn (URL export không truy cập được từ Document Server)",
  [-5]: "File có mật khẩu không đúng",
  [-6]: "Lỗi cơ sở dữ liệu chuyển đổi OnlyOffice",
  [-7]: "Dữ liệu đầu vào không hợp lệ",
  [-8]: "Token JWT OnlyOffice không hợp lệ (sai ONLYOFFICE_JWT_SECRET hoặc thiếu token trong body/header)",
  [-9]: "Không xác định được định dạng file đích",
  [-10]: "File vượt quá giới hạn kích thước OnlyOffice",
}

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
    const payload = {
      async: false,
      filetype: fileType,
      outputtype: outputtype,
      title,
      key: createId(),
      url,
    }
    const token = await signOnlyOfficeJwt(payload)
    const jwtHeader = getOnlyOfficeJwtHeader()
    const authHeaders: Record<string, string> = token
      ? {
          [jwtHeader]: `Bearer ${token}`,
          ...(jwtHeader !== "Authorization" ? { Authorization: `Bearer ${token}` } : {}),
        }
      : {}

    const requestOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders,
      },
      // OnlyOffice inbox JWT (error -8 nếu thiếu): token trong body + header
      body: JSON.stringify(token ? { ...payload, token } : payload),
    }

    const onlyOfficeBase = (process.env.ONLY_OFFICE_ENDPOINT || "").replace(/\/+$/, "")
    if (!onlyOfficeBase) {
      return c.json({ message: "ONLY_OFFICE_ENDPOINT chưa được cấu hình trên server" }, 500)
    }

    const res = await fetch(`${onlyOfficeBase}/converter`, requestOptions)
    const rawBody = await res.text()
    console.log("Convert Document:", onlyOfficeBase, res.status, rawBody.slice(0, 500))

    let resJson: {
      fileUrl?: string
      fileType?: string
      percent?: number
      endConvert?: boolean
      error?: number | string
      message?: string
    }
    try {
      resJson = JSON.parse(rawBody) as typeof resJson
    } catch {
      return c.json(
        {
          message: `OnlyOffice converter trả về không hợp lệ (HTTP ${res.status}) từ ${onlyOfficeBase}. ${rawBody.slice(0, 120)}`,
        },
        500
      )
    }

    if (res.status !== 200 || !resJson.fileUrl) {
      const errorCode = Number(resJson.error)
      const errorHint =
        Number.isFinite(errorCode) && ONLYOFFICE_CONVERT_ERROR_MESSAGE[errorCode]
          ? ONLYOFFICE_CONVERT_ERROR_MESSAGE[errorCode]
          : null
      return c.json(
        {
          message:
            resJson.message ||
            errorHint ||
            `Chuyển đổi tài liệu thất bại (HTTP ${res.status}${
              resJson.error != null ? `, error=${resJson.error}` : ""
            }) từ ${onlyOfficeBase}`,
        },
        500
      )
    }

    return c.json({ fileUrl: resJson.fileUrl }, 200)
  }
)

app.openapi(
  createRoute({
    operationId: "signOnlyOfficeConfig",
    tags: ["Lưu trữ MinIO"],
    summary: "Ký JWT cấu hình OnlyOffice Document Editor",
    path: "/onlyoffice-sign",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z
              .record(z.string(), z.any())
              .openapi(fieldDesc("Config DocsAPI (không gồm token).")),
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(
        z.object({
          token: z.string().openapi(fieldDesc("JWT OnlyOffice.")),
        }),
        "Ký JWT thành công"
      ),
    },
  }),
  async (c) => {
    const config = c.req.valid("json") as Record<string, unknown>
    const { token: _ignored, ...payload } = config
    const token = await signOnlyOfficeJwt(payload)
    if (!token) {
      return c.json({ message: "ONLYOFFICE_JWT_SECRET chưa được cấu hình trên server" }, 500)
    }
    return c.json({ token }, 200)
  }
)

const SURVEY_PRINT_OBJECT_PREFIX = "khao-thi/survey-print/"
const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const safeDecodeUri = (raw: string) => {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

const normalizeSurveyPrintObjectName = (raw: string): string | null => {
  const trimmed = safeDecodeUri(raw).replace(/^\/+/, "")
  if (trimmed.startsWith(SURVEY_PRINT_OBJECT_PREFIX)) return trimmed
  const idx = trimmed.indexOf(SURVEY_PRINT_OBJECT_PREFIX)
  if (idx > 0 && trimmed[idx - 1] === "/") return trimmed.slice(idx)
  return null
}

const readSurveyPrintObject = async (objectName: string) => {
  try {
    return await minioService.getObject(objectName)
  } catch {
    const bucket = process.env.MINIO_BUCKET || ""
    if (bucket && objectName.startsWith(`${bucket}/`)) {
      return minioService.getObject(objectName.slice(bucket.length + 1))
    }
    throw new Error("File not found")
  }
}

const saveOnlyOfficeUrlToObject = async (objectName: string, fileUrl: string) => {
  const fileRes = await fetch(fileUrl)
  if (!fileRes.ok) {
    console.error("[onlyoffice-save] Download failed:", fileRes.status, fileUrl)
    return false
  }
  const buffer = Buffer.from(await fileRes.arrayBuffer())
  await minioService.putObject(objectName, buffer, DOCX_CONTENT_TYPE)
  return true
}

/** Browser asks server to fetch OnlyOffice temp URL and persist to MinIO. */
app.post("/onlyoffice-save-from-url", async (c) => {
  const objectNameParam = c.req.query("objectName") || ""
  const objectName = normalizeSurveyPrintObjectName(objectNameParam)
  if (!objectName) {
    console.error("[onlyoffice-save-from-url] Rejected objectName:", objectNameParam)
    return c.json({ success: false, message: "Invalid objectName" }, 400)
  }

  try {
    const body = (await c.req.json()) as { url?: string }
    if (!body.url) {
      return c.json({ success: false, message: "Missing url" }, 400)
    }

    const ok = await saveOnlyOfficeUrlToObject(objectName, body.url)
    if (!ok) return c.json({ success: false, message: "Download failed" }, 500)

    return c.json({ success: true }, 200)
  } catch (error) {
    console.error("[onlyoffice-save-from-url] Error:", error)
    return c.json({ success: false, message: "Save failed" }, 500)
  }
})

/**
 * Proxy download for survey print templates.
 * OnlyOffice Document Server fetches this URL (no direct MinIO access).
 */
app.get("/survey-print", async (c) => {
  const objectNameParam = c.req.query("objectName") || ""
  const objectName = normalizeSurveyPrintObjectName(objectNameParam)
  if (!objectName) {
    return c.json({ success: false, message: "Invalid objectName" }, 400)
  }

  try {
    const buffer = await readSurveyPrintObject(objectName)
    const fileName = objectName.split("/").pop() || "survey.docx"
    return c.body(Uint8Array.from(buffer), 200, {
      "Content-Type": DOCX_CONTENT_TYPE,
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    })
  } catch (error) {
    console.error("[survey-print GET] Error:", error)
    return c.json({ success: false, message: "File not found" }, 404)
  }
})

/**
 * Proxy upload for survey print templates (client → BE → MinIO).
 */
app.put("/survey-print", async (c) => {
  const objectNameParam = c.req.query("objectName") || ""
  const objectName = normalizeSurveyPrintObjectName(objectNameParam)
  if (!objectName) {
    return c.json({ success: false, message: "Invalid objectName" }, 400)
  }

  try {
    const buffer = Buffer.from(await c.req.arrayBuffer())
    if (!buffer.length) {
      return c.json({ success: false, message: "Empty body" }, 400)
    }
    const saved = await minioService.putObject(objectName, buffer, DOCX_CONTENT_TYPE)
    return c.json(
      {
        success: true,
        objectName,
        filePath: saved.fileName,
      },
      200
    )
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error("[survey-print PUT] Error:", error)
    const diskFull = /free drive threshold|insufficient/i.test(detail)
    return c.json(
      {
        success: false,
        message: diskFull ? "MinIO hết dung lượng, không ghi được file phiếu in" : "Upload failed",
        detail,
      },
      diskFull ? 507 : 500
    )
  }
})

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
      const ok = await saveOnlyOfficeUrlToObject(objectName, body.url)
      if (!ok) return c.json({ error: 1 }, 500)
      console.log("[onlyoffice-callback] Saved:", objectName, "status=", body.status)
    }
  } catch (error) {
    console.error("[onlyoffice-callback] Error:", error)
    return c.json({ error: 1 }, 500)
  }

  return c.json({ error: 0 })
})

export default app
