import { readFile } from "node:fs/promises"
import type { PrismaClient } from "@workspace/db"
import {
  buildExcelFromTemplate,
  type BuildExcelFromTemplateOptions,
} from "@workspace/libs/template-excel-core"
import { loadTemplateBuffer } from "./render-xlsx-template"

export type BuildFromTemplateInput = Omit<BuildExcelFromTemplateOptions, "templateBuffer"> & {
  templatePath: string
  prefix?: string
  /** Đường dẫn file local dùng khi không tải được template trên MinIO. */
  localTemplatePath?: string
}

export async function buildFromTemplate(prisma: PrismaClient, input: BuildFromTemplateInput) {
  let templateBuffer: Buffer
  try {
    templateBuffer = await loadTemplateBuffer(prisma, input.templatePath, input.prefix)
  } catch (error) {
    if (!input.localTemplatePath) throw error
    templateBuffer = await readFile(input.localTemplatePath)
  }
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
    pageBreakBetweenSheets: input.pageBreakBetweenSheets,
    pageSetup: input.pageSetup,
    preserveTemplateStyle: input.preserveTemplateStyle,
  })
}
