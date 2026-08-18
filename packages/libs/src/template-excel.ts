import { saveAs } from "file-saver"
import {
  buildExcelFromTemplate,
  type BuildExcelFromTemplateOptions,
  type SheetExportOptions,
  type TableCell,
  type TableRow,
} from "./template-excel-core"

export type { BuildExcelFromTemplateOptions, SheetExportOptions, TableCell, TableRow }

export interface ExportOptions extends Omit<BuildExcelFromTemplateOptions, "templateBuffer"> {
  templateUrl: string
}

export async function exportFromTemplate(options: ExportOptions) {
  const { templateUrl, fileName, extension, ...rest } = options
  const response = await fetch(templateUrl)
  if (!response.ok) {
    throw new Error(`Không tải được template: ${response.status} ${response.statusText}`)
  }
  const templateBuffer = await response.arrayBuffer()
  const ext = extension ?? templateUrl.split(".").pop()?.toLowerCase() ?? "xlsx"
  const outBuffer = await buildExcelFromTemplate({
    ...rest,
    templateBuffer,
    fileName,
    extension: ext,
  })

  const mimeType =
    ext === "xls"
      ? "application/vnd.ms-excel"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  const normalizedName =
    ext === "xls"
      ? fileName.endsWith(".xls")
        ? fileName
        : `${fileName}.xls`
      : fileName.endsWith(".xlsx")
        ? fileName
        : `${fileName}.xlsx`

  saveAs(new Blob([outBuffer], { type: mimeType }), normalizedName)
}
