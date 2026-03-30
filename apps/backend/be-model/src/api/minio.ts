import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { createId } from "@workspace/db"
import {
  BucketItemDtoSchema,
  ListObjectDtoSchema,
  PresignedUrlDtoSchema,
  UrlDtoSchema,
} from "../dto/minio"
import { MinIOService } from "../services/minio"

const app = new OpenAPIHono({ strict: false })

const minioService = new MinIOService()
// await minioService.onModuleInit()

app.openapi(
  createRoute({
    operationId: "generatePresignedUrl",
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
      200: {
        content: { "application/json": { schema: UrlDtoSchema } },
        description: "Generate presigned URL",
      },
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
    path: "/",
    method: "get",
    request: {
      query: ListObjectDtoSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.array(BucketItemDtoSchema),
          },
        },
        description: "List objects",
      },
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
    path: "/presigned-url",
    method: "get",
    request: {
      query: z.object({ objectName: z.string() }).openapi("PresignedGetObjectDto"),
    },
    responses: {
      200: {
        content: { "application/json": { schema: UrlDtoSchema } },
        description: "Generate presigned URL",
      },
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
    operationId: "convertDocument",
    path: "/convert-document",
    method: "get",
    request: {
      query: z
        .object({
          url: z.string().url(),
          fileType: z.string(),
          outputtype: z.string(),
          title: z.string().optional(),
        })
        .openapi("ConvertDocumentDto"),
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              fileUrl: z.string().url(),
            }),
          },
        },
        description: "Generate presigned URL",
      },
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

export default app
