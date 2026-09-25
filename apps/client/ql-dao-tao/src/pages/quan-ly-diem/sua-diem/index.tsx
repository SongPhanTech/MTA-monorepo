import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import { validateExamScore, validateScore } from "@lib/utils"
import type { ScoreCorrectionStatus, ScoreCorrectionTicket } from "@workspace/db"
import {
  useCountScoreCorrectionTicket, // Add this
  useCreateScoreCorrectionItem,
  useCreateScoreCorrectionTicket,
  useDeleteScoreCorrectionItem,
  useFindManyFixedClass,
  useFindManyScoreCorrectionItem,
  useFindManyScoreCorrectionTicket,
  useFindManyStudent,
  useFindManyStudentSubjectScore,
  useFindManyTrainingObjectType,
  useFindUniqueScoreCorrectionTicket,
  useUpdateScoreCorrectionItem,
  useUpdateScoreCorrectionTicket,
} from "@workspace/db/hooks"
import { useApproveScoreCorrection } from "@workspace/libs/api/training"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { SelectTrainingCourse, useTrainingObjectTypeStore } from "@workspace/ui"
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
} from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

const SCORE_CORRECTION_STATUS_MAP = {
  INITIALIZED: { text: "Khởi tạo", color: "default" },
  PENDING_APPROVAL: { text: "Chờ duyệt", color: "processing" },
  APPROVED: { text: "Đã duyệt", color: "success" },
  // REJECTED: { text: 'Từ chối', color: 'error' },
}

export default function QuanLySuaDiem() {
  return (
    <Card title="Quản lý sửa điểm">
      <TicketList />
    </Card>
  )
}

function TicketList() {
  const { can, canSome } = useAbility()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [filters, setFilters] = useState<FilterProps>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATE_SIZE)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const where = {
    trainingObjectType: {
      id: trainingObjectTypeId,
    },
    proposal: filters.proposal
      ? { contains: filters.proposal, mode: "insensitive" as const }
      : undefined,
    decision: filters.decisionNo
      ? { contains: filters.decisionNo, mode: "insensitive" as const }
      : undefined,
    status: filters.scoreCorrectionStatus
      ? {
          in: Array.isArray(filters.scoreCorrectionStatus)
            ? filters.scoreCorrectionStatus
            : [filters.scoreCorrectionStatus],
        }
      : undefined,
  }

  const { data: tickets = [], refetch } = useFindManyScoreCorrectionTicket({
    where,
    include: {
      trainingObjectType: true,
      items: true,
    },
    orderBy: {
      date: "desc",
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  const { data: total } = useCountScoreCorrectionTicket({ where })
  const { mutateAsync: approveTicket } = useApproveScoreCorrection()

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM, "THEM") && (
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Tạo phiếu
          </Button>
        )}
      </div>
      <Table
        filters={filters}
        setFilters={(newFilters) => {
          setFilters(newFilters)
          setCurrentPage(1)
        }}
        dataSource={tickets}
        columns={[
          {
            title: "Đối tượng đào tạo",
            align: "center",
            dataIndex: ["trainingObjectType", "name"],
            key: "trainingObjectType",
            width: 200,
          },
          {
            title: "Tờ trình",
            align: "center",
            dataIndex: "proposal",
            key: "proposal",
            type: "input",
            width: 200,
          },
          {
            title: "Số quyết định",
            align: "center",
            dataIndex: "decisionNo",
            key: "decisionNo",
            type: "input",
            width: 200,
            render: (value: string, record) => {
              return record.decision
            },
          },
          {
            title: "Ngày",
            align: "center",
            dataIndex: "date",
            key: "date",
            width: 200,
            render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
          },
          {
            title: "Hạn nhập",
            align: "center",
            dataIndex: "deadline",
            key: "deadline",
            width: 200,
            render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-"),
          },
          {
            title: "SL",
            align: "center",
            key: "count",
            width: 200,
            render: (_: any, record: any) => `${record.items?.length || 0}/${record.number || 0}`,
          },
          {
            title: "Trạng thái",
            align: "center",
            dataIndex: "scoreCorrectionStatus",
            key: "status",
            type: "select",
            width: 150,
            options: Object.entries(SCORE_CORRECTION_STATUS_MAP).map(([key, value]) => ({
              label: value.text,
              value: key,
            })),
            render: (_, record) => {
              const status = record.status as keyof typeof SCORE_CORRECTION_STATUS_MAP
              const { text, color } = SCORE_CORRECTION_STATUS_MAP[status] || {
                text: status,
                color: "default",
              }
              return <Tag color={color}>{text}</Tag>
            },
          },
          {
            title: "Thao tác",
            align: "center",
            key: "action",
            width: 200,
            render: (_: any, record: any) => (
              <Space>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM, "XEM_CHI_TIET") && (
                  <Button type="link" onClick={() => setSelectedTicketId(record.id)}>
                    Chi tiết
                  </Button>
                )}
                {record.status === "PENDING_APPROVAL" &&
                  can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM, "DUYET") && (
                    <Popconfirm
                      title="Bạn có chắc chắn muốn duyệt phiếu này?"
                      onConfirm={async () => {
                        // Validation
                        if (
                          !record.proposal ||
                          !record.decision ||
                          !record.date ||
                          !record.number
                        ) {
                          message.error("Thông tin phiếu chưa đầy đủ")
                          return
                        }
                        // Note: record.items might not have full details if not fetched.
                        // But useFindManyScoreCorrectionTicket includes items: true.
                        if (!record.items || record.items.length === 0) {
                          message.error("Phiếu chưa có sinh viên")
                          return
                        }
                        // Check items
                        const invalidItems = record.items.some(
                          (item: any) =>
                            item.newAttendanceScore === null ||
                            item.newAttendanceScore === undefined ||
                            item.newMidtermScore === null ||
                            item.newMidtermScore === undefined ||
                            item.newExamScore === null ||
                            item.newExamScore === undefined
                        )

                        if (invalidItems) {
                          message.error("Thông tin điểm mới của các sinh viên chưa đầy đủ")
                          return
                        }

                        try {
                          const res = await approveTicket({
                            data: {
                              ticketId: record.id,
                            },
                          })
                          if (res.status === 200) {
                            message.success(res.data.message)
                            refetch()
                          } else {
                            message.error(res.data.message)
                          }
                        } catch (e: any) {
                          message.error(e.message || "Lỗi khi duyệt phiếu")
                        }
                      }}
                    >
                      <Button type="primary" size="small">
                        Duyệt
                      </Button>
                    </Popconfirm>
                  )}
              </Space>
            ),
          },
        ]}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: (page, size) => {
            setCurrentPage(page)
            setPageSize(size)
          },
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
        }}
      />
      <TicketModal
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
        }}
      />
      {selectedTicketId && (
        <TicketDetailDrawer
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          can={can}
        />
      )}
    </div>
  )
}

function TicketModal({
  open,
  ticket,
  onCancel,
  onSuccess,
}: {
  open: boolean
  ticket?: ScoreCorrectionTicket | undefined
  onCancel: () => void
  onSuccess: () => void
}) {
  const isUpdate = !!ticket

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const [form] = Form.useForm()
  const { mutateAsync: createTicket } = useCreateScoreCorrectionTicket()
  const { mutateAsync: updateTicket } = useUpdateScoreCorrectionTicket()
  const { data: trainingObjectTypes } = useFindManyTrainingObjectType({})

  useEffect(() => {
    if (open) {
      if (isUpdate && ticket) {
        form.setFieldsValue({
          ...ticket,
          date: ticket.date ? dayjs(ticket.date) : undefined,
          deadline: ticket.deadline ? dayjs(ticket.deadline) : undefined,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          trainingObjectTypeId,
          date: dayjs(),
        })
      }
    }
  }, [ticket, open, trainingObjectTypeId, form, isUpdate])

  const onFinish = async (values: any) => {
    try {
      if (isUpdate) {
        await updateTicket({
          where: { id: ticket?.id },
          data: {
            ...values,
            date: values.date ? values.date.toISOString() : undefined,
            deadline: values.deadline ? values.deadline.toISOString() : undefined,
          },
        })
        message.success("Cập nhật phiếu thành công")
      } else {
        await createTicket({
          data: {
            ...values,
            date: values.date ? values.date.toISOString() : new Date().toISOString(),
            deadline: values.deadline ? values.deadline.toISOString() : undefined,
            status: "INITIALIZED",
          },
        })
        message.success("Tạo phiếu thành công")
      }
      onSuccess()
    } catch (error) {
      message.error("Có lỗi xảy ra")
    }
  }

  return (
    <Modal
      title={isUpdate ? "Cập nhật phiếu sửa điểm" : "Tạo phiếu sửa điểm"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={isUpdate && ticket?.status === "APPROVED"}
      >
        {!isUpdate && (
          <Form.Item
            name="trainingObjectTypeId"
            label="Đối tượng đào tạo"
            rules={[{ required: true, message: "Vui lòng chọn đối tượng đào tạo" }]}
          >
            <Select
              placeholder="Chọn đối tượng đào tạo"
              disabled
              options={trainingObjectTypes?.map((type) => ({
                label: type.name,
                value: type.id,
              }))}
            />
          </Form.Item>
        )}
        <Form.Item name="number" label="Số lượng (dự kiến)" required>
          <InputNumber
            min={1}
            className="w-full"
            disabled={isUpdate && ticket?.status !== "INITIALIZED"}
          />
        </Form.Item>
        <Form.Item name="deadline" label="Hạn nhập" required>
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="proposal" label="Tờ trình">
          <Input />
        </Form.Item>
        <Form.Item name="decision" label="Số quyết định">
          <Input />
        </Form.Item>
        <Form.Item name="date" label="Ngày" initialValue={!isUpdate ? dayjs() : undefined}>
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function TicketDetailDrawer({
  ticketId,
  open,
  onClose,
  can,
}: {
  ticketId: string
  open: boolean
  onClose: () => void
  can: (...arg: any) => boolean
}) {
  const { data: ticket } = useFindUniqueScoreCorrectionTicket({
    where: { id: ticketId },
    include: { trainingObjectType: true },
  })

  const { data: items = [] } = useFindManyScoreCorrectionItem({
    where: { ticketId },
    include: {
      studentSubjectScore: {
        include: {
          student: {
            select: {
              userProfile: {
                select: {
                  code: true,
                  fullname: true,
                  dateOfBirth: true,
                },
              },
            },
          },
          subjectClass: {
            include: {
              subject: true,
            },
          },
          subjectVersion: {
            include: {
              subject: true,
            },
          },
        },
      },
    },
  })

  const { mutateAsync: updateTicket } = useUpdateScoreCorrectionTicket()
  const { mutateAsync: deleteItem } = useDeleteScoreCorrectionItem()

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [isUpdateTicketModalOpen, setIsUpdateTicketModalOpen] = useState(false) // Added
  const [editingItem, setEditingItem] = useState<any>(null)

  const isDeadlinePassed = ticket?.deadline ? dayjs().isAfter(dayjs(ticket.deadline)) : false
  const isFull = ticket?.number ? items.length >= ticket.number : false

  const handleStatusChange = async (newStatus: ScoreCorrectionStatus) => {
    if (newStatus === "PENDING_APPROVAL") {
      if (items?.length !== ticket?.number) {
        message.error(
          `Số lượng sinh viên (${items?.length}) không khớp với số lượng dự kiến (${ticket?.number})`
        )
        return
      }
      // Validate ticket info
      if (!ticket.proposal || !ticket.decision || !ticket.date) {
        message.error("Thông tin phiếu chưa đầy đủ (Tờ trình, Số quyết định, Ngày)")
        return
      }
      // Validate items
      if (!items || items.length === 0) {
        message.error("Phiếu chưa có sinh viên")
        return
      }
      const invalidItems = items.some(
        (item: any) =>
          item.newAttendanceScore === null ||
          item.newAttendanceScore === undefined ||
          item.newMidtermScore === null ||
          item.newMidtermScore === undefined ||
          item.newExamScore === null ||
          item.newExamScore === undefined
      )

      if (invalidItems) {
        message.error("Thông tin điểm mới của các sinh viên chưa đầy đủ")
        return
      }
    }
    try {
      await updateTicket({
        where: { id: ticketId },
        data: { status: newStatus },
      })
      message.success("Cập nhật trạng thái thành công")
    } catch (e) {
      message.error("Lỗi cập nhật trạng thái")
    }
  }

  return (
    <Drawer
      title="Chi tiết phiếu sửa điểm"
      width={1000}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          {ticket?.status === "INITIALIZED" &&
            can("QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM_CHI_TIET", "SUA") && (
              <Button onClick={() => handleStatusChange("PENDING_APPROVAL")}>Gửi duyệt</Button>
            )}
          {(ticket?.status === "INITIALIZED" || ticket?.status === "PENDING_APPROVAL") &&
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM, "SUA") && (
              <Button onClick={() => setIsUpdateTicketModalOpen(true)}>Sửa phiếu</Button>
            )}
        </Space>
      }
    >
      <Descriptions column={2} className="mb-4">
        <Descriptions.Item label="Số lượng">{ticket?.number}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag
            color={
              SCORE_CORRECTION_STATUS_MAP[
                ticket?.status as keyof typeof SCORE_CORRECTION_STATUS_MAP
              ]?.color || "default"
            }
          >
            {SCORE_CORRECTION_STATUS_MAP[ticket?.status as keyof typeof SCORE_CORRECTION_STATUS_MAP]
              ?.text || ticket?.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Tờ trình">{ticket?.proposal}</Descriptions.Item>
        <Descriptions.Item label="Quyết định">{ticket?.decision}</Descriptions.Item>
      </Descriptions>

      <div className="mb-4 flex justify-end">
        {(ticket?.status === "INITIALIZED" || ticket?.status === "PENDING_APPROVAL") &&
          can("QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM_CHI_TIET", "THEM") && (
            <Button
              type="primary"
              onClick={() => {
                if (isDeadlinePassed) {
                  message.warning("Đã quá hạn nhập phiếu")
                  return
                }
                if (isFull) {
                  message.warning("Đã đủ số lượng sinh viên dự kiến")
                  return
                }
                setIsAddStudentModalOpen(true)
              }}
            >
              Thêm sinh viên
            </Button>
          )}
      </div>

      <Table
        dataSource={items}
        columns={[
          {
            title: "Mã SV",
            align: "center",
            dataIndex: ["studentSubjectScore", "student", "userProfile", "code"],
            key: "studentCode",
            render: (_: any, record: any) =>
              record.studentSubjectScore?.student?.userProfile?.code ||
              record.studentSubjectScore?.student?.username,
          },
          {
            title: "Họ tên",
            dataIndex: ["studentSubjectScore", "student", "userProfile"],
            key: "studentName",
            render: (_: any, record: any) => {
              return record.studentSubjectScore?.student?.userProfile?.fullname
            },
          },
          {
            title: "Ngày sinh",
            dataIndex: ["studentSubjectScore", "student", "userProfile", "dateOfBirth"],
            key: "dateOfBirth",
            render: (_: any, record: any) => {
              const dateOfBirth = record.studentSubjectScore?.student?.userProfile?.dateOfBirth
              return dateOfBirth ? dayjs(dateOfBirth).format("DD/MM/YYYY") : ""
            },
          },
          {
            title: "Môn học",
            dataIndex: ["studentSubjectScore", "subjectClass", "subject", "name"],
            key: "subjectName",
            render: (_: any, record: any) =>
              record.studentSubjectScore?.subjectClass?.subject?.name ||
              record.studentSubjectScore?.subjectVersion?.subject?.name,
          },
          {
            title: "Lớp MH",
            dataIndex: ["studentSubjectScore", "subjectClass", "code"],
            key: "subjectClassCode",
          },
          {
            title: "Điểm cũ",
            key: "oldScore",
            render: (_: any, record: any) => (
              <div className="markdown text-xs">
                <p>TX: {record.oldAttendanceScore}</p>
                <p>ĐK: {record.oldMidtermScore}</p>
                <p>THI: {record.oldExamScore}</p>
              </div>
            ),
          },
          {
            title: "Điểm mới",
            key: "newScore",
            render: (_: any, record: any) => (
              <div className="markdown text-xs font-bold">
                <p>TX: {record.newAttendanceScore}</p>
                <p>ĐK: {record.newMidtermScore}</p>
                <p>THI: {record.newExamScore}</p>
              </div>
            ),
          },
          {
            title: "Thao tác",
            align: "center",
            key: "action",
            render: (_: any, record: any) =>
              ticket?.status === "INITIALIZED" || ticket?.status === "PENDING_APPROVAL" ? (
                <Space>
                  {can("QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM_CHI_TIET", "SUA") && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        if (isDeadlinePassed) {
                          message.warning("Đã quá hạn sửa điểm")
                          return
                        }
                        setEditingItem(record)
                      }}
                    >
                      Sửa điểm
                    </Button>
                  )}
                  {can("QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM_CHI_TIET", "XOA") && (
                    <Popconfirm
                      title="Xoá sinh viên này khỏi phiếu?"
                      onConfirm={async () => {
                        try {
                          await deleteItem({ where: { id: record.id } })
                          message.success("Đã xoá thành công")
                        } catch (e) {
                          message.error("Lỗi khi xoá")
                        }
                      }}
                    >
                      <Button type="link" danger size="small">
                        Xoá
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              ) : null,
          },
        ]}
        rowKey="id"
        pagination={false}
      />

      <AddStudentModal
        open={isAddStudentModalOpen}
        ticketId={ticketId}
        onCancel={() => setIsAddStudentModalOpen(false)}
        onSuccess={() => {
          setIsAddStudentModalOpen(false)
        }}
      />

      <EditScoreModal
        open={!!editingItem}
        item={editingItem}
        onCancel={() => setEditingItem(null)}
        onSuccess={() => {
          setEditingItem(null)
        }}
      />
      <TicketModal
        open={isUpdateTicketModalOpen}
        ticket={ticket}
        onCancel={() => setIsUpdateTicketModalOpen(false)}
        onSuccess={() => {
          setIsUpdateTicketModalOpen(false)
        }}
      />
    </Drawer>
  )
}

function AddStudentModal({
  open,
  ticketId,
  onCancel,
  onSuccess,
}: {
  open: boolean
  ticketId: string
  onCancel: () => void
  onSuccess: () => void
}) {
  const [form] = Form.useForm()
  const { mutateAsync: createItem } = useCreateScoreCorrectionItem()
  const [searchTerm, setSearchTerm] = useState("")

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined)
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined)
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined)

  const { data: fixedClasses } = useFindManyFixedClass({
    where: { trainingCourseId: selectedCourseId },
    orderBy: { name: "asc" },
  })

  const { data: students } = useFindManyStudent({
    where: {
      fixedClass: {
        trainingCourseId: selectedCourseId,
        id: selectedClassId,
      },
      OR: searchTerm
        ? [
            {
              userProfile: {
                code: { contains: searchTerm, mode: "insensitive" },
              },
            },
            {
              userProfile: {
                fullname: { contains: searchTerm, mode: "insensitive" },
              },
            },
          ]
        : undefined,
    },
    take: 20,
    select: {
      id: true,
      userProfile: {
        select: {
          code: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          fullname: true,
        },
      },
      fixedClass: {
        select: {
          name: true,
        },
      },
    },
  })

  const { data: subjectScores } = useFindManyStudentSubjectScore(
    {
      where: {
        studentId: selectedStudentId,
      },
      select: {
        id: true,
        attendanceScore: true,
        midtermScore: true,
        examScore: true,
        subjectClass: {
          select: {
            code: true,
            semester: {
              select: {
                name: true,
              },
            },
          },
        },
        subjectVersion: {
          select: {
            name: true,
          },
        },
      },
    },
    {
      enabled: !!selectedStudentId,
    }
  )

  const onFinish = async (values: any) => {
    const selectedScore = subjectScores?.find((s) => s.id === values.studentSubjectScoreId)
    try {
      await createItem({
        data: {
          ticketId,
          studentSubjectScoreId: values.studentSubjectScoreId,
          // Save old scores
          oldAttendanceScore: selectedScore?.attendanceScore,
          oldMidtermScore: selectedScore?.midtermScore,
          oldExamScore: selectedScore?.examScore,
        },
      })
      message.success("Thêm thành công")
      onSuccess()
      form.resetFields()
      setSearchTerm("")
      setSelectedStudentId(undefined)
    } catch (error) {
      message.error("Có lỗi xảy ra (có thể đã tồn tại)")
    }
  }

  const STUDENT_OPTIONS = (students || []).map((d) => ({
    value: d.id,
    label: `${d.userProfile?.code ?? ""} - ${d.userProfile?.fullname} - ${
      d.userProfile?.dateOfBirth ? dayjs(d.userProfile.dateOfBirth).format("DD/MM/YYYY") : "???"
    } - ${d.fixedClass?.name}`,
  }))

  const SUBJECT_SCORE_OPTIONS = (subjectScores || []).map((s) => {
    const subjectClass = s.subjectClass
      ? `(${s.subjectClass?.code || "-"} - ${s.subjectClass?.semester.name})`
      : ""
    return {
      value: s.id,
      label: `${s.subjectVersion.name} ${subjectClass} [TX: ${s.attendanceScore ?? "-"} | ĐK: ${
        s.midtermScore ?? "-"
      } | Thi: ${s.examScore ?? "-"}]`,
    }
  })

  return (
    <Modal
      title="Thêm sinh viên cần sửa điểm"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Khoá học">
              <SelectTrainingCourse
                placeholder="Chọn khoá"
                allowClear
                onChange={(val) => {
                  setSelectedCourseId(val)
                  setSelectedClassId(undefined)
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Lớp quản lý">
              <Select
                placeholder="Chọn lớp"
                allowClear
                disabled={!selectedCourseId}
                value={selectedClassId}
                onChange={setSelectedClassId}
                options={fixedClasses?.map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Tìm kiếm sinh viên (Mã SV, Tên)">
          <Select
            showSearch
            placeholder="Nhập mã SV hoặc tên"
            defaultActiveFirstOption={false}
            filterOption={false}
            onSearch={setSearchTerm}
            onChange={(val) => {
              setSelectedStudentId(val)
              form.setFieldValue("studentSubjectScoreId", undefined)
            }}
            notFoundContent={null}
            options={STUDENT_OPTIONS}
            value={selectedStudentId}
          />
        </Form.Item>
        <Form.Item
          name="studentSubjectScoreId"
          label="Chọn điểm môn học"
          rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
        >
          <Select
            placeholder="Chọn môn học"
            disabled={!selectedStudentId}
            options={SUBJECT_SCORE_OPTIONS}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function EditScoreModal({
  open,
  item,
  onCancel,
  onSuccess,
}: {
  open: boolean
  item: any
  onCancel: () => void
  onSuccess: () => void
}) {
  const [form] = Form.useForm()
  const { mutateAsync: updateItem } = useUpdateScoreCorrectionItem()

  // Set initial values when item changes
  if (item && open) {
    form.setFieldsValue({
      newAttendanceScore: item.newAttendanceScore ?? item.oldAttendanceScore,
      newMidtermScore: item.newMidtermScore ?? item.oldMidtermScore,
      newExamScore: item.newExamScore ?? item.oldExamScore,
    })
  }

  const onFinish = async (values: any) => {
    try {
      if (!!item?.studentSubjectScore?.subjectVersion?.onePoint) {
        await updateItem({
          where: { id: item.id },
          data: {
            newAttendanceScore: values.newExamScore,
            newMidtermScore: values.newExamScore,
            newExamScore: values.newExamScore,
          },
        })
      } else {
        await updateItem({
          where: { id: item.id },
          data: {
            newAttendanceScore: values.newAttendanceScore,
            newMidtermScore: values.newMidtermScore,
            newExamScore: values.newExamScore,
          },
        })
      }

      message.success("Cập nhật điểm thành công")
      onSuccess()
    } catch (error) {
      message.error("Có lỗi xảy ra")
    }
  }

  return (
    <Modal
      width={600}
      title="Nhập điểm mới"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <div className="mb-4 flex gap-4">
        <div className="w-1/2">
          <span className="font-bold mr-1">Họ tên:</span>
          <span>{item?.studentSubjectScore?.student?.userProfile?.fullname || "-"}</span>
        </div>
        <div className="w-1/2">
          <span className="font-bold mr-1">Môn học:</span>
          <span>{item?.studentSubjectScore?.subjectVersion.name || "-"}</span>
        </div>
      </div>
      <div className="mb-4">
        <p className="font-bold">Điểm hiện tại:</p>
        <p>
          TX: {item?.oldAttendanceScore ?? "-"} | ĐK: {item?.oldMidtermScore ?? "-"} | THI:{" "}
          {item?.oldExamScore ?? "-"}
        </p>
      </div>
      {!!item?.studentSubjectScore?.subjectVersion?.onePoint && (
        <div className="mb-4">
          <p className="font-bold">Môn 1 đầu điểm(Chỉ nhập điểm thi)</p>
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name={
                !!item?.studentSubjectScore?.subjectVersion?.onePoint
                  ? "newExamScore"
                  : "newAttendanceScore"
              }
              label="Điểm TX mới"
              rules={[
                {
                  validator: (_, value) =>
                    validateScore(
                      value,
                      item?.studentSubjectScore?.subjectVersion?.onePoint || false
                    ),
                },
              ]}
            >
              <InputNumber
                disabled={!!item?.studentSubjectScore?.subjectVersion?.onePoint}
                min={0}
                max={10}
                step={0.5}
                controls={false}
                className="w-full"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name={
                !!item?.studentSubjectScore?.subjectVersion?.onePoint
                  ? "newExamScore"
                  : "newMidtermScore"
              }
              label="Điểm ĐK mới"
              rules={[
                {
                  validator: (_, value) =>
                    validateScore(
                      value,
                      item?.studentSubjectScore?.subjectVersion?.onePoint || false
                    ),
                },
              ]}
            >
              <InputNumber
                disabled={!!item?.studentSubjectScore?.subjectVersion?.onePoint}
                min={0}
                max={10}
                step={0.1}
                className="w-full"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="newExamScore"
              label="Điểm Thi mới"
              rules={[
                {
                  validator: (_, value) => validateExamScore(value),
                },
              ]}
            >
              <InputNumber min={0} max={10} step={0.1} className="w-full" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

QuanLySuaDiem.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
