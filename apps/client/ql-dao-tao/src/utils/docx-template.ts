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
