import Table from "@components/commons/table"

import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useClassRegisterStatus } from "@hooks/classRegisterStatus"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { ClassRegisterStatus } from "@workspace/db"
import {
  useCountClassRegisterLogs,
  useFindManyClassRegisterLogs,
  useFindManySubjectClass,
  useFindUniqueClassRegisterSession,
  useUpdateManyClassRegisterLogs,
} from "@workspace/db/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { enrollApprovedStudents } from "@workspace/libs/api/enroll-approved-students"
import {
  Button,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Tabs,
  Tag,
  Tooltip,
  message,
} from "antd"
import dayjs from "dayjs"
import { Search, TriangleAlert } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"
import ChinhSuaDangKy from "./_components/chinh-sua-dang-ky"
import ThongKeDangKy from "./_components/thong-ke-dang-ky"

export default function ClassRegisterLogs() {
  const router = useRouter()
  const id = router.query.id as string
  const [activeTab, setActiveTab] = useState("danh-sach")
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [form] = Form.useForm<{ status: ClassRegisterStatus; reason?: string }>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { classRegisterStatusOptions, getClassRegisterStatusColor, getClassRegisterStatusLabel } =
    useClassRegisterStatus()
  const { mutateAsync: updateManyClassRegisterLogs } = useUpdateManyClassRegisterLogs()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    code: "",
    subjectClassId: undefined,
    classRegisterStatus: undefined,
  })
  const { data: initialValue } = useFindUniqueClassRegisterSession(
    {
      where: { id },
      include: {
        semester: {
          include: {
            schoolYear: true,
          },
        },
      },
    },
    { enabled: !!id }
  )

  const keyword = searchText.trim()

  const where = useMemo(
    () => ({
      classRegisterSessionId: id,
      deletedAt: null,
      ...(keyword
        ? {
            OR: [
              {
                student: {
                  code: { contains: keyword, mode: "insensitive" as const },
                },
              },
              {
                student: {
                  userProfile: {
                    fullname: { contains: keyword, mode: "insensitive" as const },
                  },
                },
              },
              {
                subjectClass: {
                  name: { contains: keyword, mode: "insensitive" as const },
                },
              },
              {
                subjectClass: {
                  code: { contains: keyword, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
      ...(filters.code
        ? {
            student: {
              code: {
                contains: filters.code,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(filters.name
        ? {
            student: {
              userProfile: {
                fullname: {
                  contains: filters.name,
                  mode: "insensitive" as const,
                },
              },
            },
          }
        : {}),
      ...(filters.subjectClassId
        ? {
            subjectClassId: {
              in: Array.isArray(filters.subjectClassId)
                ? filters.subjectClassId
                : [filters.subjectClassId],
            },
          }
        : {}),
      ...(filters.classRegisterStatus
        ? {
            status: { in: filters.classRegisterStatus },
          }
        : {}),
    }),
    [id, keyword, filters.name, filters.code, filters.subjectClassId, filters.classRegisterStatus]
  )

  const { data, refetch } = useFindManyClassRegisterLogs(
    {
      where,
      include: {
        student: {
          include: {
            userProfile: true,
          },
        },
        subjectClass: true,
      },
      orderBy: [{ student: { userProfile: { firstName: "asc" } } }, { createdAt: "desc" }],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!id,
    }
  )

  const { data: count } = useCountClassRegisterLogs(
    {
      where,
    },
    {
      enabled: !!id,
    }
  )

  const { data: subjectClass } = useFindManySubjectClass(
    {
      where: {
        classRegisterLogs: {
          some: {
            classRegisterSessionId: id,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    },
    {
      enabled: !!id,
    }
  )

  const selectedStatus = Form.useWatch("status", form)

  function handleOpenStatusModal() {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một đơn đăng ký")
      return
    }
    form.setFieldsValue({
      status: ClassRegisterStatus.SUCCESS,
      reason: undefined,
    })
    setStatusModalOpen(true)
  }

  async function handleUpdateStatus() {
    try {
      const values = await form.validateFields()
      showSpinner()
      await updateManyClassRegisterLogs({
        where: {
          id: { in: selectedRowKeys as string[] },
          classRegisterSessionId: id,
          deletedAt: null,
        },
        data: {
          status: values.status,
          reason:
            values.status === ClassRegisterStatus.FAILED ? values.reason?.trim() || null : null,
        },
      })
      message.success(`Đã cập nhật trạng thái cho ${selectedRowKeys.length} đơn đăng ký`)
      setStatusModalOpen(false)
      setSelectedRowKeys([])
      form.resetFields()
      await refetch()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.info?.message || error?.message || "Cập nhật trạng thái thất bại")
    } finally {
      hideSpinner()
    }
  }

  function handleEnrollApprovedStudents() {
    Modal.confirm({
      title: "Đưa sinh viên vào lớp môn học",
      content:
        "Chỉ đưa các sinh viên có đơn đăng ký ở trạng thái Được chấp thuận vào lớp môn học. Sinh viên đã có trong lớp sẽ được bỏ qua.",
      okText: "Đồng ý",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          showSpinner()
          const res = await enrollApprovedStudents({ classRegisterSessionId: id })
          if (res.status !== 200) {
            message.error(res.data?.message || "Đưa SV vào lớp thất bại")
            return
          }
          message.success(
            res.data.message ||
              `Đã đưa ${res.data.created} SV vào lớp (${res.data.alreadyEnrolled} đã có sẵn)`
          )
          await refetch()
        } catch (error: any) {
          message.error(error?.message || "Đưa SV vào lớp thất bại")
        } finally {
          hideSpinner()
        }
      },
    })
  }

  const danhSachTab = (
    <div className="dot-dkh-list">
      <Flex justify="space-between" align="center" gap={8} wrap className="mb-2">
        <Input
          allowClear
          size="small"
          prefix={<Search size={13} className="text-gray-400" />}
          placeholder="Tìm theo mã SV, tên học viên hoặc tên/mã lớp môn học"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value)
            setCurrentPage(1)
            setSelectedRowKeys([])
          }}
          className="!max-w-[380px]"
        />
        <Flex gap={8} wrap>
          <Button size="small" onClick={handleEnrollApprovedStudents} disabled={!id}>
            Đưa SV vào lớp môn học
          </Button>
          <Button
            type="primary"
            size="small"
            disabled={selectedRowKeys.length === 0}
            onClick={handleOpenStatusModal}
          >
            Cập nhật trạng thái
            {selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ""}
          </Button>
        </Flex>
      </Flex>

      <Table
        rowKey="id"
        className="!mt-0"
        scrollable
        maxHeight="calc(100vh - 360px)"
        filters={filters}
        setFilters={(value) => {
          setFilters(value)
          setCurrentPage(1)
          setSelectedRowKeys([])
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          preserveSelectedRowKeys: true,
          columnWidth: 40,
        }}
        columns={[
          {
            title: "STT",
            width: 50,
            align: "center",
            fixed: "left",
            className: "!py-1.5 !px-2",
            render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
          },
          {
            title: "Mã sinh viên",
            dataIndex: "code",
            width: 120,
            align: "center",
            type: "input",
            className: "!py-1.5 !px-2",
            render: (_, record) => record?.student?.code || "",
          },
          {
            title: "Họ và tên",
            dataIndex: "name",
            width: 200,
            align: "center",
            type: "input",
            className: "!py-1.5 !px-2",
            render: (_, record) =>
              record?.student?.userProfile?.fullname ||
              [record?.student?.userProfile?.lastName, record?.student?.userProfile?.firstName]
                .filter(Boolean)
                .join(" ") ||
              "",
          },
          {
            title: "Lớp môn học đăng ký",
            dataIndex: "subjectClassId",
            width: 260,
            align: "center",
            type: "select",
            className: "!py-1.5 !px-2",
            options: subjectClass?.map((i) => ({
              label: [i?.code, i?.name].filter(Boolean).join(" - "),
              value: i?.id,
            })),
            render: (_, record) =>
              [record?.subjectClass?.code, record?.subjectClass?.name]
                .filter(Boolean)
                .join(" - ") || "",
          },
          {
            title: "Thời gian đăng ký",
            dataIndex: "createdAt",
            width: 150,
            align: "center",
            className: "!py-1.5 !px-2",
            render: (_, record) =>
              record?.createdAt ? dayjs(record.createdAt).format("HH:mm DD/MM/YYYY") : "",
          },
          {
            title: "Trạng thái",
            dataIndex: "classRegisterStatus",
            align: "center",
            width: 130,
            fixed: "right",
            type: "select",
            className: "!py-1.5 !px-2",
            options: classRegisterStatusOptions.map((i) => ({
              value: i.value,
              label: i.label,
            })),
            render: (_, record) => {
              const label = getClassRegisterStatusLabel(record.status)
              const color = getClassRegisterStatusColor(record.status)
              return <Tag color={color}>{label}</Tag>
            },
          },
          {
            title: "Ghi chú",
            dataIndex: "reason",
            align: "center",
            width: 80,
            fixed: "right",
            className: "!py-1.5 !px-2",
            render: (_, record) =>
              record?.status === ClassRegisterStatus.FAILED && (
                <Row className="justify-center gap-2">
                  <Tooltip title={record?.reason}>
                    <TriangleAlert
                      size={16}
                      strokeWidth={1.5}
                      className="text-red-600 cursor-pointer"
                    />
                  </Tooltip>
                </Row>
              ),
          },
        ]}
        data={data}
        pagination={{
          size: "small",
          current: currentPage,
          pageSize: numberOfPages,
          total: count,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            if (numberOfPages === pageSize) {
              setCurrentPage(page)
            } else {
              setCurrentPage(1)
              setNumberOfPages(pageSize)
            }
          },
        }}
      />
    </div>
  )

  return (
    <div className="dot-dkh-page">
      <Divider orientation="left" orientationMargin={0} className="!mt-0 !mb-2">
        {[
          initialValue?.code,
          initialValue?.name,
          initialValue?.semester?.name,
          initialValue?.semester?.schoolYear?.name,
          dayjs(initialValue?.startDate).format("HH:mm DD/MM/YYYY"),
          dayjs(initialValue?.endDate).format("HH:mm DD/MM/YYYY"),
        ]
          .filter(Boolean)
          .join(" - ")}
      </Divider>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="dot-dkh-tabs"
        items={[
          {
            key: "danh-sach",
            label: "Danh sách đơn đăng ký",
            children: danhSachTab,
          },
          {
            key: "chinh-sua",
            label: "Chỉnh sửa",
            children: (
              <ChinhSuaDangKy sessionId={id} semesterId={initialValue?.semesterId || undefined} />
            ),
          },
          {
            key: "thong-ke",
            label: "Thống kê",
            children: <ThongKeDangKy sessionId={id} />,
          },
        ]}
      />

      <Modal
        title={`Cập nhật trạng thái (${selectedRowKeys.length} đơn)`}
        open={statusModalOpen}
        onOk={handleUpdateStatus}
        onCancel={() => {
          setStatusModalOpen(false)
          form.resetFields()
        }}
        okText="Cập nhật"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: ClassRegisterStatus.SUCCESS }}>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              options={classRegisterStatusOptions.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </Form.Item>
          {selectedStatus === ClassRegisterStatus.FAILED && (
            <Form.Item
              name="reason"
              label="Lý do từ chối"
              rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
            >
              <Input.TextArea rows={3} placeholder="Áp dụng cho tất cả đơn đã chọn" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

ClassRegisterLogs.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Kế hoạch đào tạo" },
        {
          title: "Đợt đăng ký học",
          href: ROUTER_PATH.QL_DAO_TAO.DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
        },
        { title: "Các đơn đăng ký học" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
