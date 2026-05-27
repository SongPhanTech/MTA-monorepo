import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { getMinioUrl } from "@workspace/libs"
import { TemplateHandler } from "easy-template-x"
import type { TemplateData } from "easy-template-x"
import { inflateRawSync, deflateRawSync } from "node:zlib"
import { MinIOService } from "../services/minio"

const app = new OpenAPIHono({ strict: false })

const minioService = new MinIOService()

const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const docxTemplateSchema = z.object({
  fileName: z.string(),
  path: z.string(),
  prefix: z.string().nullable().optional(),
  data: z.record(z.unknown()),
})

const docxPreviewSchema = docxTemplateSchema.extend({
  previewKey: z.string(),
})

class TemplateNotFoundError extends Error {}

async function renderDocxTemplate({
  path,
  prefix,
  data,
}: {
  path: string
  prefix?: string | null
  data: Record<string, unknown>
}): Promise<Buffer> {
  const templatePrefix = (prefix ?? "/mta/luan-van").replace(/\/+$/, "")
  const templatePath = path.replace(/^\/+/, "")

  let res = await fetch(getMinioUrl(`${templatePrefix}/${templatePath}`))

  if (!res.ok && templatePrefix !== "/mta/template") {
    res = await fetch(getMinioUrl(`/mta/template/${templatePath}`))
  }

  if (!res.ok) throw new TemplateNotFoundError("Không tìm thấy template trên MinIO")

  const buffer = await res.arrayBuffer()
  const handler = new TemplateHandler()
  const renderedBuffer = await handler.process(Buffer.from(buffer), data as TemplateData)

  return applyPageBreaks(Buffer.from(renderedBuffer))
}

const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()
function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) crc = (crc >>> 8) ^ (CRC32_TABLE[(crc ^ byte) & 0xff] ?? 0)
  return (crc ^ 0xffffffff) >>> 0
}

function applyPageBreaks(docxBuffer: Buffer): Buffer {
  let pos = 0
  const files: { name: string; data: Buffer }[] = []

  while (pos < docxBuffer.length) {
    const sig = docxBuffer.readUInt32LE(pos)
    if (sig !== 0x04034b50) break
    const nameLen = docxBuffer.readUInt16LE(pos + 26)
    const extraLen = docxBuffer.readUInt16LE(pos + 28)
    const compMethod = docxBuffer.readUInt16LE(pos + 8)
    const compSize = docxBuffer.readUInt32LE(pos + 18)
    const uncompSize = docxBuffer.readUInt32LE(pos + 22)
    const name = docxBuffer.toString("utf8", pos + 30, pos + 30 + nameLen)
    const dataStart = pos + 30 + nameLen + extraLen
    let data = docxBuffer.slice(dataStart, dataStart + compSize)

    if (compMethod === 8) data = inflateRawSync(data)

    if (name === "word/document.xml") {
      let xml = data.toString("utf8")
      xml = xml.replace(/<w:p\b[^>]*>(?:(?!<\/w:p>).)*ngắt trang.*?<\/w:p>/g, () => {
        return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
      })
      // Boi dam + gach chan cac doan duoc danh dau bang marker \uE000..\uE001 (do BE boc vao value).
      xml = xml.replace(/<w:r\b([^>]*)>([\s\S]*?)<\/w:r>/g, (full, attrs, inner) => {
        if (!inner.includes("\uE000")) return full
        let body = inner.replace(/[\uE000\uE001]/g, "")
        if (/<w:rPr\b[^>]*>/.test(body)) {
          body = body.replace(/<\/w:rPr>/, '<w:b/><w:u w:val="single"/></w:rPr>')
        } else {
          body = `<w:rPr><w:b/><w:u w:val="single"/></w:rPr>${body}`
        }
        return `<w:r${attrs}>${body}</w:r>`
      })
      data = Buffer.from(xml, "utf8")
    }

    files.push({ name, data })
    pos = dataStart + compSize
  }

  // Xây dựng lại ZIP
  const parts: Buffer[] = []
  const centralDirs: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const content = deflateRawSync(file.data)
    const nameBuf = Buffer.from(file.name)
    const crcVal = crc32(file.data)

    const lh = Buffer.alloc(30 + nameBuf.length)
    lh.writeUInt32LE(0x04034b50, 0)
    lh.writeUInt16LE(20, 4)
    lh.writeUInt16LE(8, 8)
    lh.writeUInt32LE(crcVal, 14)
    lh.writeUInt32LE(content.length, 18)
    lh.writeUInt32LE(file.data.length, 22)
    lh.writeUInt16LE(nameBuf.length, 26)
    nameBuf.copy(lh, 30)
    parts.push(lh, content)

    const cd = Buffer.alloc(46 + nameBuf.length)
    cd.writeUInt32LE(0x02014b50, 0)
    cd.writeUInt16LE(20, 4)
    cd.writeUInt16LE(20, 6)
    cd.writeUInt16LE(8, 10)
    cd.writeUInt32LE(crcVal, 16)
    cd.writeUInt32LE(content.length, 20)
    cd.writeUInt32LE(file.data.length, 24)
    cd.writeUInt16LE(nameBuf.length, 28)
    cd.writeUInt32LE(offset, 42)
    nameBuf.copy(cd, 46)
    centralDirs.push(cd)

    offset += lh.length + content.length
  }

  const cdOffset = offset
  const cdSize = centralDirs.reduce((sum, b) => sum + b.length, 0)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(files.length, 8)
  eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(cdSize, 12)
  eocd.writeUInt32LE(cdOffset, 16)

  return Buffer.concat([...parts, ...centralDirs, eocd])
}

app.openapi(
  createRoute({
    operationId: "docxTemplate",
    path: "/",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": { schema: docxTemplateSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Export Docx thành công",
        content: {
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
            schema: z.any().openapi({ type: "string", format: "binary" }),
          },
        },
      },
    },
  }),
  async (c) => {
    const { fileName, path, data, prefix } = c.req.valid("json")
    try {
      const finalBuffer = await renderDocxTemplate({ path, prefix, data })
      const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

      return c.body(new Uint8Array(finalBuffer), 200, {
        "Content-Type": DOCX_CONTENT_TYPE,
        "Content-Disposition": disposition,
      })
    } catch (error: unknown) {
      if (error instanceof TemplateNotFoundError) return c.json({ message: error.message }, 404)
      const msg = error instanceof Error ? error.message : "Lỗi khi xử lý template Docx"
      console.error("[DOCX-TEMPLATE] Error:", error)
      return c.json({ message: msg }, 500)
    }
  }
)

app.openapi(
  createRoute({
    operationId: "docxTemplatePreview",
    path: "/preview",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": { schema: docxPreviewSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Fill template và lưu lên MinIO để preview",
        content: {
          "application/json": {
            schema: z.object({ path: z.string(), fileType: z.string() }),
          },
        },
      },
      404: {
        description: "Không tìm thấy template",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
      500: {
        description: "Lỗi xử lý template",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const { path, data, prefix, previewKey } = c.req.valid("json")
    try {
      const finalBuffer = await renderDocxTemplate({ path, prefix, data })

      const safeKey = previewKey.replace(/[^a-zA-Z0-9_-]/g, "_")
      const objectName = `mta/preview/luan-van/${safeKey}.docx`

      const { fileName } = await minioService.putObject(objectName, finalBuffer, DOCX_CONTENT_TYPE)

      return c.json({ path: fileName, fileType: "docx" }, 200)
    } catch (error: unknown) {
      if (error instanceof TemplateNotFoundError) return c.json({ message: error.message }, 404)
      const msg = error instanceof Error ? error.message : "Lỗi khi xử lý template Docx"
      console.error("[DOCX-TEMPLATE-PREVIEW] Error:", error)
      return c.json({ message: msg }, 500)
    }
  }
)

export default app
