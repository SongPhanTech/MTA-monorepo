import PizZip from "pizzip"

export type MergeBlockInput = {
  buffer: Buffer
  /** Chèn page break sau block này khi ghép dọc */
  pageBreakAfter?: boolean
}

export type MergeBlocksOptions = {
  /** Số dòng trống giữa các block. Mặc định 0 */
  blockGapRows?: number
}

const NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
const REL_DRAWING =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function parseSharedStrings(xml: string) {
  const items: string[] = []
  for (const siMatch of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts: string[] = []
    for (const textMatch of siMatch[1].matchAll(/<t(?:[^>]*)>([\s\S]*?)<\/t>/g)) {
      parts.push(decodeXmlEntities(textMatch[1]))
    }
    items.push(parts.join(""))
  }
  return items
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
}

function buildSharedStringsXml(strings: string[]) {
  const items = strings
    .map((value) => {
      const needsPreserve = /^\s|\s$/.test(value) || value.includes("\n") || value.includes("\t")
      const spaceAttr = needsPreserve ? ' xml:space="preserve"' : ""
      return `<si><t${spaceAttr}>${escapeXml(value)}</t></si>`
    })
    .join("")
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="${NS_MAIN}" count="${strings.length}" uniqueCount="${strings.length}">${items}</sst>`
}

function remapSharedStringIndices(sheetXml: string, indexMap: Map<number, number>) {
  return sheetXml.replace(/<c([^>]*)\bt="s"([^>]*)>([\s\S]*?)<\/c>/g, (full, before, after, inner) => {
    const valueMatch = inner.match(/<v>(\d+)<\/v>/)
    if (!valueMatch) return full
    const oldIndex = Number(valueMatch[1])
    const newIndex = indexMap.get(oldIndex)
    if (newIndex === undefined) return full
    const updatedInner = inner.replace(/<v>\d+<\/v>/, `<v>${newIndex}</v>`)
    return `<c${before}t="s"${after}>${updatedInner}</c>`
  })
}

function mergeSharedStringsIntoMaster(
  masterZip: PizZip,
  slaveZip: PizZip,
  slaveSheetXml: string
) {
  const masterSharedPath = "xl/sharedStrings.xml"
  const slaveSharedFile = slaveZip.file("xl/sharedStrings.xml")
  if (!slaveSharedFile) return slaveSheetXml

  const masterSharedFile = masterZip.file(masterSharedPath)
  const masterStrings = masterSharedFile ? parseSharedStrings(masterSharedFile.asText()) : []
  const slaveStrings = parseSharedStrings(slaveSharedFile.asText())
  const indexMap = new Map<number, number>()

  slaveStrings.forEach((value, oldIndex) => {
    const existingIndex = masterStrings.indexOf(value)
    if (existingIndex >= 0) {
      indexMap.set(oldIndex, existingIndex)
      return
    }
    indexMap.set(oldIndex, masterStrings.length)
    masterStrings.push(value)
  })

  masterZip.file(masterSharedPath, buildSharedStringsXml(masterStrings))
  return remapSharedStringIndices(slaveSheetXml, indexMap)
}

function shiftCellRef(ref: string, rowOffset: number) {
  const match = ref.match(/^([A-Za-z]+)(\d+)$/)
  if (!match) return ref
  return `${match[1]}${Number(match[2]) + rowOffset}`
}

function shiftMergeRef(ref: string, rowOffset: number) {
  const [start, end] = ref.split(":")
  if (!start || !end) return ref
  return `${shiftCellRef(start, rowOffset)}:${shiftCellRef(end, rowOffset)}`
}

function getMaxRowFromSheetXml(sheetXml: string) {
  let max = 0
  for (const match of sheetXml.matchAll(/<row[^>]*\br="(\d+)"/g)) {
    max = Math.max(max, Number(match[1]))
  }
  for (const match of sheetXml.matchAll(/<mergeCell[^>]*ref="([^"]+)"/g)) {
    const parts = match[1].split(":")
    for (const part of parts) {
      const m = part.match(/(\d+)$/)
      if (m) max = Math.max(max, Number(m[1]))
    }
  }
  return max
}

function extractSheetDataRows(sheetXml: string) {
  const match = sheetXml.match(/<sheetData[^>]*>([\s\S]*?)<\/sheetData>/)
  return match?.[1] ?? ""
}

function extractMergeCells(sheetXml: string) {
  const match = sheetXml.match(/<mergeCells[^>]*>([\s\S]*?)<\/mergeCells>/)
  if (!match) return [] as string[]
  const body = match[1]
  const selfClosing = [...body.matchAll(/<mergeCell\b[^>]*\/>/g)].map((m) => m[0])
  if (selfClosing.length) return selfClosing
  // Một số file dùng dạng mở/đóng
  return [...body.matchAll(/<mergeCell\b[^>]*>\s*<\/mergeCell>/g)].map((m) =>
    m[0].replace(/>\s*<\/mergeCell>/, "/>")
  )
}

function offsetSheetRowsXml(rowsXml: string, rowOffset: number) {
  if (!rowOffset) return rowsXml

  // Xử lý từng row riêng để tránh regex làm hỏng attribute
  return rowsXml.replace(/<row\b([^>]*)\/>|<row\b([^>]*)>([\s\S]*?)<\/row>/g, (full) => {
    const selfClosing = full.match(/^<row\b([^>]*)\/>$/)
    if (selfClosing) {
      const attrs = offsetRowAttrs(selfClosing[1]!, rowOffset)
      return `<row${attrs}/>`
    }
    const open = full.match(/^<row\b([^>]*)>([\s\S]*)<\/row>$/)
    if (!open) return full
    const attrs = offsetRowAttrs(open[1]!, rowOffset)
    const inner = offsetCellRefsInRowInner(open[2]!, rowOffset)
    return `<row${attrs}>${inner}</row>`
  })
}

function offsetRowAttrs(attrs: string, rowOffset: number) {
  return attrs.replace(/\br="(\d+)"/, (_, row) => `r="${Number(row) + rowOffset}"`)
}

function offsetCellRefsInRowInner(inner: string, rowOffset: number) {
  return inner.replace(/<c\b([^>]*?)\br="([A-Za-z]+)(\d+)"/g, (_, before, col, row) => {
    return `<c${before}r="${col}${Number(row) + rowOffset}"`
  })
}

function offsetMergeCells(mergeTags: string[], rowOffset: number) {
  return mergeTags.map((tag) =>
    tag.replace(/ref="([^"]+)"/, (_, ref) => `ref="${shiftMergeRef(ref, rowOffset)}"`)
  )
}

/**
 * Drawing XML dùng row 0-based. Offset thêm `rowOffset` (số hàng 1-based đã dịch sheet).
 */
function offsetDrawingXml(drawingXml: string, rowOffset: number) {
  if (!rowOffset) return drawingXml

  // <xdr:row>N</xdr:row> và <a:row>N</a:row> (hiếm)
  return drawingXml
    .replace(/<(xdr:row|a:row)>(\d+)<\/\1>/g, (_, tag, row) => {
      return `<${tag}>${Number(row) + rowOffset}</${tag}>`
    })
    .replace(/<(xdr:row|a:row)\s*\/>/g, (full) => full)
}

function extractDrawingAnchors(drawingXml: string) {
  // Lấy toàn bộ twoCellAnchor / oneCellAnchor / absoluteAnchor
  const anchors: string[] = []
  const patterns = [
    /<xdr:twoCellAnchor[\s\S]*?<\/xdr:twoCellAnchor>/g,
    /<xdr:oneCellAnchor[\s\S]*?<\/xdr:oneCellAnchor>/g,
    /<xdr:absoluteAnchor[\s\S]*?<\/xdr:absoluteAnchor>/g,
  ]
  for (const pattern of patterns) {
    for (const match of drawingXml.matchAll(pattern)) {
      anchors.push(match[0])
    }
  }
  return anchors
}

function wrapDrawingXml(anchorsXml: string) {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" ` +
    `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    anchorsXml +
    `</xdr:wsDr>`
  )
}

/** Chèn thêm anchor vào drawing XML có sẵn (giữ nguyên rels/media của block đầu). */
function appendAnchorsToDrawingXml(drawingXml: string, extraAnchorsXml: string) {
  if (!extraAnchorsXml) return drawingXml
  if (drawingXml.includes("</xdr:wsDr>")) {
    return drawingXml.replace("</xdr:wsDr>", `${extraAnchorsXml}</xdr:wsDr>`)
  }
  return wrapDrawingXml(extractDrawingAnchors(drawingXml).join("") + extraAnchorsXml)
}

function getDrawingPathFromSheetRels(zip: PizZip) {
  const rels = zip.file("xl/worksheets/_rels/sheet1.xml.rels")
  if (!rels) return null
  const xml = rels.asText()
  const match = xml.match(/Target="\.\.\/drawings\/(drawing\d+\.xml)"/)
  return match ? `xl/drawings/${match[1]}` : null
}

function ensureSheetDrawingRel(zip: PizZip, drawingFileName: string) {
  const relsPath = "xl/worksheets/_rels/sheet1.xml.rels"
  let relsXml = zip.file(relsPath)?.asText()
  if (!relsXml) {
    relsXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  }

  if (relsXml.includes(`Target="../drawings/${drawingFileName}"`)) {
    zip.file(relsPath, relsXml)
    return
  }

  let maxRid = 0
  for (const match of relsXml.matchAll(/Id="rId(\d+)"/g)) {
    maxRid = Math.max(maxRid, Number(match[1]))
  }
  const newRid = `rId${maxRid + 1}`
  const rel = `<Relationship Id="${newRid}" Type="${REL_DRAWING}" Target="../drawings/${drawingFileName}"/>`
  relsXml = relsXml.replace("</Relationships>", `${rel}</Relationships>`)
  zip.file(relsPath, relsXml)

  let sheetXml = zip.file("xl/worksheets/sheet1.xml")!.asText()
  if (sheetXml.includes("<drawing ")) {
    return
  }

  const drawingTag = `<drawing r:id="${newRid}"/>`
  // Chèn drawing sau rowBreaks nếu có, ngược lại trước </worksheet>
  if (/<\/rowBreaks>/.test(sheetXml)) {
    sheetXml = sheetXml.replace(/<\/rowBreaks>/, `</rowBreaks>${drawingTag}`)
  } else {
    sheetXml = sheetXml.replace(/<\/worksheet>/, `${drawingTag}</worksheet>`)
  }
  zip.file("xl/worksheets/sheet1.xml", sheetXml)
}

function ensureContentType(contentTypesXml: string, partName: string, contentType: string) {
  if (contentTypesXml.includes(`PartName="${partName}"`)) return contentTypesXml
  return contentTypesXml.replace(
    "</Types>",
    `<Override PartName="${partName}" ContentType="${contentType}"/></Types>`
  )
}

function getMediaContentType(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "gif":
      return "image/gif"
    case "emf":
      return "image/x-emf"
    case "wmf":
      return "image/x-wmf"
    default:
      return "application/octet-stream"
  }
}

/**
 * Copy media từ slave drawing sang master, remap rId trong drawing XML.
 * Trả về drawing XML đã remap relationship.
 */
function mergeDrawingMedia(
  masterZip: PizZip,
  slaveZip: PizZip,
  slaveDrawingPath: string,
  slaveDrawingXml: string,
  mediaCounter: { n: number }
) {
  const slaveBase = slaveDrawingPath.replace(/^xl\/drawings\//, "").replace(/\.xml$/, "")
  const slaveRelsPath = `xl/drawings/_rels/${slaveBase}.xml.rels`
  const slaveRelsFile = slaveZip.file(slaveRelsPath)
  if (!slaveRelsFile) {
    return { drawingXml: slaveDrawingXml, relsEntries: [] as string[] }
  }

  let drawingXml = slaveDrawingXml
  const relsEntries: string[] = []
  let relsXml = slaveRelsFile.asText()

  for (const match of [...relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)]) {
    const oldRid = match[1]
    const target = match[2]
    if (!target.includes("../media/")) {
      // non-media rel (chart etc.) — copy as-is with new rid if needed
      continue
    }

    const mediaFile = target.replace("../media/", "")
    const slaveMediaPath = `xl/media/${mediaFile}`
    const slaveMedia = slaveZip.file(slaveMediaPath)
    if (!slaveMedia) continue

    mediaCounter.n += 1
    const ext = mediaFile.includes(".") ? mediaFile.slice(mediaFile.lastIndexOf(".")) : ".png"
    const newMediaFile = `block_media_${mediaCounter.n}${ext}`
    const newMediaPath = `xl/media/${newMediaFile}`
    masterZip.file(newMediaPath, slaveMedia.asUint8Array())

    const newRid = `rId${mediaCounter.n + 1000}`
    drawingXml = drawingXml.replaceAll(`r:embed="${oldRid}"`, `r:embed="${newRid}"`)
    drawingXml = drawingXml.replaceAll(`r:link="${oldRid}"`, `r:link="${newRid}"`)

    relsEntries.push(
      `<Relationship Id="${newRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${newMediaFile}"/>`
    )

    let contentTypes = masterZip.file("[Content_Types].xml")!.asText()
    contentTypes = ensureContentType(
      contentTypes,
      `/xl/media/${newMediaFile}`,
      getMediaContentType(newMediaFile)
    )
    masterZip.file("[Content_Types].xml", contentTypes)
  }

  return { drawingXml, relsEntries }
}

function upsertMasterDrawingRels(masterZip: PizZip, drawingPath: string, extraRels: string[]) {
  if (!extraRels.length) return
  const base = drawingPath.replace(/^xl\/drawings\//, "").replace(/\.xml$/, "")
  const relsPath = `xl/drawings/_rels/${base}.xml.rels`
  let relsXml = masterZip.file(relsPath)?.asText()
  if (!relsXml) {
    relsXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  }
  relsXml = relsXml.replace("</Relationships>", `${extraRels.join("")}</Relationships>`)
  masterZip.file(relsPath, relsXml)
}

function insertOrReplaceMergeCells(sheetXml: string, mergeTags: string[]) {
  if (!mergeTags.length) return sheetXml

  if (/<mergeCells[\s>]/.test(sheetXml)) {
    return sheetXml
      .replace(/<mergeCells[^>]*>[\s\S]*?<\/mergeCells>/, () => {
        return `<mergeCells count="${mergeTags.length}">${mergeTags.join("")}</mergeCells>`
      })
  }

  // Chèn sau sheetData
  return sheetXml.replace(
    "</sheetData>",
    `</sheetData><mergeCells count="${mergeTags.length}">${mergeTags.join("")}</mergeCells>`
  )
}

function updateDimension(sheetXml: string, maxRow: number) {
  const dimMatch = sheetXml.match(/<dimension[^>]*ref="([^"]+)"/)
  if (!dimMatch) return sheetXml
  const ref = dimMatch[1]
  const endMatch = ref.match(/:([A-Za-z]+)(\d+)$/) || ref.match(/^([A-Za-z]+)(\d+)$/)
  if (!endMatch) return sheetXml
  const endCol = endMatch[1]
  const startMatch = ref.match(/^([A-Za-z]+)(\d+)/)
  const startCol = startMatch?.[1] || "A"
  const newRef = `${startCol}1:${endCol}${Math.max(1, maxRow)}`
  return sheetXml.replace(/<dimension([^>]*)ref="[^"]+"/, `<dimension$1ref="${newRef}"`)
}

/**
 * Chèn rowBreaks đúng vị trí OOXML: trước drawing/legacyDrawing/picture, không phải cuối file.
 */
function upsertRowBreaks(sheetXml: string, breakRows: number[]) {
  if (!breakRows.length) return sheetXml

  const unique = [...new Set(breakRows.filter((r) => r > 0))].sort((a, b) => a - b)
  if (!unique.length) return sheetXml

  const breaksXml = unique.map((r) => `<brk id="${r}" max="16383" man="1"/>`).join("")
  const rowBreaks = `<rowBreaks count="${unique.length}" manualBreakCount="${unique.length}">${breaksXml}</rowBreaks>`

  // Xóa rowBreaks cũ nếu có
  let xml = sheetXml.replace(/<rowBreaks\b[^>]*>[\s\S]*?<\/rowBreaks>/g, "")

  const anchors = [
    /<drawing\b/,
    /<legacyDrawing\b/,
    /<picture\b/,
    /<tableParts\b/,
    /<\/worksheet>/,
  ]

  for (const re of anchors) {
    const idx = xml.search(re)
    if (idx >= 0) {
      return xml.slice(0, idx) + rowBreaks + xml.slice(idx)
    }
  }
  return xml
}

function appendGapRows(rowsXml: string, afterMaxRow: number, gap: number) {
  if (gap <= 0) return { rowsXml, added: 0 }
  let extra = ""
  for (let i = 1; i <= gap; i++) {
    // Dùng dạng mở/đóng — một số bản Excel lỗi với <row .../>
    extra += `<row r="${afterMaxRow + i}"></row>`
  }
  return { rowsXml: rowsXml + extra, added: gap }
}

/** Loại bỏ control char không hợp lệ trong XML 1.0 */
function sanitizeSheetXml(xml: string) {
  return xml.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
}

/**
 * Ghép nhiều file xlsx (mỗi file = 1 block đã render) thành 1 sheet,
 * giữ cell/merge/shape bằng cách offset drawing XML.
 */
export function mergeXlsxBlocksToOneSheet(
  blocks: MergeBlockInput[],
  options: MergeBlocksOptions = {}
): Buffer {
  if (blocks.length === 0) {
    throw new Error("Không có block để ghép")
  }
  if (blocks.length === 1) {
    return blocks[0].buffer
  }

  const blockGapRows = options.blockGapRows ?? 0
  const masterZip = new PizZip(blocks[0].buffer)
  let masterSheetXml = masterZip.file("xl/worksheets/sheet1.xml")!.asText()

  let masterRowsXml = extractSheetDataRows(masterSheetXml)
  let masterMerges = extractMergeCells(masterSheetXml)
  let currentMaxRow = getMaxRowFromSheetXml(masterSheetXml)
  const pageBreakRows: number[] = []

  // Drawing master — giữ nguyên file/rels của block đầu, chỉ append anchor block sau
  let masterDrawingPath = getDrawingPathFromSheetRels(masterZip)
  let masterDrawingXml =
    masterDrawingPath && masterZip.file(masterDrawingPath)
      ? masterZip.file(masterDrawingPath)!.asText()
      : null
  if (!masterDrawingPath) {
    masterDrawingPath = "xl/drawings/drawing1.xml"
  }

  const mediaCounter = { n: 0 }
  const pendingDrawingRels: string[] = []
  const extraAnchors: string[] = []

  if (blocks[0].pageBreakAfter && currentMaxRow > 0) {
    pageBreakRows.push(currentMaxRow)
  }

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]
    const slaveZip = new PizZip(block.buffer)
    let slaveSheetXml = slaveZip.file("xl/worksheets/sheet1.xml")!.asText()
    slaveSheetXml = mergeSharedStringsIntoMaster(masterZip, slaveZip, slaveSheetXml)

    const gapResult = appendGapRows(masterRowsXml, currentMaxRow, blockGapRows)
    masterRowsXml = gapResult.rowsXml
    currentMaxRow += gapResult.added

    const rowOffset = currentMaxRow
    const slaveRows = extractSheetDataRows(slaveSheetXml)
    const offsetRows = offsetSheetRowsXml(slaveRows, rowOffset)
    masterRowsXml += offsetRows

    const slaveMerges = offsetMergeCells(extractMergeCells(slaveSheetXml), rowOffset)
    masterMerges = masterMerges.concat(slaveMerges)

    const slaveDrawingPath = getDrawingPathFromSheetRels(slaveZip)
    if (slaveDrawingPath && slaveZip.file(slaveDrawingPath)) {
      let slaveDrawingXml = slaveZip.file(slaveDrawingPath)!.asText()
      const mediaMerged = mergeDrawingMedia(
        masterZip,
        slaveZip,
        slaveDrawingPath,
        slaveDrawingXml,
        mediaCounter
      )
      slaveDrawingXml = mediaMerged.drawingXml
      pendingDrawingRels.push(...mediaMerged.relsEntries)

      const offsetAnchors = extractDrawingAnchors(offsetDrawingXml(slaveDrawingXml, rowOffset))
      extraAnchors.push(...offsetAnchors)
    }

    const slaveMax = getMaxRowFromSheetXml(slaveSheetXml)
    currentMaxRow = rowOffset + slaveMax

    if (block.pageBreakAfter) {
      pageBreakRows.push(currentMaxRow)
    }
  }

  // Rebuild sheet1.xml
  masterSheetXml = masterSheetXml.replace(
    /<sheetData\b[^>]*>[\s\S]*?<\/sheetData>/,
    (fullMatch) => {
      const open = fullMatch.match(/^<sheetData\b[^>]*>/)?.[0] ?? "<sheetData>"
      return `${open}${masterRowsXml}</sheetData>`
    }
  )
  // Xóa mergeCells cũ rồi chèn lại ngay sau sheetData (đúng thứ tự OOXML)
  masterSheetXml = masterSheetXml.replace(/<mergeCells\b[^>]*>[\s\S]*?<\/mergeCells>/g, "")
  masterSheetXml = insertOrReplaceMergeCells(masterSheetXml, masterMerges)
  masterSheetXml = updateDimension(masterSheetXml, currentMaxRow)
  masterSheetXml = upsertRowBreaks(masterSheetXml, pageBreakRows)
  masterSheetXml = sanitizeSheetXml(masterSheetXml)
  masterZip.file("xl/worksheets/sheet1.xml", masterSheetXml)

  // Drawing: giữ block 1, append shape các block sau (đã offset row)
  if (masterDrawingXml || extraAnchors.length > 0) {
    const finalDrawingXml = masterDrawingXml
      ? appendAnchorsToDrawingXml(masterDrawingXml, extraAnchors.join(""))
      : wrapDrawingXml(extraAnchors.join(""))

    masterZip.file(masterDrawingPath, sanitizeSheetXml(finalDrawingXml))
    upsertMasterDrawingRels(masterZip, masterDrawingPath, pendingDrawingRels)
    ensureSheetDrawingRel(masterZip, masterDrawingPath.replace("xl/drawings/", ""))

    let contentTypes = masterZip.file("[Content_Types].xml")!.asText()
    contentTypes = ensureContentType(
      contentTypes,
      `/${masterDrawingPath}`,
      "application/vnd.openxmlformats-officedocument.drawing+xml"
    )
    masterZip.file("[Content_Types].xml", contentTypes)
  }

  // Đảm bảo workbook chỉ còn 1 sheet (sheet1)
  pruneWorkbookToSingleSheet(masterZip)

  return masterZip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer
}

function pruneWorkbookToSingleSheet(zip: PizZip) {
  const workbookPath = "xl/workbook.xml"
  const workbookFile = zip.file(workbookPath)
  if (!workbookFile) return

  let workbookXml = workbookFile.asText()
  const sheetTags = [...workbookXml.matchAll(/<sheet\b[^>]*\/>/g)].map((m) => m[0])
  if (sheetTags.length <= 1) return

  const first = sheetTags[0]!
  workbookXml = workbookXml.replace(
    /<sheets>[\s\S]*?<\/sheets>/,
    `<sheets>${first}</sheets>`
  )
  zip.file(workbookPath, workbookXml)

  for (const f of zip.file(/xl\/worksheets\/sheet\d+\.xml$/)) {
    if (f.name === "xl/worksheets/sheet1.xml") continue
    const base = f.name.replace(/^xl\/worksheets\//, "")
    zip.remove(f.name)
    zip.remove(`xl/worksheets/_rels/${base}.rels`)
  }
}
