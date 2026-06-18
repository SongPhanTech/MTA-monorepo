import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { useSurveyQuestionTypeOptions } from "@hooks/survey-question-type"
import type { SurveyQuestion, SurveyQuestionGroup } from "@workspace/db"
import { $Enums } from "@workspace/db/client"
import {
  useCreateSurveyQuestion,
  useCreateSurveyQuestionGroup,
  useFindManySurveyQuestionGroup,
  useFindUniqueSurveyQuestion,
  useUpdateSurveyQuestion,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Col, Form, Input, message, Radio, Row } from "antd"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutSurveyQuestionType = SurveyQuestion & {
  specificChoice: any[]
  specific: boolean
}
const PutSurveyQuestionModal = () => {
  const [form] = Form.useForm<PutSurveyQuestionType>()
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    surveyQuestionGroupId: string
    type: string
    surveyTopicId?: string
  }>({
    tag: "PutSurveyQuestionModal",
    onClose: form.resetFields,
  })

  const [choices, setChoices] = useState<any[]>([
    {
      answer: "1",
      description: "Rất không hài lòng",
    },
    {
      answer: "2",
      description: "Không hài lòng",
    },
    {
      answer: "3",
      description: "Phân vân",
    },
    {
      answer: "4",
      description: "Hài lòng",
    },
    {
      answer: "5",
      description: "Rất hài lòng",
    },
  ])
  const { showSpinner, hideSpinner } = useSpinner()
  const { options: surveyQuestionTypeOptions, getSurveyQuestionTypeLabel } =
    useSurveyQuestionTypeOptions()
  const { mutateAsync: create } = useCreateSurveyQuestion()
  const { mutateAsync: update } = useUpdateSurveyQuestion()
  const { mutateAsync: createSurveyQuestionGroup } = useCreateSurveyQuestionGroup()

  const { data: surveyQuestionGroupData = [] } = useFindManySurveyQuestionGroup()
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

  async function onOk(output?: PutSurveyQuestionType) {
    if (!output) return

    try {
      showSpinner()
      const surveyQuestionGroupId = await resolveSurveyQuestionGroupId(output.surveyQuestionGroupId)
      if (!surveyQuestionGroupId) {
        message.warning("Vui lòng chọn nhóm câu hỏi khảo sát")
        return
      }
      if (output.type === "SINGLE_CHOICE" && output.specificChoice?.length > 0) {
        if (input?.id) {
          if (output.specificChoice?.length > 0) {
            const res = await sqlTransaction([
              {
                model: "SpecificChoice",
                operation: "deleteMany",
                data: {
                  where: {
                    surveyQuestionId: input?.id,
                  },
                },
              },
              {
                model: "SurveyQuestion",
                operation: "update",
                data: {
                  where: {
                    id: input?.id,
                  },
                  data: {
                    name: output.name.trim(),
                    surveyQuestionGroupId,
                    type: output.type,
                    description: output.description,
                    specificChoice: {
                      create: output.specificChoice.map((i) => {
                        return {
                          answer: i?.answer,
                          description: i?.description,
                        }
                      }),
                    },
                  },
                },
              },
            ])
            if (res?.status === 200) {
              message.success("Cập nhật thành công")
            } else {
              message.error("Lỗi cập nhật câu hỏi")
            }
          } else {
            await update({
              data: {
                name: output.name.trim(),
                surveyQuestionGroupId: surveyQuestionGroupId,
                type: output.type,
                description: output.description,
                specificChoice: {
                  deleteMany: {},
                },
              },
              where: {
                id: input?.id,
              },
            })
            message.success("Cập nhật thành công")
          }
        } else {
          await create({
            data: {
              name: output.name.trim(),
              surveyQuestionGroupId: surveyQuestionGroupId,
              type: output.type,
              description: output.description,
              specificChoice: {
                createMany: {
                  data: output.specificChoice,
                },
              },
            },
          })
          message.success("Thêm mới thành công")
        }
      } else {
        if (input?.id) {
          await update({
            data: {
              name: output.name.trim(),
              surveyQuestionGroupId: surveyQuestionGroupId,
              type: output.type,
              description: output.description,
            },
            where: {
              id: input?.id,
            },
          })
          message.success("Cập nhật thành công")
        } else {
          await create({
            data: {
              name: output.name.trim(),
              surveyQuestionGroupId: surveyQuestionGroupId,
              type: output.type,
              description: output.description,
            },
          })
          message.success("Thêm mới thành công")
        }
      }

      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["Level"],
      })
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { data: surveyQuestion } = useFindUniqueSurveyQuestion(
    {
      where: { id: input?.id },
      include: {
        specificChoice: true,
      },
    },
    {
      enabled: !!input?.id,
      refetchOnWindowFocus: false,
    }
  )

  const listForm = Form.useWatch("specificChoice", form) ?? []
  const specific = Form.useWatch("specific", form) ?? false
  const typeForm = Form.useWatch("type", form) ?? false
  const handleAddChoices = () => {
    const newList = [...listForm, { answer: "", description: "" }]
    setChoices(newList)
    // form.setFieldValue('code', e.target.value.toUpperCase())
    form.setFieldsValue({ specificChoice: newList }) // ✅ cập nhật form theo state
  }

  const handleRemoveChoices = (index: number) => {
    const result = listForm.filter((i: any, idx: number) => idx !== index)
    setChoices(result)
    form.setFieldsValue({
      specificChoice: result,
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (input?.surveyQuestionGroupId) {
      form.setFieldsValue({ surveyQuestionGroupId: input?.surveyQuestionGroupId })
      return
    }

    if (isLecturerSurvey && topicQuestionGroups[0]?.id) {
      form.setFieldsValue({ surveyQuestionGroupId: topicQuestionGroups[0].id })
    }
  }, [input?.surveyQuestionGroupId, isLecturerSurvey, topicQuestionGroups])
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (surveyQuestion) {
      setChoices(
        surveyQuestion?.specificChoice?.length ? [...surveyQuestion.specificChoice] : [...choices]
      )
      form.setFieldsValue({
        ...surveyQuestion,
        specific: surveyQuestion?.specificChoice?.length ? true : false,
        specificChoice: surveyQuestion?.specificChoice?.length
          ? [...surveyQuestion.specificChoice]
          : [...choices],
      })
    } else {
      form.setFieldsValue({ specificChoice: [], specific: false })
    }
  }, [surveyQuestion])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa câu hỏi khảo sát" : "Thêm mới câu hỏi khảo sát"}
      className="w-[700px]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Câu hỏi khảo sát" required>
          <Input placeholder="Nhập câu hỏi khảo sát" />
        </FormItem>
      </Col>
      {!isLecturerSurvey && (
        <Col span={12}>
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
      <Col span={12}>
        <FormItem form={form} name="type" label="Loại câu hỏi khảo sát" required>
          <Select placeholder="Chọn loại câu hỏi khảo sát" options={surveyQuestionTypeOptions} />
        </FormItem>
      </Col>
      {typeForm === "SINGLE_CHOICE" && (
        <Col span={24}>
          <FormItem form={form} name="specific" label="Đáp án đặc biệt">
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Có</Radio>
              <Radio value={false}>Không</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
      {specific && (
        <Col span={24}>
          <div className="mb-4 text-[14px] font-[500]">Lựa chọn của câu hỏi khảo sát</div>
          <div>
            <FormItem form={form} name="specificChoice">
              <Table
                rowKey={"id"}
                columns={[
                  {
                    title: "Giá trị",
                    dataIndex: "answer",
                    width: 100,
                    render: (__, record, index) => (
                      <Form.Item
                        className="w-full mb-0"
                        name={["specificChoice", index, "answer"]}
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
                        name={["specificChoice", index, "description"]}
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
        </Col>
      )}

      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutSurveyQuestionModal
