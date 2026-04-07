import { DownloadOutlined, UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import HtmlTruncate from "@components/commons/html-truncate"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import { DIFFICULT_LABELS, QUESTION_TYPE_LABELS } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { createId, type Difficult, QuestionType } from "@workspace/db"
import { useFindManyKnowledgeBlock } from "@workspace/db/hooks"
import { generatePresignedUrl, sqlTransaction } from "@workspace/libs/api/model"
import { env } from "@workspace/libs/utils"
import { Button, Col, Form, Modal, message, Radio, Row, Select } from "antd"
import { XMLParser } from "fast-xml-parser"
import PizZip from "pizzip"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface WordImportModalInput {
  questionBankId: string
  knowledgeBlockId: string
  subjectVersionId: string
}

const WordImportModal: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { showSpinner, hideSpinner } = useSpinner()
  const [storageType, setStorageType] = useState<"khung" | "kho">("khung")
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

  const questionBankId = input?.questionBankId

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
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

  const cleanQuestionText = (text: string) => text

  const mapQuestionTypeFromText = (raw: string): QuestionType | undefined => {
    const value = raw.trim().toUpperCase().replace(/\s+/g, "")

    const mapping: Record<string, QuestionType> = {
      TL: QuestionType.ESSAY,
      TN: QuestionType.SINGLE_CHOICE,
      TNN: QuestionType.MULTIPLE_CHOICE,
      DK: QuestionType.FILL_IN_BLANK,
      SX: QuestionType.ORDERING,
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

  const extractTextAndImagesFromCell = (cell: any, zip: PizZip, relMap: Map<string, string>) => {
    const paragraphs = Array.isArray(cell?.["w:p"]) ? cell["w:p"] : [cell?.["w:p"]]
    let rawText = ""
    const images: { name: string; blob: Blob }[] = []
    let imgIndex = 1

    for (const p of paragraphs) {
      const runs = Array.isArray(p?.["w:r"]) ? p["w:r"] : [p?.["w:r"]]
      let paragraphText = ""

      for (const r of runs) {
        let value = ""
        const t = r?.["w:t"]

        if (typeof t === "string") value = t
        else if (typeof t === "object" && t?.["#text"]) value = t["#text"]

        if (value) {
          const isOption = /^([A-D])\.\s*/i.test(value)

          if (isOption && paragraphText.trim().length > 0) {
            paragraphText += "\n"
          } else if (
            paragraphText.length > 0 &&
            !paragraphText.endsWith(" ") &&
            !/^[.,!?;:]/.test(value)
          ) {
            paragraphText += " "
          }

          paragraphText += value
        }

        if (r?.["w:br"]) {
          paragraphText += "\n"
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
            paragraphText += placeholder
            images.push({ name: placeholder, blob })
            imgIndex++
          }
        }
      }

      rawText += `${paragraphText.trim()}\n`
    }

    return { text: rawText, images }
  }

  const extractPointFromCell = (cell: any): { value?: number } => {
    if (!cell) return {}

    const rawText = extractRawTextFromCell(cell)
    if (!rawText) return {}

    /**
     * Chuẩn hoá:
     * - bỏ chữ đ / điểm
     * - đổi , thành .
     * - bỏ toàn bộ ký tự thừa
     */
    const normalized = rawText
      .toLowerCase()
      .replace(/điểm|đ/g, "")
      .replace(",", ".")
      .replace(/\s+/g, "")
      .replace(/[^0-9.]/g, "")

    // bắt: 1 | 1.5 | .5
    const match = normalized.match(/(\d+(\.\d+)?|\.\d+)/)
    if (!match) return {}

    const value = Number(match[0])
    if (Number.isNaN(value)) return {}

    return { value }
  }

  const MAX_POINT_PER_QUESTION = 9

  const checkQuestionPoint = (
    value?: number
  ): {
    isInvalid: boolean
    color: "black" | "red"
    warning?: string
  } => {
    if (value === undefined) {
      return { isInvalid: false, color: "black" }
    }

    if (value > MAX_POINT_PER_QUESTION) {
      return {
        isInvalid: true,
        color: "red",
        warning: `Điểm ${value} vượt quá ${MAX_POINT_PER_QUESTION} điểm / câu`,
      }
    }

    const decimalPart = Number((value % 1).toFixed(2))

    const isValidDecimal =
      decimalPart === 0 || decimalPart === 0.25 || decimalPart === 0.5 || decimalPart === 0.75

    if (!isValidDecimal) {
      return {
        isInvalid: true,
        color: "red",
        warning: `Điểm ${value} không hợp lệ (chỉ nhận .25, .5, .75 hoặc số nguyên)`,
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

        await fetch(resPresignedUrl.data.url, {
          method: "PUT",
          body: img.blob,
        })

        const imageUrl = `${env.NEXT_PUBLIC_MINIO_ENDPOINT}/${resPresignedUrl.data.fileName}`
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
      const tables = Array.isArray(body?.["w:tbl"])
        ? body["w:tbl"]
        : body?.["w:tbl"]
          ? [body["w:tbl"]]
          : []

      if (tables.length === 0) {
        message.error("File Word không có bảng câu hỏi")
        return
      }

      const extractedQuestions: any[] = []
      const errors: { rowIndex: number; message: string }[] = []

      for (const tbl of tables) {
        const rows = Array.isArray(tbl["w:tr"]) ? tbl["w:tr"] : [tbl["w:tr"]]

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          const cells = Array.isArray(row["w:tc"]) ? row["w:tc"] : []

          if (cells.length < 5) continue

          // ===== CỘT 1: CÂU HỎI =====
          const questionCell = extractTextAndImagesFromCell(cells[0], zip, relMap)
          const rawQuestionText = questionCell.text

          if (!rawQuestionText?.trim()) continue

          // ===== CỘT 2: ĐÁP ÁN =====
          const answerCell = extractTextAndImagesFromCell(cells[1], zip, relMap)
          const answerTextRaw = answerCell.text

          // ===== CỘT 3 + 4 =====
          const typeText = extractTextAndImagesFromCell(cells[2], zip, relMap).text
          const difficultText = extractTextAndImagesFromCell(cells[3], zip, relMap).text

          const type = mapQuestionTypeFromText(typeText)
          const difficult = mapDifficultFromText(difficultText)

          if (!type || !difficult) {
            const typeVal = typeText.trim().replace(/\n/g, "↵") || "(trống)"
            const difficultVal = difficultText.trim().replace(/\n/g, "↵") || "(trống)"
            errors.push({
              rowIndex: i,
              message: `Sai mã — Loại: "${typeVal}", Độ khó: "${difficultVal}" (hợp lệ: TL, TN, TNN, DK, SX | NB, TH, VD, VDC)`,
            })
            continue
          }

          const pointRaw = extractPointFromCell(cells[4])
          const pointCheck = checkQuestionPoint(pointRaw.value)

          if (pointCheck.isInvalid && pointCheck.warning) {
            errors.push({ rowIndex: i, message: pointCheck.warning })
          }

          const question: any = {
            type,
            difficult,
            contentImagesRaw: questionCell.images,
            explanationImagesRaw: answerCell.images,
            pointRaw: pointRaw.value,
            point: pointCheck.isInvalid ? undefined : pointRaw.value,
            pointStatus: pointCheck.color,
          }

          if (type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE) {
            question.content = rawQuestionText

            question.optionsRaw = rawQuestionText
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => /^[A-D]\.\s*/i.test(l))
              .map((line) => {
                const match = line.match(/^([A-D])\.\s*(.+)$/i)
                return {
                  label: match?.[1],
                  content: match?.[2] || "",
                  isCorrect: false,
                }
              })

            // === xử lý đáp án từ cột 2 ===
            const answerLines = answerTextRaw
              .split(/\n|<br\s*\/?>/i)
              .map((l) => l.trim())
              .filter(Boolean)

            if (type === QuestionType.SINGLE_CHOICE) {
              const correct = answerLines[0]?.match(/^([A-D])\./i)?.[1]
              question.optionsRaw.forEach((o: any) => {
                o.isCorrect = o.label === correct
              })
            }

            if (type === QuestionType.MULTIPLE_CHOICE) {
              const correctLabels = answerLines
                .map((l) => l.match(/^([A-D])\./i)?.[1])
                .filter(Boolean)

              question.optionsRaw.forEach((o: any) => {
                o.isCorrect = correctLabels.includes(o.label)
              })
            }
            question.explanation = answerTextRaw
          } else if (type === QuestionType.ORDERING) {
            // ORDERING - parse options từ content
            question.content = rawQuestionText
            question.explanation = answerTextRaw
            question.answer = answerTextRaw

            // Parse options giống như SINGLE_CHOICE/MULTIPLE_CHOICE
            question.optionsRaw = rawQuestionText
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => /^[A-D]\.\s*/i.test(l))
              .map((line) => {
                const match = line.match(/^([A-D])\.\s*(.+)$/i)
                return {
                  label: match?.[1],
                  content: match?.[2] || "",
                }
              })
          } else {
            // ESSAY / ORAL / FILL_IN_BLANK
            question.content = cleanQuestionText(rawQuestionText)
            question.explanation = answerTextRaw

            if (type === QuestionType.FILL_IN_BLANK) {
              question.answer = answerTextRaw
            }
          }

          extractedQuestions.push(question)
        }
      }

      const questionsWithKey = extractedQuestions.map((q, index) => ({
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

      message.success(`Đã import ${extractedQuestions.length} câu hỏi`)
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
        let html = text

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

  const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
    where: {
      deletedAt: null,
      examMatrix: {
        examFramework: {
          subjectVersionId: input?.subjectVersionId,
        },
      },
    },
  })

  const buildQuestionPayload = async (q: any, knowledgeBlockId?: string) => {
    const content = await uploadImagesAndReplacePlaceholders(q.content, q.contentImagesRaw || [])
    const explanation = await uploadImagesAndReplacePlaceholders(
      q.explanation,
      q.explanationImagesRaw || []
    )

    const payload: any = {
      content,
      explanation,
      type: q.type,
      difficult: q.difficult,
      point: q.point,
      isAutoGraded: false,
      questionBankId,
      id: createId(),
      ...(storageType === "khung" ? { knowledgeBlockId } : {}),
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
      if (storageType === "khung" && !knowledgeBlockId) {
        message.error("Bạn phải chọn Chuẩn đầu ra khi lưu tại khung")
        return
      }

      if (!questionBankId) {
        message.error("Bạn phải chọn Ngân hàng câu hỏi (Question Bank)!")
        return
      }

      showSpinner()
      const selectedQuestions = questions.filter((q) => selectedRowKeys.includes(q.key))

      // Upload ảnh và build payload cho tất cả câu hỏi song song
      const payloads = await Promise.all(
        selectedQuestions.map((q) => buildQuestionPayload(q, knowledgeBlockId))
      )

      // Tách questions và relations để dùng createMany
      const questionsData: any[] = []
      const multipleChoiceOptionsData: any[] = []
      const orderingItemsData: any[] = []
      const fillInBlankSlotsData: any[] = []

      payloads.forEach((payload) => {
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

      const operations: any[] = [
        {
          model: "Question",
          operation: "createMany",
          data: {
            data: questionsData,
          },
        },
      ]

      if (multipleChoiceOptionsData.length > 0) {
        operations.push({
          model: "MultipleChoiceOption",
          operation: "createMany",
          data: {
            data: multipleChoiceOptionsData,
          },
        })
      }

      if (orderingItemsData.length > 0) {
        operations.push({
          model: "OrderingItem",
          operation: "createMany",
          data: {
            data: orderingItemsData,
          },
        })
      }

      if (fillInBlankSlotsData.length > 0) {
        operations.push({
          model: "FillInBlankSlot",
          operation: "createMany",
          data: {
            data: fillInBlankSlotsData,
          },
        })
      }

      const res = await sqlTransaction(operations)

      if (res.status !== 200) {
        message.error("Lưu câu hỏi thất bại. Vui lòng kiểm tra lại.")
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
      style={{ top: storageType === "khung" ? 8 : 20 }}
      styles={{
        body: {
          height: questions.length === 0 ? "auto" : storageType === "khung" ? "88vh" : "82vh",
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
          <Col span={24}>
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
          </Col>

          {storageType === "khung" && (
            <Col span={24}>
              <Col span={6}>
                <FormItem
                  form={form}
                  name="knowledgeBlockId"
                  label="Chuẩn đầu ra"
                  layout="vertical"
                  required
                >
                  <Select
                    maxTagCount={"responsive"}
                    placeholder="Chọn chuẩn đầu ra"
                    options={knowledgeBlockData?.map(({ id, name }) => ({
                      value: id,
                      label: name,
                    }))}
                  />
                </FormItem>
              </Col>
            </Col>
          )}
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
