import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const UploadExcelModel = z
  .object({
    file: z
      .instanceof(File)
      .refine(
        (file) =>
          [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
            "application/vnd.ms-excel",
            "application/vnd.oasis.opendocument.spreadsheet",
          ].includes(file.type),
        "Định dạng file không hỗ trợ"
      )
      .openapi({
        type: "string",
        format: "binary",
        description: "File Excel (.xlsx, .xlsm, .xlsb, .xls, .ods).",
      }),
  })
  .openapi("UploadExcel")
