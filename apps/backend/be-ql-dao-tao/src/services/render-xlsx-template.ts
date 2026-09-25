import { getTemplateBuffer } from "@workspace/libs/server"
import { fetchMinio } from "@workspace/libs/utils"
import type { PrismaClient } from "@workspace/db"
import XlsxTemplate from "xlsx-template"
import { mergeXlsxBlocksToOneSheet } from "../utils/merge-xlsx-blocks"
import { mergeXlsxSheets } from "../utils/merge-xlsx-sheets"
import { patchToTrinhTemplate } from "../utils/patch-to-trinh-template"

export type XlsxTemplateSheetInput = {
  sheetName?: string
  sheet?: number | string
  data: Record<string, unknown>
  /** Chèn ngắt trang sau block này (chỉ khi mergeBlocksToOneSheet = true) */
  pageBreakAfter?: boolean
}

export type RenderXlsxTemplateInput = {
  templatePath: string
  sheets: XlsxTemplateSheetInput[]
  autoPatchTablePlaceholders?: boolean
  /**
   * Ghép nhiều block vào 1 sheet (xếp dọc), giữ shape bằng cách offset drawing XML.
   * Mặc định false → mỗi phần tử sheets[] = 1 tab riêng.
   */
  mergeBlocksToOneSheet?: boolean
  /** Số dòng trống giữa các block khi ghép dọc. Mặc định 0 */
  blockGapRows?: number
  /**
   * Prefix đường dẫn MinIO (ví dụ `/mta/template`).
   * Không truyền → lấy mặc định từ DB template / `/mta/template`.
   */
  prefix?: string
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

function joinPrefixAndPath(prefix: string, templatePath: string) {
  const p = prefix.trim().replace(/\/+$/, "")
  const name = templatePath.trim().replace(/^\/+/, "")
  const joined = `${p}/${name}`
  return joined.startsWith("/") ? joined : `/${joined}`
}

export async function loadTemplateBuffer(
  prisma: PrismaClient,
  templatePath: string,
  prefix?: string
) {
  const normalized = normalizeTemplatePath(templatePath)

  // Có prefix → luôn lấy từ MinIO theo prefix + file name
  if (prefix?.trim()) {
    const fullPath = joinPrefixAndPath(prefix, normalized)
    const res = await fetchMinio(fullPath)
    if (!res.ok) {
      throw new Error(`Không tải được template: ${fullPath}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }

  // Path tuyệt đối (bắt đầu /) → MinIO trực tiếp
  if (normalized.startsWith("/")) {
    const res = await fetchMinio(normalized)
    if (!res.ok) {
      throw new Error(`Không tải được template: ${templatePath}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }

  // Không truyền prefix → mặc định từ DB template / fallback /mta/template
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
  {
    templatePath,
    sheets,
    autoPatchTablePlaceholders = false,
    mergeBlocksToOneSheet,
    blockGapRows = 0,
    prefix,
  }: RenderXlsxTemplateInput
) {
  if (!sheets.length) {
    throw new Error("Cần ít nhất 1 sheet dữ liệu để xuất")
  }

  const templateBuffer = await loadTemplateBuffer(prisma, templatePath, prefix)
  const generatedSheets: {
    sheetName: string
    buffer: Buffer
    pageBreakAfter?: boolean
  }[] = []

  for (let index = 0; index < sheets.length; index++) {
    const sheetInput = sheets[index]!
    const buffer = await renderSingleSheet(
      templateBuffer,
      sheetInput.sheet ?? 1,
      sheetInput.data,
      autoPatchTablePlaceholders
    )

    generatedSheets.push({
      sheetName: sheetInput.sheetName || `Sheet${index + 1}`,
      buffer,
      pageBreakAfter: sheetInput.pageBreakAfter,
    })
  }

  if (generatedSheets.length === 1) {
    return generatedSheets[0]!.buffer
  }

  // true → luôn ghép 1 sheet
  // undefined + không có sheetName → cũng ghép 1 sheet (tránh tạo Sheet1/Sheet2/...)
  // false → nhiều tab (dùng khi cần sheetName riêng như tờ trình TKB)
  const shouldMergeToOneSheet =
    mergeBlocksToOneSheet === true ||
    (mergeBlocksToOneSheet !== false && sheets.every((s) => !s.sheetName))

  if (shouldMergeToOneSheet) {
    return mergeXlsxBlocksToOneSheet(
      generatedSheets.map((s) => ({
        buffer: s.buffer,
        pageBreakAfter: s.pageBreakAfter,
      })),
      { blockGapRows }
    )
  }

  return mergeXlsxSheets(generatedSheets)
}
