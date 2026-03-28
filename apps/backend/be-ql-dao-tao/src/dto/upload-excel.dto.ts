import { z } from "@hono/zod-openapi"

export const UploadExcelModel = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) =>
        [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
          "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm
          "application/vnd.ms-excel.sheet.binary.macroEnabled.12", // .xlsb
          "application/vnd.ms-excel", // .xls
          "application/vnd.oasis.opendocument.spreadsheet", // .ods
        ].includes(file.type),
      "Định dạng file không hỗ trợ"
    )
    // .refine(
    //     (f) => {
    //         const allowedExtensions = [
    //             '.xlsx',
    //             '.xlsm',
    //             '.xlsb',
    //             '.xls',
    //             '.ods',
    //         ]
    //         return allowedExtensions.some((ext) =>
    //             f.name.toLowerCase().endsWith(ext)
    //         )
    //     },
    //     { message: 'Định dạng file không hỗ trợ' }
    // )
    .openapi({ type: "string", format: "binary" }),
})
