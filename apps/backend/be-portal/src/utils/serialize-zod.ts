import { ZodArray, ZodNullable, ZodObject, ZodOptional, type ZodTypeAny, z } from "zod"

export interface SerializedField {
  path: string
  type: string
  description?: string
  items?: SerializedField[]
}

const SerializedFieldScalar = z.object({
  path: z.string(),
  type: z.string(),
  description: z.string().optional(),
})

export const SerializedFieldSchema = SerializedFieldScalar.extend({
  items: z.array(SerializedFieldScalar).optional(),
}).openapi("SerializedField")

export const SerializedFieldsSchema = z.array(SerializedFieldSchema).openapi("SerializedFields")

function unwrap(schema: ZodTypeAny): ZodTypeAny {
  let current = schema
  while (current instanceof ZodOptional || current instanceof ZodNullable) {
    current = current.unwrap()
  }
  return current
}

function getType(schema: ZodTypeAny): string {
  const def = schema._def
  switch (def.typeName) {
    case "ZodString":
      return "string"
    case "ZodNumber":
      return "number"
    case "ZodBoolean":
      return "boolean"
    case "ZodDate":
      return "date"
    case "ZodObject":
      return "object"
    case "ZodArray":
      return "array"
    default:
      return "unknown"
  }
}

export function serializeZodSchema(schema: ZodObject<any>): SerializedField[] {
  const shape = schema.shape
  return Object.entries(shape).map(([key, value]: [string, any]) => {
    const unwrapped = unwrap(value)
    const type = getType(unwrapped)

    if (unwrapped instanceof ZodArray) {
      const element = unwrap(unwrapped.element)
      const elementType = getType(element)

      if (element instanceof ZodObject) {
        return {
          path: key,
          type: "array",
          description: value.description,
          items: serializeZodSchema(element),
        }
      }

      return {
        path: key,
        type: "array",
        description: value.description,
        items: [
          {
            path: "",
            type: elementType,
            description: element.description,
          },
        ],
      }
    }

    return {
      path: key,
      type,
      description: value.description,
    }
  })
}
