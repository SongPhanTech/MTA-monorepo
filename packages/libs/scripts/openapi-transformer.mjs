/**
 * Chuẩn hoá spec trước khi orval sinh code.
 *
 * Zod `z.instanceof(File)` không kèm `.openapi({ type: "string", format: "binary" })`
 * sẽ sinh ra schema rỗng -> orval cho ra kiểu `unknown`, khiến `formData.append` lỗi type.
 * Ở đây ép mọi field trong body `multipart/form-data` không có `type` thành binary (Blob).
 */
const isEmptySchema = (schema) =>
  !!schema &&
  typeof schema === "object" &&
  !schema.type &&
  !schema.$ref &&
  !schema.allOf &&
  !schema.anyOf &&
  !schema.oneOf &&
  !schema.enum

export default (spec) => {
  for (const methods of Object.values(spec.paths ?? {})) {
    for (const operation of Object.values(methods ?? {})) {
      const schema = operation?.requestBody?.content?.["multipart/form-data"]?.schema
      for (const [name, property] of Object.entries(schema?.properties ?? {})) {
        if (isEmptySchema(property)) {
          schema.properties[name] = { ...property, type: "string", format: "binary" }
        }
      }
    }
  }

  return spec
}
