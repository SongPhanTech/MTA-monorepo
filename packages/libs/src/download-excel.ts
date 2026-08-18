import { exportFromTemplate as exportFromTemplateApi } from "./api/training"
import type { FromTemplateRequest } from "./api/schemas"

export type ExportFromTemplateApiRequest = FromTemplateRequest

export function downloadExcelBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportFromTemplateViaApi(body: FromTemplateRequest) {
  return exportFromTemplateApi(body)
}

export async function exportAndDownloadFromTemplate(body: FromTemplateRequest) {
  const response = await exportFromTemplateViaApi(body)
  if (response.status !== 200 || !(response.data instanceof Blob)) {
    const message =
      response.data && typeof response.data === "object" && "message" in response.data
        ? String(response.data.message)
        : "Xuất Excel thất bại"
    throw new Error(message)
  }

  const ext = body.extension ?? body.templatePath.split(".").pop()?.toLowerCase() ?? "xlsx"
  const normalizedName =
    ext === "xls"
      ? body.fileName.endsWith(".xls")
        ? body.fileName
        : `${body.fileName}.xls`
      : body.fileName.endsWith(".xlsx")
        ? body.fileName
        : `${body.fileName}.xlsx`

  downloadExcelBlob(response.data, normalizedName)
}
