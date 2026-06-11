import type { SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import { Empty, Spin, Table } from "antd"
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

const renderLoaiLich = (row: SuKienLich) => (
  <span
    className="inline-block rounded border px-1.5 py-0 text-[10px] font-medium leading-tight"
    style={{
      borderColor: row.mauLoai,
      color: row.mauLoai,
      backgroundColor: `${row.mauLoai}14`,
    }}
  >
    {row.tenLoai}
  </span>
)

const columns: ColumnsType<SuKienLich> = [
  {
    title: "Thứ",
    dataIndex: "ngay",
    width: 72,
    ellipsis: true,
    render: (value: string) => formatThu(value),
  },
  {
    title: "Tiết",
    dataIndex: "tiet",
    width: 44,
    align: "center",
    ellipsis: true,
    render: (value?: string) => value ?? "—",
  },
  { title: "TG", dataIndex: "thoiGian", width: 88, ellipsis: true },
  {
    title: "Nội dung",
    dataIndex: "tieuDe",
    ellipsis: true,
    render: (value: string) => <span className="text-xs font-semibold">{value}</span>,
  },
  {
    title: "Loại",
    key: "loai",
    width: 80,
    ellipsis: true,
    render: (_, row) => renderLoaiLich(row),
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
