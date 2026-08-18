import PizZip from "pizzip"

const TABLE_CELLS = [
  { cell: "A7", field: "stt", style: "5" },
  { cell: "B7", field: "hovaten", style: "5" },
  { cell: "C7", field: "tendetai", style: "5" },
  { cell: "D7", field: "gvhd", style: "5" },
  { cell: "E7", field: "isThesis", style: "6" },
  { cell: "F7", field: "ghichu", style: "5" },
] as const

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function colToNum(col: string) {
  let num = 0
  for (const ch of col) {
    num = num * 26 + (ch.charCodeAt(0) - 64)
  }
  return num
}

function parseCellRef(ref: string) {
  const col = ref.replace(/[0-9]/g, "")
  const row = Number(ref.replace(/[^0-9]/g, ""))
  return { col, row, colNum: colToNum(col) }
}

function appendSharedStrings(sharedStringsXml: string, placeholders: string[]) {
  const uniqueCountMatch = sharedStringsXml.match(/uniqueCount="(\d+)"/)
  const countMatch = sharedStringsXml.match(/count="(\d+)"/)
  const currentUnique = Number(uniqueCountMatch?.[1] ?? 0)
  const currentCount = Number(countMatch?.[1] ?? 0)

  const newItems = placeholders
    .map((placeholder) => `<si><t>${escapeXml(placeholder)}</t></si>`)
    .join("")

  const updatedXml = sharedStringsXml
    .replace(/uniqueCount="\d+"/, `uniqueCount="${currentUnique + placeholders.length}"`)
    .replace(/count="\d+"/, `count="${currentCount + placeholders.length}"`)
    .replace("</sst>", `${newItems}</sst>`)

  return {
    xml: updatedXml,
    indices: placeholders.map((_, index) => currentUnique + index),
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

function addMergeCell(sheetXml: string, ref: string) {
  if (sheetXml.includes(`ref="${ref}"`)) {
    return sheetXml
  }

  const mergeCellsMatch = sheetXml.match(/<mergeCells count="(\d+)">([\s\S]*?)<\/mergeCells>/)
  if (!mergeCellsMatch) {
    return sheetXml.replace(
      "</sheetData>",
      `<mergeCells count="1"><mergeCell ref="${ref}"/></mergeCells></sheetData>`
    )
  }

  const count = Number(mergeCellsMatch[1]) + 1
  const body = mergeCellsMatch[2]
  return sheetXml.replace(
    mergeCellsMatch[0],
    `<mergeCells count="${count}">${body}<mergeCell ref="${ref}"/></mergeCells>`
  )
}

function convertMustacheToDollarSyntax(sharedStringsXml: string) {
  return sharedStringsXml.replace(/\{\{/g, "${").replace(/\}\}/g, "}")
}

/** Xóa các ô nằm trong vùng merge nhưng không phải ô góc trên-trái (Excel sẽ báo lỗi repair). */
export function removeCellsInsideMergedRegions(sheetXml: string) {
  const mergeRefs = [...sheetXml.matchAll(/<mergeCell ref="([^"]+)"/g)].map((match) => match[1]!)
  if (!mergeRefs.length) return sheetXml

  const mergedTopLeft = new Set<string>()
  const cellsToRemove = new Set<string>()

  for (const mergeRef of mergeRefs) {
    const [topLeft, bottomRight] = mergeRef.split(":")
    if (!topLeft || !bottomRight) continue

    mergedTopLeft.add(topLeft)
    const start = parseCellRef(topLeft)
    const end = parseCellRef(bottomRight)

    for (let row = start.row; row <= end.row; row++) {
      for (let colNum = start.colNum; colNum <= end.colNum; colNum++) {
        let col = ""
        let n = colNum
        while (n > 0) {
          const rem = (n - 1) % 26
          col = String.fromCharCode(65 + rem) + col
          n = Math.floor((n - 1) / 26)
        }
        const ref = `${col}${row}`
        if (ref !== topLeft) {
          cellsToRemove.add(ref)
        }
      }
    }
  }

  if (!cellsToRemove.size) return sheetXml

  return sheetXml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g, (rowBlock, rowNum, rowAttrs, rowInner) => {
    const cleanedInner = rowInner.replace(/<c r="([A-Z]+\d+)"[^>]*(?:\/>|>[\s\S]*?<\/c>)/g, (cellBlock: string, ref: string) => {
      if (cellsToRemove.has(ref)) {
        return ""
      }
      return cellBlock
    })

    const hasCells = /<c r="/.test(cleanedInner)
    if (!hasCells && !mergedTopLeft.has(`A${rowNum}`)) {
      // giữ row nếu còn merge top-left trên hàng này
      const keepRow = [...mergedTopLeft].some((ref) => ref.endsWith(String(rowNum)))
      if (!keepRow) return rowBlock
    }

    return `<row r="${rowNum}"${rowAttrs}>${cleanedInner}</row>`
  })
}

/**
 * Vá template PhuLucDanhSachLuanVan.xlsx trên MinIO cho xlsx-template:
 * - ${dotxet}, ${soQD}, ${ngay}, ${thang}, ${nam} ở phần header
 * - A4 → ${groupTitle} (merge A4:F4)
 * - A7..F7 → ${table:data.*} (dòng dữ liệu lặp)
 * - A8 → ${tongso} (merge A8:F8)
 */
export function patchPhuLucDanhSachLuanVanTemplate(templateBuffer: Buffer): Buffer {
  const zip = new PizZip(templateBuffer)
  const sharedStringsFile = zip.file("xl/sharedStrings.xml")
  const sheetFile = zip.file("xl/worksheets/sheet1.xml")

  if (!sharedStringsFile || !sheetFile) {
    return templateBuffer
  }

  let sharedStringsXml = convertMustacheToDollarSyntax(sharedStringsFile.asText())
  let sheetXml = sheetFile.asText()

  const placeholdersToAdd: string[] = []
  const cellPatches: Array<{ cell: string; placeholder: string; style?: string }> = []

  if (!sharedStringsXml.includes("${groupTitle}")) {
    placeholdersToAdd.push("${groupTitle}")
    cellPatches.push({ cell: "A4", placeholder: "${groupTitle}", style: "3" })
  }

  for (const { cell, field, style } of TABLE_CELLS) {
    const placeholder = `\${table:data.${field}}`
    if (!sharedStringsXml.includes(placeholder)) {
      placeholdersToAdd.push(placeholder)
      cellPatches.push({ cell, placeholder, style })
    }
  }

  if (!sharedStringsXml.includes("${tongso}")) {
    placeholdersToAdd.push("${tongso}")
    cellPatches.push({ cell: "A8", placeholder: "${tongso}", style: "4" })
  }

  if (placeholdersToAdd.length > 0) {
    const { xml, indices } = appendSharedStrings(sharedStringsXml, placeholdersToAdd)
    sharedStringsXml = xml

    let patchIndex = 0
    for (const patch of cellPatches) {
      sheetXml = upsertSharedStringCell(
        sheetXml,
        patch.cell,
        indices[patchIndex]!,
        patch.style
      )
      patchIndex++
    }

    sheetXml = addMergeCell(sheetXml, "A4:F4")
    sheetXml = addMergeCell(sheetXml, "A8:F8")
  } else {
    sharedStringsXml = convertMustacheToDollarSyntax(sharedStringsXml)
  }

  sheetXml = removeCellsInsideMergedRegions(sheetXml)

  zip.file("xl/sharedStrings.xml", sharedStringsXml)
  zip.file("xl/worksheets/sheet1.xml", sheetXml)
  return zip.generate({ type: "nodebuffer" }) as Buffer
}
