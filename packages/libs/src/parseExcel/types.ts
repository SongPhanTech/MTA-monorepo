import { z } from "@hono/zod-openapi"

export const zParseSheetError = z
  .object({
    sheetRef: z.string(),
    cellRef: z.string().nullable(),
    message: z.string(),
  })
  .openapi("ParseSheetError")
export type ParseSheetError = z.infer<typeof zParseSheetError>
