import Table from "@components/commons/table"
import { validateExamScore } from "@lib/utils"
import { kythiStore } from "@pages/quan-ly-diem/nhap-diem-theo-phach"
import { useStore } from "@tanstack/react-store"
import { useFindManyExamPaper, useUpdateSubjectClass } from "@workspace/db/hooks"
import { getUrl } from "@workspace/libs/api/custom-instance"
import { getExportSubjectClassScoreUrl, useSaveExamScore } from "@workspace/libs/api/training"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { Badge, Button, Col, Flex, Form, InputNumber, Modal, message } from "antd"
import { Printer } from "lucide-react"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { sqlTransaction } from "@workspace/libs/api/model"

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
              attendanceScore: {
                not: null,
              },
              midtermScore: {
                not: null,
              },
              subjectVersion: {
                onePoint: false,
              },
            },
            {
              subjectVersion: {
                onePoint: true,
              },
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
          include: {
            student: {
              include: {
                userProfile: true,
                fixedClass: true,
              },
            },
            subjectClass: {
              include: {
                fixedClasses: {
                  include: {
                    trainingCourse: true,
                  },
                },
              },
            },
            subjectVersion: true,
          },
        },
      },
      orderBy: {
        examCode: "asc",
      },
    },
    { enabled: !!examId }
  )

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
  const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
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
    try {
      if (!!subjectClassId && subjectClassId?.length > 0) {
        let list: any = subjectClassId.map((i) => {
          return {
            model: "SubjectClass",
            operation: "update",
            data: {
              where: {
                id: i,
              },
              data: {
                isLockExamScore: true,
              },
            },
          }
        })
        let res = await sqlTransaction(list)
      }
    } catch (_) {
      message.warning("Vui lòng kiểm tra lại điểm")
      return
    }
  }

  const isAllLocked = examPapers.length > 0 && examPapers.every((p) => p?.examList?.lockExamCode)

  return (
    <div className="max-w-screen-sm">
      <Col span={24}>
        <Flex justify="space-between" align="center">
          <Badge
            status={isAllLocked ? "success" : "error"}
            text={
              isAllLocked
                ? "Đã khóa phách - Cho phép nhập điểm"
                : "Chưa khóa phách - Không thể nhập điểm"
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
              disabled={!isAllLocked}
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
                          style={{ width: "100%" }}
                          step={0.1}
                          controls={false}
                          disabled={!(record as any)?.examList?.lockExamCode}
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
