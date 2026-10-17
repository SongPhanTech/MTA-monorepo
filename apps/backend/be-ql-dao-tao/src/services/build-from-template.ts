import type { PrismaClient } from "@workspace/db"
import {
  buildExcelFromTemplate,
  type BuildExcelFromTemplateOptions,
} from "@workspace/libs/template-excel-core"
import { loadTemplateBuffer } from "./render-xlsx-template"

export type BuildFromTemplateInput = Omit<BuildExcelFromTemplateOptions, "templateBuffer"> & {
  templatePath: string
  prefix?: string
}

export async function buildFromTemplate(prisma: PrismaClient, input: BuildFromTemplateInput) {
  const templateBuffer = await loadTemplateBuffer(prisma, input.templatePath, input.prefix)
  const extension = input.extension ?? input.templatePath.split(".").pop()?.toLowerCase() ?? "xlsx"

  return buildExcelFromTemplate({
    templateBuffer,
    extension,
    sheets: input.sheets,
    fileName: input.fileName,
    fontFamily: input.fontFamily,
    fontSize: input.fontSize,
    mergeSheetsToOne: input.mergeSheetsToOne,
    sheetName: input.sheetName,
  })
}
