import DefaultLayout from "@layouts/default-layout"
import {
  type RegistrationStatsPayload,
  useRegistrationStats,
} from "@workspace/libs/api/portal-registration-stats"
import { useFindManyClassRegisterSession } from "@workspace/db/hooks"
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs, { type Dayjs } from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"

dayjs.locale("vi")

const { RangePicker } = DatePicker
const { Text } = Typography

type FailureRow = RegistrationStatsPayload["failures"]["items"][number]

export default function ThongKeDangKyHocPage() {
  const [sessionId, setSessionId] = useState<string>()
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf("day").hour(8),
    dayjs().startOf("day").hour(17),
  ])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [stats, setStats] = useState<RegistrationStatsPayload | null>(null)

  const { data: sessions = [], isLoading: loadingSessions } = useFindManyClassRegisterSession({
    where: { deletedAt: null },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      semester: { select: { name: true, schoolYear: { select: { name: true } } } },
    },
  })

  const { mutateAsync, isPending } = useRegistrationStats()

  const sessionOptions = useMemo(
    () =>
      sessions.map((s) => ({
        value: s.id,
        label: [s.name, s.semester?.name, s.semester?.schoolYear?.name].filter(Boolean).join(" - "),
      })),
    [sessions]
  )

  useEffect(() => {
    if (!sessionId && sessions[0]?.id) {
      setSessionId(sessions[0].id)
    }
  }, [sessionId, sessions])

  const loadStats = useCallback(
    async (nextPage = page, nextPageSize = pageSize) => {
      if (!sessionId || !range?.[0] || !range?.[1]) return
      try {
        const res = await mutateAsync({
          classRegisterSessionId: sessionId,
          from: range[0].toISOString(),
          to: range[1].toISOString(),
          page: nextPage,
          pageSize: nextPageSize,
        })
        if (res.status === 200 && "summary" in res.data) {
          setStats(res.data)
          return
        }
        const errMsg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? (res.data as { message?: string }).message
            : undefined
        message.error(errMsg || "Không lấy được thống kê")
      } catch {
        message.error("Không lấy được thống kê")
      }
    },
    [sessionId, range, page, pageSize, mutateAsync]
  )

  useEffect(() => {
    void loadStats(page, pageSize)
  }, [loadStats, page, pageSize])

  const columns: ColumnsType<FailureRow> = [
    {
      title: "Thời gian",
      dataIndex: "occurredAt",
      width: 170,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Mã HV",
      width: 120,
      render: (_, row) => row.student.studentCode || "—",
    },
    {
      title: "Họ tên",
      width: 180,
      render: (_, row) => row.student.fullName || "—",
    },
    {
      title: "Lớp quản lý",
      width: 120,
      render: (_, row) => row.student.fixedClassName || "—",
    },
    {
      title: "Lớp môn học",
      render: (_, row) =>
        row.subjectClasses.length === 0 ? (
          "—"
        ) : (
          <Space wrap size={[4, 4]}>
            {row.subjectClasses.map((sc) => (
              <Tag key={sc.id}>
                {sc.classCode} — {sc.subjectName}
              </Tag>
            ))}
          </Space>
        ),
    },
    {
      title: "Lỗi",
      width: 280,
      render: (_, row) => (
        <div>
          {row.code ? <Tag color="error">{row.code}</Tag> : null}
          <Text type="secondary">{row.message}</Text>
        </div>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card size="small">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Text strong>Đợt đăng ký</Text>
            <Select
              style={{ width: "100%", marginTop: 4 }}
              loading={loadingSessions}
              options={sessionOptions}
              value={sessionId}
              placeholder="Chọn đợt đăng ký"
              onChange={(v) => {
                setSessionId(v)
                setPage(1)
              }}
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={24} md={14}>
            <Text strong>Khoảng thời gian</Text>
            <RangePicker
              style={{ width: "100%", marginTop: 4 }}
              showTime={{ format: "HH:mm" }}
              format="DD/MM/YYYY HH:mm"
              value={range}
              onChange={(v) => {
                if (v?.[0] && v?.[1]) {
                  setRange([v[0], v[1]])
                  setPage(1)
                }
              }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card loading={isPending}>
            <Statistic title="Đủ điều kiện" value={stats?.summary.eligibleCount ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isPending}>
            <Statistic
              title="Đã đăng ký thành công"
              value={stats?.summary.registeredCount ?? 0}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isPending}>
            <Statistic
              title="Chưa đăng ký"
              value={stats?.summary.notRegisteredCount ?? 0}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={isPending}>
            <Statistic
              title="Không đăng ký được (lỗi)"
              value={stats?.summary.failedCount ?? 0}
              valueStyle={{ color: "#d48806" }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết đăng ký lỗi" loading={isPending && !stats}>
        {!stats?.failures.items.length ? (
          <Empty description="Không có lỗi đăng ký trong khoảng thời gian đã chọn" />
        ) : (
          <Table<FailureRow>
            rowKey="id"
            columns={columns}
            dataSource={stats.failures.items}
            pagination={{
              current: page,
              pageSize,
              total: stats.failures.total,
              showSizeChanger: true,
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </Space>
  )
}

ThongKeDangKyHocPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Thống kê đăng ký học" }]}>{page}</DefaultLayout>
}
