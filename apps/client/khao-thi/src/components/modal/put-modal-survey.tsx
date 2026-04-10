import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import ConfigSurveyExam from "@components/sub-pages/config-survey-exam"
import SelectLecturer from "@components/sub-pages/select-lecturer"
import useSpinner from "@hooks/spinner"
import type { Survey, SurveyObjectType, SurveyResponse, SurveyTopic } from "@workspace/db"
import {
  useCreateSurvey,
  useCreateSurveyChoice,
  useFindManySchoolYear,
  useFindManySurveyObjectType,
  useFindManySurveyTopic,
  useFindUniqueSurvey,
  useUpdateSurvey,
} from "@workspace/db/hooks"
import { useCreateClusterSurvey } from "@workspace/libs/api/exam"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  message,
  Radio,
  Row,
  Steps,
  TreeSelect as TreeSelectAnt,
} from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Step } = Steps

export type PutSurveyType = Survey & {
  surveyObjectTypes: string[]
  semesterId: string
  subjectClassIds: string[]
  surveyQuestionIds: string[]
  surveyChoice: any[]
}

type StepItem = {
  title: string
  content: React.ReactNode
  fields?: string[]
}

export interface TreeNodeType {
  value: string
  title: React.ReactNode
  children?: TreeNodeType[]
  selectable?: boolean
}

interface Choices {
  id?: string | null
  answer: string | null
  description: string
  surveyResponses?: SurveyResponse[]
  requireExplanation: boolean | null
}

const PutSurveyModal = () => {
  const [form] = Form.useForm<PutSurveyType>()
  const { id: semesterIdStore } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    type: string
  }>({
    tag: "PutSurveyModal",
    onClose: form.resetFields,
  })
  const [current, setCurrent] = useState(0)
  const [choices, setChoices] = useState<any[]>([
    {
      answer: "1",
      description: "Rất không hài lòng",
      requireExplanation: false,
    },
    {
      answer: "2",
      description: "Không hài lòng",
      requireExplanation: false,
    },
    {
      answer: "3",
      description: "Phân vân",
      requireExplanation: false,
    },
    {
      answer: "4",
      description: "Hài lòng",
      requireExplanation: false,
    },
    {
      answer: "5",
      description: "Rất hài lòng",
      requireExplanation: false,
    },
  ])
  const validateStartDate = async (_: any, value?: dayjs.Dayjs) => {
    if (!value) return Promise.resolve()

    const today = dayjs().startOf("day")

    if (value.startOf("day").isBefore(today)) {
      return Promise.reject("Thời gian bắt đầu phải từ ngày hiện tại trở đi")
    }

    return Promise.resolve()
  }

  const validateEndDate = async (_: any, value?: dayjs.Dayjs) => {
    const startDate = form.getFieldValue("startDate")

    if (!value || !startDate) return Promise.resolve()

    if (!value.isAfter(startDate)) {
      return Promise.reject("Thời gian kết thúc phải lớn hơn thời gian bắt đầu")
    }

    return Promise.resolve()
  }

  const next = async () => {
    try {
      // chỉ validate field trong bước hiện tại
      await form.validateFields(steps[current].fields)
      setCurrent(current + 1)
    } catch (err) {
      message.error("Vui lòng nhập đủ thông tin trước khi tiếp tục!")
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: create } = useCreateSurvey()
  const { mutateAsync: update } = useUpdateSurvey()
  const { mutateAsync: createSurveyChoice } = useCreateSurveyChoice()
  const { mutateAsync: createMultiple } = useCreateClusterSurvey()
  const { data: surveyTopics = [] } = useFindManySurveyTopic({
    where: {
      type: input?.type === "multiple" ? "CLUSTER" : "SINGLE",
    },
  })
  const { data: surveyObjectTypesData = [] } = useFindManySurveyObjectType({
    where: { trainingObjectTypeId },
  })

  async function onOk(output?: PutSurveyType) {
    if (!trainingObjectTypeId) {
      message.error("Vui lòng chọn loại đối tượng đào tạo")
      return
    }
    if (!output) return
    try {
      showSpinner()

      if (input?.type === "multiple") {
        const res = await createMultiple({
          data: {
            name: output.name.trim(),
            surveyObjectTypeIds: output.surveyObjectTypes,
            surveyTopicId: output.surveyTopicId,
            startDate: output.startDate.toISOString(),
            endDate: output?.endDate ? output?.endDate.toISOString() : null,
            isPublic: output.isPublic,
            anonymous: output.anonymous,
            subjectClassIds: output.subjectClassIds.length ? output.subjectClassIds : [],
            surveyChoices: output.surveyChoice,
            surveyQuestionIds: output.surveyQuestionIds,
            semesterId: output.semesterId,
            trainingObjectTypeId,
          },
        })
        if (res?.status === 200) {
          message.success("Tạo thành công")
          onClose()
          return
        }
      } else {
        if (input?.id && output.surveyChoice?.length > 0) {
          let listTransition: any = [
            {
              model: "Survey",
              operation: "update",
              data: {
                data: {
                  code: output.code,
                  name: output.name.trim(),
                  surveyObjectType: {
                    set:
                      output.surveyObjectTypes.map((item) => ({
                        id: item,
                      })) || [],
                  },
                  startDate: output.startDate,
                  endDate: output.endDate,
                  description: output.description,
                  isPublic: output.isPublic,
                  anonymous: !output.isPublic ? false : output.anonymous,
                  surveyChoice: {
                    deleteMany: {},
                  },
                  surveyQuestion: {
                    set: output.surveyQuestionIds.length
                      ? output.surveyQuestionIds.map((item) => ({ id: item }))
                      : [],
                  },
                },
                where: {
                  id: input?.id,
                },
              },
            },
            {
              model: "SurveyChoice",
              operation: "deleteMany",
              data: {
                where: {
                  survey: {
                    some: {
                      id: input?.id,
                    },
                  },
                },
              },
            },
          ]
          if (output.surveyChoice?.length > 0) {
            listTransition = [
              ...listTransition,
              ...output.surveyChoice.map((i: any) => {
                return {
                  model: "SurveyChoice",
                  operation: "create",
                  data: {
                    data: {
                      answer: i.answer,
                      description: i.description,
                      requireExplanation: i.requireExplanation,
                      survey: {
                        connect: {
                          id: input?.id,
                        },
                      },
                    },
                  },
                }
              }),
            ]
          }

          const res: any = sqlTransaction(listTransition)

          if (res?.status === 200) {
            message.success("Tạo thành công")
            onClose()
            return
          }
        } else {
          const res = await create({
            data: {
              code: output.code,
              name: output.name.trim(),
              surveyObjectType:
                output?.surveyObjectTypes?.length > 0
                  ? {
                      connect:
                        output.surveyObjectTypes.map((item) => ({
                          id: item,
                        })) || [],
                    }
                  : {},
              surveyTopic: {
                connect: {
                  id: output.surveyTopicId,
                },
              },
              startDate: output.startDate,
              endDate: output.endDate,
              description: output.description,
              isPublic: output.isPublic,
              anonymous: !output.isPublic ? false : output.anonymous,
              surveyQuestion: {
                connect: output.surveyQuestionIds.length
                  ? output.surveyQuestionIds.map((item) => ({ id: item }))
                  : [],
              },
              semester: {
                connect: {
                  id: semesterIdStore,
                },
              },
              trainingObjectType: {
                connect: {
                  id: trainingObjectTypeId,
                },
              },
            },
          })

          // TODO: fix create survey choice
          for (const choice of output.surveyChoice) {
            await createSurveyChoice({
              data: {
                survey: { connect: { id: res?.id } },
                answer: choice.answer,
                description: choice.description,
                requireExplanation: choice.requireExplanation,
              },
            })
          }
          message.success("Thêm mới thành công")
        }
        onClose()
      }

      // refetch() lại danh sách level
    } catch (error: any) {
      console.log(error)
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { data: schoolYears, isLoading: schoolYearLoading } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        orderBy: { startDate: "desc" },
      },
    },
  })

  const semesterId = Form.useWatch("semesterId", form)

  // Tạo treeData từ schoolYears và semesters
  const treeData: TreeNodeType[] = useMemo(() => {
    return (
      schoolYears?.map((schoolYear) => ({
        value: `schoolYear-${schoolYear.id}`,
        title: schoolYear.name,
        selectable: false,
        children:
          schoolYear.semesters.map((semester) => ({
            value: semester.id,
            title: `${semester.name}`,
          })) || [],
      })) || []
    )
  }, [schoolYears])

  const { data: survey } = useFindUniqueSurvey(
    {
      where: { id: input?.id },
      include: {
        surveyObjectType: true,
        surveyChoice: {
          include: {
            surveyResponses: true,
          },
        },
        surveyQuestion: true,
      },
    },
    {
      enabled: !!input?.id,
      refetchOnWindowFocus: false,
    }
  )

  const filterTreeNode = (input: string, treeNode: any) => {
    return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
  }

  const surveyTopicId = Form.useWatch("surveyTopicId", form)
  const isPublic = Form.useWatch("isPublic", form)
  const anonymous = Form.useWatch("anonymous", form)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  const steps: StepItem[] = useMemo(() => {
    return [
      {
        title: "Thông tin chung",
        content: (
          <Row gutter={16}>
            {/* <Col span={12}>
                            <FormItem form={form} name="code" label="Mã khảo sát" required>
                                <Input placeholder="Nhập mã khảo sát" />
                            </FormItem>
                        </Col> */}
            <Col span={24}>
              <FormItem form={form} name="name" label="Tên khảo sát" required>
                <Input placeholder="Nhập tên khảo sát" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="surveyTopicId" label="Chủ đề khảo sát" required>
                <Select
                  placeholder="Chọn chủ đề khảo sát"
                  options={surveyTopics.map((i: SurveyTopic) => {
                    return {
                      value: i.id,
                      label: i.name,
                    }
                  })}
                />
              </FormItem>
            </Col>
            {input?.type !== "multiple" && !(isPublic && anonymous) && (
              <Col span={12}>
                <FormItem
                  form={form}
                  name="surveyObjectTypes"
                  label="Đối tượng làm khảo sát"
                  required={true}
                >
                  <Select
                    mode="multiple"
                    maxTagCount={"responsive"}
                    placeholder="Chọn đối tượng làm khảo sát"
                    options={surveyObjectTypesData.map((i: SurveyObjectType) => {
                      return {
                        value: i.id,
                        label: i.name,
                      }
                    })}
                  />
                </FormItem>
              </Col>
            )}
            {input?.type === "multiple" && (
              <Col span={12}>
                <FormItem form={form} name="semesterId" label="Kỳ học" required>
                  <TreeSelectAnt
                    showSearch
                    dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                    placeholder={"Chọn kỳ học"}
                    allowClear
                    treeDefaultExpandAll
                    treeData={treeData}
                    filterTreeNode={filterTreeNode}
                    treeNodeFilterProp="title"
                    loading={schoolYearLoading}
                  />
                </FormItem>
              </Col>
            )}

            <Col span={12}>
              <FormItem
                form={form}
                name="startDate"
                label="Thời gian bắt đầu"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian bắt đầu",
                  },
                  { validator: validateStartDate },
                ]}
              >
                <DatePicker format="DD/MM/YYYY" className="w-full" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                form={form}
                name="endDate"
                label="Thời gian kết thúc"
                rules={[{ validator: validateEndDate }]}
              >
                <DatePicker format="DD/MM/YYYY" className="w-full" />
              </FormItem>
            </Col>

            <Col span={12}>
              <Row gutter={16}>
                <Col span={8}>
                  <FormItem form={form} name={"isPublic"} label="Có công khai không?" required>
                    <Radio.Group buttonStyle="solid">
                      <Radio value={true}>Có</Radio>
                      <Radio value={false}>Không</Radio>
                    </Radio.Group>
                  </FormItem>
                </Col>
                {isPublic === true && (
                  <Col span={8}>
                    <FormItem form={form} name={"anonymous"} label="Có ẩn danh không?" required>
                      <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                      </Radio.Group>
                    </FormItem>
                  </Col>
                )}
              </Row>
            </Col>
          </Row>
        ),
      },
      ...(input?.type === "multiple"
        ? [
            {
              title: "Đối tượng được khảo sát",
              content: <SelectLecturer surveyTopicId={surveyTopicId} semesterId={semesterId} />,
            },
          ]
        : []),
      {
        title: "Cấu hình sinh đề",
        content: (
          <ConfigSurveyExam
            surveyTopicId={surveyTopicId}
            choices={choices}
            setChoices={(value: any) => setChoices(value)}
          />
        ),
      },
    ]
  }, [
    input,
    surveyObjectTypesData,
    surveyTopics,
    treeData,
    surveyTopicId,
    semesterId,
    isPublic,
    anonymous,
    choices,
    form,
  ])
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (survey) {
      setChoices(
        survey?.surveyChoice.length
          ? survey?.surveyChoice.map((item) => {
              return {
                id: item.id,
                answer: item.answer,
                description: item.description,
                requireExplanation: item.requireExplanation,
                surveyResponses: item.surveyResponses,
              }
            })
          : choices
      )
      form.setFieldsValue({
        ...survey,
        semesterId: semesterIdStore,
        startDate: dayjs(survey.startDate),
        endDate: survey.endDate ? dayjs(survey.endDate) : undefined,
        surveyObjectTypes: survey.surveyObjectType.map((item) => item.id),
        surveyQuestionIds: survey?.surveyQuestion.map((item) => item.id),
        surveyChoice: survey?.surveyChoice.length
          ? survey?.surveyChoice.map((item) => {
              return {
                id: item.id,
                answer: item.answer,
                description: item.description,
                requireExplanation: item.requireExplanation,
                surveyResponses: item.surveyResponses,
              }
            })
          : choices,
      })
    } else {
      form.setFieldsValue({
        semesterId: semesterIdStore,
        isPublic: false,
        anonymous: false,
        surveyChoice: choices,
      })
    }
  }, [survey, semesterIdStore])

  return (
    <Modal
      open={isOpen}
      width={1100}
      maskClosable={false}
      title={input?.id ? "Chỉnh sửa khảo sát" : "Thêm mới khảo sát"}
      footer={null}
      onCancel={onClose}
    >
      <div className="w-full max-w-[700px] mx-auto mt-6">
        <Steps current={current} style={{ marginBottom: 24 }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
      </div>

      <Form form={form} layout="vertical" onFinish={onOk}>
        {steps.map((step, index) => (
          <div key={step.title} style={{ display: index === current ? "block" : "none" }}>
            {step.content}
          </div>
        ))}

        <div className="flex justify-end" style={{ marginTop: 24 }}>
          {current > 0 && (
            <Button style={{ marginRight: 8 }} onClick={prev}>
              Quay lại
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Tiếp theo
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          )}
        </div>
      </Form>
    </Modal>
  )
}

export default PutSurveyModal
