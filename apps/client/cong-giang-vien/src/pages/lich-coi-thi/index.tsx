import { useSession } from "@workspace/auth/react"
import { useFindManySchoolYear } from "@workspace/db/hooks"
import {
  type LecturerExamScheduleItem,
  useLecturerExamSchedule,
} from "@workspace/libs/api/training-exam-schedule"
import { Col, DatePicker, Empty, Row, Select, Space, Table, Typography, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs, { type Dayjs } from "dayjs"
import { useEffect, useMemo, useState } from "react"

dayjs.locale("vi")

const { RangePicker } = DatePicker
const { Text } = Typography

function formatExamDate(value?: string | null) {
  if (!value) return ""
  const d = dayjs(value)
  return d.isValid() ? d.format("DD/MM/YYYY") : value
}

function formatTime(value?: string | null) {
  if (!value) return ""
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5)
  const d = dayjs(value)
  return d.isValid() ? d.format("HH:mm") : value
}

export default function LichCoiThiPage() {
  const { data: me } = useSession()
  const userProfileId = me?.sDM_NhanVienId || ""

  const [schoolYearId, setSchoolYearId] = useState<string>()
  const [semesterId, setSemesterId] = useState<string>()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const { data: schoolYears = [], isLoading: loadingYears } = useFindManySchoolYear({
    where: { deletedAt: null, active: true },
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        where: { deletedAt: null, active: true },
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, schoolYearId: true },
      },
    },
    take: 50,
  })

  const semesterOptions = useMemo(() => {
    const years = schoolYearId ? schoolYears.filter((y) => y.id === schoolYearId) : schoolYears
    return years.flatMap((y) =>
      (y.semesters ?? []).map((s) => ({
        value: s.id,
        label: schoolYearId ? s.name : `${s.name} (${y.name})`,
      }))
    )
  }, [schoolYears, schoolYearId])

  useEffect(() => {
    if (!semesterId) return
    const stillValid = semesterOptions.some((o) => o.value === semesterId)
    if (!stillValid) setSemesterId(undefined)
  }, [semesterId, semesterOptions])

  const queryParams = useMemo(
    () => ({
      userProfileId,
      schoolYearId,
      semesterId,
      fromDate: dateRange?.[0]?.isValid() ? dateRange[0].format("YYYY-MM-DD") : undefined,
      toDate: dateRange?.[1]?.isValid() ? dateRange[1].format("YYYY-MM-DD") : undefined,
    }),
    [userProfileId, schoolYearId, semesterId, dateRange]
  )

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useLecturerExamSchedule(queryParams, {
    enabled: !!userProfileId,
  })

  useEffect(() => {
    if (!response) return
    if (response.status !== 200) {
      message.error(response.data?.message || "Không lấy được lịch coi thi")
    }
  }, [response])

  const rows = response?.status === 200 ? response.data.Data : []
  const total = response?.status === 200 ? response.data.Total : 0

  const columns: ColumnsType<LecturerExamScheduleItem> = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_v, _r, index) => index + 1,
    },
    {
      title: "Ngày thi",
      dataIndex: "exam_date",
      width: 110,
      render: (v) => formatExamDate(v),
    },
    {
      title: "Ca thi",
      dataIndex: "exam_period_name",
      width: 90,
    },
    {
      title: "Giờ",
      width: 120,
      render: (_v, row) => {
        const start = formatTime(row.start_time)
        const end = formatTime(row.end_time)
        if (!start && !end) return ""
        return `${start}${start && end ? " - " : ""}${end}`
      },
    },
    {
      title: "Mã môn",
      dataIndex: "subject_code",
      width: 110,
    },
    {
      title: "Tên môn học",
      dataIndex: "subject_name",
      ellipsis: true,
    },
    {
      title: "STC",
      dataIndex: "credit_count",
      width: 60,
      align: "center",
    },
    {
      title: "Lớp thi",
      dataIndex: "exam_class_code",
      width: 140,
      ellipsis: true,
    },
    {
      title: "Số SV",
      dataIndex: "student_count",
      width: 70,
      align: "center",
    },
    {
      title: "Phòng",
      dataIndex: "room_name",
      width: 90,
    },
    {
      title: "Nhà",
      dataIndex: "building_name",
      width: 100,
    },
    {
      title: "Địa điểm",
      dataIndex: "training_location_name",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Hình thức",
      dataIndex: "exam_type",
      width: 100,
    },
    {
      title: "Học kỳ",
      dataIndex: "semester_name",
      width: 110,
    },
    {
      title: "Năm học",
      dataIndex: "school_year_name",
      width: 110,
    },
  ]

  return (
    <Space direction="vertical" size={16} className="w-full">
      <div>
        <Text strong className="text-base">
          Lịch coi thi
        </Text>
        <div className="text-gray-500 text-sm mt-1">
          Tra cứu lịch coi thi theo năm học, học kỳ hoặc khoảng ngày
        </div>
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Năm học"
            className="w-full"
            loading={loadingYears}
            value={schoolYearId}
            options={schoolYears.map((y) => ({ value: y.id, label: y.name }))}
            onChange={(value) => {
              setSchoolYearId(value)
              setSemesterId(undefined)
            }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Học kỳ"
            className="w-full"
            value={semesterId}
            options={semesterOptions}
            onChange={setSemesterId}
          />
        </Col>
        <Col xs={24} sm={24} md={12}>
          <RangePicker
            className="w-full"
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
            value={dateRange}
            onChange={(values) => setDateRange(values)}
          />
        </Col>
      </Row>

      <Table<LecturerExamScheduleItem>
        rowKey={(row) => row.Id || `${row.subject_code}-${row.exam_date}-${row.start_time}`}
        size="small"
        bordered
        loading={isLoading || isFetching}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1400 }}
        locale={{
          emptyText: isError ? (
            <Empty description="Không tải được lịch coi thi" />
          ) : (
            <Empty description="Không có lịch coi thi" />
          ),
        }}
        pagination={{
          showSizeChanger: true,
          showTotal: () => `Tổng ${total} lịch coi thi`,
          defaultPageSize: 20,
        }}
      />
    </Space>
  )
}
