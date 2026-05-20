import { readFileSync, writeFileSync } from "fs"
import { STATS_ROUTE_DOCS } from "../src/dto/stats-route-docs"

const path = new URL("../src/api/stats.ts", import.meta.url).pathname
let content = readFileSync(path, "utf8")

if (!content.includes("STATS_ROUTE_DOCS")) {
  content = content.replace(
    'import { RequestSchema } from "../dto/training-coure.dto"',
    `import { RequestSchema } from "../dto/training-coure.dto"
import { STATS_ROUTE_DOCS } from "../dto/stats-route-docs"
import {
  PreviewOnlyRequestSchema,
  PreviewWithManagementOrgRequestSchema,
  PreviewWithSemesterRequestSchema,
  StudentsOfInterestRequestSchema,
  StatBaseResponseSchema,
} from "../dto/stats-openapi.dto"
import { fieldDesc } from "../dto/openapi-helpers"`
  )
}

content = content.replace(
  /const StatBaseSchema = z\.object\(\{[\s\S]*?\}\)/,
  "const StatBaseSchema = StatBaseResponseSchema"
)

const previewOnlyBlock = `schema: z.object({
              preview: z.boolean().default(false),
            }),`

const previewOnlyReplacement = `schema: PreviewOnlyRequestSchema,`

let count = 0
while (content.includes(previewOnlyBlock)) {
  content = content.replace(previewOnlyBlock, previewOnlyReplacement)
  count++
}

const mgmtBlock = `schema: z.object({
              preview: z.boolean().default(false),
              managementOrganizationId: z
                .string()
                .uuid()
                .describe("DM_DonVi.Id - ID đơn vị quản lý"),
            }),`
const mgmtReplacement = `schema: PreviewWithManagementOrgRequestSchema,`
while (content.includes(mgmtBlock)) {
  content = content.replace(mgmtBlock, mgmtReplacement)
  count++
}

const interestBlock = `schema: z.object({
              preview: z.boolean().default(false),
              warningLevel: z.string().optional(),
              debtCredits: z.string().optional(),
              gpaThreshold: z.string().optional(),
            }),`
const interestReplacement = `schema: StudentsOfInterestRequestSchema,`
if (content.includes(interestBlock)) {
  content = content.replace(interestBlock, interestReplacement)
}

const semesterBlocks = [
  `schema: z.object({
              preview: z.boolean().default(false),
              semesterId: z.string().describe("Semester.id - ID học kỳ"),
            }),`,
]
for (const block of semesterBlocks) {
  while (content.includes(block)) {
    content = content.replace(block, `schema: PreviewWithSemesterRequestSchema,`)
  }
}

for (const [routePath, docs] of Object.entries(STATS_ROUTE_DOCS)) {
  const pathLine = `    path: "${routePath}",`
  const idx = content.indexOf(pathLine)
  if (idx === -1) continue
  const afterPath = content.slice(idx, idx + 400)
  if (afterPath.includes("summary:")) continue
  const insert = `${pathLine}
    summary: ${JSON.stringify(docs.summary)},
    description: ${JSON.stringify(docs.description)},`
  content = content.replace(pathLine, insert)
}

writeFileSync(path, content)
console.log("Patched stats.ts")
