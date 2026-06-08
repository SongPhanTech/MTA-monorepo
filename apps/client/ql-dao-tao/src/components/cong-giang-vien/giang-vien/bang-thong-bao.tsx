import KhungPanel from "@components/cong-giang-vien/giang-vien/khung-panel"
import { DanhSachThongBao } from "@workspace/ui"

interface BangThongBaoProps {
  gon?: boolean
}

// Khối "Thông báo" - bao danh sách thông báo dùng chung.
const BangThongBao = ({ gon }: BangThongBaoProps) => {
  return (
    <KhungPanel
      className={gon ? "flex h-full min-h-0 flex-col" : undefined}
      tieuDe="Thông báo"
      bodyClassName={gon ? "min-h-0 flex-1 overflow-hidden p-1" : undefined}
    >
      <div className={gon ? "h-full overflow-y-auto [&>div]:!h-full [&>div]:!max-h-full" : undefined}>
        <DanhSachThongBao />
      </div>
    </KhungPanel>
  )
}

export default BangThongBao
