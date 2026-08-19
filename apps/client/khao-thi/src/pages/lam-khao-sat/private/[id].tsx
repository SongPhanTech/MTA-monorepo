import Loading from "@components/commons/loading"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import KhaoSatPrivateLayout from "@layouts/khao-sat-layout/private"
import { toRoman } from "@lib/utils"
import { useSession } from "@workspace/auth/react"
import type { SurveySession } from "@workspace/db"
import { useSuspenseFindFirstStudent } from "@workspace/db/hooks"
import { getPrivateSurvey, useSavePublicSurvey } from "@workspace/libs/api/exam"
import type { GetSurveyResult } from "@workspace/libs/api/schemas/getSurveyResult"
import { Button, Col, Flex, Form, Input, message, Radio, Row } from "antd"
import {
  DEFAULT_SURVEY_PRINT_FORM_CONTENT,
  LECTURER_SURVEY_PRINT_FORM_CONTENT,
} from "@workspace/libs/survey-form-content"
import { SurveyFormFooter, SurveyFormIntro } from "@workspace/ui"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import Confetti from "react-confetti"

type PutSurveySession = SurveySession & {
  responses: {
    surveyChoiceId?: string
    answerText?: string
    explanation?: string
  }[]
}

type GroupedSurveyQuestion = {
  id: string // group id
  name: string // group name
  question: {
    id: string
    name: string
    type: string
  }[]
}
type SurveyType = GetSurveyResult
function TakeTestPage() {
  const router = useRouter()
  const { showSpinner, hideSpinner } = useSpinner()
  const [startAt, setStartAt] = useState<Date>(new Date())
  const id = router.query.id as string
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || ""
  const [form] = Form.useForm<PutSurveySession>()
  const [survey, setSurvey] = useState<SurveyType>()
  const [isLoading, setIsLoading] = useState(true)
  const [isDone, setIsDone] = useState(false)

  // const { data } =  useGetPublicSurvey(id)
  const { mutateAsync: createSavePublicSurvey } = useSavePublicSurvey()

  const { data: student } = useSuspenseFindFirstStudent({
    where: {
      userProfileId: profileId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

  // const handleChange = (questionId: string, value: any) => {
  //     const choice = survey?.surveyChoice.find((i) => i.id === value)
  //     if (choice?.requireExplanation) {
  //         setExpandedRowKeys((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]))
  //     }
  // }

  const dataTest = useMemo(() => {
    const groupedMap = (survey?.surveyQuestion ?? []).reduce<Record<string, GroupedSurveyQuestion>>(
      (acc: any, item: any, index: number) => {
        const groupId = item.surveyQuestionGroupId

        if (!acc[groupId]) {
          acc[groupId] = {
            ...item,
            id: item.surveyQuestionGroup.id,
            name: item.surveyQuestionGroup.name,
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

    // Chuyển thành array

    const grouped: GroupedSurveyQuestion[] = Object.values(groupedMap).map((i: any, index) => {
      return { ...i, index: toRoman(index + 1) }
    })
    // const general=grouped.filter((i)=>i?.)
    const flatData = grouped.flatMap((i) => [i, ...(i.question || [])])
    return flatData || []
    // return classGroups
  }, [survey?.surveyQuestion])

  // const requireExplanation = useMemo(() => {
  //     return survey?.surveyChoice?.filter((i: any) => !!i?.requireExplanation).map((i) => i.id)
  // }, [survey])

  async function onOk() {
    const dataSubmit = form.getFieldsValue()
    const responsesError = dataSubmit?.responses.filter(
      (i: any) => !i?.answerText && !i.surveyChoiceId
    )

    if (
      responsesError?.length ||
      survey?.surveyQuestion?.length !== dataSubmit?.responses?.length
    ) {
      message.error("Bạn chưa hoàn thành mẫu khảo sát")
      return
    }

    // const reason = dataSubmit?.responses.filter(
    //     (i: any) => requireExplanation?.includes(i?.surveyChoiceId) && !i.explanation
    // )
    // if (reason.length) {
    //     message.error('Bạn chưa nhập lý do cho những khảo sát đặc biệt')
    //     return
    // }

    try {
      showSpinner()
      const res = await createSavePublicSurvey({
        data: {
          startedAt: new Date(startAt).toISOString(),
          surveyId: id,
          profileId: profileId,
          studentId: student?.id,
          studentCode: student?.code || undefined,
          responses: dataSubmit?.responses?.map((i, index) => {
            return {
              surveyQuestionId: survey?.surveyQuestion[index]?.id,
              surveyChoiceId: i?.surveyChoiceId,
              explanation: i?.explanation,
              answerText: i?.answerText,
            }
          }),
        },
      })
      if (res?.status === 200) {
        message.success("Gửi khảo sát thành công")
        setIsDone(true)
      } else {
        message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      }
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

  const fetchData = async () => {
    const response = await getPrivateSurvey(id, {
      profileId,
    })
    if (response?.status === 200) {
      if (response?.data?.isPublic) {
        return
      }
      setSurvey(response?.data)
      setStartAt(new Date())
    } else {
      message.error(response?.data?.message)
    }
    setIsLoading(false)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (id && profileId) {
      fetchData()
    }
  }, [id, profileId])

  return isLoading ? (
    <Loading />
  ) : isDone ? (
    <div className="text-center flex flex-col items-center justify-center min-h-[calc(100vh-64px-24px)]">
      <div className="text-2xl mb-6 text-[#0d7101]">Xin chúc mừng bạn đã hoàn thành khảo sát</div>
      <Button
        type="primary"
        onClick={() => {
          router.push("/thiet-lap-khao-sat/danh-sach-khao-sat")
        }}
        size="large"
        className="mb-20"
      >
        Quay về
      </Button>
      <Confetti width={window?.innerWidth || 1000} height={window?.innerHeight || 1000} />
    </div>
  ) : (
    <Form form={form} className="px-6 max-w-[1100px] w-full mx-auto">
      <div className="text-xl font-bold mb-4 text-center uppercase color-black">{survey?.name}</div>
      <SurveyFormIntro
        survey={survey}
        fallback={
          survey?.lectureInfo
            ? LECTURER_SURVEY_PRINT_FORM_CONTENT
            : DEFAULT_SURVEY_PRINT_FORM_CONTENT
        }
      />
      {survey?.surveyChoice?.length && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Table
              rowKey="id"
              dataSource={[{ id: "abc" }]}
              columns={survey.surveyChoice.map((i) => {
                return {
                  title: `${i?.description}`,
                  dataIndex: i?.id,
                  key: i?.id,
                  align: "center",
                  render: () => (
                    <div className="flex items-center justify-center">
                      <Button className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                        {i?.answer}
                      </Button>
                    </div>
                  ),
                }
              })}
              pagination={false}
            />
          </Col>

          <Col span={24} className="my-3">
            <Table
              rowKey="id"
              dataSource={dataTest || []}
              pagination={false}
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  render: (_, record) => {
                    return (
                      <div className={`${record.isParent ? "font-semibold" : ""}`}>
                        {record?.index}
                      </div>
                    )
                  },
                },
                {
                  title: "Nội dung phản hồi",
                  dataIndex: "content",
                  render: (_, record) => {
                    const order = survey?.surveyQuestion.findIndex((item) => item.id === record.id)
                    return record.isParent ? (
                      <div className="font-semibold uppercase">{record?.name}</div>
                    ) : record?.type === "ESSAY" ? (
                      <div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: record?.name,
                          }}
                        />
                        <Form.Item
                          name={["responses", order, "answerText"]}
                          rules={[
                            {
                              required: true,
                              message: "Nhập câu trả lời",
                            },
                          ]}
                        >
                          <Input.TextArea placeholder="Nhập câu trả lời" />
                        </Form.Item>
                      </div>
                    ) : record?.specificChoice?.length > 0 ? (
                      <div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: record?.name,
                          }}
                        />
                        <Form.Item
                          name={["responses", order, "surveyChoiceId"]}
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng chọn mức phản hồi",
                            },
                          ]}
                          style={{ marginBottom: 0 }}
                          className="w-full"
                        >
                          <Radio.Group className="w-full gap-x-2 flex">
                            {survey?.surveyChoice.map((i, index: number) => (
                              <Radio key={i?.id} value={i?.id} className="relative">
                                <div>{record?.specificChoice[index]?.description}</div>
                              </Radio>
                            ))}
                          </Radio.Group>
                        </Form.Item>
                      </div>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: record?.name,
                        }}
                      />
                    )
                  },
                  onCell: (record, rowIndex) => {
                    return {
                      colSpan:
                        record.isParent ||
                        record?.specificChoice?.length > 0 ||
                        record?.type === "ESSAY"
                          ? 2
                          : 1,
                    }
                  },
                },
                {
                  title: "Mức phản hồi",
                  width: 200,
                  align: "center",
                  onCell: (record, rowIndex) => {
                    return {
                      colSpan:
                        record.isParent ||
                        record?.specificChoice?.length > 0 ||
                        record?.type === "ESSAY"
                          ? 0
                          : 1,
                    }
                  },
                  render: (_, record, qIndex) => {
                    const order = survey?.surveyQuestion.findIndex((item) => item.id === record.id)
                    return (
                      record?.type === "SINGLE_CHOICE" && (
                        <Form.Item
                          name={["responses", order, "surveyChoiceId"]}
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng chọn mức phản hồi",
                            },
                          ]}
                          style={{ marginBottom: 0 }}
                          className="w-full"
                        >
                          <Radio.Group className="w-full gap-x-2 flex">
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
              bordered={true}
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

          <Col span={24} className="my-6">
            <Flex justify="end">
              <Button onClick={() => onOk()} type="primary">
                Lưu
              </Button>
            </Flex>
          </Col>
        </Row>
      )}
    </Form>
  )
}

export default TakeTestPage
TakeTestPage.getLayout = function getLayout(page: React.ReactNode) {
  return <KhaoSatPrivateLayout headerName="Làm khảo sát">{page}</KhaoSatPrivateLayout>
}
