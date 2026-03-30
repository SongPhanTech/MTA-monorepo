import { UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import { useSurveyQuestionTypeOptions } from "@hooks/survey-question-type"
import { type SurveyQuestion, type SurveyQuestionGroup, SurveyQuestionType } from "@workspace/db"
import { useFindManySurveyQuestionGroup, useFindUniqueSurveyQuestion } from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { PizZip } from "@workspace/libs/docxjs"
import { Button, Col, Form, message, Table, Upload } from "antd"
import { XMLParser } from "fast-xml-parser"
import type { Key } from "react"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutSurveyQuestionType = SurveyQuestion
type ImportedQuestion = {
  content: string
  type: SurveyQuestionType
}
function detectQuestionType(text: string): SurveyQuestionType {
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
  let prevEndedWithChar = false

  for (const r of runs) {
    const t = r?.["w:t"]
    const value =
      typeof t === "string" ? t : typeof t === "object" && t?.["#text"] ? t["#text"] : ""

    if (!value) continue

    const startsWithPunctuation = /^[.,!?;:]/.test(value)
    const endsWithChar = /[A-Za-zÀ-ỹ0-9]$/.test(value)

    if (text && prevEndedWithChar && !startsWithPunctuation) {
      text += " "
    }

    text += value
    prevEndedWithChar = endsWithChar
  }

  return text.trim()
}

function stripLeadingIndex(text: string): string {
  return (
    text
      .trim()
      // remove (TN) / (TL)
      .replace(/\(\s*(TN|TL)\s*\)/gi, "")
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

const PutSurveyImportQuestionModal = () => {
  const [form] = Form.useForm<SurveyQuestion>()
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    surveyQuestionGroupId?: string
  }>({
    tag: "PutSurveyImportQuestionModal",
    onClose: form.resetFields,
  })
  const [importedQuestions, setImportedQuestions] = useState<ImportedQuestion[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const { showSpinner, hideSpinner } = useSpinner()
  const { getSurveyQuestionTypeLabel } = useSurveyQuestionTypeOptions()

  const tableData = importedQuestions.map((q, index) => ({
    key: index,
    content: q.content,
    type: getSurveyQuestionTypeLabel(q.type),
  }))

  const { data: surveyQuestionGroupData = [] } = useFindManySurveyQuestionGroup()

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

      const questions: ImportedQuestion[] = []

      for (const p of paragraphs) {
        const runs = Array.isArray(p["w:r"]) ? p["w:r"] : [p["w:r"]]
        const rawText = joinRunsWithSpace(runs)

        if (!rawText) continue

        const type = detectQuestionType(rawText)
        const content = stripLeadingIndex(rawText)

        if (!content) continue

        questions.push({
          content,
          type,
        })
      }

      if (!questions.length) {
        message.error("Không có câu hỏi hợp lệ")
        return
      }
      const uniqueQuestions = questions.filter(
        (q, index, arr) => arr.findIndex((x) => x.content === q.content) === index
      )

      setImportedQuestions(uniqueQuestions)
      setSelectedRowKeys([])
    } catch (err) {
      console.error(err)
      message.error("Lỗi khi đọc file Word")
    }
  }

  async function onOk(output?: SurveyQuestion) {
    if (!output) return

    if (!output.surveyQuestionGroupId) {
      message.warning("Vui lòng chọn nhóm câu hỏi khảo sát")
      return
    }
    const selectedQuestions = selectedRowKeys
      .map((key) => importedQuestions[Number(key)])
      .filter(Boolean)

    if (!selectedQuestions.length) {
      message.warning("Vui lòng chọn ít nhất một câu hỏi")
      return
    }

    try {
      showSpinner()

      const res = await sqlTransaction([
        {
          model: "SurveyQuestion",
          operation: "createMany",
          data: {
            data: selectedQuestions.map((i) => ({
              name: i.content,
              surveyQuestionGroupId: output.surveyQuestionGroupId,
              type: i.type,
              description: null,
            })),
          },
        },
      ])
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
    console.log(input)
    if (input?.surveyQuestionGroupId) {
      form.setFieldsValue({
        surveyQuestionGroupId: input?.surveyQuestionGroupId,
      })
    }
  }, [input?.surveyQuestionGroupId])
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
      <Col span={24}>
        {importedQuestions.length > 0 && (
          <Col span={24}>
            <div className="mt-4">
              <div className="font-semibold mb-2">Danh sách câu hỏi từ file Word</div>

              <Table<{ key: number; content: string }>
                rowKey="key"
                dataSource={tableData}
                pagination={false}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys: Key[]) => setSelectedRowKeys(keys),
                }}
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
