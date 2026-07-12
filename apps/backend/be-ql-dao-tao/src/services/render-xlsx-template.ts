import { getTemplateBuffer } from "@workspace/libs/server"
import { getMinioUrl } from "@workspace/libs/utils"
import type { PrismaClient } from "@workspace/db"
import XlsxTemplate from "xlsx-template"
import { mergeXlsxSheets } from "../utils/merge-xlsx-sheets"
import { patchToTrinhTemplate } from "../utils/patch-to-trinh-template"

export type XlsxTemplateSheetInput = {
  sheetName?: string
  sheet?: number | string
  data: Record<string, unknown>
}

export type RenderXlsxTemplateInput = {
  templatePath: string
  sheets: XlsxTemplateSheetInput[]
  autoPatchTablePlaceholders?: boolean
}

function normalizeTemplatePath(templatePath: string) {
  const trimmed = templatePath.trim()
  if (trimmed.startsWith("/")) {
    return trimmed
  }
  if (trimmed.startsWith("mta/")) {
    return `/${trimmed}`
  }
  return trimmed
}

export async function loadTemplateBuffer(prisma: PrismaClient, templatePath: string) {
  const normalized = normalizeTemplatePath(templatePath)

  if (normalized.startsWith("/")) {
    const url = getMinioUrl(normalized)
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Không tải được template: ${templatePath}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }

  return getTemplateBuffer(prisma, normalized)
}

async function renderSingleSheet(
  templateBuffer: Buffer,
  sheet: number | string,
  data: Record<string, unknown>,
  autoPatchTablePlaceholders: boolean
) {
  const preparedTemplate = autoPatchTablePlaceholders
    ? patchToTrinhTemplate(templateBuffer)
    : templateBuffer
  const template = new XlsxTemplate(preparedTemplate)
  template.substitute(sheet, data)
  return (await template.generate({ type: "nodebuffer" })) as Buffer
}

export async function renderXlsxTemplate(
  prisma: PrismaClient,
  { templatePath, sheets, autoPatchTablePlaceholders = false }: RenderXlsxTemplateInput
) {
  if (!sheets.length) {
    throw new Error("Cần ít nhất 1 sheet dữ liệu để xuất")
  }

  const templateBuffer = await loadTemplateBuffer(prisma, templatePath)
  const generatedSheets: { sheetName: string; buffer: Buffer }[] = []

  for (let index = 0; index < sheets.length; index++) {
    const sheetInput = sheets[index]
    const buffer = await renderSingleSheet(
      templateBuffer,
      sheetInput.sheet ?? 1,
      sheetInput.data,
      autoPatchTablePlaceholders
    )

    generatedSheets.push({
      sheetName: sheetInput.sheetName || `Sheet${index + 1}`,
      buffer,
    })
  }

  if (generatedSheets.length === 1) {
    return generatedSheets[0].buffer
  }

  return mergeXlsxSheets(generatedSheets)
}
