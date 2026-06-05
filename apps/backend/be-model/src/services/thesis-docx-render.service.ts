import { renderDocxTemplate } from "./docx-template-render.service"

type DocxTemplatePayload = {
  fileName: string
  path: string
  prefix?: string
  data: Record<string, unknown>
}

export async function renderThesisPaymentDocx(payload: DocxTemplatePayload): Promise<Buffer> {
  return renderDocxTemplate({
    path: payload.path,
    prefix: payload.prefix,
    data: payload.data,
  })
}
