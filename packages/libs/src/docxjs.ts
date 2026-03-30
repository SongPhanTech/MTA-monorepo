import Docxtemplater from "docxtemplater"
import PizZip from "pizzip"

const loadFile = (filePath: string): Promise<PizZip> => {
  return new Promise((resolve, reject) => {
    import("pizzip/utils/index.js").then((PizZipUtils) => {
      ;(PizZipUtils as any).getBinaryContent(filePath, (error: Error, content: string) => {
        if (error) {
          reject(error)
        } else {
          const zip = new PizZip(content)
          resolve(zip)
        }
      })
    })
  })
}
const exportFile = (template: PizZip): Blob => {
  const blob = template.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
  return blob
}

export { Docxtemplater, PizZip, loadFile, exportFile }
