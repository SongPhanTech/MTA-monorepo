import { LOAI_LICH_META, type SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import { Empty, Spin, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

interface LichTuanBangProps {
  suKien: SuKienLich[]
  isLoading?: boolean
}

const formatThu = (ngay: string) => {
  const d = dayjs(ngay)
  const thu = d.day()
  if (thu === 0) return `CN ${d.format("DD/MM")}`
  return `T${thu + 1} ${d.format("DD/MM")}`
}

const columns: ColumnsType<SuKienLich> = [
  {
    title: "Thứ",
    dataIndex: "ngay",
    width: 72,
    ellipsis: true,
    render: (value: string) => formatThu(value),
  },
  { title: "Tiết", dataIndex: "tiet", width: 44, align: "center", ellipsis: true },
  { title: "TG", dataIndex: "thoiGian", width: 88, ellipsis: true },
  {
    title: "Nội dung",
    dataIndex: "tieuDe",
    ellipsis: true,
    render: (value: string) => <span className="text-xs font-semibold">{value}</span>,
  },
  {
    title: "Loại",
    dataIndex: "loaiLich",
    width: 80,
    ellipsis: true,
    render: (value: SuKienLich["loaiLich"]) => {
      const meta = LOAI_LICH_META[value]
      return (
        <Tag color={meta.badgeColor} className="m-0 text-[10px] leading-tight">
          {meta.label}
        </Tag>
      )
    },
  },
]

const LichTuanBang = ({ suKien, isLoading }: LichTuanBangProps) => {
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spin size="small" />
      </div>
    )
  }

  if (!suKien.length) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Empty description="Không có lịch" image={Empty.PRESENTED_IMAGE_SIMPLE} className="m-0" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto [&_.ant-table]:text-xs">
      <Table<SuKienLich>
        rowKey="id"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={suKien}
        pagination={false}
        className="w-full"
      />
    </div>
  )
}

export default LichTuanBang
