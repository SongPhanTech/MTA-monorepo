import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import { DIFFICULT_OPTIONS, QUESTION_TYPE_OPTIONS } from "@constants/constants"
import type { Difficult, QuestionType } from "@workspace/db/client"
import { QuestionType as QuestionTypeEnum } from "@workspace/db/client"
import { Button, Checkbox, Col, Form, Input, InputNumber, Row, Tooltip } from "antd"
import type { FormInstance } from "antd/es/form"
import { Trash2 } from "lucide-react"

export const CLUSTER_QUESTION_TYPE = "CLUSTER" as QuestionType

export type SubQuestionFormItem = {
  id?: string
  type: QuestionType
  content: string
  difficult: Difficult
  point: number
  explanation?: string
  multipleChoiceOptions: Array<{
    id?: string
    key?: string
    content: string
    isCorrect?: boolean
    correctOrder?: number
  }>
}

export const defaultMcOptions = () =>
  [1, 2, 3, 4].map((n) => ({
    key: String(n),
    content: "",
    isCorrect: false,
  }))

export const defaultSubQuestion = (): SubQuestionFormItem => ({
  type: QuestionTypeEnum.SINGLE_CHOICE,
  content: "",
  difficult: "D1" as Difficult,
  point: 0.25,
  multipleChoiceOptions: defaultMcOptions(),
})

const SUB_QUESTION_TYPE_OPTIONS = QUESTION_TYPE_OPTIONS.filter(
  (o) => o.value !== CLUSTER_QUESTION_TYPE
)

type ClusterSubQuestionsFormProps = {
  form: FormInstance
}

export default function ClusterSubQuestionsForm({ form }: ClusterSubQuestionsFormProps) {
  const subQuestions =
    (Form.useWatch("subQuestions", form) as SubQuestionFormItem[] | undefined) || []

  const handleAddSubQuestion = () => {
    const current = form.getFieldValue("subQuestions") || []
    form.setFieldValue("subQuestions", [...current, defaultSubQuestion()])
  }

  const handleRemoveSubQuestion = (index: number) => {
    const current = form.getFieldValue("subQuestions") || []
    form.setFieldValue(
      "subQuestions",
      current.filter((_: SubQuestionFormItem, i: number) => i !== index)
    )
  }

  const handleAddOption = (subIndex: number) => {
    const current = form.getFieldValue("subQuestions") || []
    const options = current[subIndex]?.multipleChoiceOptions || []
    current[subIndex] = {
      ...current[subIndex],
      multipleChoiceOptions: [
        ...options,
        { key: String(options.length + 1), content: "", isCorrect: false },
      ],
    }
    form.setFieldValue("subQuestions", [...current])
  }

  const handleRemoveOption = (subIndex: number, optIndex: number) => {
    const current = form.getFieldValue("subQuestions") || []
    const options = current[subIndex]?.multipleChoiceOptions || []
    current[subIndex] = {
      ...current[subIndex],
      multipleChoiceOptions: options.filter((_: unknown, i: number) => i !== optIndex),
    }
    form.setFieldValue("subQuestions", [...current])
  }

  return (
    <Col span={24}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">Câu hỏi con</span>
        <Button type="dashed" onClick={handleAddSubQuestion}>
          Thêm câu hỏi con
        </Button>
      </div>

      {subQuestions.length === 0 && (
        <div className="text-gray-400 text-sm mb-4 italic">Chưa có câu hỏi con</div>
      )}

      {subQuestions.map((_, subIndex) => {
        const subType = subQuestions[subIndex]?.type
        const options = subQuestions[subIndex]?.multipleChoiceOptions || []

        return (
          <div key={subIndex} className="border border-[#D1D5DB] rounded-lg p-4 mb-4 bg-[#FAFAFA]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-sm">
                Câu {String.fromCharCode(97 + subIndex)})
              </span>
              <Tooltip title="Xóa câu hỏi con">
                <Trash2
                  size={16}
                  className="text-red-600 cursor-pointer"
                  onClick={() => handleRemoveSubQuestion(subIndex)}
                />
              </Tooltip>
            </div>

            <Row gutter={[16, 0]}>
              <Col span={8}>
                <FormItem
                  form={form}
                  name={["subQuestions", subIndex, "type"]}
                  label="Loại câu hỏi"
                  required
                >
                  <Select options={SUB_QUESTION_TYPE_OPTIONS} />
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem
                  form={form}
                  name={["subQuestions", subIndex, "difficult"]}
                  label="Mức độ"
                  required
                >
                  <Select options={DIFFICULT_OPTIONS} />
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem
                  form={form}
                  name={["subQuestions", subIndex, "point"]}
                  label="Điểm"
                  required
                >
                  <InputNumber min={0} step={0.25} className="w-full" />
                </FormItem>
              </Col>
              <Col span={24}>
                <FormItem
                  form={form}
                  name={["subQuestions", subIndex, "content"]}
                  label="Nội dung (tuỳ chọn)"
                >
                  <Input placeholder="VD: Chọn từ khác biệt" />
                </FormItem>
              </Col>

              {(subType === QuestionTypeEnum.SINGLE_CHOICE ||
                subType === QuestionTypeEnum.MULTIPLE_CHOICE) && (
                <Col span={24}>
                  <Table
                    rowKey="key"
                    pagination={false}
                    data={options}
                    columns={[
                      {
                        title: "Đáp án",
                        width: 90,
                        render: (_: unknown, __: unknown, index: number) =>
                          `Đáp án ${index + 1}`,
                      },
                      {
                        title: "Nội dung",
                        render: (_: unknown, __: unknown, index: number) => (
                          <Form.Item
                            name={[
                              "subQuestions",
                              subIndex,
                              "multipleChoiceOptions",
                              index,
                              "content",
                            ]}
                            className="mb-0"
                            rules={[{ required: true, message: "Nhập đáp án" }]}
                          >
                            <Input placeholder="VD: A. rough" />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "Đúng",
                        width: 60,
                        align: "center",
                        render: (_: unknown, __: unknown, index: number) => (
                          <Form.Item
                            name={[
                              "subQuestions",
                              subIndex,
                              "multipleChoiceOptions",
                              index,
                              "isCorrect",
                            ]}
                            className="mb-0"
                            valuePropName="checked"
                          >
                            <Checkbox />
                          </Form.Item>
                        ),
                      },
                      {
                        width: 40,
                        align: "center",
                        render: (_: unknown, __: unknown, index: number) => (
                          <Trash2
                            size={16}
                            className="text-red-600 cursor-pointer"
                            onClick={() => handleRemoveOption(subIndex, index)}
                          />
                        ),
                      },
                    ]}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="small" onClick={() => handleAddOption(subIndex)}>
                      Thêm đáp án
                    </Button>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )
      })}
    </Col>
  )
}
