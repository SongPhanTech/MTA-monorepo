import FormItem from "@components/commons/form-item"
import Table from "@components/commons/table"
import type { PutSurveyType } from "@components/modal/put-modal-survey"
import type { SurveyQuestion } from "@workspace/db"
import { useFindManySurveyQuestionGroup } from "@workspace/db/hooks"
import { Button, Empty, Form, Input, Row, Tree, type TreeProps } from "antd"
import { Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

interface MyTreeNode {
  title: string
  key: string
  value?: string // nếu bạn muốn gán giá trị riêng
  children?: MyTreeNode[]
}

function ConfigSurveyExam({
  surveyTopicId,
  choices,
  setChoices,
}: {
  surveyTopicId?: string
  choices: any[]
  setChoices: any
}) {
  const form = Form.useFormInstance<PutSurveyType>()
  const [initValue, setInitValue] = useState<string[]>([])

  const { data: surveyQuestionGroup = [], refetch } = useFindManySurveyQuestionGroup(
    {
      where: {
        surveyTopic: {
          some: {
            id: surveyTopicId,
          },
        },
      },
      include: {
        surveyTopic: true,
        surveyQuestion: true,
      },
      orderBy: { createdAt: "asc" },
    },
    {
      enabled: !!surveyTopicId,
    }
  )

  const treeData = useMemo(() => {
    return surveyQuestionGroup.map((item) => ({
      title: item.name,
      key: item.id,
      children: item.surveyQuestion.map((i: SurveyQuestion) => ({
        title: i.name,
        key: i.id,
      })),
      disabled: item.surveyQuestion.length === 0,
    }))
  }, [surveyQuestionGroup])

  const onCheck: TreeProps["onCheck"] = (checkedKeys, info) => {
    // info.checkedNodes: (DataNode & { children?: DataNode[] })[]
    const onlyLeafValues = (info.checkedNodes as MyTreeNode[])
      .filter((node) => !node.children?.length) // chỉ lấy node không có children
      .map((node) => node.value ?? node.key) // lấy value nếu có, không thì lấy key

    form.setFieldValue("surveyQuestionIds", onlyLeafValues)
    setInitValue(onlyLeafValues)
  }
  const handleAddChoices = () => {
    const newList = [...choices, { answer: "", description: "", requireExplanation: false }]
    setChoices(newList)
    form.setFieldValue("surveyChoice", newList)
  }

  const handleRemoveChoices = (index: number) => {
    const result = choices.filter((_i: any, idx: number) => idx !== index)
    setChoices(result)
    form.setFieldValue("surveyChoice", result)
  }

  return (
    <div className="w-full px-3 mt-3">
      <div className="mb-4 text-[14px] font-[500]">Lựa chọn của câu hỏi khảo sát</div>
      <div>
        <FormItem form={form} name="surveyChoice">
          <Table
            columns={[
              {
                title: "Giá trị",
                dataIndex: "answer",
                width: 100,
                render: (__, record, index) => (
                  <Form.Item
                    className="w-full mb-0"
                    name={["surveyChoice", index, "answer"]}
                    label=""
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập giá trị",
                      },
                    ]}
                  >
                    <Input className="w-full" placeholder="Nhập giá trị" />
                  </Form.Item>
                ),
              },

              {
                title: "Mô tả",
                dataIndex: "description",
                width: 200,
                render: (record, __, index) => (
                  <Form.Item
                    className="w-full mb-0"
                    name={["surveyChoice", index, "description"]}
                    label=""
                  >
                    <Input placeholder="Nhập mô tả" />
                  </Form.Item>
                ),
              },
              {
                title: "Thao tác",
                width: 50,
                align: "center",
                render: (__, record, index: number) => {
                  return (
                    <Row className="justify-center gap-2">
                      <Trash2
                        size={16}
                        strokeWidth={1.5}
                        className={"text-red-600 cursor-pointer"}
                        onClick={(e) => {
                          // e.stopPropagation()
                          handleRemoveChoices(index)
                        }}
                      />
                    </Row>
                  )
                },
              },
            ]}
            bordered
            data={choices}
            pagination={false}
          />
        </FormItem>

        <div className="flex items-center justify-end">
          <Button color="primary" variant="outlined" onClick={handleAddChoices}>
            Thêm câu trả lời
          </Button>
        </div>
      </div>

      <div className="mb-4 text-[14px] font-[500]">Danh sách câu hỏi khảo sát</div>
      {surveyQuestionGroup ? (
        <FormItem
          form={form}
          name="surveyQuestionIds"
          className="max-h-[800px] overflow-y-auto"
          valuePropName="checked"
        >
          <Tree
            defaultExpandAll
            checkedKeys={initValue}
            treeData={treeData}
            checkable
            multiple
            onCheck={onCheck}
          />
        </FormItem>
      ) : (
        <Empty />
      )}
    </div>
  )
}

export default ConfigSurveyExam
