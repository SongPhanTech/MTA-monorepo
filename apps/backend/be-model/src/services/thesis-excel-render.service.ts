import { getMinioUrl } from "@workspace/libs"
import XlsxTemplate from "xlsx-template"
import { mergeXlsxBlocksToOneSheet } from "../utils/merge-xlsx-blocks"

type ExcelTemplatePayload = {
  fileName: string
  path: string
  prefix?: string | null
  data: {
    items: Array<Record<string, unknown>>
  }
}

type RenderLuanVanXlsxOptions = {
  path: string
  prefix?: string | null
  items: Array<Record<string, unknown>>
  prepareTemplate?: (templateBuffer: Buffer) => Buffer
}

async function loadLuanVanTemplateBuffer(path: string, prefix?: string | null) {
  const templatePrefix = (prefix ?? "/mta/luan-van").replace(/\/+$/, "")
  const templatePath = path.replace(/^\/+/, "")

  let res = await fetch(getMinioUrl(`${templatePrefix}/${templatePath}`))
  if (!res.ok && templatePrefix !== "/mta/template") {
    res = await fetch(getMinioUrl(`/mta/template/${templatePath}`))
  }
  if (!res.ok) {
    throw new Error("Không tìm thấy template")
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function renderLuanVanXlsxFromItems({
  path,
  prefix,
  items,
  prepareTemplate,
}: RenderLuanVanXlsxOptions): Promise<Buffer> {
  if (!items.length) {
    throw new Error("Không có dữ liệu để xuất file Excel")
  }

  let templateBuffer = await loadLuanVanTemplateBuffer(path, prefix)
  if (prepareTemplate) {
    templateBuffer = prepareTemplate(templateBuffer)
  }

  const generatedSheets: { buffer: Buffer; pageBreakAfter?: boolean }[] = []
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    if (!item) continue
    const template = new XlsxTemplate(templateBuffer)
    template.substitute(1, item)
    const sheetBuffer = await template.generate({ type: "nodebuffer" })

    generatedSheets.push({
      buffer: Buffer.from(sheetBuffer as ArrayBuffer),
      pageBreakAfter: index < items.length - 1,
    })
  }

  if (generatedSheets.length === 1) {
    return generatedSheets[0]!.buffer
  }

  return mergeXlsxBlocksToOneSheet(generatedSheets, { blockGapRows: 0 })
}

export async function renderThesisPaymentXlsx(payload: ExcelTemplatePayload): Promise<Buffer> {
  return renderLuanVanXlsxFromItems({
    path: payload.path,
    prefix: payload.prefix,
    items: payload.data.items,
  })
}
