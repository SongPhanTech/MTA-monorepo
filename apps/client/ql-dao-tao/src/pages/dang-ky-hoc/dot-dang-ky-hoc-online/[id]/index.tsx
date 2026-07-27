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
import { Button, Col, Divider, Flex, Form, Input, Modal, Row, Select, Tag, Tooltip, message } from "antd"
import dayjs from "dayjs"
import { TriangleAlert } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"

export default function ClassRegisterLogs() {
  const router = useRouter()
  const id = router.query.id as string
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [statusModalOpen, setStatusModalOpen] = useState(false)
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

  const where = useMemo(
    () => ({
      classRegisterSessionId: id,
      deletedAt: null,
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
    [id, filters.name, filters.code, filters.subjectClassId, filters.classRegisterStatus]
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
            values.status === ClassRegisterStatus.FAILED
              ? values.reason?.trim() || null
              : null,
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

  return (
    <div>
      <Divider orientation="left" orientationMargin={0}>
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
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex justify="end" gap={8} wrap>
            <Button type="primary" disabled={selectedRowKeys.length === 0} onClick={handleOpenStatusModal}>
              Cập nhật trạng thái
              {selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ""}
            </Button>
          </Flex>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
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
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "code",
                width: 120,
                align: "center",
                type: "input",
                render: (_, record) => record?.student?.code || "",
              },
              {
                title: "Họ và tên",
                dataIndex: "name",
                width: 200,
                align: "center",
                type: "input",

                render: (_, record) =>
                  record?.student?.userProfile?.fullname ||
                  [record?.student?.userProfile?.lastName, record?.student?.userProfile?.firstName]
                    .filter(Boolean)
                    .join(" ") ||
                  "",
              },
              {
                title: "Lớp",
                dataIndex: "subjectClassId",
                width: 200,
                align: "center",
                type: "select",
                options: subjectClass?.map((i) => {
                  return {
                    label: i?.name,
                    value: i?.id,
                  }
                }),
                render: (_, record) => record?.subjectClass?.name || "",
              },
              {
                title: "Trạng thái",
                dataIndex: "classRegisterStatus",

                align: "center",
                width: 140,
                fixed: "right",
                type: "select",
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
                width: 100,
                fixed: "right",
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
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
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
        </Col>
      </Row>

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
