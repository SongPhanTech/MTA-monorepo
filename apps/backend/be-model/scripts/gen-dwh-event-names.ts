/**
 * Sinh src/dwh/event-names.ts = toàn bộ model thuộc @@schema("ql-dao-tao") trong schema.prisma.
 * Chạy lại sau khi thêm/bớt bảng ở schema ql-dao-tao:
 *   bun scripts/gen-dwh-event-names.ts
 * Chỉ đọc file schema, không import app, không chạm DB.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const DWH_SCHEMA = "ql-dao-tao"
const REQUIRED_FIELDS = ["id", "updatedAt", "deletedAt"]

const root = join(import.meta.dir, "..")
const schemaPath = join(root, "../../../packages/database/prisma/schema.prisma")
const outputPath = join(root, "src/dwh/event-names.ts")

const schema = readFileSync(schemaPath, "utf8")
const models = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)]

const names: string[] = []
const skipped: string[] = []
for (const [, name, body] of models) {
  if (!name || !body?.includes(`@@schema("${DWH_SCHEMA}")`)) continue
  const missing = REQUIRED_FIELDS.filter((field) => !new RegExp(`^\\s+${field}\\s`, "m").test(body))
  if (missing.length) skipped.push(`${name} (thiếu ${missing.join(", ")})`)
  else names.push(name)
}
names.sort((a, b) => a.localeCompare(b))

const content = `// Sinh tự động bởi scripts/gen-dwh-event-names.ts — không sửa tay.
// Toàn bộ model thuộc @@schema("${DWH_SCHEMA}") có đủ ${REQUIRED_FIELDS.join(", ")}.

export const DWH_EVENT_NAMES = [
${names.map((name) => `  "${name}",`).join("\n")}
] as const

export type DwhEventName = (typeof DWH_EVENT_NAMES)[number]
`

writeFileSync(outputPath, content)
console.log(`Đã ghi ${names.length} event vào ${outputPath}`)
if (skipped.length) console.warn("Bỏ qua (không phân trang được):", skipped.join("; "))
