import KhungPanel from "@components/cong-giang-vien/giang-vien/khung-panel"
import TheThongBao from "@components/cong-giang-vien/thong-bao/the-thong-bao"
import {
  duongDanNhapDiemTheoThongBao,
  type ThongBaoView,
} from "@components/cong-giang-vien/thong-bao/types"
import { useThongBaoGiangVien } from "@hooks/use-thong-bao-giang-vien"
import { ROUTER_PATH } from "@workspace/router"
import { Empty, Spin } from "antd"
import Link from "next/link"
import { useRouter } from "next/router"

interface BangThongBaoProps {
  gon?: boolean
}

// Khối thông báo tóm tắt trên trang chủ cổng GV.
const BangThongBao = ({ gon }: BangThongBaoProps) => {
  const { danhSachTomTat, isLoading, danhDauDaDoc } = useThongBaoGiangVien()

  const router = useRouter()

  const handleChon = (thongBao: ThongBaoView) => {
    danhDauDaDoc(thongBao.id)
    const duongDan = duongDanNhapDiemTheoThongBao(thongBao)
    if (duongDan) router.push(duongDan)
  }

  const noiDung = isLoading ? (
    <div className="flex h-full min-h-[120px] items-center justify-center">
      <Spin size="small" />
    </div>
  ) : danhSachTomTat.length === 0 ? (
    <div className="flex h-full min-h-[120px] items-center justify-center">
      <Empty description="Không có thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
  ) : (
    danhSachTomTat.map((item) => (
      <TheThongBao key={item.id} thongBao={item} compact={gon} onClick={handleChon} />
    ))
  )

  return (
    <KhungPanel
      className={gon ? "flex h-full min-h-0 flex-col overflow-hidden" : undefined}
      tieuDe="Thông báo"
      action={
        <Link
          href={ROUTER_PATH.CONG_GIANG_VIEN.THONG_BAO}
          className="text-sm text-primary hover:underline"
        >
          Xem tất cả →
        </Link>
      }
      bodyClassName={gon ? "flex min-h-0 flex-1 flex-col overflow-hidden p-1" : undefined}
    >
      {gon ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
            {noiDung}
          </div>
        </div>
      ) : (
        <div className="space-y-2">{noiDung}</div>
      )}
    </KhungPanel>
  )
}

export default BangThongBao
