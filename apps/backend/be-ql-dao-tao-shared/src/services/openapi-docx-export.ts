import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"

type OpenApiDoc = Record<string, unknown>

const METHOD_ORDER = ["get", "post", "put", "patch", "delete", "options", "head"] as const

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function markdownToParagraphs(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trimEnd()
    if (!line.trim()) continue
    if (line.startsWith("```")) continue
    if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({ text: line.slice(3).trim(), heading: HeadingLevel.HEADING_2 })
      )
      continue
    }
    if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({ text: line.slice(4).trim(), heading: HeadingLevel.HEADING_3 })
      )
      continue
    }
    if (line.startsWith("- ")) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.slice(2).trim() })],
          bullet: { level: 0 },
        })
      )
      continue
    }
    const plain = line.replace(/\*\*/g, "").replace(/`/g, "").trim()
    if (plain) {
      paragraphs.push(new Paragraph({ children: [new TextRun(plain)] }))
    }
  }
  return paragraphs
}

function schemaPropertyLines(schema: unknown, indent = 0): string[] {
  const s = asRecord(schema)
  if (!s) return []
  const pad = "  ".repeat(indent)
  const lines: string[] = []

  const desc = asString(s.description)
  const type = asString(s.type) ?? (s.enum ? "enum" : undefined)
  if (desc || type) {
    lines.push(`${pad}${type ? `[${type}] ` : ""}${desc ?? ""}`.trim())
  }

  const props = asRecord(s.properties)
  if (props) {
    for (const [name, propSchema] of Object.entries(props)) {
      const prop = asRecord(propSchema)
      const propType = prop ? (asString(prop.type) ?? "object") : "unknown"
      const propDesc = prop ? asString(prop.description) : undefined
      lines.push(`${pad}• ${name} (${propType}): ${propDesc ?? "—"}`)
      if (prop?.properties || prop?.items) {
        lines.push(...schemaPropertyLines(prop, indent + 1))
      }
    }
  }

  const items = asRecord(s.items)
  if (items) {
    lines.push(`${pad}• (mảng phần tử)`)
    lines.push(...schemaPropertyLines(items, indent + 1))
  }

  return lines
}

function contentSchemaLines(content: unknown): string[] {
  const contentObj = asRecord(content)
  if (!contentObj) return []
  const lines: string[] = []
  for (const [mediaType, media] of Object.entries(contentObj)) {
    const mediaRec = asRecord(media)
    const schema = mediaRec?.schema
    lines.push(`Content-Type: ${mediaType}`)
    lines.push(...schemaPropertyLines(schema))
  }
  return lines
}

function parametersTable(parameters: unknown[]): Table | null {
  if (!parameters.length) return null
  const header = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tên", bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Vị trí", bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Bắt buộc", bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mô tả", bold: true })] })] }),
    ],
  })
  const rows = parameters.map((param) => {
    const p = asRecord(param)
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(asString(p?.name) ?? "—")] }),
        new TableCell({ children: [new Paragraph(asString(p?.in) ?? "—")] }),
        new TableCell({
          children: [new Paragraph(p?.required === true ? "Có" : "Không")],
        }),
        new TableCell({ children: [new Paragraph(asString(p?.description) ?? "—")] }),
      ],
    })
  })
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  })
}

function collectOperations(doc: OpenApiDoc): Array<{
  tag: string
  path: string
  method: string
  operation: Record<string, unknown>
}> {
  const paths = asRecord(doc.paths) ?? {}
  const items: Array<{
    tag: string
    path: string
    method: string
    operation: Record<string, unknown>
  }> = []

  for (const [path, pathItem] of Object.entries(paths)) {
    const pathRec = asRecord(pathItem)
    if (!pathRec) continue
    for (const method of METHOD_ORDER) {
      const operation = asRecord(pathRec[method])
      if (!operation) continue
      const tags = Array.isArray(operation.tags)
        ? operation.tags.filter((t): t is string => typeof t === "string")
        : ["Khác"]
      for (const tag of tags) {
        items.push({ tag, path, method, operation })
      }
    }
  }

  items.sort((a, b) => {
    if (a.tag !== b.tag) return a.tag.localeCompare(b.tag, "vi")
    if (a.path !== b.path) return a.path.localeCompare(b.path)
    return METHOD_ORDER.indexOf(a.method as (typeof METHOD_ORDER)[number]) -
      METHOD_ORDER.indexOf(b.method as (typeof METHOD_ORDER)[number])
  })
  return items
}

export async function buildOpenApiDocx(openApiDoc: OpenApiDoc): Promise<Buffer> {
  const info = asRecord(openApiDoc.info) ?? {}
  const title = asString(info.title) ?? "API Documentation"
  const version = asString(info.version) ?? "1.0.0"
  const description = asString(info.description) ?? ""

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Phiên bản: ${version}`, italics: true }),
        new TextRun({ text: "  |  " }),
        new TextRun({
          text: `Xuất lúc: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`,
          italics: true,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ]

  if (description) {
    children.push(
      new Paragraph({ text: "Giới thiệu", heading: HeadingLevel.HEADING_1 }),
      ...markdownToParagraphs(description)
    )
  }

  const servers = openApiDoc.servers
  if (Array.isArray(servers) && servers.length) {
    children.push(new Paragraph({ text: "Máy chủ (Servers)", heading: HeadingLevel.HEADING_2 }))
    for (const server of servers) {
      const s = asRecord(server)
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${asString(s?.url) ?? "—"}`, bold: true }),
            new TextRun({ text: ` — ${asString(s?.description) ?? ""}` }),
          ],
        })
      )
    }
  }

  const securitySchemes = asRecord(asRecord(openApiDoc.components)?.securitySchemes)
  if (securitySchemes && Object.keys(securitySchemes).length) {
    children.push(new Paragraph({ text: "Xác thực", heading: HeadingLevel.HEADING_2 }))
    for (const [name, scheme] of Object.entries(securitySchemes)) {
      const s = asRecord(scheme)
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${name}: `, bold: true }),
            new TextRun({
              text: `${asString(s?.type) ?? ""} ${asString(s?.scheme) ?? ""}`.trim(),
            }),
          ],
        })
      )
    }
  }

  const operations = collectOperations(openApiDoc)
  let currentTag = ""
  for (const { tag, path, method, operation } of operations) {
    if (tag !== currentTag) {
      currentTag = tag
      children.push(
        new Paragraph({ text: "" }),
        new Paragraph({ text: tag, heading: HeadingLevel.HEADING_1 })
      )
    }

    const summary = asString(operation.summary) ?? asString(operation.operationId) ?? path
    const opDesc = asString(operation.description)

    children.push(
      new Paragraph({
        text: `${method.toUpperCase()} ${path}`,
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [new TextRun({ text: summary, bold: true })],
      })
    )
    if (opDesc) {
      children.push(...markdownToParagraphs(opDesc))
    }

    const parameters = Array.isArray(operation.parameters) ? operation.parameters : []
    if (parameters.length) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Tham số", bold: true })],
        })
      )
      const table = parametersTable(parameters)
      if (table) children.push(table)
    }

    const requestBody = asRecord(operation.requestBody)
    if (requestBody) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Request body", bold: true })],
        })
      )
      const rbDesc = asString(requestBody.description)
      if (rbDesc) children.push(new Paragraph(rbDesc))
      for (const line of contentSchemaLines(requestBody.content)) {
        children.push(new Paragraph({ children: [new TextRun({ text: line, size: 20 })] }))
      }
    }

    const responses = asRecord(operation.responses)
    if (responses) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Responses", bold: true })],
        })
      )
      for (const [status, response] of Object.entries(responses)) {
        const res = asRecord(response)
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `HTTP ${status}: `, bold: true }),
              new TextRun(asString(res?.description) ?? "—"),
            ],
          })
        )
        for (const line of contentSchemaLines(res?.content)) {
          children.push(new Paragraph({ children: [new TextRun({ text: line, size: 20 })] }))
        }
      }
    }
  }

  const document = new Document({
    sections: [{ properties: {}, children }],
  })

  return Packer.toBuffer(document)
}
