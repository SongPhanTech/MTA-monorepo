import type { SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import { formatThu } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import { Empty, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react"

interface LichTuanBangProps {
  suKien: SuKienLich[]
  isLoading?: boolean
  onXemChiTiet?: (suKien: SuKienLich) => void
}

const CHIEU_CAO_HEADER_BANG = 39

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

const LichTuanBang = ({ suKien, isLoading, onXemChiTiet }: LichTuanBangProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(120)
  const dongLich = useMemo(() => gopTheoNgay(suKien), [suKien])

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => {
      setChieuCaoBody(Math.max(120, el.clientHeight - CHIEU_CAO_HEADER_BANG))
    }

    capNhatChieuCao()
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    return () => observer.disconnect()
  }, [isLoading, suKien.length])

  return (
    <div
      ref={vungBangRef}
      className="h-full min-h-0 flex-1 overflow-hidden"
      style={{ "--gv-body-h": `${chieuCaoBody}px` } as CSSProperties}
    >
      <Table<DongLichTuan>
        rowKey="id"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={dongLich}
        loading={isLoading}
        pagination={false}
        scroll={{ x: "100%", y: chieuCaoBody }}
        className="bang-gv-full h-full [&_.ant-table]:text-xs"
        locale={{
          emptyText: (
            <Empty description="Không có lịch" image={Empty.PRESENTED_IMAGE_SIMPLE} className="m-0" />
          ),
        }}
        onRow={(record) => ({
          className: onXemChiTiet ? "cursor-pointer" : undefined,
          onClick: () => onXemChiTiet?.(record),
        })}
      />
    </div>
  )
}

export default LichTuanBang
