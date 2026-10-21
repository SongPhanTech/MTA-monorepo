import Table from "@components/commons/table"
import { validateExamScore } from "@lib/utils"
import { kythiStore } from "@pages/quan-ly-diem/nhap-diem-theo-phach"
import { useStore } from "@tanstack/react-store"
import {
  useFindManyExamPaper,
  useFindManySubjectClass,
  useUpdateManySubjectClass,
} from "@workspace/db/hooks"
import { getUrl } from "@workspace/libs/api/custom-instance"
import { getExportSubjectClassScoreUrl, useSaveExamScore } from "@workspace/libs/api/training"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { Badge, Button, Col, Flex, Form, Input, InputNumber, Modal, message } from "antd"
import { Printer } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function NhapDiemPhach() {
  const [form] = Form.useForm<{ list: Record<string, { score: number | null }> }>()
  const { examId, subjectClassId } = useStore(kythiStore)
  const { data: examPapers = [], refetch } = useFindManyExamPaper(
    {
      where: {
        examList: { examRoom: { examId } },
        studentSubjectScore: {
          suspended: false,
          examBanned: false,
          examPostponed: false,
          OR: [
            {
              attendanceScore: { not: null },
              midtermScore: { not: null },
              subjectVersion: { onePoint: false },
            },
            {
              subjectVersion: { onePoint: true },
            },
          ],
        },
      },
      include: {
        examList: {
          select: {
            lockExamCode: true,
          },
        },
        studentSubjectScore: {
          select: {
            examScore: true,
          },
        },
      },
      orderBy: {
        examCode: "asc",
      },
    },
    { enabled: !!examId, refetchOnWindowFocus: false }
  )

  const { data: subjectClasses = [] } = useFindManySubjectClass(
    {
      where: { id: { in: subjectClassId } },
      select: { isLockExamScore: true },
    },
    { enabled: !!examId }
  )

  const isLockExamScore = useMemo(() => {
    return subjectClasses.some((s) => s.isLockExamScore)
  }, [subjectClasses])

  const isLockExamCode = useMemo(() => {
    return examPapers.length > 0 && examPapers.every((p) => p?.examList?.lockExamCode)
  }, [examPapers])

  const { onOpen: openXemTaiLieu } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
    mode?: "view" | "edit"
    convertTo?: string
  }>({
    tag: "XemTaiLieu",
  })

  useEffect(() => {
    if (examPapers) {
      form.setFieldsValue({
        list: examPapers.reduce(
          (acc, curr) => {
            acc[curr.id] = {
              score: curr.studentSubjectScore?.examScore ?? null,
            }
            return acc
          },
          {} as Record<string, { score: number | null }>
        ),
      })
    }
  }, [examPapers, form])

  const handleSave = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn lưu điểm không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        handleNhapDiem()
      },
    })
  }

  const { mutateAsync: saveScore } = useSaveExamScore()
  const { mutateAsync: updateManySubjectClass } = useUpdateManySubjectClass()
  // const listForm = Form.useWatch('list', form) || []
  const handleNhapDiem = async () => {
    const dataForm = form.getFieldsValue()

    const dataSubmit: { score: number | null; id: string }[] = []
    for (const [key, { score }] of Object.entries(dataForm.list)) {
      try {
        await validateExamScore(score)
      } catch (_) {
        message.warning("Vui lòng kiểm tra lại điểm")
        return
      }
      dataSubmit.push({
        id: key,
        score,
      })
    }
    const res = await saveScore({
      data: dataSubmit,
    })
    if (res?.status === 200) {
      message.success("Lưu điểm thành công")
      refetch()
    }
  }

  const handlePrint = async () => {
    if (!!subjectClassId && subjectClassId?.length > 0) {
      updateManySubjectClass({
        where: { id: { in: subjectClassId } },
        data: {
          isLockExamScore: true,
        },
      })
    }
  }

  return (
    <div className="max-w-screen-sm">
      <Col span={24}>
        <Flex justify="space-between" align="center">
          <Badge
            status={isLockExamCode ? "success" : "error"}
            text={
              isLockExamScore
                ? "P13 đã khoá điểm"
                : isLockExamCode
                  ? "Đã khoá phách - Cho phép nhập điểm"
                  : "Chưa khoá phách - Không thể nhập điểm"
            }
          />
          <Flex gap={8}>
            <Button
              onClick={async () => {
                await handlePrint()
                openXemTaiLieu({
                  uri: getUrl(
                    getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") ||
                      "https://api.daotao.mta.swantech.vn",
                    `${getExportSubjectClassScoreUrl({
                      examId: examId,
                      type: "KEM-PHACH",
                    })}`
                  ),
                  name: "Điểm kèm phách",
                  mimeType: "xlsx",
                  convertTo: "pdf",
                })
              }}
            >
              <Printer />
              In phiếu điểm kèm phách
            </Button>
            <Button
              type="primary"
              disabled={!isLockExamCode}
              onClick={() => {
                handleSave()
              }}
            >
              Lưu
            </Button>
          </Flex>
        </Flex>
      </Col>
      <Col span={24}>
        <Form form={form}>
          <Form.Item name="list">
            <Table
              rowKey="id"
              columns={[
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Phách",
                  dataIndex: "name",
                  width: 150,
                  align: "center",
                  fixed: "left",
                  render: (_, record: any) => record?.examCode || "",
                },
                {
                  title: "Điểm",
                  align: "center",
                  fixed: "left",
                  render: (_, record) => {
                    return (
                      <Form.Item
                        className="w-full mb-0"
                        name={["list", record.id, "score"]}
                        label=""
                        rules={[
                          {
                            validator: (_, value) => validateExamScore(value),
                          },
                        ]}
                      >
                        <InputNumber
                          keyboard={false}
                          style={{ width: "100%" }}
                          step={0.1}
                          controls={false}
                          disabled={isLockExamScore || !isLockExamCode}
                          parser={(value) => {
                            if (!value) return ""
                            const num = Number(value)
                            if (Number.isNaN(num)) return ""
                            return num > 10 ? Number((num / 10).toFixedSmart(2)) : num
                          }}
                          formatter={(value) => {
                            if (!value) return ""
                            const num = Number(value)
                            if (Number.isNaN(num)) return ""
                            return num > 10 ? (num / 10).toFixedSmart(2) : num.toString()
                          }}
                          className="score-input"
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                              e.preventDefault()
                              const inputs = document.querySelectorAll(".score-input input")

                              const inputsArray = Array.from(inputs)
                              const currentIndex = inputsArray.indexOf(e.target as Element)

                              if (e.key === "ArrowUp" && currentIndex > 0) {
                                ;(inputsArray[currentIndex - 1] as HTMLInputElement).focus()
                              } else if (
                                e.key === "ArrowDown" &&
                                currentIndex < inputsArray.length - 1
                              ) {
                                ;(inputsArray[currentIndex + 1] as HTMLInputElement).focus()
                              }
                            }
                          }}
                        />
                      </Form.Item>
                    )
                  },
                },
              ]}
              maxHeight={"calc(100vh - 390px)"}
              data={examPapers}
              pagination={false}
            />
          </Form.Item>
        </Form>
      </Col>
    </div>
  )
}
