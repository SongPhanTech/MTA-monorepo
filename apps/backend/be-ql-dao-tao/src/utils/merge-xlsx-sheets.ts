import PizZip from "pizzip"

type MergeSheetInput = {
  sheetName: string
  buffer: Buffer
}

const NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function sanitizeSheetName(name: string) {
  return name.replace(/[\\/?*:[\]]/g, "_").slice(0, 31) || "Sheet"
}

function getSheetCount(workbookXml: string) {
  return (workbookXml.match(/<sheet /g) || []).length
}

function getMaxRid(relsXml: string) {
  let max = 0
  for (const match of relsXml.matchAll(/Id="rId(\d+)"/g)) {
    max = Math.max(max, Number(match[1]))
  }
  return max
}

function getMaxSheetId(workbookXml: string) {
  let max = 0
  for (const match of workbookXml.matchAll(/sheetId="(\d+)"/g)) {
    max = Math.max(max, Number(match[1]))
  }
  return max
}

function parseSharedStrings(xml: string) {
  const items: string[] = []
  for (const siMatch of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts: string[] = []
    for (const textMatch of siMatch[1].matchAll(/<t(?:[^>]*)>([\s\S]*?)<\/t>/g)) {
      parts.push(textMatch[1])
    }
    items.push(parts.join(""))
  }
  return items
}

function buildSharedStringsXml(strings: string[]) {
  const items = strings.map((value) => `<si><t>${escapeXml(value)}</t></si>`).join("")
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="${NS_MAIN}" count="${strings.length}" uniqueCount="${strings.length}">${items}</sst>`
}

function remapSharedStringIndices(sheetXml: string, indexMap: Map<number, number>) {
  return sheetXml.replace(
    /<c([^>]*)\bt="s"([^>]*)>([\s\S]*?)<\/c>/g,
    (full, before, after, inner) => {
      const valueMatch = inner.match(/<v>(\d+)<\/v>/)
      if (!valueMatch) return full
      const oldIndex = Number(valueMatch[1])
      const newIndex = indexMap.get(oldIndex)
      if (newIndex === undefined) return full
      const updatedInner = inner.replace(/<v>\d+<\/v>/, `<v>${newIndex}</v>`)
      return `<c${before}t="s"${after}>${updatedInner}</c>`
    }
  )
}

function mergeSharedStrings(masterZip: PizZip, slaveZip: PizZip, slaveSheetXml: string) {
  const masterSharedPath = "xl/sharedStrings.xml"
  const slaveSharedPath = "xl/sharedStrings.xml"
  const masterSharedFile = masterZip.file(masterSharedPath)
  const slaveSharedFile = slaveZip.file(slaveSharedPath)

  if (!slaveSharedFile) {
    return slaveSheetXml
  }

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

function updateSheetName(zip: PizZip, sheetIndex: number, name: string) {
  const workbookPath = "xl/workbook.xml"
  const workbookXml = zip.file(workbookPath)?.asText()
  if (!workbookXml) return

  const sheetTags = [...workbookXml.matchAll(/<sheet ([^/>]+)\/>/g)]
  const target = sheetTags[sheetIndex - 1]
  if (!target) return

  const updatedTag = target[0].replace(
    /name="[^"]*"/,
    `name="${escapeXml(sanitizeSheetName(name))}"`
  )
  zip.file(workbookPath, workbookXml.replace(target[0], updatedTag))
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
    case "svg":
      return "image/svg+xml"
    default:
      return "application/octet-stream"
  }
}

function ensureContentType(contentTypesXml: string, partName: string, contentType: string) {
  if (contentTypesXml.includes(`PartName="${partName}"`)) {
    return contentTypesXml
  }
  return contentTypesXml.replace(
    "</Types>",
    `<Override PartName="${partName}" ContentType="${contentType}"/></Types>`
  )
}

function appendSheetFromWorkbook(masterZip: PizZip, slaveBuffer: Buffer, sheetName: string) {
  const slaveZip = new PizZip(slaveBuffer)
  const workbookXml = masterZip.file("xl/workbook.xml")!.asText()
  const workbookRelsXml = masterZip.file("xl/_rels/workbook.xml.rels")!.asText()
  let contentTypesXml = masterZip.file("[Content_Types].xml")!.asText()

  const newSheetIdx = getSheetCount(workbookXml) + 1
  const newSheetFile = `sheet${newSheetIdx}.xml`
  const newSheetPath = `xl/worksheets/${newSheetFile}`

  let sheetXml = slaveZip.file("xl/worksheets/sheet1.xml")!.asText()
  sheetXml = mergeSharedStrings(masterZip, slaveZip, sheetXml)
  masterZip.file(newSheetPath, sheetXml)

  const slaveSheetRels = slaveZip.file("xl/worksheets/_rels/sheet1.xml.rels")
  if (slaveSheetRels) {
    let sheetRelsXml = slaveSheetRels.asText()
    const drawingMatches = [...sheetRelsXml.matchAll(/Target="\.\.\/drawings\/(drawing\d+\.xml)"/g)]

    for (const match of drawingMatches) {
      const drawingFile = match[1]
      const newDrawingFile = `drawing${newSheetIdx}.xml`
      const drawingPath = `xl/drawings/${drawingFile}`
      const newDrawingPath = `xl/drawings/${newDrawingFile}`

      if (slaveZip.file(drawingPath)) {
        masterZip.file(newDrawingPath, slaveZip.file(drawingPath)!.asUint8Array())

        const drawingBase = drawingFile.replace(".xml", "")
        const slaveDrawingRels = slaveZip.file(`xl/drawings/_rels/${drawingBase}.xml.rels`)
        if (slaveDrawingRels) {
          let drawingRelsXml = slaveDrawingRels.asText()
          for (const mediaMatch of drawingRelsXml.matchAll(/Target="\.\.\/media\/([^"]+)"/g)) {
            const mediaFile = mediaMatch[1]
            const mediaPath = `xl/media/${mediaFile}`
            if (!masterZip.file(mediaPath) && slaveZip.file(mediaPath)) {
              masterZip.file(mediaPath, slaveZip.file(mediaPath)!.asUint8Array())
              contentTypesXml = ensureContentType(
                contentTypesXml,
                `/xl/media/${mediaFile}`,
                getMediaContentType(mediaFile)
              )
            }
          }
          masterZip.file(
            `xl/drawings/_rels/${newDrawingFile.replace(".xml", "")}.xml.rels`,
            drawingRelsXml
          )
        }

        contentTypesXml = ensureContentType(
          contentTypesXml,
          `/xl/drawings/${newDrawingFile}`,
          "application/vnd.openxmlformats-officedocument.drawing+xml"
        )
      }

      sheetRelsXml = sheetRelsXml.replace(
        `../drawings/${drawingFile}`,
        `../drawings/${newDrawingFile}`
      )
    }

    masterZip.file(`xl/worksheets/_rels/${newSheetFile}.rels`, sheetRelsXml)
    contentTypesXml = ensureContentType(
      contentTypesXml,
      `/xl/worksheets/_rels/${newSheetFile}.rels`,
      "application/vnd.openxmlformats-package.relationships+xml"
    )
  }

  const newSheetId = getMaxSheetId(workbookXml) + 1
  const newRid = getMaxRid(workbookRelsXml) + 1
  const safeName = escapeXml(sanitizeSheetName(sheetName))

  masterZip.file(
    "xl/workbook.xml",
    workbookXml.replace(
      "</sheets>",
      `<sheet name="${safeName}" sheetId="${newSheetId}" r:id="rId${newRid}"/></sheets>`
    )
  )
  masterZip.file(
    "xl/_rels/workbook.xml.rels",
    workbookRelsXml.replace(
      "</Relationships>",
      `<Relationship Id="rId${newRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/${newSheetFile}"/></Relationships>`
    )
  )

  contentTypesXml = ensureContentType(
    contentTypesXml,
    `/xl/worksheets/${newSheetFile}`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"
  )
  masterZip.file("[Content_Types].xml", contentTypesXml)
}

export function mergeXlsxSheets(sheets: MergeSheetInput[]): Buffer {
  if (sheets.length === 0) {
    throw new Error("No sheets to merge")
  }
  if (sheets.length === 1) {
    const zip = new PizZip(sheets[0].buffer)
    updateSheetName(zip, 1, sheets[0].sheetName)
    return zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer
  }

  const masterZip = new PizZip(sheets[0].buffer)
  updateSheetName(masterZip, 1, sheets[0].sheetName)

  for (let i = 1; i < sheets.length; i++) {
    appendSheetFromWorkbook(masterZip, sheets[i].buffer, sheets[i].sheetName)
  }

  return masterZip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer
}
