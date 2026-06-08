import TheThongBao from "@components/cong-giang-vien/thong-bao/the-thong-bao"
import type { ThongBaoView } from "@components/cong-giang-vien/thong-bao/types"
import { Empty, Spin } from "antd"

interface DanhSachThongBaoProps {
  danhSach: ThongBaoView[]
  loading?: boolean
  onChon?: (id: string) => void
}

const DanhSachThongBao = ({ danhSach, loading, onChon }: DanhSachThongBaoProps) => {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spin />
      </div>
    )
  }

  if (danhSach.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
        <Empty description="Không có thông báo" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {danhSach.map((item) => (
        <TheThongBao key={item.id} thongBao={item} onClick={onChon} />
      ))}
    </div>
  )
}

export default DanhSachThongBao
