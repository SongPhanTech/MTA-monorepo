import { customModelFetch } from "@workspace/libs/api/custom-instance"

export interface DocxTemplateBody {
  fileName: string
  path: string
  prefix?: string
  data: Record<string, unknown>
}

export interface CustomModelResponse<T> {
  status: number
  data: T
  headers: Headers
}

export const docxTemplate = (body: DocxTemplateBody): Promise<CustomModelResponse<Blob>> => {
  return customModelFetch<CustomModelResponse<Blob>>("/api/docx-template", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

export const previewDocxTemplate = (
  body: DocxTemplateBody & { previewKey: string }
): Promise<CustomModelResponse<{ path: string; fileType: string }>> => {
  return customModelFetch<CustomModelResponse<{ path: string; fileType: string }>>(
    "/api/docx-template/preview",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )
}
