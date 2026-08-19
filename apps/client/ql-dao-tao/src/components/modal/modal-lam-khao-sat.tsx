import { useSession } from "@workspace/auth/react"
import {
  getGetSurveysOfProfileQueryKey,
  getPublicSurvey,
  useSavePublicSurvey,
} from "@workspace/libs/api/exam"
import type { GetSurveyResult } from "@workspace/libs/api/schemas/getSurveyResult"
import {
  DEFAULT_SURVEY_PRINT_FORM_CONTENT,
  LECTURER_SURVEY_PRINT_FORM_CONTENT,
} from "@workspace/libs/survey-form-content"
import { SurveyFormFooter, SurveyFormIntro } from "@workspace/ui"
import { useQueryClient } from "@tanstack/react-query"
import {
  Modal as AntdModal,
  Button,
  Col,
  Flex,
  Form,
  Input,
  message,
  Radio,
  Row,
  Skeleton,
  Table,
} from "antd"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { toRoman } from "@/utils/romans"

type GroupedSurveyQuestion = {
  id: string
  name: string
  question: {
    id: string
    name: string
    type: string
  }[]
}

const ModalLamKhaoSat = () => {
  const { isOpen, onClose, input } = useDisclosure<{ surveyId: string }>({
    tag: "ModalLamKhaoSat",
    onClose: () => {
      setSurvey(undefined)
      form.resetFields()
    },
  })

  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId

  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [survey, setSurvey] = useState<GetSurveyResult>()
  const [startAt, setStartAt] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)

  const { mutateAsync: createSavePublicSurvey, isPending } = useSavePublicSurvey()

  // Gom câu hỏi theo nhóm (surveyQuestionGroup) rồi làm phẳng để đổ vào Table
  const dataTest = useMemo(() => {
    const groupedMap = (survey?.surveyQuestion ?? []).reduce<Record<string, GroupedSurveyQuestion>>(
      (acc: any, item: any, index: number) => {
        const groupId = item.surveyQuestionGroup?.id

        if (!acc[groupId]) {
          acc[groupId] = {
            ...item,
            id: item.surveyQuestionGroup?.id,
            name: item.surveyQuestionGroup?.name,
            question: [],
            isParent: true,
          }
        }

        acc[groupId].question.push({
          ...item,
          id: item.id,
          name: item.name,
          type: item.type,
          isParent: false,
          index: index + 1,
        })

        return acc
      },
      {}
    )

    const grouped: GroupedSurveyQuestion[] = Object.values(groupedMap).map((i: any, index) => {
      return { ...i, index: toRoman(index + 1) }
    })
    return grouped.flatMap((i) => [i, ...(i.question || [])]) || []
  }, [survey?.surveyQuestion])

  const fetchData = async (surveyId: string) => {
    setIsLoading(true)
    try {
      const response = await getPublicSurvey(surveyId)
      if (response?.status === 200) {
        setSurvey(response.data)
        setStartAt(new Date())
      } else {
        message.error((response?.data as any)?.message || "Không tải được khảo sát")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: chỉ chạy khi mở modal
  useEffect(() => {
    if (isOpen && input?.surveyId) {
      fetchData(input.surveyId)
    }
  }, [isOpen, input?.surveyId])

  async function onOk() {
    if (!input?.surveyId) return
    const dataSubmit = form.getFieldsValue()

    const responsesError = (dataSubmit?.responses ?? []).filter(
      (i: any) => !i?.answerText && !i?.surveyChoiceId
    )

    if (
      responsesError?.length ||
      survey?.surveyQuestion?.length !== dataSubmit?.responses?.length
    ) {
      message.error("Bạn chưa hoàn thành mẫu khảo sát")
      return
    }

    try {
      const res = await createSavePublicSurvey({
        data: {
          startedAt: new Date(startAt).toISOString(),
          surveyId: input.surveyId,
          profileId,
          responses: dataSubmit?.responses?.map((i: any, index: number) => ({
            surveyQuestionId: survey?.surveyQuestion[index]?.id as string,
            surveyChoiceId: i.surveyChoiceId,
            explanation: i.explanation,
            answerText: i.answerText,
          })),
        },
      })
      if (res?.status === 200) {
        message.success("Gửi khảo sát thành công")
        queryClient.invalidateQueries({
          queryKey: getGetSurveysOfProfileQueryKey(profileId as string),
        })
        onClose()
      } else {
        message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      }
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  return (
    <AntdModal
      open={isOpen}
      onCancel={onClose}
      maskClosable={false}
      title={survey?.name || "Trả lời khảo sát"}
      className="w-[1100px]"
      footer={null}
    >
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Form form={form} className="w-full">
          <div className="mb-4 text-center text-xl font-bold uppercase text-black">
            {survey?.name}
          </div>

          <SurveyFormIntro
            survey={survey}
            fallback={
              survey?.lectureInfo
                ? LECTURER_SURVEY_PRINT_FORM_CONTENT
                : DEFAULT_SURVEY_PRINT_FORM_CONTENT
            }
          />

          {survey?.surveyChoice?.length ? (
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Table
                  rowKey="id"
                  dataSource={[{ id: "header" }]}
                  columns={survey.surveyChoice.map((i) => ({
                    title: `${i?.description}`,
                    dataIndex: i?.id,
                    key: i?.id,
                    align: "center" as const,
                    render: () => (
                      <div className="flex items-center justify-center">
                        <Button className="flex h-6 w-6 items-center justify-center border-[1px] border-solid border-[#ed9e9e] text-[12px] text-[#ea1212]">
                          {i?.answer}
                        </Button>
                      </div>
                    ),
                  }))}
                  pagination={false}
                />
              </Col>

              <Col span={24} className="my-3">
                <Table
                  rowKey="id"
                  dataSource={dataTest || []}
                  pagination={false}
                  bordered
                  columns={[
                    {
                      title: "STT",
                      width: 50,
                      align: "center",
                      render: (_, record: any) => (
                        <div className={record.isParent ? "font-semibold" : ""}>
                          {record?.index}
                        </div>
                      ),
                    },
                    {
                      title: "Nội dung phản hồi",
                      dataIndex: "content",
                      render: (_, record: any) => {
                        const order = survey?.surveyQuestion.findIndex(
                          (item) => item.id === record.id
                        )
                        return record.isParent ? (
                          <div className="font-semibold uppercase">{record?.name}</div>
                        ) : record?.type === "ESSAY" ? (
                          <div>
                            <div dangerouslySetInnerHTML={{ __html: record?.name }} />
                            <Form.Item
                              name={["responses", order, "answerText"]}
                              rules={[{ required: true, message: "Nhập câu trả lời" }]}
                            >
                              <Input.TextArea placeholder="Nhập câu trả lời" />
                            </Form.Item>
                          </div>
                        ) : record?.specificChoice?.length > 0 ? (
                          <div>
                            <div dangerouslySetInnerHTML={{ __html: record?.name }} />
                            <Form.Item
                              name={["responses", order, "surveyChoiceId"]}
                              rules={[{ required: true, message: "Vui lòng chọn mức phản hồi" }]}
                              style={{ marginBottom: 0 }}
                              className="w-full"
                            >
                              <Radio.Group className="flex w-full gap-x-2">
                                {survey?.surveyChoice.map((i, index: number) => (
                                  <Radio key={i?.id} value={i?.id} className="relative">
                                    <div>{record?.specificChoice[index]?.description}</div>
                                  </Radio>
                                ))}
                              </Radio.Group>
                            </Form.Item>
                          </div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: record?.name }} />
                        )
                      },
                      onCell: (record: any) => ({
                        colSpan:
                          record.isParent ||
                          record?.specificChoice?.length > 0 ||
                          record?.type === "ESSAY"
                            ? 2
                            : 1,
                      }),
                    },
                    {
                      title: "Mức phản hồi",
                      width: 200,
                      align: "center",
                      onCell: (record: any) => ({
                        colSpan:
                          record.isParent ||
                          record?.specificChoice?.length > 0 ||
                          record?.type === "ESSAY"
                            ? 0
                            : 1,
                      }),
                      render: (_, record: any) => {
                        const order = survey?.surveyQuestion.findIndex(
                          (item) => item.id === record.id
                        )
                        return (
                          record?.type === "SINGLE_CHOICE" && (
                            <Form.Item
                              name={["responses", order, "surveyChoiceId"]}
                              rules={[{ required: true, message: "Vui lòng chọn mức phản hồi" }]}
                              style={{ marginBottom: 0 }}
                              className="w-full"
                            >
                              <Radio.Group className="flex w-full gap-x-2">
                                {survey?.surveyChoice.map((i) => (
                                  <Radio.Button key={i?.id} value={i?.id}>
                                    {i?.answer}
                                  </Radio.Button>
                                ))}
                              </Radio.Group>
                            </Form.Item>
                          )
                        )
                      },
                    },
                  ]}
                />
              </Col>

              <Col span={24}>
                <SurveyFormFooter
                  survey={survey}
                  fallback={
                    survey?.lectureInfo
                      ? LECTURER_SURVEY_PRINT_FORM_CONTENT
                      : DEFAULT_SURVEY_PRINT_FORM_CONTENT
                  }
                />
              </Col>

              <Col span={24} className="my-3">
                <Flex justify="end" gap={8}>
                  <Button onClick={onClose}>Hủy</Button>
                  <Button onClick={onOk} type="primary" loading={isPending}>
                    Lưu
                  </Button>
                </Flex>
              </Col>
            </Row>
          ) : (
            <div className="text-center text-base">Khảo sát chưa có nội dung</div>
          )}
        </Form>
      )}
    </AntdModal>
  )
}

export default ModalLamKhaoSat
