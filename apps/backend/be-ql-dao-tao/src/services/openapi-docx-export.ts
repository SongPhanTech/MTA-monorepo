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

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
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

type SchemaField = {
  name: string
  type: string
  required: boolean
  description: string
  example: string
  location?: string
}

function resolveRef(
  doc: OpenApiDoc,
  schema: unknown,
  depth = 0
): Record<string, unknown> | undefined {
  const s = asRecord(schema)
  if (!s) return undefined
  if (depth > 8) return s

  const ref = asString(s.$ref)
  if (ref) {
    const parts = ref.replace("#/", "").split("/")
    let current: unknown = doc
    for (const part of parts) {
      current = asRecord(current)?.[part]
    }
    const resolved = asRecord(current)
    if (resolved) {
      return resolveRef(doc, { ...resolved, ...s, $ref: undefined }, depth + 1)
    }
  }

  return s
}

function schemaTypeLabel(schema: Record<string, unknown>): string {
  if (schema.enum) return `enum(${asArray<string>(schema.enum).join(" | ")})`
  if (asString(schema.format)) return `${asString(schema.type) ?? "string"} (${schema.format})`
  if (schema.type) return asString(schema.type) ?? "unknown"
  if (schema.properties) return "object"
  if (schema.items) return "array"
  if (schema.oneOf || schema.anyOf || schema.allOf) return "union"
  return "unknown"
}

function collectSchemaFields(
  doc: OpenApiDoc,
  schema: unknown,
  prefix = "",
  requiredSet: Set<string> = new Set(),
  visited = new Set<string>(),
  depth = 0
): SchemaField[] {
  if (depth > 8) return []

  const rawRef = asString(asRecord(schema)?.$ref)
  if (rawRef) {
    if (visited.has(rawRef)) return []
    visited.add(rawRef)
  }

  const s = resolveRef(doc, schema)
  if (!s) return []

  if (s.oneOf || s.anyOf || s.allOf) {
    if (prefix === "") {
      return [
        {
          name: "(giá trị)",
          type: schemaTypeLabel(s),
          required: true,
          description: asString(s.description) ?? "—",
          example: s.example !== undefined ? JSON.stringify(s.example) : "—",
        },
      ]
    }
    return []
  }

  const fields: SchemaField[] = []
  const required = new Set(asArray<string>(s.required))
  const props = asRecord(s.properties)

  if (props) {
    for (const [name, propSchema] of Object.entries(props)) {
      const prop = resolveRef(doc, propSchema)
      if (!prop) continue
      const fullName = prefix ? `${prefix}.${name}` : name
      const isRequired = required.has(name) || requiredSet.has(fullName)
      fields.push({
        name: fullName,
        type: schemaTypeLabel(prop),
        required: isRequired,
        description: asString(prop.description) ?? "—",
        example: prop.example !== undefined ? JSON.stringify(prop.example) : "—",
      })
      if (prop.properties || prop.items) {
        fields.push(
          ...collectSchemaFields(doc, propSchema, fullName, requiredSet, visited, depth + 1)
        )
      }
    }
    return fields
  }

  const items = resolveRef(doc, s.items)
  if (items && !prefix) {
    fields.push({
      name: "(mảng)",
      type: `array<${schemaTypeLabel(items)}>`,
      required: true,
      description: asString(s.description) ?? "Danh sách phần tử",
      example: "—",
    })
    fields.push(...collectSchemaFields(doc, s.items, "[]", requiredSet, visited, depth + 1))
  } else if (items) {
    fields.push(
      ...collectSchemaFields(doc, s.items, `${prefix}[]`, requiredSet, visited, depth + 1)
    )
  } else if (!props && prefix === "") {
    fields.push({
      name: "(giá trị)",
      type: schemaTypeLabel(s),
      required: true,
      description: asString(s.description) ?? "—",
      example: s.example !== undefined ? JSON.stringify(s.example) : "—",
    })
  }

  return fields
}

function schemaFieldsTable(fields: SchemaField[]): Table | null {
  if (!fields.length) return null
  const header = new TableRow({
    children: ["Tên", "Vị trí", "Kiểu", "Bắt buộc", "Mô tả", "Ví dụ"].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
        })
    ),
  })
  const rows = fields.map(
    (f) =>
      new TableRow({
        children: [
          f.name,
          f.location ?? "—",
          f.type,
          f.required ? "Có" : "Không",
          f.description,
          f.example,
        ].map((text) => new TableCell({ children: [new Paragraph(text)] })),
      })
  )
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  })
}

function parametersFromRequestBody(
  doc: OpenApiDoc,
  requestBody: Record<string, unknown>
): SchemaField[] {
  const fields: SchemaField[] = []
  const content = asRecord(requestBody.content)
  if (!content) return fields

  for (const [mediaType, media] of Object.entries(content)) {
    const schema = asRecord(media)?.schema
    const bodyFields = collectSchemaFields(doc, schema)
    for (const f of bodyFields) {
      fields.push({ ...f, location: `body (${mediaType})` })
    }
    if (!bodyFields.length) {
      fields.push({
        name: "(body)",
        type: mediaType,
        required: requestBody.required !== false,
        description: asString(requestBody.description) ?? "Request body",
        example: "—",
        location: `body (${mediaType})`,
      })
    }
  }
  return fields
}

function parametersFromOperation(
  doc: OpenApiDoc,
  operation: Record<string, unknown>
): SchemaField[] {
  const fields: SchemaField[] = []

  for (const param of asArray<unknown>(operation.parameters)) {
    const p = asRecord(param)
    if (!p) continue
    const schema = resolveRef(doc, p.schema)
    fields.push({
      name: asString(p.name) ?? "—",
      location: asString(p.in) ?? "—",
      type: schema ? schemaTypeLabel(schema) : "—",
      required: p.required === true,
      description: asString(p.description) ?? asString(schema?.description) ?? "—",
      example: schema?.example !== undefined ? JSON.stringify(schema.example) : "—",
    })
  }

  const requestBody = asRecord(operation.requestBody)
  if (requestBody) {
    fields.push(...parametersFromRequestBody(doc, requestBody))
  }

  return fields
}

function responseSchemaTable(doc: OpenApiDoc, response: Record<string, unknown>): Table | null {
  const content = asRecord(response.content)
  if (!content) return null

  const fields: SchemaField[] = []
  for (const [mediaType, media] of Object.entries(content)) {
    const schema = asRecord(media)?.schema
    const schemaFields = collectSchemaFields(doc, schema)
    if (schemaFields.length) {
      for (const f of schemaFields) {
        fields.push({ ...f, location: mediaType })
      }
    } else {
      fields.push({
        name: "(nội dung)",
        location: mediaType,
        type: asString(asRecord(schema)?.format) === "binary" ? "binary" : mediaType,
        required: true,
        description: asString(asRecord(schema)?.description) ?? "—",
        example: "—",
      })
    }
  }
  return schemaFieldsTable(fields)
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
    return (
      METHOD_ORDER.indexOf(a.method as (typeof METHOD_ORDER)[number]) -
      METHOD_ORDER.indexOf(b.method as (typeof METHOD_ORDER)[number])
    )
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

    const inputFields = parametersFromOperation(openApiDoc, operation)
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Đầu vào", bold: true })],
      })
    )
    if (inputFields.length) {
      const inputTable = schemaFieldsTable(inputFields)
      if (inputTable) children.push(inputTable)
    } else {
      children.push(new Paragraph({ children: [new TextRun("Không có tham số.")] }))
    }

    const responses = asRecord(operation.responses) ?? {}
    const successEntries = Object.entries(responses).filter(([status]) => status.startsWith("2"))
    const errorEntries = Object.entries(responses).filter(([status]) => !status.startsWith("2"))

    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Phản hồi thành công", bold: true })],
      })
    )
    if (successEntries.length) {
      for (const [status, response] of successEntries) {
        const res = asRecord(response) ?? {}
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `HTTP ${status}: `, bold: true }),
              new TextRun(asString(res.description) ?? "—"),
            ],
          })
        )
        const table = responseSchemaTable(openApiDoc, res)
        if (table) children.push(table)
      }
    } else {
      children.push(new Paragraph({ children: [new TextRun("—")] }))
    }

    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Phản hồi lỗi / thất bại", bold: true })],
      })
    )
    if (errorEntries.length) {
      for (const [status, response] of errorEntries) {
        const res = asRecord(response) ?? {}
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `HTTP ${status}: `, bold: true }),
              new TextRun(asString(res.description) ?? "—"),
            ],
          })
        )
        const table = responseSchemaTable(openApiDoc, res)
        if (table) children.push(table)
      }
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun("Có thể trả về 400/404/409/500 theo handler chung — xem phần Giới thiệu."),
          ],
        })
      )
    }
  }

  const document = new Document({
    sections: [{ properties: {}, children }],
  })

  return Packer.toBuffer(document)
}
