import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { usePaymentStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { PaymentStatus } from "@workspace/db/client"
import {
  useCountGuestTeachingPayment,
  useFindManyGuestTeachingPayment,
  useFindManySemester,
  useUpdateManyGuestTeachingPayment,
} from "@workspace/db/hooks"
import { calculateGuestTeachingPayment } from "@workspace/libs/api/training"
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Table as TableAntd,
  Tag,
} from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useMemo, useState } from "react"

function lecturerName(lecturer?: {
  code?: string | null
  userProfile?: { firstName?: string | null; lastName?: string | null; fullname?: string | null }
}) {
  const profile = lecturer?.userProfile
  if (!profile) return "-"
  const composed = `${profile.lastName ?? ""} ${profile.firstName ?? ""}`.trim()
  return composed || profile.fullname || "-"
}

export default function DanhSachThanhToanMoiGiang() {
  const { getPaymentStatusColor, getPaymentStatusLabel, paymentStatusOptions } =
    usePaymentStatusOptions()
  const { showSpinner, hideSpinner } = useSpinner()

  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [semesterId, setSemesterId] = useState<string>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [form] = Form.useForm()

  const [filters, setFilters] = useState<FilterProps>({
    name: undefined,
    transactionCode: undefined,
    paymentStatus: undefined,
    paymentDate: undefined,
  })

  const { data: semesters = [] } = useFindManySemester({
    where: { active: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  })

  const where = useMemo(() => {
    const w: Record<string, unknown> = {}
    if (semesterId) w.semesterId = semesterId

    if (filters.name) {
      w.lecturer = {
        is: {
          OR: [
            { code: { contains: filters.name, mode: "insensitive" } },
            { userProfile: { is: { fullname: { contains: filters.name, mode: "insensitive" } } } },
            { userProfile: { is: { lastName: { contains: filters.name, mode: "insensitive" } } } },
            { userProfile: { is: { firstName: { contains: filters.name, mode: "insensitive" } } } },
          ],
        },
      }
    }

    if (filters.transactionCode) {
      w.transactionCode = { contains: filters.transactionCode, mode: "insensitive" }
    }

    if (filters.paymentStatus) {
      w.status = Array.isArray(filters.paymentStatus)
        ? { in: filters.paymentStatus }
        : { equals: filters.paymentStatus }
    }

    if (filters.paymentDate?.length === 2) {
      w.paymentDate = {
        gte: dayjs(filters.paymentDate[0], "DD/MM/YYYY").toDate(),
        lte: dayjs(filters.paymentDate[1], "DD/MM/YYYY").toDate(),
      }
    }

    return w
  }, [
    semesterId,
    filters.name,
    filters.transactionCode,
    filters.paymentStatus,
    filters.paymentDate,
  ])

  const { data: payments = [], refetch: refetchPayments } = useFindManyGuestTeachingPayment({
    where,
    include: {
      lecturer: { include: { userProfile: true } },
      semester: { select: { id: true, name: true } },
      hiringOrg: { select: { Id: true, sTen: true } },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
    orderBy: { createdAt: "desc" },
  })

  const { data: count = 0, refetch: refetchCount } = useCountGuestTeachingPayment({ where })

  const { mutateAsync: updateManyPayment } = useUpdateManyGuestTeachingPayment()

  const handleOpenStatusModal = () => {
    form.resetFields()
    setStatusModalOpen(true)
  }
  const [calcResult, setCalcResult] = useState<{
    message: string
    dryRun: boolean
    totalGroups: number
    created: number
    updated: number
    skippedPaid: number
    items?: {
      lecturerId: string
      lecturerName: string
      hiringOrgId: string
      hiringOrgName: string
      totalPeriods: number
      ratePerPeriod: number
      amount: number
      action: "create" | "update" | "skippedPaid"
    }[]
    unresolved: {
      lecturerId: string
      lecturerName: string
      hiringOrgId: string | null
      reason: string
    }[]
  }>()

  const runCalculate = async (dryRun: boolean) => {
    if (!semesterId) {
      message.warning("Vui lòng chọn học kỳ trước khi kết toán")
      return
    }
    showSpinner()
    try {
      const res = await calculateGuestTeachingPayment({ semesterId, dryRun })
      if (res?.status === 200) {
        const data = res.data
        setCalcResult(data)
        if (!dryRun) {
          message.success(data.message)
          setSelectedRowKeys([])
          await Promise.all([refetchPayments(), refetchCount()])
        }
      } else {
        message.error((res?.data as { message?: string })?.message || "Kết toán thất bại")
      }
    } catch {
      message.error("Có lỗi xảy ra khi kết toán")
    } finally {
      hideSpinner()
    }
  }

  const handleSettle = () => {
    if (!semesterId) {
      message.warning("Vui lòng chọn học kỳ trước khi kết toán")
      return
    }
    Modal.confirm({
      title: "Kết toán học kỳ",
      content:
        "Hệ thống sẽ tính lại tiền mời giảng từ PCGV và ghi vào danh sách. Bản ghi đã thanh toán sẽ được giữ nguyên. Tiếp tục?",
      okText: "Kết toán",
      cancelText: "Hủy",
      onOk: () => runCalculate(false),
    })
  }

  const handleUpdateStatus = async () => {
    const values = await form.validateFields()
    showSpinner()
    try {
      const data: Record<string, unknown> = { status: values.status }
      if (values.status === PaymentStatus.PAID) {
        data.paymentDate = values.paymentDate ? values.paymentDate.toDate() : new Date()
      }
      if (values.transactionCode?.trim()) data.transactionCode = values.transactionCode.trim()
      if (values.decisionRef?.trim()) data.decisionRef = values.decisionRef.trim()

      await updateManyPayment({
        where: { id: { in: selectedRowKeys as string[] } },
        data,
      })
      message.success(`Đã cập nhật ${selectedRowKeys.length} bản ghi thanh toán`)
      setStatusModalOpen(false)
      setSelectedRowKeys([])
      await refetchPayments()
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return
      message.error("Cập nhật trạng thái thất bại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[0, 16]} align="middle" justify="space-between" className="mb-4">
            <Col flex="auto">
              <Flex align="center" gap={12} wrap>
                <span className="whitespace-nowrap font-medium">Học kỳ:</span>
                <Select
                  allowClear
                  showSearch
                  placeholder="Tất cả học kỳ"
                  className="min-w-[260px]"
                  optionFilterProp="label"
                  value={semesterId}
                  options={semesters.map((s) => ({ value: s.id, label: s.name }))}
                  onChange={(value) => {
                    setSemesterId(value)
                    setCurrentPage(1)
                    setSelectedRowKeys([])
                  }}
                />
              </Flex>
            </Col>
            <Col>
              <Flex gap={8} wrap justify="end">
                <Button disabled={!semesterId} onClick={() => runCalculate(true)}>
                  Tính thử
                </Button>
                <Button type="primary" ghost disabled={!semesterId} onClick={handleSettle}>
                  Kết toán học kỳ
                </Button>
                <Button
                  type="primary"
                  disabled={selectedRowKeys.length === 0}
                  onClick={handleOpenStatusModal}
                >
                  Cập nhật trạng thái
                </Button>
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            id="guest-teaching-payment"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            data={payments}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              getCheckboxProps: (record) => ({
                disabled: record.status === PaymentStatus.PAID,
              }),
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã GV",
                dataIndex: "name",
                width: 120,
                align: "center",
                type: "input",
                fixed: "left",
                render: (_, record) => record.lecturer?.code || "-",
              },
              {
                title: "Tên giảng viên",
                width: 200,
                align: "left",
                fixed: "left",
                render: (_, record) => lecturerName(record.lecturer),
              },
              {
                title: "Học kỳ",
                width: 160,
                align: "left",
                render: (_, record) => record.semester?.name || "-",
              },
              {
                title: "Khoa chủ trì",
                width: 200,
                align: "left",
                render: (_, record) => record.hiringOrg?.sTen || "-",
              },
              {
                title: "Số tiết",
                dataIndex: "totalPeriods",
                width: 90,
                align: "right",
                render: (value) => value ?? 0,
              },
              {
                title: "Đơn giá / tiết",
                dataIndex: "ratePerPeriod",
                width: 130,
                align: "right",
                render: (value) => (value != null ? `${Number(value).formatVND()}` : "-"),
              },
              {
                title: "Thành tiền",
                dataIndex: "amount",
                width: 140,
                align: "right",
                render: (value) => (value != null ? `${Number(value).formatVND()}` : "-"),
              },
              {
                title: "Mã giao dịch",
                dataIndex: "transactionCode",
                width: 150,
                align: "center",
                type: "input",
              },
              {
                title: "Số QĐ",
                dataIndex: "decisionRef",
                width: 130,
                align: "center",
                render: (value) => value || "-",
              },
              {
                title: "Ngày chi trả",
                dataIndex: "paymentDate",
                width: 120,
                align: "center",
                type: "date",
                render: (_, record) =>
                  record.paymentDate ? dayjs(record.paymentDate).format("DD/MM/YYYY") : "-",
              },
              {
                title: "Trạng thái",
                dataIndex: "paymentStatus",
                width: 140,
                align: "center",
                fixed: "right",
                type: "select",
                options: paymentStatusOptions,
                render: (_, record) => (
                  <Tag color={getPaymentStatusColor(record.status)}>
                    {getPaymentStatusLabel(record.status)}
                  </Tag>
                ),
              },
            ]}
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
        title={`Cập nhật trạng thái thanh toán (${selectedRowKeys.length} bản ghi)`}
        open={statusModalOpen}
        onOk={handleUpdateStatus}
        onCancel={() => setStatusModalOpen(false)}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" initialValues={{ status: PaymentStatus.PROCESSING }}>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              options={paymentStatusOptions.map((o) => ({ value: o.value, label: o.label }))}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
            {({ getFieldValue }) =>
              getFieldValue("status") === PaymentStatus.PAID ? (
                <Form.Item name="paymentDate" label="Ngày chi trả">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="transactionCode" label="Mã giao dịch (tùy chọn)">
            <Input placeholder="Áp dụng cho tất cả bản ghi đã chọn" />
          </Form.Item>
          <Form.Item name="decisionRef" label="Số quyết định (tùy chọn)">
            <Input placeholder="Áp dụng cho tất cả bản ghi đã chọn" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={calcResult?.dryRun ? "Kết quả tính thử kết toán" : "Kết quả kết toán"}
        open={!!calcResult}
        onCancel={() => setCalcResult(undefined)}
        footer={[
          <Button key="close" onClick={() => setCalcResult(undefined)}>
            Đóng
          </Button>,
        ]}
        width={720}
      >
        {calcResult && (
          <Flex vertical gap={12}>
            <Flex gap={8} wrap>
              <Tag color="blue">Tổng nhóm: {calcResult.totalGroups}</Tag>
              <Tag color="green">Tạo mới: {calcResult.created}</Tag>
              <Tag color="orange">Cập nhật: {calcResult.updated}</Tag>
              <Tag>Bỏ qua (đã TT): {calcResult.skippedPaid}</Tag>
              <Tag color={calcResult.unresolved.length ? "red" : "default"}>
                Chưa giải được: {calcResult.unresolved.length}
              </Tag>
            </Flex>
            {calcResult.dryRun && (
              <Alert
                type="info"
                message='Đây là kết quả tính thử, chưa ghi dữ liệu. Nhấn "Kết toán học kỳ" để lưu.'
              />
            )}
            {calcResult.items && calcResult.items.length > 0 && (
              <TableAntd
                size="small"
                rowKey={(r) => `${r.lecturerId}-${r.hiringOrgId}`}
                dataSource={calcResult.items}
                pagination={false}
                scroll={{ y: 320 }}
                columns={[
                  { title: "Giảng viên", dataIndex: "lecturerName", width: 180 },
                  { title: "Khoa chủ trì", dataIndex: "hiringOrgName", width: 160 },
                  { title: "Số tiết", dataIndex: "totalPeriods", align: "right", width: 80 },
                  {
                    title: "Đơn giá/tiết",
                    dataIndex: "ratePerPeriod",
                    align: "right",
                    width: 120,
                    render: (v: number) => Number(v).formatVND(),
                  },
                  {
                    title: "Thành tiền",
                    dataIndex: "amount",
                    align: "right",
                    width: 130,
                    render: (v: number) => Number(v).formatVND(),
                  },
                  {
                    title: "",
                    dataIndex: "action",
                    width: 90,
                    align: "center",
                    render: (a: string) =>
                      a === "create" ? (
                        <Tag color="green">Tạo mới</Tag>
                      ) : a === "update" ? (
                        <Tag color="orange">Cập nhật</Tag>
                      ) : (
                        <Tag>Đã TT</Tag>
                      ),
                  },
                ]}
              />
            )}
            {calcResult.unresolved.length > 0 && (
              <TableAntd
                size="small"
                rowKey={(r) => `${r.lecturerId}-${r.hiringOrgId ?? "-"}`}
                dataSource={calcResult.unresolved}
                pagination={false}
                scroll={{ y: 280 }}
                columns={[
                  { title: "Giảng viên", dataIndex: "lecturerName" },
                  { title: "Lý do", dataIndex: "reason" },
                ]}
              />
            )}
          </Flex>
        )}
      </Modal>
    </div>
  )
}

DanhSachThanhToanMoiGiang.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
