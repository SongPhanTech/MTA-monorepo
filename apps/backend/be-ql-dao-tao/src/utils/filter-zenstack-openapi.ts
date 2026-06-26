import { QL_DAO_TAO_MODEL_PATH_SEGMENTS } from "./ql-dao-tao-models"

type OpenApiDoc = Record<string, unknown>

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => !!asRecord(item))
}

const ALLOWED_READ_OPERATIONS = new Set(["findMany", "findUnique"])

function filterPathMethods(pathItem: Record<string, unknown>): Record<string, unknown> | undefined {
  const getMethod = asRecord(pathItem.get)
  if (!getMethod) return undefined
  return { get: getMethod }
}

function isAllowedZenstackReadPath(path: string): boolean {
  const operation = path.split("/").pop()
  return operation ? ALLOWED_READ_OPERATIONS.has(operation) : false
}

export function filterZenstackOpenApiForQlDaoTao(doc: OpenApiDoc): OpenApiDoc {
  const paths = asRecord(doc.paths) ?? {}
  const filteredPaths: Record<string, unknown> = {}

  for (const [path, pathItem] of Object.entries(paths)) {
    const match = path.match(/^\/api\/model\/([^/]+)/)
    if (!match?.[1] || !QL_DAO_TAO_MODEL_PATH_SEGMENTS.has(match[1])) continue
    if (!isAllowedZenstackReadPath(path)) continue

    const record = asRecord(pathItem)
    if (!record) continue

    const getOnly = filterPathMethods(record)
    if (getOnly) filteredPaths[path] = getOnly
  }

  const filteredTags = asArray(doc.tags).filter((tag) => {
    const name = typeof tag.name === "string" ? tag.name : ""
    return QL_DAO_TAO_MODEL_PATH_SEGMENTS.has(name)
  })

  return {
    ...doc,
    paths: filteredPaths,
    ...(filteredTags.length > 0 ? { tags: filteredTags } : {}),
  }
}
