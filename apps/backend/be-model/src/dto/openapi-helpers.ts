/** Mô tả trường cho OpenAPI (Scalar / Swagger). */
export function fieldDesc(description: string): { description: string }
export function fieldDesc(
  description: string,
  example: string
): { description: string; example: string }
export function fieldDesc(
  description: string,
  example: number
): { description: string; example: number }
export function fieldDesc(
  description: string,
  example: boolean
): { description: string; example: boolean }
export function fieldDesc(description: string, example?: string | number | boolean) {
  return example === undefined ? { description } : { description, example }
}
