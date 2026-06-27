import { filterZenstackOpenApiForKhaoThi } from "./filter-zenstack-openapi"

type OpenApiDoc = Record<string, unknown>

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function mergeComponents(
  honoComponents: Record<string, unknown> | undefined,
  zenstackComponents: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!honoComponents && !zenstackComponents) return undefined

  const merged: Record<string, unknown> = {}
  const sectionKeys = new Set([
    ...Object.keys(zenstackComponents ?? {}),
    ...Object.keys(honoComponents ?? {}),
  ])

  for (const key of sectionKeys) {
    const zenstackSection = asRecord(zenstackComponents?.[key])
    const honoSection = asRecord(honoComponents?.[key])
    if (zenstackSection || honoSection) {
      merged[key] = { ...zenstackSection, ...honoSection }
    }
  }

  return merged
}

function mergeTags(
  honoTags: unknown,
  zenstackTags: unknown
): Array<Record<string, unknown>> | undefined {
  const allTags = [...asArray(zenstackTags), ...asArray(honoTags)]
  if (allTags.length === 0) return undefined

  const seen = new Set<string>()
  const merged: Array<Record<string, unknown>> = []

  for (const tag of allTags) {
    const record = asRecord(tag)
    if (!record) continue
    const name = typeof record.name === "string" ? record.name : undefined
    if (name && seen.has(name)) continue
    if (name) seen.add(name)
    merged.push(record)
  }

  return merged.length > 0 ? merged : undefined
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => !!asRecord(item))
}

export function mergeOpenApiSpecs(honoDoc: OpenApiDoc, zenstackDoc: OpenApiDoc): OpenApiDoc {
  const filteredZenstackDoc = filterZenstackOpenApiForKhaoThi(zenstackDoc)
  const honoPaths = asRecord(honoDoc.paths) ?? {}
  const zenstackPaths = asRecord(filteredZenstackDoc.paths) ?? {}
  const components = mergeComponents(
    asRecord(honoDoc.components),
    asRecord(filteredZenstackDoc.components)
  )
  const tags = mergeTags(honoDoc.tags, filteredZenstackDoc.tags)

  return {
    ...honoDoc,
    paths: { ...zenstackPaths, ...honoPaths },
    ...(components ? { components } : {}),
    ...(tags ? { tags } : {}),
  }
}
