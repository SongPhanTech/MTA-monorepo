import { UploadOutlined } from "@ant-design/icons"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { Button, Modal, message, Table } from "antd"
import { XMLParser } from "fast-xml-parser"
import PizZip from "pizzip"
import type React from "react"
import { useState } from "react"

interface WordImportModalProps {
  visible: boolean
  onCancel: () => void
  onImportSuccess: (questions: any[]) => void
}

const WordImportModal: React.FC<WordImportModalProps> = ({
  visible,
  onCancel,
  onImportSuccess,
}) => {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  })

  const extractTextAndImagesFromCell = (cell: any, zip: PizZip, relMap: Map<string, string>) => {
    const paragraphs = Array.isArray(cell?.["w:p"]) ? cell["w:p"] : [cell?.["w:p"]]
    let rawText = ""
    let prevEndedWithChar = false
    const images: { name: string; blob: Blob }[] = []
    let imgIndex = 1

    for (const p of paragraphs) {
      const runs = Array.isArray(p?.["w:r"]) ? p["w:r"] : [p?.["w:r"]]
      let paragraphText = ""

      for (const r of runs) {
        const t = r?.["w:t"]
        let value = ""
        if (typeof t === "string") {
          value = t
        } else if (typeof t === "object" && t?.["#text"]) {
          value = t["#text"]
        }

        if (value) {
          const startsWithPunctuation = /^[.,!?;:]/.test(value)
          const endsWithChar = /[a-zA-ZÀ-ỹ0-9]$/.test(value)
          if (paragraphText && prevEndedWithChar && !startsWithPunctuation) {
            paragraphText += " "
          }
          paragraphText += value
          prevEndedWithChar = endsWithChar
        }

        const drawing = r?.["w:drawing"]
        const blip =
          drawing?.["wp:inline"]?.["a:graphic"]?.["a:graphicData"]?.["pic:pic"]?.["pic:blipFill"]?.[
            "a:blip"
          ]
        const relId = blip?.["@_r:embed"]
        if (relId) {
          const imagePath = `word/${relMap.get(relId)}`
          const file = zip.file(imagePath)
          if (file) {
            const blob = new Blob([file.asArrayBuffer()], { type: "image/png" })
            const placeholder = `{img_${imgIndex}}`
            paragraphText += ` ${placeholder} `
            images.push({ name: placeholder, blob })
            imgIndex++
          }
        }
      }

      // Sau mỗi đoạn văn, thêm xuống dòng
      rawText += `${paragraphText.trim()}\n`
    }

    const cleanedText = rawText
      .replace(/([.,!?;:])(?=\S)/g, "$1 ")
      .replace(/\s{2,}/g, " ")
      .trim()

    return { text: cleanedText, images }
  }

  const extractPointFromCell = (cell: any, zip: PizZip, relMap: Map<string, string>) => {
    const { text } = extractTextAndImagesFromCell(cell, zip, relMap)
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*(đ|điểm)?/i)
    if (match) {
      return Number.parseFloat(match[1].replace(",", "."))
    }
    return undefined
  }

  const uploadImagesAndReplacePlaceholders = async (
    rawText: string,
    images: { name: string; blob: Blob }[]
  ): Promise<string> => {
    let result = rawText

    for (const img of images) {
      const extension = "png"
      const resPresignedUrl = await generatePresignedUrl({
        path: "question-images",
        extension,
      })

      if (resPresignedUrl.status !== 200) {
        throw new Error(
          "message" in resPresignedUrl.data
            ? resPresignedUrl.data.message
            : "Không thể tạo presigned URL"
        )
      }

      const { url, fileName } = resPresignedUrl.data

      await fetch(url, {
        method: "PUT",
        body: img.blob,
      })

      const imageUrl = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${fileName}`
      result = result.replace(img.name, `<img src="${imageUrl}" style="max-width: 100%;" />`)
    }
    result = result.replace(/\n/g, "<br />")

    return result
  }

  const handleImport = async (file: File) => {
    setLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const zip = new PizZip(arrayBuffer)

      const documentXml = zip.file("word/document.xml")?.asText()
      const relsXml = zip.file("word/_rels/document.xml.rels")?.asText()

      const doc = parser.parse(documentXml || "")
      const rels = relsXml ? parser.parse(relsXml)?.Relationships?.Relationship || [] : []

      const relMap = new Map()
      ;(Array.isArray(rels) ? rels : [rels]).forEach((rel) => {
        if (rel["@_Type"]?.includes("image")) {
          relMap.set(rel["@_Id"], rel["@_Target"])
        }
      })

      const body = doc["w:document"]["w:body"]
      const tables = Array.isArray(body["w:tbl"]) ? body["w:tbl"] : [body["w:tbl"]]

      const extractedQuestions: any[] = []

      for (const tbl of tables) {
        const rows = Array.isArray(tbl["w:tr"]) ? tbl["w:tr"] : [tbl["w:tr"]]

        for (let i = 0; i < rows.length - 1; i += 2) {
          const question: any = {}

          // Row lẻ (câu hỏi + điểm)
          const contentRow = rows[i]
          const contentCells = Array.isArray(contentRow["w:tc"])
            ? contentRow["w:tc"]
            : [contentRow["w:tc"]]
          const contentResult = await extractTextAndImagesFromCell(contentCells[0], zip, relMap)
          let processedContent = contentResult.text
          if (processedContent.startsWith("Câu hỏi:")) {
            processedContent = processedContent.substring("Câu hỏi:".length).trim()
          }
          question.content = processedContent
          question.contentImagesRaw = contentResult.images
          question.point = extractPointFromCell(contentCells[contentCells.length - 1], zip, relMap)

          // Row chẵn (giải thích)
          const explanationRow = rows[i + 1]
          const explanationCells = Array.isArray(explanationRow["w:tc"])
            ? explanationRow["w:tc"]
            : [explanationRow["w:tc"]]
          const explanationResult = await extractTextAndImagesFromCell(
            explanationCells[0],
            zip,
            relMap
          )
          question.explanation = explanationResult.text
          question.explanationImagesRaw = explanationResult.images

          if (question.content && question.explanation && question.point !== undefined) {
            extractedQuestions.push(question)
          }
        }
      }
      setQuestions(extractedQuestions)

      message.success(`Đã import thành công ${extractedQuestions.length} câu hỏi`)
    } catch (error) {
      message.error("Có lỗi xảy ra khi đọc file Word")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const renderContentWithImagePlaceholders = (text: string, images: any[]) => {
    if (!images || images.length === 0) return text

    let result = text
    images.forEach((img) => {
      const blobUrl = URL.createObjectURL(img.blob)
      result = result.replace(img.name, `<img src="${blobUrl}" style="max-width: 100%;" />`)
    })
    return result
  }

  const columns = [
    {
      title: "Câu hỏi",
      dataIndex: "content",
      width: 100,
      key: "content",
      render: (text: string, record: any) => (
        <div
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          dangerouslySetInnerHTML={{
            __html: renderContentWithImagePlaceholders(text, record.contentImagesRaw || []),
          }}
        />
      ),
    },
    {
      title: "Giải thích",
      dataIndex: "explanation",
      width: 300,
      key: "explanation",
      render: (text: string, record: any) => (
        <div
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          dangerouslySetInnerHTML={{
            __html: renderContentWithImagePlaceholders(text, record.explanationImagesRaw || []),
          }}
        />
      ),
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
      width: 80,
      align: "center" as const,
      render: (point: number) => `${point} đ`,
    },
  ]
  const handleCancel = () => {
    questions.forEach((q) => {
      ;[...(q.contentImagesRaw || []), ...(q.explanationImagesRaw || [])].forEach((img) => {
        if (img.blobUrl) {
          URL.revokeObjectURL(img.blobUrl)
        }
      })
    })
    onCancel()
    setQuestions([])
  }

  return (
    <Modal
      title="Import câu hỏi từ Word"
      open={visible}
      className="w-[80vw] max-h-[80vh]"
      onCancel={handleCancel}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          disabled={questions.length === 0}
          onClick={async () => {
            try {
              const processedQuestions = await Promise.all(
                questions.map(async (q) => {
                  const content = await uploadImagesAndReplacePlaceholders(
                    q.content,
                    q.contentImagesRaw || []
                  )
                  const explanation = await uploadImagesAndReplacePlaceholders(
                    q.explanation,
                    q.explanationImagesRaw || []
                  )
                  return {
                    content,
                    explanation,
                    point: q.point,
                  }
                })
              )

              onImportSuccess(processedQuestions)
              onCancel()
              setQuestions([])
            } catch (error) {
              message.error("Lỗi khi upload ảnh lên MinIO")
              console.error(error)
            }
          }}
        >
          Lưu Câu Hỏi
        </Button>,
      ]}
    >
      <input
        type="file"
        accept=".docx"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleImport(file)
          }
          e.target.value = ""
        }}
        style={{ display: "none" }}
        id="word-import-input"
      />

      <Button
        icon={<UploadOutlined />}
        onClick={() => document.getElementById("word-import-input")?.click()}
      >
        Chọn File Word
      </Button>

      {loading && <div style={{ margin: "16px 0" }}>Đang đọc file...</div>}

      {questions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Table
            columns={columns}
            dataSource={questions}
            rowKey={(record, index) => index?.toString() || ""}
            scroll={{
              x: "100%",
              y: "calc(70vh - 130px)",
            }}
            sticky={{
              offsetHeader: 0,
            }}
            style={{
              maxHeight: "70vh",
            }}
            pagination={{
              position: ["bottomRight"],
              defaultPageSize: 5,
              showSizeChanger: {
                labelRender: ({ value }) => `${value} / trang`,
                optionRender: (oriOption) => `${oriOption.value} / trang`,
              },
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </div>
      )}
    </Modal>
  )
}

export default WordImportModal
