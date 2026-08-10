import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useClassRegisterStatus } from "@hooks/classRegisterStatus"
import useSpinner from "@hooks/spinner"
import { ClassRegisterStatus } from "@workspace/db"
import {
  useCountStudent,
  useFindManyClassRegisterLogs,
  useFindManyStudent,
  useFindManySubjectClass,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import {
  Alert,
  Button,
  Col,
  Empty,
  Flex,
  Form,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd"
import dayjs from "dayjs"
import { ArrowLeftRight, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

type Props = {
  sessionId: string
  semesterId?: string
}

type ScoreGuardRow = {
  id: string
  studentId: string
  subjectClassId: string | null
}

const SCORE_OR_FILTER = [
  { attendanceScore: { not: null } },
  { midtermScore: { not: null } },
  { finalScore: { not: null } },
  { examScore: { not: null } },
  { manualFinalScore: { not: null } },
]

function subjectClassLabel(sc?: { code?: string | null; name?: string | null } | null) {
  return [sc?.code, sc?.name].filter(Boolean).join(" - ") || ""
}

export default function ChinhSuaDangKy({ sessionId, semesterId }: Props) {
  const { showSpinner, hideSpinner } = useSpinner()
  const { getClassRegisterStatusColor, getClassRegisterStatusLabel } = useClassRegisterStatus()

  const [studentFilters, setStudentFilters] = useState<FilterProps>({
    code: "",
    name: "",
  })
  const [selectedStudentId, setSelectedStudentId] = useState<string>()
  const [selectedLogKeys, setSelectedLogKeys] = useState<React.Key[]>([])
  const [studentPage, setStudentPage] = useState(1)
  const [studentPageSize, setStudentPageSize] = useState(DEFAULT_PAGINATE_SIZE)

  const [addOpen, setAddOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)
  const [addForm] = Form.useForm<{ subjectClassId: string }>()
  const [changeForm] = Form.useForm<{ subjectClassId: string }>()

  const hasStudentSearch = Boolean(studentFilters.code || studentFilters.name)

  const studentWhere = useMemo(
    () => ({
      deletedAt: null,
      ...(studentFilters.code
        ? { code: { contains: studentFilters.code, mode: "insensitive" as const } }
        : {}),
      ...(studentFilters.name
        ? {
            userProfile: {
              fullname: {
                contains: studentFilters.name,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      // Không gõ tìm kiếm → mặc định SV đã có đơn trong đợt; có tìm kiếm → cho phép chọn SV mới để đăng ký bổ sung
      ...(!hasStudentSearch
        ? {
            classRegisterLogs: {
              some: {
                classRegisterSessionId: sessionId,
                deletedAt: null,
              },
            },
          }
        : {}),
    }),
    [sessionId, studentFilters.code, studentFilters.name, hasStudentSearch]
  )

  const { data: students = [], isFetching: loadingStudents } = useFindManyStudent(
    {
      where: studentWhere,
      include: { userProfile: true },
      orderBy: { code: "asc" },
      take: studentPageSize,
      skip: (studentPage - 1) * studentPageSize,
    },
    { enabled: !!sessionId }
  )

  const { data: studentCount = 0 } = useCountStudent(
    { where: studentWhere },
    { enabled: !!sessionId }
  )

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  const {
    data: logs = [],
    refetch: refetchLogs,
    isFetching: loadingLogs,
  } = useFindManyClassRegisterLogs(
    {
      where: {
        classRegisterSessionId: sessionId,
        studentId: selectedStudentId,
        deletedAt: null,
      },
      include: {
        subjectClass: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!sessionId && !!selectedStudentId }
  )

  const registeredSubjectClassIds = useMemo(
    () => logs.map((l) => l.subjectClassId).filter(Boolean) as string[],
    [logs]
  )

  const changeSourceLog = useMemo(() => {
    if (selectedLogKeys.length !== 1) return null
    return logs.find((l) => l.id === selectedLogKeys[0]) || null
  }, [logs, selectedLogKeys])

  const { data: addSubjectClasses = [] } = useFindManySubjectClass(
    {
      where: {
        deletedAt: null,
        active: true,
        cancelled: false,
        ...(semesterId ? { semesterId } : {}),
        ...(registeredSubjectClassIds.length
          ? { id: { notIn: registeredSubjectClassIds } }
          : {}),
      },
      include: { subject: true },
      orderBy: [{ code: "asc" }],
      take: 200,
    },
    { enabled: addOpen && !!semesterId }
  )

  const changeSubjectVersionId = changeSourceLog?.subjectClass?.subjectId

  const { data: changeSubjectClasses = [] } = useFindManySubjectClass(
    {
      where: {
        deletedAt: null,
        active: true,
        cancelled: false,
        ...(semesterId ? { semesterId } : {}),
        ...(changeSubjectVersionId ? { subjectId: changeSubjectVersionId } : {}),
        ...(changeSourceLog?.subjectClassId
          ? { id: { not: changeSourceLog.subjectClassId } }
          : {}),
      },
      include: { subject: true },
      orderBy: [{ code: "asc" }],
      take: 200,
    },
    { enabled: changeOpen && !!changeSubjectVersionId }
  )

  async function invalidateCaches() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["zenstack", "ClassRegisterLogs"] }),
      queryClient.invalidateQueries({ queryKey: ["zenstack", "StudentSubjectScore"] }),
      queryClient.invalidateQueries({ queryKey: ["zenstack", "Student"] }),
      queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] }),
      refetchLogs(),
    ])
  }

  async function assertNoScores(studentId: string, subjectClassIds: string[]) {
    const res = await sqlTransaction([
      {
        model: "StudentSubjectScore",
        operation: "findMany",
        data: {
          where: {
            studentId,
            subjectClassId: { in: subjectClassIds },
            OR: SCORE_OR_FILTER,
          },
          select: { id: true, studentId: true, subjectClassId: true },
        },
      },
    ])
    if (res.status !== 200) throw new Error("Không thể kiểm tra điểm học viên")
    const rows = (res.data?.[0] || []) as ScoreGuardRow[]
    if (rows.length > 0) {
      throw new Error("Học phần đã phát sinh dữ liệu (điểm), không thể thao tác.")
    }
  }

  async function handleCancel() {
    if (!selectedStudentId) {
      message.warning("Vui lòng chọn sinh viên")
      return
    }
    if (selectedLogKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một học phần để hủy")
      return
    }

    const selectedLogs = logs.filter((l) => selectedLogKeys.includes(l.id))
    const subjectClassIds = selectedLogs.map((l) => l.subjectClassId)

    try {
      showSpinner()
      await assertNoScores(selectedStudentId, subjectClassIds)

      const res = await sqlTransaction([
        {
          model: "ClassRegisterLogs",
          operation: "deleteMany",
          data: {
            where: {
              id: { in: selectedLogs.map((l) => l.id) },
              classRegisterSessionId: sessionId,
              studentId: selectedStudentId,
            },
          },
        },
        {
          model: "StudentSubjectScore",
          operation: "deleteMany",
          data: {
            where: {
              studentId: selectedStudentId,
              subjectClassId: { in: subjectClassIds },
              attendanceScore: null,
              midtermScore: null,
              examScore: null,
              finalScore: null,
              manualFinalScore: null,
            },
          },
        },
      ])
      if (res.status !== 200) throw new Error("Hủy đăng ký thất bại")

      message.success(`Đã hủy ${selectedLogs.length} học phần`)
      setSelectedLogKeys([])
      await invalidateCaches()
    } catch (error: any) {
      message.error(error?.message || "Hủy đăng ký thất bại")
    } finally {
      hideSpinner()
    }
  }

  async function handleAdd() {
    if (!selectedStudentId) return
    try {
      const values = await addForm.validateFields()
      const subjectClass = addSubjectClasses.find((sc) => sc.id === values.subjectClassId)
      if (!subjectClass?.subjectId) {
        message.error("Không tìm thấy lớp môn học")
        return
      }

      showSpinner()

      const existing = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "findMany",
          data: {
            where: {
              studentId: selectedStudentId,
              subjectClassId: values.subjectClassId,
            },
            select: { id: true },
          },
        },
      ])
      if (existing.status !== 200) throw new Error("Không thể kiểm tra đăng ký hiện có")
      if ((existing.data?.[0] as { id: string }[])?.length) {
        throw new Error("Sinh viên đã có trong lớp môn học này")
      }

      const res = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "createMany",
          data: {
            data: [
              {
                studentId: selectedStudentId,
                subjectClassId: values.subjectClassId,
                subjectVersionId: subjectClass.subjectId,
              },
            ],
            skipDuplicates: true,
          },
        },
        {
          model: "ClassRegisterLogs",
          operation: "createMany",
          data: {
            data: [
              {
                classRegisterSessionId: sessionId,
                studentId: selectedStudentId,
                subjectClassId: values.subjectClassId,
                status: ClassRegisterStatus.SUCCESS,
              },
            ],
            skipDuplicates: true,
          },
        },
      ])
      if (res.status !== 200) throw new Error("Đăng ký bổ sung thất bại")

      message.success("Đã đăng ký bổ sung học phần")
      setAddOpen(false)
      addForm.resetFields()
      await invalidateCaches()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || "Đăng ký bổ sung thất bại")
    } finally {
      hideSpinner()
    }
  }

  async function handleChangeClass() {
    if (!selectedStudentId || !changeSourceLog) return
    try {
      const values = await changeForm.validateFields()
      const targetClass = changeSubjectClasses.find((sc) => sc.id === values.subjectClassId)
      if (!targetClass?.subjectId) {
        message.error("Không tìm thấy lớp môn học đích")
        return
      }

      showSpinner()
      await assertNoScores(selectedStudentId, [changeSourceLog.subjectClassId])

      const existing = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "findMany",
          data: {
            where: {
              studentId: selectedStudentId,
              subjectClassId: values.subjectClassId,
            },
            select: { id: true },
          },
        },
      ])
      if (existing.status !== 200) throw new Error("Không thể kiểm tra lớp đích")
      if ((existing.data?.[0] as { id: string }[])?.length) {
        throw new Error("Sinh viên đã thuộc lớp môn học đích")
      }

      const res = await sqlTransaction([
        {
          model: "ClassRegisterLogs",
          operation: "updateMany",
          data: {
            where: { id: changeSourceLog.id },
            data: {
              subjectClassId: values.subjectClassId,
              status: ClassRegisterStatus.SUCCESS,
              reason: `Đổi lớp từ ${subjectClassLabel(changeSourceLog.subjectClass)}`,
            },
          },
        },
        {
          model: "StudentSubjectScore",
          operation: "updateMany",
          data: {
            where: {
              studentId: selectedStudentId,
              subjectClassId: changeSourceLog.subjectClassId,
            },
            data: {
              subjectClassId: values.subjectClassId,
              subjectVersionId: targetClass.subjectId,
            },
          },
        },
      ])
      if (res.status !== 200) throw new Error("Đổi lớp thất bại")

      message.success("Đã đổi lớp môn học")
      setChangeOpen(false)
      changeForm.resetFields()
      setSelectedLogKeys([])
      await invalidateCaches()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || "Đổi lớp thất bại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={[16, 16]}>
      {/* <Col span={24}>
        <Alert
          type="info"
          showIcon
          message="Chỉnh sửa đăng ký sau xử lý"
          description="Cho phép hủy học phần, đăng ký bổ sung hoặc đổi lớp cho sinh viên. Không thể thao tác học phần đã có điểm."
        />
      </Col> */}

      <Col xs={24} lg={8}>
        <Typography.Text strong>1. Chọn sinh viên</Typography.Text>
        <div className="mt-2 chinh-sua-sv-table">
          <Table
            rowKey="id"
            loading={loadingStudents}
            filters={studentFilters}
            setFilters={(value) => {
              setStudentFilters(value)
              setStudentPage(1)
              setSelectedStudentId(undefined)
              setSelectedLogKeys([])
            }}
            rowSelection={{
              type: "radio",
              selectedRowKeys: selectedStudentId ? [selectedStudentId] : [],
              onChange: (keys) => {
                setSelectedStudentId(keys[0] as string | undefined)
                setSelectedLogKeys([])
              },
            }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedStudentId(record.id)
                setSelectedLogKeys([])
              },
            })}
            columns={[
              {
                title: "Mã SV",
                dataIndex: "code",
                type: "input",
                width: 110,
                render: (v) => v || "",
              },
              {
                title: "Họ và tên",
                dataIndex: "name",
                type: "input",
                render: (_, record) =>
                  record?.userProfile?.fullname ||
                  [record?.userProfile?.lastName, record?.userProfile?.firstName]
                    .filter(Boolean)
                    .join(" ") ||
                  "",
              },
            ]}
            data={students}
            pagination={{
              size: "small",
              current: studentPage,
              pageSize: studentPageSize,
              total: studentCount,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]}/${total}`,
              onChange: (page, pageSize) => {
                if (studentPageSize === pageSize) setStudentPage(page)
                else {
                  setStudentPage(1)
                  setStudentPageSize(pageSize)
                }
              },
            }}
            scroll={{ y: 420 }}
          />
        </div>
      </Col>

      <Col xs={24} lg={16}>
        <Flex justify="space-between" align="center" wrap gap={8} className="mb-2">
          <Typography.Text strong>
            2. Đăng ký hiện tại
            {selectedStudent
              ? ` — ${selectedStudent.code} ${
                  selectedStudent.userProfile?.fullname ||
                  [selectedStudent.userProfile?.lastName, selectedStudent.userProfile?.firstName]
                    .filter(Boolean)
                    .join(" ")
                }`
              : ""}
          </Typography.Text>
          <Space wrap className="chinh-sua-actions">
            <Button
              icon={
                <span className="inline-flex items-center justify-center leading-none">
                  <Plus size={14} strokeWidth={2} />
                </span>
              }
              type="primary"
              disabled={!selectedStudentId}
              className="inline-flex items-center"
              onClick={() => {
                addForm.resetFields()
                setAddOpen(true)
              }}
            >
              Đăng ký bổ sung
            </Button>
            <Button
              icon={
                <span className="inline-flex items-center justify-center leading-none">
                  <ArrowLeftRight size={14} strokeWidth={2} />
                </span>
              }
              disabled={!selectedStudentId || selectedLogKeys.length !== 1}
              className="inline-flex items-center"
              onClick={() => {
                if (selectedLogKeys.length !== 1) {
                  message.warning("Chọn đúng 1 học phần để đổi lớp")
                  return
                }
                changeForm.resetFields()
                setChangeOpen(true)
              }}
            >
              Đổi lớp
            </Button>
            <Popconfirm
              title="Hủy học phần đã chọn?"
              description="Sẽ xóa đơn đăng ký và ghi danh lớp tương ứng."
              okText="Hủy học phần"
              cancelText="Đóng"
              okButtonProps={{ danger: true }}
              disabled={!selectedStudentId || selectedLogKeys.length === 0}
              onConfirm={handleCancel}
            >
              <Button
                danger
                icon={
                  <span className="inline-flex items-center justify-center leading-none">
                    <Trash2 size={14} strokeWidth={2} />
                  </span>
                }
                disabled={!selectedStudentId || selectedLogKeys.length === 0}
                className="inline-flex items-center"
              >
                Hủy học phần
                {selectedLogKeys.length > 0 ? ` (${selectedLogKeys.length})` : ""}
              </Button>
            </Popconfirm>
          </Space>
        </Flex>

        {!selectedStudentId ? (
          <Empty description="Chọn sinh viên bên trái để chỉnh sửa đăng ký" />
        ) : (
          <Table
            rowKey="id"
            loading={loadingLogs}
            filters={{}}
            setFilters={() => undefined}
            rowSelection={{
              selectedRowKeys: selectedLogKeys,
              onChange: setSelectedLogKeys,
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Lớp môn học",
                render: (_, record) => subjectClassLabel(record.subjectClass),
              },
              {
                title: "Thời gian ĐK",
                width: 150,
                align: "center",
                render: (_, record) =>
                  record.createdAt ? dayjs(record.createdAt).format("HH:mm DD/MM/YYYY") : "",
              },
              {
                title: "Trạng thái",
                width: 140,
                align: "center",
                render: (_, record) => (
                  <Tag color={getClassRegisterStatusColor(record.status)}>
                    {getClassRegisterStatusLabel(record.status)}
                  </Tag>
                ),
              },
              {
                title: "Ghi chú",
                width: 180,
                ellipsis: true,
                render: (_, record) => record.reason || "",
              },
            ]}
            data={logs}
            pagination={false}
            scroll={{ y: 420 }}
          />
        )}
      </Col>

      <Modal
        title="Đăng ký bổ sung học phần"
        open={addOpen}
        onOk={handleAdd}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
        }}
        okText="Đăng ký"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="subjectClassId"
            label="Lớp môn học"
            rules={[{ required: true, message: "Vui lòng chọn lớp môn học" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn lớp môn học"
              options={addSubjectClasses.map((sc) => ({
                value: sc.id,
                label: subjectClassLabel(sc),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Đổi lớp môn học"
        open={changeOpen}
        onOk={handleChangeClass}
        onCancel={() => {
          setChangeOpen(false)
          changeForm.resetFields()
        }}
        okText="Đổi lớp"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={changeForm} layout="vertical">
          <Form.Item label="Lớp hiện tại">
            <Typography.Text>{subjectClassLabel(changeSourceLog?.subjectClass)}</Typography.Text>
          </Form.Item>
          <Form.Item
            name="subjectClassId"
            label="Lớp mới (cùng học phần)"
            rules={[{ required: true, message: "Vui lòng chọn lớp mới" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn lớp môn học mới"
              options={changeSubjectClasses.map((sc) => ({
                value: sc.id,
                label: subjectClassLabel(sc),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  )
}
