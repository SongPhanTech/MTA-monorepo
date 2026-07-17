import PizZip from "pizzip"

const TABLE_PLACEHOLDERS = [
  { cell: "G7", field: "weekday" },
  { cell: "H7", field: "period" },
  { cell: "I7", field: "room" },
] as const

function appendSharedStrings(sharedStringsXml: string, placeholders: string[]) {
  const uniqueCountMatch = sharedStringsXml.match(/uniqueCount="(\d+)"/)
  const countMatch = sharedStringsXml.match(/count="(\d+)"/)
  const currentUnique = Number(uniqueCountMatch?.[1] ?? 0)
  const currentCount = Number(countMatch?.[1] ?? 0)

  const newItems = placeholders.map((placeholder) => `<si><t>${placeholder}</t></si>`).join("")

  const updatedXml = sharedStringsXml
    .replace(/uniqueCount="\d+"/, `uniqueCount="${currentUnique + placeholders.length}"`)
    .replace(/count="\d+"/, `count="${currentCount + placeholders.length}"`)
    .replace("</sst>", `${newItems}</sst>`)

  const startIndex = currentUnique
  return {
    xml: updatedXml,
    indices: placeholders.map((_, index) => startIndex + index),
  }
}

function upsertSharedStringCell(
  sheetXml: string,
  cellRef: string,
  sharedStringIndex: number,
  style?: string
) {
  const styleAttr = style ? ` s="${style}"` : ""
  const replacement = `<c r="${cellRef}"${styleAttr} t="s"><v>${sharedStringIndex}</v></c>`
  const selfClosingPattern = new RegExp(`<c r="${cellRef}"([^/>]*)/>`)
  const fullCellPattern = new RegExp(`<c r="${cellRef}"[^>]*>(?:[\\s\\S]*?)</c>`)

  if (selfClosingPattern.test(sheetXml)) {
    return sheetXml.replace(selfClosingPattern, replacement)
  }

  if (fullCellPattern.test(sheetXml)) {
    return sheetXml.replace(fullCellPattern, replacement)
  }

  return sheetXml
}

/**
 * Vá placeholder bảng cũ thiếu cột Thứ/Tiết/Giảng đường (G7/H7/I7).
 * Bỏ qua nếu template đã có sẵn placeholder.
 */
export function patchToTrinhTemplate(templateBuffer: Buffer): Buffer {
  const zip = new PizZip(templateBuffer)
  const sharedStringsFile = zip.file("xl/sharedStrings.xml")
  const sheetFile = zip.file("xl/worksheets/sheet1.xml")

  if (!sharedStringsFile || !sheetFile) {
    return templateBuffer
  }

  const sharedStringsXml = sharedStringsFile.asText()
  const requiredFields = TABLE_PLACEHOLDERS.map(({ field }) => `table:data.${field}`)
  if (requiredFields.every((field) => sharedStringsXml.includes(field))) {
    return templateBuffer
  }

  const placeholders = TABLE_PLACEHOLDERS.map(({ field }) => `\${table:data.${field}}`)
  const { xml: updatedSharedStringsXml, indices } = appendSharedStrings(
    sharedStringsXml,
    placeholders
  )

  let sheetXml = sheetFile.asText()
  TABLE_PLACEHOLDERS.forEach(({ cell }, index) => {
    const styleMatch = sheetXml.match(new RegExp(`<c r="${cell}" s="(\\d+)"`))
    sheetXml = upsertSharedStringCell(sheetXml, cell, indices[index], styleMatch?.[1])
  })

  zip.file("xl/sharedStrings.xml", updatedSharedStringsXml)
  zip.file("xl/worksheets/sheet1.xml", sheetXml)

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer
}
