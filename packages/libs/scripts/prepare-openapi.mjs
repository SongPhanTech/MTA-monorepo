import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const presets = {
  training: {
    sourceUrl:
      process.env.TRAINING_OPENAPI_URL ?? "https://mta.swantech.vn/api/lms/openapi",
    outputPath: path.join(__dirname, "../openapi/training.openapi.json"),
  },
  ems: {
    sourceUrl: process.env.EMS_OPENAPI_URL ?? "https://mta.swantech.vn/api/ems/openapi",
    outputPath: path.join(__dirname, "../openapi/ems.openapi.json"),
  },
}

function collectRefs(obj, refs = new Set(), depth = 0) {
  if (!obj || depth > 30) return refs
  if (typeof obj === "object") {
    if (obj.$ref) refs.add(obj.$ref)
    for (const value of Object.values(obj)) collectRefs(value, refs, depth + 1)
  }
  return refs
}

async function prepareOpenApi({ sourceUrl, outputPath }) {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI from ${sourceUrl}: ${response.status}`)
  }

  const spec = await response.json()
  const paths = {}

  for (const [route, methods] of Object.entries(spec.paths ?? {})) {
    if (!route.startsWith("/api/model/")) {
      paths[route] = methods
    }
  }

  const schemas = spec.components?.schemas ?? {}
  const needed = new Set()
  const queue = []

  for (const methods of Object.values(paths)) {
    for (const operation of Object.values(methods)) {
      for (const ref of collectRefs(operation)) {
        if (ref.startsWith("#/components/schemas/")) queue.push(ref)
      }
    }
  }

  while (queue.length > 0) {
    const ref = queue.pop()
    if (!ref?.startsWith("#/components/schemas/") || needed.has(ref)) continue

    needed.add(ref)
    const name = ref.slice("#/components/schemas/".length)
    const schema = schemas[name]
    if (!schema) continue

    for (const nestedRef of collectRefs(schema)) {
      if (nestedRef.startsWith("#/components/schemas/") && !needed.has(nestedRef)) {
        queue.push(nestedRef)
      }
    }
  }

  const prunedSchemas = {}
  for (const ref of needed) {
    const name = ref.slice("#/components/schemas/".length)
    if (schemas[name]) prunedSchemas[name] = schemas[name]
  }

  const prepared = {
    ...spec,
    paths,
    components: {
      ...spec.components,
      schemas: prunedSchemas,
    },
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(prepared))

  const operationCount = Object.values(paths).reduce(
    (count, methods) =>
      count + Object.values(methods).filter((operation) => operation?.operationId).length,
    0
  )

  console.log(
    `[prepare-openapi] ${sourceUrl} -> ${outputPath} (${operationCount} ops, ${Object.keys(prunedSchemas).length} schemas)`
  )
}

async function main() {
  const target = process.argv[2] ?? "all"
  const jobs =
    target === "all"
      ? Object.values(presets)
      : [presets[target]].filter(Boolean)

  if (jobs.length === 0) {
    throw new Error(`Unknown preset "${target}". Use: training | ems | all`)
  }

  for (const job of jobs) {
    await prepareOpenApi(job)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
