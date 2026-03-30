import FormItem from "@components/commons/form-item"
import Loading from "@components/commons/loading"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import KhaoSatLayout from "@layouts/khao-sat-layout"
import { cn, toRoman } from "@lib/utils"
import type { SurveySession } from "@workspace/db"
import { getPublicSurvey, useSavePublicSurvey, validateUserSurvey } from "@workspace/libs/api/exam"
import type { GetSurveyResult } from "@workspace/libs/api/schemas/getSurveyResult"
import { Button, Col, Flex, Form, Input, Modal, message, Radio, Row } from "antd"

import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import Confetti from "react-confetti"

type PutSurveySession = SurveySession & {
  responses: {
    surveyQuestionId: string
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

type PutUser = {
  code: string
}
type SurveyType = GetSurveyResult
function TakeTestPage() {
  const router = useRouter()
  const { showSpinner, hideSpinner } = useSpinner()
  const [startAt, setStartAt] = useState<Date>(new Date())
  const id = router.query.id as string
  // const surveyObjectTypeId = router.query.surveyObjectTypeId as string

  const [form] = Form.useForm<PutSurveySession>()
  const [formUser] = Form.useForm<PutUser>()
  const [survey, setSurvey] = useState<SurveyType>()
  const [isLoading, setIsLoading] = useState(true)
  const [anonymous, setAnonymous] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // const { data } =  useGetPublicSurvey(id)
  const { mutateAsync: createSavePublicSurvey } = useSavePublicSurvey()
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
  // const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

  // const handleChange = (questionId: string, value: any) => {
  //     const choice = survey?.surveyChoice.find((i) => i.id === value)
  //     if (choice?.requireExplanation) {
  //         setExpandedRowKeys((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]))
  //     }
  // }
  // const requireExplanation = useMemo(() => {
  //     return survey?.surveyChoice?.filter((i: any) => !!i?.requireExplanation).map((i) => i.id)
  // }, [survey])

  async function onOk() {
    const dataSubmit = form.getFieldsValue()
    console.log(dataSubmit)

    const studentCode = formUser.getFieldValue("code")

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
          studentCode,
          // surveyObjectTypeId: surveyObjectTypeId,
          responses: dataSubmit?.responses?.map((i, index) => {
            return {
              surveyQuestionId: survey?.surveyQuestion[index]?.id,
              surveyChoiceId: i.surveyChoiceId,
              explanation: i.explanation,
              answerText: i.answerText,
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
    const response = await getPublicSurvey(id)
    if (response?.status === 200) {
      if (!response?.data?.isPublic) {
        return
      }
      if (!response?.data?.anonymous) {
        setAnonymous(false)
        setIsOpen(true)
      }

      setSurvey(response?.data)
      setStartAt(new Date())
    } else {
      message.error(response?.data?.message)
    }
    setIsLoading(false)
  }

  const CheckUser = async () => {
    try {
      const studentCode = formUser.getFieldValue("code")
      const res = await validateUserSurvey({ studentCode })
      if (res.status === 200) {
        setAnonymous(true)
        setIsOpen(false)
      }
    } catch (error) {
      console.log(error)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

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
    <div>
      {anonymous && (
        <Form form={form} className="px-6 max-w-[1100px] w-full mx-auto">
          <div className="text-xl font-bold mb-4 text-center uppercase color-black">
            {survey?.name}
          </div>
          {survey?.lectureInfo && (
            <Row gutter={[0, 2]} className="mb-3 color-black">
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Tên giảng viên: </div>
                  <span>
                    {survey?.lectureInfo?.lastName || ""} {survey?.lectureInfo?.firstName || ""}
                  </span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Tên học phần: </div>
                  <span>
                    {survey?.subjectClass?.code || ""} {survey?.subjectClass?.name || ""}
                  </span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Khoa (Viện): </div>
                  <span>{survey?.lectureInfo?.organization || ""}</span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={6}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Bộ môn: </div>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={6}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Lớp: </div>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Ngày lấy ý kiến: </div>
                  {/* <span>{dayjs(new Date()).format('DD/MM/YYYY')}</span> */}
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Học kỳ: </div>
                  <span>{survey?.semester?.name || ""}</span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={24}>
                <div className="italic indent-8 mt-4">
                  Nhằm góp phần nâng cao chất lượng giảng dạy, phục vụ lợi ích của người học, Học
                  viện đề nghị Anh/Chị với tinh thần trách nhiệm và xây dựng , cho ý kiến về hoạt
                  động giảng dạy của giảng viên thông qua phiếu phản hồi này. Thông tin do Anh/Chị
                  cung cấp sẽ được Học viên bảo mật và xử lý đảm bảo không làm ảnh hưởng đến kết quả
                  học tập, rèn luyên của Anh/Chị
                </div>
              </Col>
              <Col span={24}>
                <div className="italic indent-8">
                  Đề nghị Anh/chị đánh xấu "X" vào các ô tương ứng với nội dung trong bảng câu hỏi
                  theo thang phản hồi
                </div>
              </Col>
            </Row>
          )}
          {!survey?.lectureInfo && (
            <Row gutter={[0, 2]} className="mb-3 color-black">
              <Col span={24}>
                <div className="italic indent-8 mt-4">
                  Để đóng góp phần tìm ra những giải pháp nhằm nâng cao chất lượng đào tạo của Học
                  viện đề nghị đồng chí (anh/chị) vui lòng điền đầy đủ thông tin trả lời các câu hỏi
                  dưới dây bằng cách đánh dấu "X" vào một ô phù hợp nhất trong mục "các phương án
                  trả lời".
                </div>
              </Col>
              <Col span={24}>
                <div className="italic indent-8">
                  Thông tin đồng chí (anh/chị) cung cấp sẽ được Học viện xử lý khách quan và bảo mật
                </div>
              </Col>
              <Col span={24}>
                <div className="indent-8 uppercase font-bold">I. Thông tin chung</div>
              </Col>
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Chuyên ngành: </div>
                  <span>
                    {survey?.lectureInfo?.lastName || ""} {survey?.lectureInfo?.firstName || ""}
                  </span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Khoa (Viện): </div>
                  <span>
                    {survey?.lectureInfo?.lastName || ""} {survey?.lectureInfo?.firstName || ""}
                  </span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Lớp: </div>
                  <span>
                    {survey?.lectureInfo?.lastName || ""} {survey?.lectureInfo?.firstName || ""}
                  </span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Khoá: </div>
                  <span>
                    {survey?.lectureInfo?.lastName || ""} {survey?.lectureInfo?.firstName || ""}
                  </span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>
              <Col span={24}>
                <div className="flex items-end">
                  <div className="!w-fit whitespace-nowrap">Đối tượng đào tạo: </div>
                  <span>
                    {survey?.lectureInfo?.lastName || ""} {survey?.lectureInfo?.firstName || ""}
                  </span>
                  {/* <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" /> */}
                </div>
              </Col>

              <div className="indent-8 uppercase font-bold">II. Nội dung đánh giá</div>
            </Row>
          )}

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
                        const order = survey?.surveyQuestion.findIndex(
                          (item) => item.id === record.id
                        )
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
                        const order = survey?.surveyQuestion.findIndex(
                          (item) => item.id === record.id
                        )
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
      )}
      <Modal
        title={`Khảo sát ${survey?.name}`}
        open={isOpen}
        className={"w-[500px]"}
        okText="Đồng ý"
        cancelText="Hủy"
        onCancel={() => setIsOpen(false)}
        onOk={formUser.submit}
        maskClosable={false}
      >
        <div className="flex gap-4 justify-between">
          <Form
            form={formUser}
            onFinish={CheckUser}
            layout="vertical"
            className={cn("mt-4", "w-full")}
          >
            <Col span={24}>
              <FormItem form={formUser} name={"code"} label="Mã học viên" required>
                <Input placeholder="Mã học viên" />
              </FormItem>
            </Col>
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default TakeTestPage
TakeTestPage.getLayout = function getLayout(page: React.ReactNode) {
  return <KhaoSatLayout>{page}</KhaoSatLayout>
}
