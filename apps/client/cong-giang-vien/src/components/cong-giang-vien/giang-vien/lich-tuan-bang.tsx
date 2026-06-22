import type { SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import { formatThu } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import { Empty, Spin, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useMemo } from "react"

interface LichTuanBangProps {
  suKien: SuKienLich[]
  isLoading?: boolean
}

/** Dòng bảng lịch tuần đã gộp các sự kiện cùng ngày để merge ô Thứ/Ngày. */
type DongLichTuan = SuKienLich & {
  thu: string
  ngayHienThi: string
  rowSpanNgay: number
}

const gopTheoNgay = (suKien: SuKienLich[]): DongLichTuan[] => {
  const rows: DongLichTuan[] = []
  let i = 0

  while (i < suKien.length) {
    const ngayKey = dayjs(suKien[i].ngay).format("YYYY-MM-DD")
    const nhom: SuKienLich[] = []

    while (i < suKien.length && dayjs(suKien[i].ngay).format("YYYY-MM-DD") === ngayKey) {
      nhom.push(suKien[i])
      i++
    }

    const count = nhom.length
    nhom.forEach((sk, idx) => {
      rows.push({
        ...sk,
        thu: formatThu(sk.ngay),
        ngayHienThi: dayjs(sk.ngay).format("DD/MM"),
        rowSpanNgay: idx === 0 ? count : 0,
      })
    })
  }

  return rows
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

const columns: ColumnsType<DongLichTuan> = [
  {
    title: "Thứ",
    dataIndex: "thu",
    width: 64,
    align: "center",
    ellipsis: true,
    onCell: (row) => ({ rowSpan: row.rowSpanNgay }),
  },
  {
    title: "Ngày",
    dataIndex: "ngayHienThi",
    width: 64,
    align: "center",
    ellipsis: true,
    onCell: (row) => ({ rowSpan: row.rowSpanNgay }),
  },
  { title: "Thời gian", dataIndex: "thoiGian", width: 100, ellipsis: true },
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
  const dongLich = useMemo(() => gopTheoNgay(suKien), [suKien])

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
      <Table<DongLichTuan>
        rowKey="id"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={dongLich}
        pagination={false}
        className="w-full"
      />
    </div>
  )
}

export default LichTuanBang
