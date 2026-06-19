import Select from "@components/commons/select"
import Table from "@components/commons/table"
import { DIFFICULT_OPTIONS, QUESTION_TYPE_OPTIONS } from "@constants/constants"
import type { Difficult, QuestionType } from "@workspace/db/client"
import { QuestionType as QuestionTypeEnum } from "@workspace/db/client"
import { Button, Checkbox, Col, Form, Input, InputNumber, Row, Tooltip } from "antd"
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

export default function ClusterSubQuestionsForm() {
  const form = Form.useFormInstance()
  const subQuestionsWatch =
    (Form.useWatch("subQuestions", form) as SubQuestionFormItem[] | undefined) || []

  return (
    <Col span={24}>
      <div className="text-sm font-medium mb-3">Câu hỏi con</div>
      <Form.List name="subQuestions">
          {(fields, { add, remove }) => (
            <>
              {fields.length === 0 && (
                <div className="text-gray-400 text-sm mb-2 italic">Chưa có câu hỏi con</div>
              )}

              {fields.map((field, subIndex) => {
                const subType = subQuestionsWatch[field.name]?.type
                return (
                  <div
                    key={field.key}
                    className="border border-[#D1D5DB] rounded-lg p-4 mb-4 bg-[#FAFAFA]"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-sm">
                        Câu {String.fromCharCode(97 + subIndex)})
                      </span>
                      <Tooltip title="Xóa câu hỏi con">
                        <Trash2
                          size={16}
                          className="text-red-600 cursor-pointer"
                          onClick={() => remove(field.name)}
                        />
                      </Tooltip>
                    </div>

                    <Row gutter={[16, 0]}>
                      <Form.Item name={[field.name, "id"]} hidden>
                        <Input />
                      </Form.Item>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, "type"]}
                          label="Loại câu hỏi"
                          rules={[{ required: true, message: "Vui lòng chọn loại câu hỏi" }]}
                          className="mb-0 mt-2"
                        >
                          <Select options={SUB_QUESTION_TYPE_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, "difficult"]}
                          label="Mức độ"
                          rules={[{ required: true, message: "Vui lòng chọn mức độ" }]}
                          className="mb-0 mt-2"
                        >
                          <Select options={DIFFICULT_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, "point"]}
                          label="Điểm"
                          rules={[{ required: true, message: "Vui lòng nhập điểm" }]}
                          className="mb-0 mt-2"
                        >
                          <InputNumber min={0} step={0.25} className="w-full" />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name={[field.name, "content"]}
                          label="Nội dung (tuỳ chọn)"
                          className="mb-0 mt-2"
                        >
                          <Input placeholder="Nhập nội dung câu hỏi" />
                        </Form.Item>
                      </Col>

                      {(subType === QuestionTypeEnum.SINGLE_CHOICE ||
                        subType === QuestionTypeEnum.MULTIPLE_CHOICE) && (
                        <Col span={24}>
                          <Form.List name={[field.name, "multipleChoiceOptions"]}>
                            {(optFields, { add: addOpt, remove: removeOpt }) => (
                              <>
                                <Table
                                  rowKey="key"
                                  pagination={false}
                                  data={optFields}
                                  columns={[
                                    {
                                      title: "Đáp án",
                                      width: 90,
                                      render: (_: unknown, __: unknown, index: number) =>
                                        `Đáp án ${index + 1}`,
                                    },
                                    {
                                      title: "Nội dung",
                                      render: (_: unknown, optField) => (
                                        <Form.Item
                                          name={[optField.name, "content"]}
                                          className="mb-0"
                                          rules={[{ required: true, message: "Nhập đáp án" }]}
                                        >
                                          <Input placeholder="Nhập đáp án" />
                                        </Form.Item>
                                      ),
                                    },
                                    {
                                      title: "Đúng",
                                      width: 60,
                                      align: "center",
                                      render: (_: unknown, optField) => (
                                        <Form.Item
                                          name={[optField.name, "isCorrect"]}
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
                                      render: (_: unknown, optField) => (
                                        <Trash2
                                          size={16}
                                          className="text-red-600 cursor-pointer"
                                          onClick={() => removeOpt(optField.name)}
                                        />
                                      ),
                                    },
                                  ]}
                                />
                                <div className="flex justify-end mt-2">
                                  <Button
                                    onClick={() =>
                                      addOpt({
                                        key: String(optFields.length + 1),
                                        content: "",
                                        isCorrect: false,
                                      })
                                    }
                                  >
                                    Thêm đáp án
                                  </Button>
                                </div>
                              </>
                            )}
                          </Form.List>
                        </Col>
                      )}
                    </Row>
                  </div>
                )
              })}

              <div className="flex justify-end">
                <Button onClick={() => add(defaultSubQuestion())}>Thêm câu hỏi con</Button>
              </div>
            </>
          )}
        </Form.List>
    </Col>
  )
}
