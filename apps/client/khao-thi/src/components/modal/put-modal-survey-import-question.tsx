import { UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import { useSurveyQuestionTypeOptions } from "@hooks/survey-question-type"
import { type SurveyQuestion, type SurveyQuestionGroup, SurveyQuestionType } from "@workspace/db"
import { $Enums } from "@workspace/db/client"
import { useCreateSurveyQuestionGroup, useFindManySurveyQuestionGroup, useFindUniqueSurveyQuestion } from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { PizZip } from "@workspace/libs/docxjs"
import { Button, Col, Form, message, Table, Upload } from "antd"
import { XMLParser } from "fast-xml-parser"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutSurveyQuestionType = SurveyQuestion
type ImportedQuestion = {
  content: string
  type: SurveyQuestionType
  specificChoice?: Array<{
    answer: string
    description: string | null
  }>
}
function detectQuestionType(text: string): SurveyQuestionType {
  if (/\(\s*TN\*\s*\)/i.test(text)) {
    return SurveyQuestionType.SINGLE_CHOICE
  }

  if (/\(\s*TN\s*\)/i.test(text)) {
    return SurveyQuestionType.SINGLE_CHOICE
  }

  if (/\(\s*TL\s*\)/i.test(text)) {
    return SurveyQuestionType.ESSAY
  }

  // fallback nếu không có
  return SurveyQuestionType.SINGLE_CHOICE
}

function joinRunsWithSpace(runs: any[]): string {
  let text = ""
  let prevChunk = ""

  for (const r of runs) {
    const t = r?.["w:t"]
    const value =
      typeof t === "string" ? t : typeof t === "object" && t?.["#text"] ? t["#text"] : ""

    if (!value) continue

    const prevEndsWithWord = /[A-Za-zÀ-ỹ]$/.test(prevChunk)
    const currentStartsWithWord = /^[A-Za-zÀ-ỹ]/.test(value)
    const prevHasTrailingSpace = /\s$/.test(prevChunk)
    const currentHasLeadingSpace = /^\s/.test(value)
    const shouldInsertSpace =
      text.length > 0 &&
      prevEndsWithWord &&
      currentStartsWithWord &&
      !prevHasTrailingSpace &&
      !currentHasLeadingSpace &&
      prevChunk.trim().length > 1 &&
      value.trim().length > 1

    if (shouldInsertSpace) {
      text += " "
    }

    text += value
    prevChunk = value
  }

  return text.trim()
}

function stripLeadingIndex(text: string): string {
  return (
    text
      .trim()
      // remove (TN) / (TN*) / (TL)
      .replace(/\(\s*(TN\*|TN|TL)\s*\)/gi, "")
      // dấu . hoặc - đứng một mình
      .replace(/^[.-]\s*/, "")
      // 1. , 1.1 , 1.2.3 , 01.02
      .replace(/^\d+(?:\.\d+)*\s*[.)-]?\s*/, "")
      // I. II. III.
      .replace(/^[IVX]+\s*[.)-]?\s*/i, "")
      // a) b) c.
      .replace(/^[a-zA-Z]\s*[.)-]\s*/, "")
      // Câu 1:, Câu hỏi 2:
      .replace(/^(Câu|Câu hỏi)\s*\d+\s*[:-]?\s*/i, "")
      .trim()
  )
}

function isQuestionStartLine(text: string): boolean {
  return /\(\s*(TN\*|TN|TL)\s*\)/i.test(text)
}

function parseSpecificChoiceLine(text: string): {
  answer: string
  description: string | null
} | null {
  const match = text.match(/^((?:#\d+)|[A-Z])\s*[.)]\s*(.+?)\s*(?:\((.*?)\))?\s*$/i)
  if (!match) return null

  const answer = match[2]?.trim()
  const rawDescription = match[3]?.trim() ?? ""
  const description = rawDescription.trim()

  return {
    answer,
    description: description || null,
  }
}

function splitQuestionAndInlineChoices(text: string): {
  questionContent: string
  inlineChoices: Array<{
    answer: string
    description: string | null
  }>
} {
  const firstChoiceMatch = text.match(/(?:#\d+|[A-Z])\s*[.)]\s*/i)
  if (!firstChoiceMatch || firstChoiceMatch.index === undefined) {
    return {
      questionContent: text.trim(),
      inlineChoices: [],
    }
  }

  const firstChoiceMarker = /(?:#\d+|[A-Z])\s*[.)]\s*/i.exec(text.slice(firstChoiceMatch.index))
  if (!firstChoiceMarker || firstChoiceMarker.index === undefined) {
    return {
      questionContent: text.trim(),
      inlineChoices: [],
    }
  }

  const firstChoiceStart = firstChoiceMatch.index + firstChoiceMarker.index
  const questionContent = text.slice(0, firstChoiceStart).trim()
  const choicesPart = text.slice(firstChoiceStart).trim()

  const inlineChoices: Array<{
    answer: string
    description: string | null
  }> = []

  const hasNumberedChoices = /#\d+\s*[.)]\s*/.test(choicesPart)
  const choiceRegex = hasNumberedChoices
    ? /(#\d+)\s*[.)]\s*([\s\S]*?)(?=(?:#\d+\s*[.)]\s*)|$)/g
    : /([A-Z])\s*[.)]\s*([\s\S]*?)(?=(?:[A-Z]\s*[.)]\s*)|$)/g
  const choiceMatches = [...choicesPart.matchAll(choiceRegex)]

  for (const match of choiceMatches) {
    const answer = match[2]?.trim()
    if (!answer) continue

    const choiceText = `${match[1]}. ${answer}`
    const parsedChoice = parseSpecificChoiceLine(choiceText)
    if (parsedChoice?.answer) {
      inlineChoices.push(parsedChoice)
    }
  }

  if (!questionContent || !inlineChoices.length) {
    return {
      questionContent: text.trim(),
      inlineChoices: [],
    }
  }

  return {
    questionContent,
    inlineChoices,
  }
}

const PutSurveyImportQuestionModal = () => {
  const [form] = Form.useForm<SurveyQuestion>()
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    surveyQuestionGroupId?: string
    type?: string
    surveyTopicId?: string
  }>({
    tag: "PutSurveyImportQuestionModal",
    onClose: form.resetFields,
  })
  const [importedQuestions, setImportedQuestions] = useState<ImportedQuestion[]>([])

  const { showSpinner, hideSpinner } = useSpinner()
  const { getSurveyQuestionTypeLabel } = useSurveyQuestionTypeOptions()

  const tableData = importedQuestions.map((q, index) => ({
    key: index,
    content: q.content,
    type: getSurveyQuestionTypeLabel(q.type),
  }))

  const { data: surveyQuestionGroupData = [] } = useFindManySurveyQuestionGroup()
  const { mutateAsync: createSurveyQuestionGroup } = useCreateSurveyQuestionGroup()
  const { data: topicQuestionGroups = [] } = useFindManySurveyQuestionGroup(
    {
      where: {
        surveyTopic: {
          some: {
            id: input?.surveyTopicId,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 1,
    },
    {
      enabled: input?.type === $Enums.SurveyType.CLUSTER && !!input?.surveyTopicId,
    }
  )

  const isLecturerSurvey = input?.type === $Enums.SurveyType.CLUSTER

  async function resolveSurveyQuestionGroupId(groupId?: string | null) {
    if (groupId) return groupId
    if (!isLecturerSurvey || !input?.surveyTopicId) return groupId ?? undefined

    if (topicQuestionGroups[0]?.id) {
      return topicQuestionGroups[0].id
    }

    const defaultGroup = await createSurveyQuestionGroup({
      data: {
        name: "Nhóm câu hỏi mặc định",
        surveyTopic: {
          connect: {
            id: input.surveyTopicId,
          },
        },
      },
    })

    queryClient.invalidateQueries({
      queryKey: ["SurveyQuestionGroup"],
    })

    if (!defaultGroup?.id) {
      return undefined
    }

    return defaultGroup.id
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
  })

  const handleImportWord = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const zip = new PizZip(arrayBuffer)

      const documentXml = zip.file("word/document.xml")?.asText()
      if (!documentXml) {
        message.error("File Word không hợp lệ")
        return
      }

      const doc = parser.parse(documentXml)
      const rawParagraphs = doc?.["w:document"]?.["w:body"]?.["w:p"]
      const paragraphs = Array.isArray(rawParagraphs)
        ? rawParagraphs
        : rawParagraphs
          ? [rawParagraphs]
          : []

      if (!paragraphs) {
        message.error("Không đọc được nội dung Word")
        return
      }

      const lines: string[] = []
      for (const p of paragraphs) {
        const runs = Array.isArray(p["w:r"]) ? p["w:r"] : [p["w:r"]]
        const rawText = joinRunsWithSpace(runs)
        if (rawText) {
          lines.push(rawText)
        }
      }

      const questions: ImportedQuestion[] = []
      let currentQuestion: ImportedQuestion | null = null
      let currentIsSpecialSingleChoice = false

      for (const rawText of lines) {
        const isQuestionLine = isQuestionStartLine(rawText)

        if (isQuestionLine) {
          if (currentQuestion?.content) {
            questions.push(currentQuestion)
          }

          const isSpecial = /\(\s*TN\*\s*\)/i.test(rawText)
          const type = detectQuestionType(rawText)
          const strippedContent = stripLeadingIndex(rawText)
          if (!strippedContent) {
            currentQuestion = null
            currentIsSpecialSingleChoice = false
            continue
          }

          const { questionContent, inlineChoices } =
            isSpecial && type === SurveyQuestionType.SINGLE_CHOICE
              ? splitQuestionAndInlineChoices(strippedContent)
              : { questionContent: strippedContent, inlineChoices: [] }

          currentQuestion = {
            content: questionContent,
            type,
            specificChoice: inlineChoices,
          }
          currentIsSpecialSingleChoice = isSpecial && type === SurveyQuestionType.SINGLE_CHOICE
          continue
        }

        if (!currentQuestion) continue

        if (currentIsSpecialSingleChoice) {
          const parsedChoice = parseSpecificChoiceLine(rawText)
          if (parsedChoice) {
            currentQuestion.specificChoice?.push(parsedChoice)
          }
        }
      }

      if (currentQuestion?.content) {
        questions.push(currentQuestion)
      }

      const normalizedQuestions = questions.map((q) => ({
        ...q,
        specificChoice: q.specificChoice?.length ? q.specificChoice : undefined,
      }))

      if (!normalizedQuestions.length) {
        message.error("Không có câu hỏi hợp lệ")
        return
      }
      const uniqueQuestions = normalizedQuestions.filter(
        (q, index, arr) => arr.findIndex((x) => x.content === q.content) === index
      )

      setImportedQuestions(uniqueQuestions)
    } catch (err) {
      console.error(err)
      message.error("Lỗi khi đọc file Word")
    }
  }

  async function onOk(output?: SurveyQuestion) {
    if (!output) return

    const surveyQuestionGroupId = await resolveSurveyQuestionGroupId(output.surveyQuestionGroupId)
    if (!surveyQuestionGroupId) {
      message.warning("Vui lòng chọn nhóm câu hỏi khảo sát")
      return
    }
    const selectedQuestions = importedQuestions

    if (!selectedQuestions.length) {
      message.warning("Chưa có câu hỏi nào để import")
      return
    }

    try {
      showSpinner()

      const createOperations = selectedQuestions.map((i) => ({
        model: "SurveyQuestion" as const,
        operation: "create" as const,
        data: {
          data: {
            name: i.content,
            surveyQuestionGroupId,
            type: i.type,
            description: null,
            ...(i.type === SurveyQuestionType.SINGLE_CHOICE && i.specificChoice?.length
              ? {
                  specificChoice: {
                    createMany: {
                      data: i.specificChoice,
                    },
                  },
                }
              : {}),
          },
        },
      }))

      const res = await sqlTransaction(createOperations)
      if (res?.status !== 200) {
        message.error("Có lỗi xảy ra khi thêm mới câu hỏi")
        return
      }
      queryClient.invalidateQueries({ queryKey: ["zenstack", "SurveyQuestion"] })
      message.success(`Đã import ${selectedQuestions.length} câu hỏi`)
      onClose()
    } catch (err) {
      message.error("Đã xảy ra lỗi")
    } finally {
      hideSpinner()
    }
  }

  const { data: surveyQuestion } = useFindUniqueSurveyQuestion(
    {
      where: { id: input?.id },
    },
    {
      enabled: !!input?.id,
    }
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (input?.surveyQuestionGroupId) {
      form.setFieldsValue({
        surveyQuestionGroupId: input?.surveyQuestionGroupId,
      })
      return
    }

    if (isLecturerSurvey && topicQuestionGroups[0]?.id) {
      form.setFieldsValue({ surveyQuestionGroupId: topicQuestionGroups[0].id })
    }
  }, [input?.surveyQuestionGroupId, isLecturerSurvey, topicQuestionGroups])
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (surveyQuestion) {
      form.setFieldsValue(surveyQuestion)
    }
  }, [surveyQuestion])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Nhập câu hỏi khảo sát"}
      className="w-[700px]"
    >
      <Col span={24}>
        <Form.Item label="Import câu hỏi từ Word">
          <Upload
            accept=".doc,.docx"
            showUploadList={false}
            beforeUpload={(file) => {
              handleImportWord(file)
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>Import từ file Word</Button>
          </Upload>
        </Form.Item>
      </Col>

      {!isLecturerSurvey && (
        <Col span={24}>
          <FormItem form={form} name="surveyQuestionGroupId" label="Nhóm câu hỏi khảo sát" required>
            <Select
              placeholder="Chọn nhóm câu hỏi khảo sát"
              options={surveyQuestionGroupData.map((i: SurveyQuestionGroup) => {
                return {
                  value: i.id,
                  label: i.name,
                }
              })}
            />
          </FormItem>
        </Col>
      )}
      <Col span={24}>
        {importedQuestions.length > 0 && (
          <Col span={24}>
            <div className="mt-4">
              <div className="font-semibold mb-2">Danh sách câu hỏi từ file Word</div>

              <Table<{ key: number; content: string }>
                rowKey="key"
                dataSource={tableData}
                pagination={false}
                columns={[
                  {
                    title: "STT",
                    width: 60,
                    align: "center",
                    render: (_: any, __: any, index: number) => index + 1,
                  },
                  {
                    title: "Nội dung câu hỏi",
                    dataIndex: "content",
                  },
                  {
                    title: "Loại",
                    dataIndex: "type",
                    width: 120,
                    align: "center",
                  },
                ]}
              />
            </div>
          </Col>
        )}
      </Col>
    </PutFormModal>
  )
}

export default PutSurveyImportQuestionModal
