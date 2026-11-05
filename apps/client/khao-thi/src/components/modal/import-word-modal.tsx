import { DownloadOutlined, UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import HtmlTruncate from "@components/commons/html-truncate"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import { DIFFICULT_LABELS, QUESTION_TYPE_LABELS } from "@constants/constants"
import { CLUSTER_QUESTION_TYPE, formatClusterSubLabel } from "@/utils/cluster-question-utils"
import useSpinner from "@hooks/spinner"
import useEnsureQuestionBank from "@hooks/question-bank"
import { createId, type Difficult, QuestionType } from "@workspace/db"
import { useFindManyKnowledgeBlock } from "@workspace/db/hooks"
import { generatePresignedUrl, sqlTransaction } from "@workspace/libs/api/model"
import { env, getRuntimeEnv } from "@workspace/libs/utils"
import { Button, Col, Form, Modal, message, Row, Select } from "antd"
import { XMLParser } from "fast-xml-parser"
import PizZip from "pizzip"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

// Chuẩn hoá mã chuẩn đầu ra giống khi import CĐR: viết hoa, bỏ khoảng trắng
const normalizeOutcomeCode = (code: string) => code.toUpperCase().replace(/\s+/g, "")

interface WordImportModalInput {
  questionBankId?: string
  knowledgeBlockId: string
  subjectVersionId: string
  examFrameworkId?: string
}

const WordImportModal: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { showSpinner, hideSpinner } = useSpinner()
  // Bỏ tính năng "Lưu tại kho": câu hỏi luôn được lưu tại khung đề
  // const [storageType, setStorageType] = useState<"khung" | "kho">("khung")
  const [form] = Form.useForm()
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [importErrors, setImportErrors] = useState<{ rowIndex: number; message: string }[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<FilterProps>({
    questionType: undefined,
    content: "",
    explanation: "",
    difficult: undefined,
  })

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // lọc loại câu hỏi
      if (
        filters.questionType &&
        filters.questionType.length > 0 &&
        !filters.questionType.includes(q.type)
      ) {
        return false
      }

      // lọc độ khó
      if (
        filters.difficult &&
        filters.difficult.length > 0 &&
        !filters.difficult.includes(q.difficult)
      ) {
        return false
      }

      // lọc nội dung
      if (filters.content) {
        const content = q.content?.toLowerCase() || ""
        if (!content.includes(filters.content.toLowerCase())) {
          return false
        }
      }

      // lọc giải thích
      if (filters.explanation) {
        const explanation = q.explanation?.toLowerCase() || ""
        if (!explanation.includes(filters.explanation.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [questions, filters])

  const pagedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredQuestions.slice(start, start + pageSize)
  }, [filteredQuestions, currentPage, pageSize])

  const { onOpen: onOpenAddHuongDanNganHang } = useDisclosure({
    tag: "AddHuongDanNganHang",
  })

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_ASSET_PREFIX}/files/file-mau-import-cau-hoi.docx`
      )
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "file-mau-import-cau-hoi.docx"
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)

      message.success("Tải xuống thành công")
    } catch (error) {
      message.error("Không thể tải file mẫu")
      console.error("Lỗi tải file:", error)
    }
  }

  const { isOpen, onClose, input } = useDisclosure<WordImportModalInput>({
    tag: "WordImportModal",
    onClose: () => {
      questions.forEach((q) => {
        ;[...(q.contentImagesRaw || []), ...(q.explanationImagesRaw || [])].forEach((img) => {
          if (img.blobUrl) {
            URL.revokeObjectURL(img.blobUrl)
          }
        })
      })

      setQuestions([])
      setSelectedRowKeys([])
      setImportErrors([])
    },
  })

  const { ensureQuestionBankId } = useEnsureQuestionBank(input?.subjectVersionId)

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    trimValues: false,
  })
  const extractRawTextFromCell = (cell: any): string => {
    if (!cell) return ""

    const getText = (node: any): string => {
      if (!node) return ""
      let t = ""

      // w:t text node
      const wt = node["w:t"]
      if (typeof wt === "string") t += wt
      else if (typeof wt === "object" && wt?.["#text"]) t += wt["#text"]

      // runs
      if (node["w:r"]) {
        const runs = Array.isArray(node["w:r"]) ? node["w:r"] : [node["w:r"]]
        for (const r of runs) t += getText(r)
      }

      // paragraphs
      if (node["w:p"]) {
        const paras = Array.isArray(node["w:p"]) ? node["w:p"] : [node["w:p"]]
        for (const p of paras) t += getText(p)
      }

      // content controls (w:sdt) – thường gặp trong cell có form field
      if (node["w:sdt"]) {
        const sdts = Array.isArray(node["w:sdt"]) ? node["w:sdt"] : [node["w:sdt"]]
        for (const sdt of sdts) {
          if (sdt["w:sdtContent"]) t += getText(sdt["w:sdtContent"])
        }
      }

      // hyperlinks
      if (node["w:hyperlink"]) {
        const links = Array.isArray(node["w:hyperlink"])
          ? node["w:hyperlink"]
          : [node["w:hyperlink"]]
        for (const link of links) t += getText(link)
      }

      return t
    }

    return getText(cell)
  }

  const normalizeWordQuestionText = (text: string) => {
    return text
      .replace(/\r/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/\b([a-d])\.\s+(?=[A-D]\.)/gi, "")
      .replace(/([^\n\s])([A-D])\.(?=\S)/g, "$1\n$2. ")
      .replace(/([^\n])([A-D])\.\s+/g, "$1\n$2. ")
      .replace(/(\S)(\*\s*Đáp\s*án\s*:)/gi, "$1\n$2")
  }

  const cleanQuestionText = (text: string) => normalizeWordQuestionText(text)

  const splitQuestionContentAndOptionLines = (lines: string[]) => {
    const optionLineRegex = /^\s*[A-D]\.\s*/i

    return {
      questionLines: lines.filter((line) => !optionLineRegex.test(line)),
      optionLines: lines.filter((line) => optionLineRegex.test(line)),
    }
  }

  const mapQuestionTypeFromText = (raw: string): QuestionType | undefined => {
    const value = raw.trim().toUpperCase().replace(/\s+/g, "")

    const mapping: Record<string, QuestionType> = {
      TL: QuestionType.ESSAY,
      TN: QuestionType.SINGLE_CHOICE,
      TNN: QuestionType.MULTIPLE_CHOICE,
      DK: QuestionType.FILL_IN_BLANK,
      SX: QuestionType.ORDERING,
      CH: CLUSTER_QUESTION_TYPE,
    }

    return mapping[value]
  }

  const mapDifficultFromText = (raw: string): Difficult | undefined => {
    const value = raw.trim().toUpperCase().replace(/\s+/g, "")

    const mapping: Record<string, Difficult> = {
      NB: "D1",
      TH: "D2",
      VD: "D3",
      VDC: "D4",
    }

    return mapping[value]
  }

  const extractTextAndImagesFromParagraph = (
    p: any,
    zip: PizZip,
    relMap: Map<string, string>,
    startIndex = 1
  ) => {
    const runs = Array.isArray(p?.["w:r"]) ? p["w:r"] : [p?.["w:r"]]

    let text = ""
    const images: { name: string; blob: Blob }[] = []
    let imgIndex = startIndex

    for (const r of runs) {
      let value = ""
      const t = r?.["w:t"]

      if (typeof t === "string") value = t
      else if (typeof t === "object" && t?.["#text"]) value = t["#text"]

      if (r?.["w:tab"]) {
        text += "\t"
      }

      if (r?.["w:br"] || r?.["w:cr"]) {
        text += "\n"
      }

      if (value) {
        text += value
      }

      const drawing = r?.["w:drawing"]
      const blip =
        drawing?.["wp:inline"]?.["a:graphic"]?.["a:graphicData"]?.["pic:pic"]?.["pic:blipFill"]?.[
          "a:blip"
        ]

      const relId = blip?.["@_r:embed"]
      if (relId) {
        const file = zip.file(`word/${relMap.get(relId)}`)
        if (file) {
          const blob = new Blob([file.asArrayBuffer()], { type: "image/png" })
          const name = `{img_${imgIndex}}`

          text += name
          images.push({ name, blob })
          imgIndex++
        }
      }
    }

    return {
      text: `${normalizeWordQuestionText(text)}\n`,
      images,
      nextIndex: imgIndex,
    }
  }

  const extractPointFromText = (text: string): { value?: number } => {
    if (!text) return {}

    const match = text.match(/\(\s*([\d.,]+)\s*đ\s*\)/i)
    if (!match) return {}

    const value = Number(match[0])
    if (Number.isNaN(value)) return {}

    return { value }
  }

  const MAX_POINT_PER_QUESTION = 9

  const validateQuestionPoint = (value?: number) => {
    if (value === undefined) return { isInvalid: false, color: "black" }

    if (value > MAX_POINT_PER_QUESTION) {
      return {
        isInvalid: true,
        color: "red",
        warning: `Điểm ${value} vượt quá ${MAX_POINT_PER_QUESTION}`,
      }
    }

    const decimal = value % 1
    const valid = [
      0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5,
      4.75, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25,
      9.5, 9.75, 10,
    ]

    if (!valid.includes(Number(decimal.toFixed(2)))) {
      return {
        isInvalid: true,
        color: "red",
        warning: `Điểm ${value} không hợp lệ`,
      }
    }

    return { isInvalid: false, color: "black" }
  }

  const uploadImagesAndReplacePlaceholders = async (
    rawText: string,
    images: { name: string; blob: Blob }[]
  ): Promise<string> => {
    let result = rawText

    for (const img of images) {
      try {
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

        const uploadRes = await fetch(url, {
          method: "PUT",
          body: img.blob,
        })

        if (!uploadRes.ok) {
          throw new Error(`Upload ảnh thất bại: ${uploadRes.status}`)
        }

        const imageUrl = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${fileName}`
        result = result.replace(img.name, `<img src="${imageUrl}" style="max-width: 100%;" />`)
      } catch (error) {
        console.error(`Failed to upload image ${img.name}:`, error)
      }
    }

    return result.replace(/\n/g, "<br />")
  }

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,

    onSelect: (record: any, selected: boolean) => {
      const key = record.key

      if (selected) {
        setSelectedRowKeys((prev) => {
          if (prev.includes(key)) return prev
          return [...prev, key]
        })
      } else {
        setIsAllSelected(false)
        setSelectedRowKeys((prev) => prev.filter((k) => k !== key))
      }
    },

    onChange: (_keys: any, _rows: any, info: any) => {
      if (info?.type !== "all") return

      if (isAllSelected) {
        setSelectedRowKeys([])
        setIsAllSelected(false)
        return
      }

      setSelectedRowKeys(questions.map((q) => q.key))
      setIsAllSelected(true)
    },
  }

  const parseQuestionHeader = (
    line: string
  ): {
    questionNumber: number
    typeCode: string
    difficultCode: string
    point: number
    outcomeCode?: string
    questionText: string
  } | null => {
    // Pattern: Câu N: ( TYPE- DIFFICULTY) ( POINT đ) [MÃ CĐR] Question text
    // TYPE can be: TN, TNN, DK, SX, TL
    // DIFFICULTY can be: NB, TH, VD, VDC
    // [MÃ CĐR] tuỳ chọn: mã chuẩn đầu ra của khung đề
    const headerRegex =
      /^Câu\s*(\d+)\s*:\s*\(\s*(TNN|TN|DK|SX|TL|CH)\s*-\s*(NB|TH|VD|VDC)\s*\)\s*\(\s*([\d.,]+)\s*đ\s*\)\s*(?:\[\s*([^\]]*?)\s*\])?\s*(.+)?$/i

    const match = line.match(headerRegex)
    if (!match) return null

    const questionNumber = Number.parseInt(match[1], 10)
    const typeCode = match[2].toUpperCase()
    const difficultCode = match[3].toUpperCase()
    const pointStr = match[4].replace(",", ".")
    const point = Number.parseFloat(pointStr)
    const outcomeCode = match[5]?.trim() || undefined
    const questionText = match[6]?.trim() || ""

    return { questionNumber, typeCode, difficultCode, point, outcomeCode, questionText }
  }

  const subQuestionStartRegex = /^([a-z])\)\s*(.*)$/i

  const subQuestionMetaRegex =
    /^\(\s*(TNN|TN|DK|SX|TL)\s*-\s*(NB|TH|VD|VDC)\s*\)\s*\(\s*([\d.,]+)\s*đ\s*\)\s*(.*)$/i

  const splitSegmentBodyAndAnswer = (segmentLines: string[]) => {
    const answerStartIdx = segmentLines.findIndex((l) => /^\*\s*Đáp\s*án\s*:/i.test(l))
    const bodyLines = (
      answerStartIdx >= 0 ? segmentLines.slice(0, answerStartIdx) : segmentLines
    ).filter(Boolean)

    const answerLines: string[] = []
    if (answerStartIdx >= 0) {
      const firstAnswerLine = segmentLines[answerStartIdx]
        .replace(/^\*\s*Đáp\s*án\s*:\s*/i, "")
        .trim()
      if (firstAnswerLine) answerLines.push(firstAnswerLine)
      for (let i = answerStartIdx + 1; i < segmentLines.length; i++) {
        if (segmentLines[i]) answerLines.push(segmentLines[i])
      }
    }

    return { bodyLines, answerLines }
  }

  const parseQuestionSegment = (type: QuestionType, segmentLines: string[]) => {
    const { bodyLines, answerLines } = splitSegmentBodyAndAnswer(segmentLines)
    const normalizedBody = normalizeWordQuestionText(bodyLines.join("\n"))
    const { questionLines, optionLines } = splitQuestionContentAndOptionLines(
      normalizedBody.split("\n").filter(Boolean)
    )
    const rawQuestionText = normalizeWordQuestionText(questionLines.join("\n"))
    const answerTextRaw = normalizeWordQuestionText(answerLines.join("\n"))

    const result: any = {
      content: cleanQuestionText(rawQuestionText),
      explanation: answerTextRaw,
      answer: answerTextRaw,
      optionsRaw: [],
    }

    if (type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE) {
      result.optionsRaw = optionLines.map((line) => {
        const match = line.match(/^([A-D])\.\s*(.+)$/i)
        return {
          label: match?.[1]?.toUpperCase(),
          content: match?.[2] || "",
          isCorrect: false,
        }
      })

      if (type === QuestionType.SINGLE_CHOICE) {
        const correctMatch = answerLines[0]?.match(/^([A-D])\.?\s*/i)
        const correct = correctMatch?.[1]?.toUpperCase()
        result.optionsRaw.forEach((o: any) => {
          o.isCorrect = o.label === correct
        })
      } else {
        const correctLabels = answerLines
          .map((l) => l.trim())
          .map((l) => l.match(/^([A-D])\./i)?.[1]?.toUpperCase())
          .filter(Boolean)
        result.optionsRaw.forEach((o: any) => {
          o.isCorrect = correctLabels.includes(o.label)
        })
      }
    } else if (type === QuestionType.ORDERING) {
      result.optionsRaw = optionLines.map((line) => {
        const match = line.match(/^([A-D])\.\s*(.+)$/i)
        return {
          label: match?.[1]?.toUpperCase(),
          content: match?.[2] || "",
        }
      })
    }

    return result
  }

  const parseSubQuestionMeta = (
    restAfterLabel: string,
    fallback: { type: QuestionType; difficult: Difficult; point: number }
  ) => {
    const metaMatch = restAfterLabel.match(subQuestionMetaRegex)
    if (!metaMatch) {
      return {
        type: fallback.type,
        difficult: fallback.difficult,
        point: fallback.point,
        remainderLines: restAfterLabel ? [restAfterLabel] : [],
      }
    }

    const type = mapQuestionTypeFromText(metaMatch[1]) ?? fallback.type
    const difficult = mapDifficultFromText(metaMatch[2]) ?? fallback.difficult
    const point = Number.parseFloat(metaMatch[3].replace(",", "."))
    const trailing = metaMatch[4]?.trim()

    return {
      type,
      difficult,
      point: Number.isNaN(point) ? fallback.point : point,
      remainderLines: trailing ? [trailing] : [],
    }
  }

  const validateParsedSubQuestion = (sq: any) => {
    if (sq.type === QuestionType.SINGLE_CHOICE || sq.type === QuestionType.MULTIPLE_CHOICE) {
      return !sq.optionsRaw?.length || !sq.optionsRaw.some((o: any) => o.isCorrect)
    }
    if (sq.type === QuestionType.ORDERING) {
      return !sq.optionsRaw?.length || !sq.answer
    }
    if (sq.type === QuestionType.FILL_IN_BLANK) {
      return !sq.answer?.trim()
    }
    return false
  }

  const buildSubQuestionRelationRows = (sq: any, subId: string) => {
    const multipleChoiceOptions: any[] = []
    const orderingItems: any[] = []
    const fillInBlankSlots: any[] = []

    if (
      (sq.type === QuestionType.SINGLE_CHOICE || sq.type === QuestionType.MULTIPLE_CHOICE) &&
      sq.optionsRaw?.length > 0
    ) {
      sq.optionsRaw.forEach((opt: any, optIndex: number) => {
        multipleChoiceOptions.push({
          questionId: subId,
          content: `${opt.label}. ${opt.content}`,
          isCorrect: opt.isCorrect,
          order: optIndex + 1,
        })
      })
    }

    if (sq.type === QuestionType.ORDERING && sq.optionsRaw?.length > 0) {
      const orderMatch = sq.answer?.match(
        /([A-D])\s*(?:→|->)\s*([A-D])(?:\s*(?:→|->)\s*([A-D]))?(?:\s*(?:→|->)\s*([A-D]))?/
      )

      if (orderMatch) {
        const correctSequence = orderMatch.slice(1).filter(Boolean) as string[]
        const orderMap = new Map<string, number>()
        correctSequence.forEach((label: string, idx: number) => {
          orderMap.set(label, idx + 1)
        })

        sq.optionsRaw.forEach((opt: any) => {
          orderingItems.push({
            questionId: subId,
            content: `${opt.label}. ${opt.content}`,
            correctOrder: orderMap.get(opt.label) ?? sq.optionsRaw.length + 1,
          })
        })
      }
    }

    if (sq.type === QuestionType.FILL_IN_BLANK) {
      const slotMatches =
        sq.answer
          ?.split(/[\n;]/)
          .map((line: string) => {
            const match = line.match(/^\s*[([\{]?(\d+)[)\]\}\.\:\=\-]*\s*(.+)$/)
            if (!match) return null
            return {
              order: Number(match[1]),
              correctAnswer: match[2].trim(),
            }
          })
          .filter(Boolean) || []

      slotMatches.forEach((slot: any) => {
        fillInBlankSlots.push({
          questionId: subId,
          order: slot.order,
          correctAnswer: slot.correctAnswer,
        })
      })
    }

    return { multipleChoiceOptions, orderingItems, fillInBlankSlots }
  }

  const questionStartRegex =
    /^Câu\s*(\d+)\s*:\s*\(\s*(TNN|TN|DK|SX|TL|CH)\s*-\s*(NB|TH|VD|VDC)\s*\)\s*\(\s*[\d.,]+\s*đ\s*\)/i

  const normalizeFingerprintText = (text?: string) => (text || "").trim().replace(/\s+/g, " ")

  const clusterFingerprint = (q: any) => {
    const subFp = (q.subQuestionsRaw || [])
      .map(
        (sq: any) =>
          `${sq.label}:${sq.type}:${sq.point}:${sq.difficult}:${normalizeFingerprintText(sq.content)}:${(
            sq.optionsRaw || []
          )
            .map((o: any) => `${o.label}=${normalizeFingerprintText(o.content)}`)
            .join(",")}`
      )
      .join("|")
    return `cluster:${normalizeFingerprintText(q.content)}:${subFp}`
  }

  const dedupeExtractedQuestions = (items: any[]) => {
    const seen = new Set<string>()
    return items.filter((q) => {
      const key =
        q.type === CLUSTER_QUESTION_TYPE
          ? clusterFingerprint(q)
          : `${q.type}:${normalizeFingerprintText(q.content)}:${q.point}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const parseClusterSubQuestions = (
    blockLines: string[],
    headerInfo: { questionText: string },
    difficult: Difficult,
    parentPoint: number
  ) => {
    const stemLines: string[] = []
    const stemSeen = new Set<string>()
    const addStemLine = (line: string) => {
      const trimmed = line.trim()
      if (!trimmed || stemSeen.has(trimmed)) return
      stemSeen.add(trimmed)
      stemLines.push(trimmed)
    }

    if (headerInfo.questionText) addStemLine(headerInfo.questionText)

    const subStarts: { index: number; label: string }[] = []
    for (let i = 0; i < blockLines.length; i++) {
      const line = (blockLines[i] || "").trim()
      if (!line) continue
      if (subQuestionStartRegex.test(line)) {
        subStarts.push({
          index: i,
          label: line.match(subQuestionStartRegex)?.[1]?.toLowerCase() || "",
        })
      } else if (subStarts.length === 0) {
        addStemLine(line)
      }
    }

    if (subStarts.length === 0) {
      return {
        stem: cleanQuestionText(stemLines.join("\n")),
        subQuestions: [] as any[],
        error: "Không tìm thấy câu hỏi con (a), b), c)...)",
      }
    }

    const pointPerSub = Math.round((parentPoint / subStarts.length) * 100) / 100 || parentPoint

    const subQuestions = subStarts.map((start, s) => {
      const end = s + 1 < subStarts.length ? subStarts[s + 1].index : blockLines.length
      const rawSegmentLines = blockLines
        .slice(start.index, end)
        .map((l) => l.trim())
        .filter(Boolean)

      const firstLine = rawSegmentLines[0] || ""
      const restAfterLabel = firstLine.match(subQuestionStartRegex)?.[2]?.trim() || ""
      const otherLines = rawSegmentLines.slice(1)

      const meta = parseSubQuestionMeta(restAfterLabel, {
        type: QuestionType.SINGLE_CHOICE,
        difficult,
        point: pointPerSub,
      })

      const segmentLines = [...meta.remainderLines, ...otherLines]
      const parsed = parseQuestionSegment(meta.type, segmentLines)

      return {
        type: meta.type,
        difficult: meta.difficult,
        point: meta.point,
        content: parsed.content,
        optionsRaw: parsed.optionsRaw,
        explanation: parsed.explanation,
        answer: parsed.answer,
        label: start.label,
      }
    })

    return { stem: cleanQuestionText(stemLines.join("\n")), subQuestions }
  }

  const handleImport = async (file: File) => {
    setLoading(true)
    setImportErrors([])
    try {
      const arrayBuffer = await file.arrayBuffer()
      const zip = new PizZip(arrayBuffer)

      const documentXml = zip.file("word/document.xml")?.asText()
      const relsXml = zip.file("word/_rels/document.xml.rels")?.asText()

      if (!documentXml) {
        message.error("Không đọc được nội dung Word")
        return
      }

      const doc = parser.parse(documentXml)
      const rels = relsXml ? parser.parse(relsXml)?.Relationships?.Relationship || [] : []

      // ===== MAP IMAGE REL =====
      const relMap = new Map<string, string>()
      ;(Array.isArray(rels) ? rels : [rels]).forEach((rel) => {
        if (rel["@_Type"]?.includes("image")) {
          relMap.set(rel["@_Id"], rel["@_Target"])
        }
      })

      const body = doc["w:document"]?.["w:body"]

      const paragraphs: any[] = []

      const collectParagraphs = (node: any) => {
        if (!node) return

        if (node["w:p"]) {
          const ps = Array.isArray(node["w:p"]) ? node["w:p"] : [node["w:p"]]
          paragraphs.push(...ps)
        }

        Object.values(node).forEach((child: any) => {
          if (typeof child === "object") {
            if (Array.isArray(child)) child.forEach(collectParagraphs)
            else collectParagraphs(child)
          }
        })
      }

      collectParagraphs(body)

      if (paragraphs.length === 0) {
        message.error("File Word không có nội dung câu hỏi")
        return
      }

      let imgCounter = 1

      const lines: { text: string; images: { name: string; blob: Blob }[] }[] = []

      for (const p of paragraphs) {
        const { text, images, nextIndex } = extractTextAndImagesFromParagraph(
          p,
          zip,
          relMap,
          imgCounter
        )

        imgCounter = nextIndex

        lines.push({
          text,
          images,
        })
      }

      const questionBlocks: {
        lines: { text: string; images: { name: string; blob: Blob }[] }[]
      }[] = []
      let currentBlock: { text: string; images: { name: string; blob: Blob }[] }[] = []
      let foundFirstQuestion = false

      for (const line of lines) {
        const trimmed = line.text.replace(/\s+/g, " ").trim()

        // Chỉ tách block khi gặp header câu hỏi đầy đủ (tránh tách nhầm trong nội dung)
        if (questionStartRegex.test(trimmed)) {
          foundFirstQuestion = true
          // Lưu block cũ
          if (currentBlock.length > 0) {
            questionBlocks.push({ lines: currentBlock })
          }
          currentBlock = [line]
        } else if (foundFirstQuestion) {
          if (!trimmed && currentBlock.length > 0) {
            currentBlock.push(line)
          } else if (trimmed) {
            currentBlock.push(line)
          }
        }
        // Bỏ qua tất cả dòng trước câu hỏi đầu tiên (phần header hướng dẫn)
      }

      // Lưu block cuối
      if (currentBlock.length > 0) {
        questionBlocks.push({ lines: currentBlock })
      }

      if (questionBlocks.length === 0) {
        message.error("Không tìm thấy câu hỏi nào trong file Word")
        return
      }

      const extractedQuestions: any[] = []
      const errors: { rowIndex: number; message: string }[] = []
      const knowledgeBlockByCode = await fetchKnowledgeBlockByCode()
      const validOutcomeCodes = [...knowledgeBlockByCode.keys()].join(", ") || "khung chưa có mã nào"

      for (const block of questionBlocks) {
        const allText = block.lines.map((l) => l.text).join("\n")
        const allImages = block.lines.flatMap((l) => l.images)

        // Tách header và các dòng còn lại
        const blockLines = allText.split("\n")
        const headerLine = (blockLines[0] || "").replace(/\u00A0/g, " ").trim()

        const headerInfo = parseQuestionHeader(headerLine)
        if (!headerInfo) {
          errors.push({
            rowIndex: questionBlocks.indexOf(block) + 1,
            message: `Không parse được header: "${headerLine.slice(0, 80)}..."`,
          })
          continue
        }

        const type = mapQuestionTypeFromText(headerInfo.typeCode)
        const difficult = mapDifficultFromText(headerInfo.difficultCode)

        if (!type || !difficult) {
          errors.push({
            rowIndex: headerInfo.questionNumber,
            message: `Câu ${headerInfo.questionNumber}: Sai mã — Loại: "${headerInfo.typeCode}", Độ khó: "${headerInfo.difficultCode}" (hợp lệ: TL, TN, TNN, DK, SX, CH | NB, TH, VD, VDC)`,
          })
          continue
        }

        const { value: extractedPoint } = extractPointFromText(headerLine)

        const point = extractedPoint ?? headerInfo.point

        const pointCheck = validateQuestionPoint(point)
        if (pointCheck.isInvalid && pointCheck.warning) {
          errors.push({ rowIndex: headerInfo.questionNumber, message: pointCheck.warning })
        }

        // Mã chuẩn đầu ra ghi ở đầu dòng, phải thuộc khung đề đang import
        let knowledgeBlockId: string | undefined
        if (headerInfo.outcomeCode) {
          knowledgeBlockId = knowledgeBlockByCode.get(normalizeOutcomeCode(headerInfo.outcomeCode))
          if (!knowledgeBlockId) {
            errors.push({
              rowIndex: headerInfo.questionNumber,
              message: `Câu ${headerInfo.questionNumber}: Mã chuẩn đầu ra "${headerInfo.outcomeCode}" không thuộc khung đề này (mã hợp lệ: ${validOutcomeCodes})`,
            })
          }
        }

        if (type === CLUSTER_QUESTION_TYPE) {
          const clusterParsed = parseClusterSubQuestions(
            blockLines.slice(1),
            headerInfo,
            difficult,
            point ?? headerInfo.point
          )

          if ("error" in clusterParsed && clusterParsed.error) {
            errors.push({
              rowIndex: headerInfo.questionNumber,
              message: `Câu ${headerInfo.questionNumber}: ${clusterParsed.error}`,
            })
            continue
          }

          const invalidSub = clusterParsed.subQuestions.find(validateParsedSubQuestion)
          if (invalidSub) {
            errors.push({
              rowIndex: headerInfo.questionNumber,
              message: `Câu ${headerInfo.questionNumber}: Thiếu đáp án hoặc dữ liệu ở câu hỏi con ${invalidSub.label})`,
            })
          }

          extractedQuestions.push({
            type,
            difficult,
            knowledgeBlockId,
            contentImagesRaw: allImages,
            explanationImagesRaw: [],
            pointRaw: headerInfo.point,
            point: pointCheck.isInvalid ? undefined : point,
            pointStatus: pointCheck.color,
            content: clusterParsed.stem,
            subQuestionsRaw: clusterParsed.subQuestions,
            previewContent: [
              clusterParsed.stem,
              ...clusterParsed.subQuestions.map((sq, i) => {
                const { prefix, body } = formatClusterSubLabel(i, sq.content)
                if (
                  sq.type === QuestionType.SINGLE_CHOICE ||
                  sq.type === QuestionType.MULTIPLE_CHOICE
                ) {
                  const opts = sq.optionsRaw
                    .map((o: any) => `${o.label}. ${o.content}`)
                    .join("    ")
                  return `${prefix}${body ? ` ${body}\n` : " "}${opts}`
                }
                if (sq.type === QuestionType.ORDERING && sq.optionsRaw?.length) {
                  const opts = sq.optionsRaw.map((o: any) => `${o.label}. ${o.content}`).join("\n")
                  return `${prefix}${body ? ` ${body}\n` : " "}${opts}`
                }
                return `${prefix}${body ? ` ${body}` : ""}`
              }),
            ].join("\n\n"),
            explanation: clusterParsed.subQuestions
              .map((sq, i) => `${String.fromCharCode(97 + i)}) ${sq.explanation || "—"}`)
              .join("\n"),
          })
          continue
        }

        // Tìm dòng bắt đầu bằng "*Đáp án"
        const answerStartIdx = blockLines.findIndex((l) => /^\*\s*Đáp\s*án\s*:/i.test(l))

        // Nội dung câu hỏi: từ header text + các dòng trước đáp án
        const contentLines: string[] = []
        if (headerInfo.questionText) {
          contentLines.push(headerInfo.questionText)
        }

        const endIdx = answerStartIdx >= 0 ? answerStartIdx : blockLines.length
        for (let i = 1; i < endIdx; i++) {
          contentLines.push(blockLines[i])
        }

        // Đáp án: từ dòng "*Đáp án:" trở đi
        const answerLines: string[] = []
        if (answerStartIdx >= 0) {
          // Lấy text sau "*Đáp án:" trên cùng dòng
          const firstAnswerLine = blockLines[answerStartIdx]
            .replace(/^\*Đáp\s*án\s*:\s*/i, "")
            .trim()
          if (firstAnswerLine) {
            answerLines.push(firstAnswerLine)
          }
          // Các dòng tiếp theo
          for (let i = answerStartIdx + 1; i < blockLines.length; i++) {
            if (blockLines[i]) {
              answerLines.push(blockLines[i])
            }
          }
        }

        const previewQuestionText = normalizeWordQuestionText(contentLines.join("\n"))
        const { questionLines, optionLines } = splitQuestionContentAndOptionLines(contentLines)
        const rawQuestionText = normalizeWordQuestionText(questionLines.join("\n"))
        const answerTextRaw = normalizeWordQuestionText(answerLines.join("\n"))

        const question: any = {
          type,
          difficult,
          knowledgeBlockId,
          contentImagesRaw: allImages,
          explanationImagesRaw: [],
          pointRaw: headerInfo.point,
          point: pointCheck.isInvalid ? undefined : point,
          pointStatus: pointCheck.color,
          previewContent: previewQuestionText,
        }

        if (type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE) {
          question.content = cleanQuestionText(rawQuestionText)

          question.optionsRaw = optionLines.map((line) => {
            const match = line.match(/^([A-D])\.\s*(.+)$/i)
            return {
              label: match?.[1]?.toUpperCase(),
              content: match?.[2] || "",
              isCorrect: false,
            }
          })

          if (type === QuestionType.SINGLE_CHOICE) {
            // Đáp án dạng: "D. Liên Xô" hoặc chỉ "D"
            const correctMatch = answerLines[0]?.match(/^([A-D])\.?\s*/i)
            const correct = correctMatch?.[1]?.toUpperCase()
            question.optionsRaw.forEach((o: any) => {
              o.isCorrect = o.label === correct
            })
          }

          if (type === QuestionType.MULTIPLE_CHOICE) {
            // Nhiều đáp án, mỗi dòng: "A. Nội dung" hoặc chỉ "A"
            const correctLabels = answerLines
              .map((l) => l.trim())
              .map((l) => l.match(/^([A-D])\./i)?.[1]?.toUpperCase())
              .filter(Boolean)
            question.optionsRaw.forEach((o: any) => {
              o.isCorrect = correctLabels.includes(o.label)
            })
          }
          question.explanation = answerTextRaw
        } else if (type === QuestionType.ORDERING) {
          question.content = cleanQuestionText(rawQuestionText)
          question.explanation = answerTextRaw
          question.answer = answerTextRaw

          question.optionsRaw = optionLines.map((line) => {
            const match = line.match(/^([A-D])\.\s*(.+)$/i)
            return {
              label: match?.[1]?.toUpperCase(),
              content: match?.[2] || "",
            }
          })
        } else if (type === QuestionType.FILL_IN_BLANK) {
          question.content = cleanQuestionText(rawQuestionText)
          question.explanation = answerTextRaw
          question.answer = answerTextRaw
        } else {
          // ESSAY (TL)
          question.content = cleanQuestionText(rawQuestionText)
          question.explanation = answerTextRaw
        }

        extractedQuestions.push(question)
      }

      const dedupedQuestions = dedupeExtractedQuestions(extractedQuestions)

      const questionsWithKey = dedupedQuestions.map((q, index) => ({
        ...q,
        key: index.toString(),
      }))

      console.table(
        questionsWithKey.map((q) => ({
          content: q.content?.slice(0, 30),
          point: q.point,
        }))
      )

      setQuestions(questionsWithKey)
      setSelectedRowKeys(questionsWithKey.map((q) => q.key))
      setImportErrors(errors)

      message.success(`Đã import ${dedupedQuestions.length} câu hỏi`)
    } catch (error) {
      console.error(error)
      message.error("Có lỗi xảy ra khi đọc file Word")
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
    return result.replace(/\n/g, "<br />")
  }

  const columns = [
    {
      title: "STT",
      dataIndex: "key",
      width: 55,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Câu hỏi",
      dataIndex: "content",
      width: 350,
      type: "input",
      render: (text: string, record: any) => {
        let html = record.previewContent || text

        html = renderContentWithImagePlaceholders(html, record.contentImagesRaw || [])

        return (
          <HtmlTruncate>
            <div
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              dangerouslySetInnerHTML={{
                __html: renderWithMath(html),
              }}
            />
          </HtmlTruncate>
        )
      },
    },
    {
      title: "Loại câu hỏi",
      dataIndex: "type",
      width: 120,
      key: "type",
      type: "select",
      render: (value: string) => {
        const key = value as QuestionType
        return QUESTION_TYPE_LABELS[key] ?? value
      },
      align: "center" as const,
    },
    {
      title: "Độ khó",
      dataIndex: "difficult",
      width: 120,
      key: "difficult",
      render: (value: Difficult) => DIFFICULT_LABELS[value] ?? value,
      align: "center" as const,
    },
    {
      title: "Đáp án",
      dataIndex: "explanation",
      width: 320,
      render: (_: any, record: any) => {
        let html = record.explanation || "—"

        html = renderContentWithImagePlaceholders(html, record.explanationImagesRaw || [])
        return (
          <div
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        )
      },
    },

    {
      title: "Chuẩn đầu ra",
      dataIndex: "knowledgeBlockId",
      width: 200,
      key: "knowledgeBlockId",
      render: (value: string | undefined, record: any) => (
        <Select
          className="w-full"
          allowClear
          value={value}
          placeholder="Theo chuẩn đầu ra mặc định"
          options={knowledgeBlockOptions}
          onChange={(knowledgeBlockId) =>
            setQuestions((prev) =>
              prev.map((q) => (q.key === record.key ? { ...q, knowledgeBlockId } : q))
            )
          }
        />
      ),
    },
    {
      title: "Điểm",
      dataIndex: "point",
      width: 80,
      key: "point",
      align: "center" as const,
      render: (_: any, record: any) => {
        const value = record.pointRaw
        const color = record.pointStatus === "red" ? "#ff4d4f" : "inherit"

        return <span style={{ color, fontWeight: 600 }}>{value !== undefined ? value : "—"}</span>
      },
    },
  ]

  const knowledgeBlockWhere = {
    deletedAt: null,
    examMatrix: {
      deletedAt: null,
      ...(input?.examFrameworkId
        ? { examFrameworkId: input.examFrameworkId }
        : {
            examFramework: {
              subjectVersionId: input?.subjectVersionId,
            },
          }),
    },
  }

  const { data: knowledgeBlockData, refetch: refetchKnowledgeBlocks } = useFindManyKnowledgeBlock(
    { where: knowledgeBlockWhere },
    { enabled: isOpen }
  )

  const knowledgeBlockOptions = useMemo(
    () =>
      (knowledgeBlockData ?? []).map(({ id, name, code }) => ({
        value: id,
        label: code ? `${code} - ${name}` : name,
      })),
    [knowledgeBlockData]
  )

  // Lấy mới danh sách chuẩn đầu ra của khung ngay lúc đọc file, không dùng dữ liệu cache
  const fetchKnowledgeBlockByCode = async () => {
    const res = await sqlTransaction([
      {
        model: "KnowledgeBlock",
        operation: "findMany",
        data: { where: knowledgeBlockWhere, select: { id: true, code: true } },
      },
    ])
    const rows: { id: string; code: string | null }[] =
      res?.status === 200 ? ((res.data as any)?.[0] ?? []) : (knowledgeBlockData ?? [])
    refetchKnowledgeBlocks()

    const map = new Map<string, string>()
    for (const kb of rows) {
      if (kb.code) map.set(normalizeOutcomeCode(kb.code), kb.id)
    }
    return map
  }

  const buildQuestionPayload = async (
    q: any,
    questionBankId: string,
    knowledgeBlockId?: string
  ) => {
    if (q.type === CLUSTER_QUESTION_TYPE) {
      let content = ""
      try {
        content = await uploadImagesAndReplacePlaceholders(q.content, q.contentImagesRaw || [])
      } catch {
        throw new Error("Upload ảnh thất bại")
      }

      return {
        isCluster: true,
        parent: {
          id: createId(),
          content,
          type: CLUSTER_QUESTION_TYPE,
          difficult: q.difficult,
          point: q.point,
          isAutoGraded: true,
          questionBankId,
          knowledgeBlockId,
        },
        subQuestionsRaw: q.subQuestionsRaw || [],
      }
    }

    let content = ""
    let explanation = ""

    try {
      content = await uploadImagesAndReplacePlaceholders(q.content, q.contentImagesRaw || [])

      explanation = await uploadImagesAndReplacePlaceholders(
        q.explanation,
        q.explanationImagesRaw || []
      )
    } catch (e) {
      throw new Error("Upload ảnh thất bại")
    }
    const payload: any = {
      content,
      explanation,
      type: q.type,
      difficult: q.difficult,
      point: q.point,
      isAutoGraded: false,
      questionBankId,
      id: createId(),
      knowledgeBlockId,
    }

    if (
      (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE) &&
      q.optionsRaw?.length > 0
    ) {
      payload.multipleChoiceOptions = {
        create: q.optionsRaw.map((opt: any, index: number) => ({
          content: `${opt.label}. ${opt.content}`,
          isCorrect: opt.isCorrect,
          order: index + 1,
        })),
      }
    }

    if (q.type === QuestionType.ORDERING && q.optionsRaw?.length > 0) {
      const orderMatch = q.answer?.match(
        /([A-D])\s*(?:→|->)\s*([A-D])(?:\s*(?:→|->)\s*([A-D]))?(?:\s*(?:→|->)\s*([A-D]))?/
      )

      if (orderMatch) {
        const correctSequence = orderMatch.slice(1).filter(Boolean) as string[]
        const orderMap = new Map<string, number>()
        correctSequence.forEach((label: string, idx: number) => {
          orderMap.set(label, idx + 1)
        })

        payload.orderingItems = {
          create: q.optionsRaw.map((opt: any) => ({
            content: `${opt.label}. ${opt.content}`,
            correctOrder: orderMap.get(opt.label) ?? q.optionsRaw.length + 1,
          })),
        }
      }
    }

    if (q.type === QuestionType.FILL_IN_BLANK) {
      const slotMatches =
        q.answer
          ?.split(/[\n;]/)
          .map((line: string) => {
            const match = line.match(/^\s*[([\{]?(\d+)[)\]\}\.\:\=\-]*\s*(.+)$/)
            if (!match) return null
            return {
              order: Number(match[1]),
              correctAnswer: match[2].trim(),
            }
          })
          .filter(Boolean) || []

      if (slotMatches.length > 0) {
        payload.fillInBlankSlots = {
          create: slotMatches.map((slot: any) => ({
            order: slot.order,
            correctAnswer: slot.correctAnswer,
          })),
        }
      }
    }

    return payload
  }

  const onOk = async () => {
    try {
      const { knowledgeBlockId } = await form.validateFields()
      const selectedQuestions = questions.filter((q) => selectedRowKeys.includes(q.key))
      if (!knowledgeBlockId && selectedQuestions.some((q) => !q.knowledgeBlockId)) {
        message.error("Có câu hỏi chưa có mã chuẩn đầu ra, vui lòng chọn Chuẩn đầu ra mặc định")
        return
      }

      const questionBankId = input?.questionBankId || (await ensureQuestionBankId())
      if (!questionBankId) {
        message.error("Bạn phải chọn Ngân hàng câu hỏi (Question Bank)!")
        return
      }

      showSpinner()
      const clusterSelected = selectedQuestions.filter((q) => q.type === CLUSTER_QUESTION_TYPE)
      const normalSelected = selectedQuestions.filter((q) => q.type !== CLUSTER_QUESTION_TYPE)

      const payloads = await Promise.all(
        normalSelected.map((q) => buildQuestionPayload(q, questionBankId, q.knowledgeBlockId || knowledgeBlockId))
      )

      const questionsData: any[] = []
      const multipleChoiceOptionsData: any[] = []
      const orderingItemsData: any[] = []
      const fillInBlankSlotsData: any[] = []

      payloads.forEach((payload: any) => {
        if (payload.isCluster) return

        const { multipleChoiceOptions, orderingItems, fillInBlankSlots, ...questionData } = payload

        questionsData.push(questionData)

        if (multipleChoiceOptions?.create) {
          multipleChoiceOptions.create.forEach((option: any) => {
            multipleChoiceOptionsData.push({
              ...option,
              questionId: questionData.id,
            })
          })
        }

        if (orderingItems?.create) {
          orderingItems.create.forEach((item: any) => {
            orderingItemsData.push({
              ...item,
              questionId: questionData.id,
            })
          })
        }

        if (fillInBlankSlots?.create) {
          fillInBlankSlots.create.forEach((slot: any) => {
            fillInBlankSlotsData.push({
              ...slot,
              questionId: questionData.id,
            })
          })
        }
      })

      const operations: any[] = []

      if (questionsData.length > 0) {
        operations.push({
          model: "Question",
          operation: "createMany",
          data: { data: questionsData },
        })
      }

      if (multipleChoiceOptionsData.length > 0) {
        operations.push({
          model: "MultipleChoiceOption",
          operation: "createMany",
          data: { data: multipleChoiceOptionsData },
        })
      }

      if (orderingItemsData.length > 0) {
        operations.push({
          model: "OrderingItem",
          operation: "createMany",
          data: { data: orderingItemsData },
        })
      }

      if (fillInBlankSlotsData.length > 0) {
        operations.push({
          model: "FillInBlankSlot",
          operation: "createMany",
          data: { data: fillInBlankSlotsData },
        })
      }

      if (operations.length > 0) {
        const res = await sqlTransaction(operations)
        if (res.status !== 200) {
          message.error("Lưu câu hỏi thất bại. Vui lòng kiểm tra lại.")
          return
        }
      }

      for (const cq of clusterSelected) {
        const clusterPayload = (await buildQuestionPayload(
          cq,
          questionBankId,
          cq.knowledgeBlockId || knowledgeBlockId
        )) as {
          isCluster: true
          parent: Record<string, unknown>
          subQuestionsRaw: any[]
        }

        const parentId = clusterPayload.parent.id as string
        const clusterKnowledgeBlockId = clusterPayload.parent.knowledgeBlockId
        const clusterOps: any[] = [
          {
            model: "Question",
            operation: "create",
            data: { data: clusterPayload.parent },
          },
        ]

        const subQuestionsData: any[] = []
        const subOptionsData: any[] = []
        const subOrderingData: any[] = []
        const subFillInBlankData: any[] = []

        clusterPayload.subQuestionsRaw.forEach((sq, index) => {
          const subId = createId()
          subQuestionsData.push({
            id: subId,
            content: sq.content?.trim() || "",
            type: sq.type,
            difficult: sq.difficult,
            point: sq.point,
            explanation: sq.explanation,
            isAutoGraded: sq.type !== QuestionType.ESSAY,
            questionBankId,
            parentQuestionId: parentId,
            order: index + 1,
            knowledgeBlockId: clusterKnowledgeBlockId,
          })

          const relations = buildSubQuestionRelationRows(sq, subId)
          subOptionsData.push(...relations.multipleChoiceOptions)
          subOrderingData.push(...relations.orderingItems)
          subFillInBlankData.push(...relations.fillInBlankSlots)
        })

        if (subQuestionsData.length > 0) {
          clusterOps.push({
            model: "Question",
            operation: "createMany",
            data: { data: subQuestionsData },
          })
        }

        if (subOptionsData.length > 0) {
          clusterOps.push({
            model: "MultipleChoiceOption",
            operation: "createMany",
            data: { data: subOptionsData },
          })
        }

        if (subOrderingData.length > 0) {
          clusterOps.push({
            model: "OrderingItem",
            operation: "createMany",
            data: { data: subOrderingData },
          })
        }

        if (subFillInBlankData.length > 0) {
          clusterOps.push({
            model: "FillInBlankSlot",
            operation: "createMany",
            data: { data: subFillInBlankData },
          })
        }

        const clusterRes = await sqlTransaction(clusterOps)
        if (clusterRes.status !== 200) {
          message.error("Lưu câu hỏi chùm thất bại. Vui lòng kiểm tra lại.")
          return
        }
      }

      if (operations.length === 0 && clusterSelected.length === 0) {
        message.warning("Không có câu hỏi nào được chọn")
        return
      }

      message.success("Import câu hỏi thành công")
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "Question"],
      })
      onClose()
      setQuestions([])
      setSelectedRowKeys([])
    } catch (error) {
      console.error(error)
      message.error("Lưu câu hỏi thất bại. Vui lòng kiểm tra lại.")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Modal
      title="Import câu hỏi từ Word"
      open={isOpen}
      width="90vw"
      onCancel={onClose}
      style={{ top: 8 }}
      styles={{
        body: {
          height: questions.length === 0 ? "auto" : "88vh",
          overflow: "hidden",
        },
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,

        <Button
          key="submit"
          type="primary"
          disabled={selectedRowKeys.length === 0 || importErrors.length > 0}
          onClick={onOk}
        >
          Lưu Câu Hỏi
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
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
          <Col>
            <Button
              icon={<UploadOutlined />}
              onClick={() => document.getElementById("word-import-input")?.click()}
            >
              Chọn File Word
            </Button>
          </Col>
          <Col>
            <Button icon={<DownloadOutlined />} type="primary" onClick={handleDownloadTemplate}>
              Tải file mẫu
            </Button>
          </Col>
          <Col>
            <Button onClick={onOpenAddHuongDanNganHang} type="primary">
              Hướng dẫn điền file Word
            </Button>
          </Col>
          {/* Bỏ tính năng "Lưu tại kho": câu hỏi luôn được lưu tại khung đề */}
          {/* <Col span={24}>
            <div className="mt-2 mb-2">
              <div className="text-sm font-medium">Vị trí lưu trữ</div>
              <Radio.Group
                value={storageType}
                onChange={(e) => {
                  const value = e.target.value
                  setStorageType(value)

                  if (value !== "khung") {
                    form.resetFields(["knowledgeBlockId"])
                  }
                }}
              >
                <Radio value="khung">Lưu tại khung</Radio>
                <Radio value="kho">Lưu tại kho</Radio>
              </Radio.Group>
            </div>
          </Col> */}

          <Col span={24}>
            <Col span={6}>
              <FormItem
                form={form}
                name="knowledgeBlockId"
                label="Chuẩn đầu ra mặc định"
                tooltip="Áp dụng cho các câu không ghi mã chuẩn đầu ra [MÃ] ở đầu dòng"
                layout="vertical"
              >
                <Select
                  maxTagCount={"responsive"}
                  allowClear
                  placeholder="Chọn chuẩn đầu ra"
                  options={knowledgeBlockOptions}
                />
              </FormItem>
            </Col>
          </Col>
        </Row>
      </Form>

      {importErrors.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Table
            dataSource={importErrors.map((e, idx) => ({ ...e, key: idx }))}
            pagination={false}
            columns={[
              {
                title: "Dòng",
                dataIndex: "rowIndex",
                width: 70,
                align: "center" as const,
                render: (v: number) => `#${v}`,
              },
              {
                title: `${importErrors.length} câu hỏi bị lỗi`,
                dataIndex: "message",
                render: (v: string) => <span style={{ color: "#faad14" }}>{v}</span>,
              },
            ]}
          />
        </div>
      )}

      {questions.length > 0 && (
        <div>
          <Table
            rowKey="key"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={columns}
            dataSource={pagedQuestions}
            rowSelection={rowSelection}
            scroll={{
              x: "100%",
              y: importErrors.length > 0 ? "calc(50vh - 100px)" : "calc(68vh - 130px)",
            }}
            sticky={{
              offsetHeader: 0,
            }}
            style={{
              maxHeight: "60vh",
            }}
            pagination={{
              position: ["bottomRight"],
              current: currentPage,
              pageSize,
              total: filteredQuestions.length,
              onChange: (page, size) => {
                setCurrentPage(page)
                setPageSize(size)
              },
              showSizeChanger: true,
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
