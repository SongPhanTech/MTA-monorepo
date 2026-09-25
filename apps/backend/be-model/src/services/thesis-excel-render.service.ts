import { fetchMinio } from "@workspace/libs"
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

export async function renderThesisPaymentXlsx(payload: ExcelTemplatePayload): Promise<Buffer> {
  const templatePrefix = (payload.prefix ?? "/mta/luan-van").replace(/\/+$/, "")
  const templatePath = payload.path.replace(/^\/+/, "")

  let res = await fetchMinio(`${templatePrefix}/${templatePath}`)
  if (!res.ok && templatePrefix !== "/mta/template") {
    res = await fetchMinio(`/mta/template/${templatePath}`)
  }
  if (!res.ok) {
    throw new Error("Không tìm thấy template")
  }

  const arrayBuffer = await res.arrayBuffer()
  const templateBuffer = Buffer.from(arrayBuffer)

  const generatedSheets: { buffer: Buffer; pageBreakAfter?: boolean }[] = []
  for (let index = 0; index < payload.data.items.length; index++) {
    const item = payload.data.items[index]
    if (!item) continue
    const template = new XlsxTemplate(templateBuffer)
    template.substitute(1, item)
    const sheetBuffer = await template.generate({ type: "nodebuffer" })

    generatedSheets.push({
      buffer: Buffer.from(sheetBuffer as any),
      pageBreakAfter: index < payload.data.items.length - 1,
    })
  }

  const mergedBuffer = mergeXlsxBlocksToOneSheet(generatedSheets, { blockGapRows: 0 })
  return mergedBuffer
}
