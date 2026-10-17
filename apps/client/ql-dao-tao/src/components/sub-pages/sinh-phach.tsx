import { ClearOutlined, DeleteOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import { examSuspendedReason } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { formatDate } from "@lib/utils"
import { kythiStore } from "@pages/quan-ly-diem/nhap-diem-theo-phach"
import { useStore } from "@tanstack/react-store"
import {
  useFindManyExamPaper,
  useFindManyExamRoom,
  useFindManyExamList,
  useUpdateManyExamList,
  useUpdateManySubjectClass,
  useUpdateManyExamPaper,
} from "@workspace/db/hooks"
import { getUrl } from "@workspace/libs/api/custom-instance"
import { sqlTransaction } from "@workspace/libs/api/model"
import type { SqlTransactionBodyItem } from "@workspace/libs/api/schemas"
import { getExportSubjectClassScoreUrl, useGenExamListCode } from "@workspace/libs/api/training"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { cn } from "@workspace/ui/lib/utils"
import {
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Flex,
  Form,
  Input,
  Modal,
  message,
  Select,
  Tooltip,
} from "antd"
import { Printer } from "lucide-react"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface StudentExamFormType {
  list: Record<
    string,
    {
      suspended?: boolean
      suspendedReason?: string
      description?: string
      isEdit: boolean
    }
  >
}

export default function SinhPhach() {
  const { examId } = useStore(kythiStore)
  const [form] = Form.useForm<StudentExamFormType>()

  const listForm = Form.useWatch("list", form) || []

  const { data: examRooms = [], refetch } = useFindManyExamRoom(
    {
      where: { examId },
      include: {
        examList: {
          select: {
            lockExamCode: true,
          },
        },
      },
    },
    { enabled: !!examId }
  )

  const { data: examPapers = [], refetch: refreshExamPaper } = useFindManyExamPaper(
    {
      where: {
        examList: {
          examRoom: {
            examId,
            roomId: { not: null },
          },
        },
      },
      select: {
        id: true,
        examCode: true,
        studentSubjectScoreId: true,
        studentSubjectScore: {
          select: {
            attendanceScore: true,
            midtermScore: true,
            examScore: true,
            suspended: true,
            suspendedReason: true,
            description: true,
            student: {
              select: {
                userProfile: {
                  select: {
                    code: true,
                    fullname: true,
                    dateOfBirth: true,
                  },
                },
                fixedClass: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          studentSubjectScore: {
            student: {
              userProfile: {
                firstName: "asc",
              },
            },
          },
        },
        {
          studentSubjectScore: {
            student: {
              userProfile: {
                lastName: "asc",
              },
            },
          },
        },
      ],
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

  const lockExamCode = examRooms.every((er) => er.examList.every((el) => el.lockExamCode))

  const handleSave = () => {
    const isScored = examPapers.some((p) => p.studentSubjectScore.examScore !== null)
    if (isScored) {
      message.error("Phách đã được nhập điểm")
      return
    }
    Modal.confirm({
      title: "Xác nhận",
      content: isScored
        ? "Phách đã được nhập điểm, bạn có chắc chắn muốn sinh phách lại không?"
        : "Bạn có chắc chắn muốn sinh phách không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        handleGenCode()
      },
    })
  }
  const { mutateAsync: updateManyExamList } = useUpdateManyExamList()
  const { mutateAsync: updateManyExamPaper } = useUpdateManyExamPaper()
  const { mutateAsync: genCode } = useGenExamListCode()
  const { mutateAsync: updateManySubjectClass } = useUpdateManySubjectClass()

  const handleGenCode = async () => {
    const res = await genCode({
      data: { examId: examId ?? "" },
    })
    if (res?.status === 200) {
      message.success("Sinh phách thành công")
    } else {
      message.error(res.data.message)
    }
    refetch()
    refreshExamPaper()
  }

  const { showSpinner, hideSpinner } = useSpinner()

  useEffect(() => {
    if (examId) {
      form.setFieldsValue({
        list: examPapers.reduce(
          (acc, cur) => {
            acc[cur.studentSubjectScoreId] = {
              suspended: cur?.studentSubjectScore?.suspended ?? false,
              suspendedReason: cur?.studentSubjectScore?.suspendedReason ?? undefined,
              description: cur?.studentSubjectScore?.description ?? undefined,
              isEdit: false,
            }
            return acc
          },
          {} as StudentExamFormType["list"]
        ),
      })
    }
  }, [examId, examPapers, form])

  const handleSaveExamSuspended = async () => {
    try {
      showSpinner()
      const values = form.getFieldsValue()
      const valueListObject = Object.entries(values.list).map(([key, value_]) => {
        return {
          id: key,
          ...value_,
        }
      })

      const filteredValues = valueListObject.filter((item) => item.isEdit)

      const updateTransactions: SqlTransactionBodyItem[] = filteredValues.map((i) => ({
        model: "StudentSubjectScore",
        operation: "update",
        data: {
          where: {
            id: i.id,
          },
          data: {
            suspended: i.suspended ?? false,
            suspendedReason: i.suspended ? i.suspendedReason || null : null,
          },
        },
      }))
      const res = await sqlTransaction(updateTransactions)
      if (res.status === 200) {
        message.success("Cập nhật thành công")
      }
      refetch()
      refreshExamPaper()
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra, vui lòng thử lại sau!")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Col span={24}>
        <Flex justify="space-between" align="center">
          <Flex justify="end" align="center" gap={8}>
            <Button
              icon={<ClearOutlined />}
              danger
              disabled={lockExamCode}
              onClick={async () => {
                await updateManyExamPaper({
                  where: { examList: { examRoom: { examId } } },
                  data: { examCode: null },
                })
                await updateManyExamList({
                  where: { examRoom: { examId } },
                  data: { createdExamCode: false },
                })
              }}
            >
              Tẩy phách
            </Button>
            <Checkbox
              onChange={async (e) => {
                await updateManyExamList({
                  where: { examRoom: { examId } },
                  data: { lockExamCode: e.target.checked },
                })
                await updateManySubjectClass({
                  where: { exam: { examRooms: { some: { examList: { some: { id: examId } } } } } },
                  data: { isLockExamScore: e.target.checked },
                })
              }}
              checked={lockExamCode}
            >
              Khoá sinh phách
            </Checkbox>
          </Flex>
          <Flex justify="end" align="center" gap={8}>
            <AddExamPaperModal
              examId={examId ?? ""}
              lockExamCode={lockExamCode}
              onSuccess={() => {
                refetch()
                refreshExamPaper()
              }}
            />
            <Button
              type="primary"
              className="bg-orange-500"
              disabled={lockExamCode}
              onClick={handleSaveExamSuspended}
            >
              Lưu đình chỉ thi
            </Button>
            <Button
              type="primary"
              onClick={() => {
                handleSave()
              }}
              disabled={lockExamCode}
            >
              Tạo phách
            </Button>
            <Button
              onClick={() => {
                openXemTaiLieu({
                  uri: getUrl(
                    getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") ||
                      "https://api.daotao.mta.swantech.vn",
                    `${getExportSubjectClassScoreUrl({
                      examId: examId,
                      type: "DANH-SACH-PHACH",
                    })}`
                  ),
                  name: "Danh sách phách",
                  mimeType: "xlsx",
                  convertTo: "pdf",
                })
              }}
            >
              <Printer />
              In phách
            </Button>
          </Flex>
        </Flex>
      </Col>
      <Col span={24}>
        <Form
          form={form}
          initialValues={{ list: {} }}
          onValuesChange={(changedValue) => {
            const key = Object.keys(changedValue.list)?.[0]

            form.setFieldValue(["list", key, "isEdit"], true)
          }}
        >
          <Form.Item hidden name={"list"} />
          <Table
            rowKey="studentSubjectScoreId"
            onRow={(record) => {
              return {
                className: cn(listForm?.[record.studentSubjectScoreId]?.isEdit && "bg-yellow-100"),
              }
            }}
            columns={[
              {
                title: "STT",
                width: 40,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "name",
                align: "center",
                width: 150,
                render: (_, record) =>
                  record?.studentSubjectScore?.student?.userProfile?.code || "",
              },
              {
                title: "Tên thí sinh",
                dataIndex: "fullname",
                render: (_, record) =>
                  record?.studentSubjectScore?.student?.userProfile?.fullname || "không rõ",
              },
              {
                title: "Ngày sinh",
                width: 110,
                align: "center",
                render: (_, record) => {
                  const dateOfBirth = record?.studentSubjectScore?.student?.userProfile?.dateOfBirth
                  return dateOfBirth ? formatDate(dateOfBirth) : ""
                },
              },
              {
                title: "Lớp",
                width: 120,
                align: "center",
                render: (_, record) => {
                  const fixedClass = record?.studentSubjectScore?.student?.fixedClass
                  if (!fixedClass?.code) return ""
                  return <Tooltip title={fixedClass.name}>{fixedClass.code}</Tooltip>
                },
              },
              {
                title: "Điểm TX",
                width: 70,
                align: "center",
                render: (_, record) => record?.studentSubjectScore?.attendanceScore ?? "",
              },
              {
                title: "Điểm ĐK",
                align: "center",
                width: 70,
                render: (_, record) => record?.studentSubjectScore?.midtermScore ?? "",
              },
              {
                title: "Điểm thi",
                align: "center",
                width: 70,
                render: (_, record) => record?.studentSubjectScore?.examScore ?? "",
              },
              {
                title: "Phách",
                dataIndex: "name",
                width: 100,
                align: "center",
                render: (_, record) => record?.examCode || "",
              },
              {
                title: "Đình chỉ thi",
                align: "center",
                width: 100,
                render: (_, record) => {
                  return (
                    <>
                      <Form.Item
                        className="w-full mb-0"
                        name={["list", record.studentSubjectScoreId, "suspended"]}
                        label=""
                        valuePropName="checked"
                      >
                        <Checkbox
                          disabled={lockExamCode}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              form.setFieldValue(
                                ["list", record.studentSubjectScoreId, "suspendedReason"],
                                undefined
                              )
                            }
                          }}
                        />
                      </Form.Item>
                      <Form.Item name={["list", record.studentSubjectScoreId, "isEdit"]} hidden />
                    </>
                  )
                },
              },
              {
                title: "Lý do đình chỉ thi",
                render: (_, record) => {
                  const suspended = listForm[record.studentSubjectScoreId]?.suspended
                  return (
                    <Form.Item
                      name={["list", record.studentSubjectScoreId, "suspendedReason"]}
                      className="m-0"
                    >
                      {!suspended ? (
                        <Input.TextArea autoSize readOnly variant="underlined" />
                      ) : (
                        <AutoComplete
                          placeholder="Nhập lý do đình chỉ thi"
                          options={examSuspendedReason.map((s) => ({
                            label: s,
                            value: s,
                          }))}
                          styles={{ popup: { root: { width: "fit" } } }}
                          disabled={!suspended}
                        >
                          <Input.TextArea autoSize readOnly variant="underlined" />
                        </AutoComplete>
                      )}
                    </Form.Item>
                  )
                },
              },
              {
                title: "Ghi chú",
                render: (_, record) => {
                  return (
                    <Form.Item
                      className="w-full mb-0"
                      name={["list", record.studentSubjectScoreId, "description"]}
                      label=""
                    >
                      <Input.TextArea autoSize variant="underlined" placeholder="Nhập ghi chú" />
                    </Form.Item>
                  )
                },
              },
            ]}
            scrollable
            maxHeight={"calc(100vh - 390px)"}
            data={examPapers}
            pagination={false}
          />
        </Form>
      </Col>
    </div>
  )
}

function AddExamPaperModal({
  examId,
  lockExamCode,
  onSuccess,
}: {
  examId: string
  lockExamCode: boolean
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedExamListId, setSelectedExamListId] = useState<string>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const { data: examPapers = [], refetch: refetchPapers } = useFindManyExamPaper(
    {
      where: {
        examList: {
          examRoom: {
            examId,
            roomId: null,
          },
        },
      },
      select: {
        id: true,
        studentSubjectScoreId: true,
        studentSubjectScore: {
          select: {
            examBanned: true,
            examBannedReason: true,
            examPostponed: true,
            examPostponedReason: true,
            student: {
              select: {
                userProfile: {
                  select: {
                    code: true,
                    fullname: true,
                    dateOfBirth: true,
                    gender: { select: { sTen: true } },
                  },
                },
              },
            },
          },
        },
      },
    },
    { enabled: open && !!examId }
  )

  const { data: examLists = [] } = useFindManyExamList(
    {
      where: {
        examRoom: { examId, roomId: { not: null } },
      },
      include: {
        examRoom: {
          include: { room: true },
        },
      },
    },
    { enabled: open && !!examId }
  )

  const { showSpinner, hideSpinner } = useSpinner()

  const handleSave = async () => {
    if (!selectedExamListId || selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn danh sách thi và ít nhất một thí sinh")
      return
    }

    const selectedPapers = examPapers.filter((p) => selectedRowKeys.includes(p.id))
    const hasBannedOrPostponed = selectedPapers.some(
      (p) => p.studentSubjectScore?.examBanned || p.studentSubjectScore?.examPostponed
    )

    if (hasBannedOrPostponed) {
      Modal.confirm({
        title: "Xác nhận",
        content:
          "Trong danh sách chọn có thí sinh đang bị cấm thi hoặc hoãn thi. Việc thêm vào danh sách thi sẽ tự động huỷ cấm thi/hoãn thi cho các thí sinh này. Bạn có chắc chắn tiếp tục?",
        onOk: () => performSave(selectedPapers),
      })
    } else {
      performSave(selectedPapers)
    }
  }

  const performSave = async (selectedPapers: any[]) => {
    try {
      showSpinner()
      const updateTransactions: SqlTransactionBodyItem[] = []

      selectedPapers.forEach((paper) => {
        const oldReason =
          paper.studentSubjectScore?.examBannedReason ||
          paper.studentSubjectScore?.examPostponedReason
        const updateDescription = `P13 bổ sung DS thi${oldReason ? ` (HUỶ: ${oldReason})` : ""}`

        updateTransactions.push({
          model: "StudentSubjectScore",
          operation: "update",
          data: {
            where: { id: paper.studentSubjectScoreId },
            data: {
              examBanned: false,
              examBannedReason: null,
              examPostponed: false,
              examPostponedReason: null,
              description: updateDescription,
            },
          },
        })

        updateTransactions.push({
          model: "ExamPaper",
          operation: "update",
          data: {
            where: { id: paper.id },
            data: { examListId: selectedExamListId, description: updateDescription },
          },
        })
      })

      const res = await sqlTransaction(updateTransactions)
      if (res.status === 200) {
        message.success("Bổ sung thí sinh thành công")
        setOpen(false)
        setSelectedRowKeys([])
        setSelectedExamListId(undefined)
        refetchPapers()
        onSuccess()
      }
    } catch (e: any) {
      message.error(e.message || "Có lỗi xảy ra, vui lòng thử lại sau!")
    } finally {
      hideSpinner()
    }
  }

  return (
    <>
      <Button disabled={lockExamCode} onClick={() => setOpen(true)}>
        Bổ sung thí sinh
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        title="Bổ sung thí sinh vào danh sách thi"
        width={1000}
      >
        <Flex vertical gap={16} className="mt-4">
          <Flex align="center" gap={8}>
            <span className="whitespace-nowrap font-medium">Danh sách thi:</span>
            <Select
              className="w-64"
              value={selectedExamListId}
              onChange={setSelectedExamListId}
              placeholder="Chọn danh sách thi"
              options={examLists.map((el) => ({
                label: `${el.examRoom?.room?.name || "Không rõ"} (Ca ${el.start})`,
                value: el.id,
              }))}
            />
          </Flex>

          <Table
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Mã sinh viên",
                dataIndex: ["studentSubjectScore", "student", "userProfile", "code"],
              },
              {
                title: "Họ và tên",
                dataIndex: ["studentSubjectScore", "student", "userProfile", "fullname"],
              },
              {
                title: "Giới tính",
                render: (_, record) => {
                  return record.studentSubjectScore?.student?.userProfile?.gender.sTen
                },
              },
              {
                title: "Ngày sinh",
                render: (_, record) => {
                  return (
                    record.studentSubjectScore?.student?.userProfile?.dateOfBirth &&
                    record.studentSubjectScore?.student?.userProfile?.dateOfBirth?.toLocaleDateString(
                      "vi-VN"
                    )
                  )
                },
              },
              {
                title: "Cấm thi",
                align: "center",
                width: 80,
                render: (_, record) => (record.studentSubjectScore?.examBanned ? "✅" : ""),
              },
              {
                title: "Lý do cấm thi",
                render: (_, record) => record.studentSubjectScore?.examBannedReason,
              },
              {
                title: "Hoãn thi",
                align: "center",
                width: 80,
                render: (_, record) => (record.studentSubjectScore?.examPostponed ? "✅" : ""),
              },
              {
                title: "Lý do hoãn thi",
                render: (_, record) => record.studentSubjectScore?.examPostponedReason,
              },
            ]}
            data={examPapers}
            pagination={{ hideOnSinglePage: true }}
            maxHeight={400}
          />
        </Flex>
      </Modal>
    </>
  )
}
