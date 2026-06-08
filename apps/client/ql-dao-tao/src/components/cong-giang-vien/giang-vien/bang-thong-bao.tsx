import KhungPanel from "@components/cong-giang-vien/giang-vien/khung-panel"
import TheThongBao from "@components/cong-giang-vien/thong-bao/the-thong-bao"
import { CONG_GIANG_VIEN_THONG_BAO_PATH } from "@constants/cong-giang-vien-path"
import { useThongBaoGiangVien } from "@hooks/use-thong-bao-giang-vien"
import { Empty, Spin } from "antd"
import Link from "next/link"
import { useDisclosure } from "react-hook-disclosure-modal"

interface BangThongBaoProps {
  gon?: boolean
}

// Khối thông báo tóm tắt trên trang chủ cổng GV.
const BangThongBao = ({ gon }: BangThongBaoProps) => {
  const { danhSachTomTat, isLoading, danhDauDaDoc } = useThongBaoGiangVien()

  const { onOpen: moChiTiet } = useDisclosure<string>({
    tag: "ViewNotificationModal",
  })

  const handleChon = (id: string) => {
    danhDauDaDoc(id)
    moChiTiet(id)
  }

  return (
    <KhungPanel
      className={gon ? "flex h-full min-h-0 flex-col" : undefined}
      tieuDe="Thông báo"
      action={
        <Link
          href={CONG_GIANG_VIEN_THONG_BAO_PATH}
          className="text-sm text-primary hover:underline"
        >
          Xem tất cả →
        </Link>
      }
      bodyClassName={gon ? "min-h-0 flex-1 overflow-hidden p-1" : undefined}
    >
      <div className={gon ? "h-full space-y-2 overflow-y-auto pr-1" : "space-y-2"}>
        {isLoading ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <Spin size="small" />
          </div>
        ) : danhSachTomTat.length === 0 ? (
          <Empty description="Không có thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          danhSachTomTat.map((item) => (
            <TheThongBao key={item.id} thongBao={item} compact={gon} onClick={handleChon} />
          ))
        )}
      </div>
    </KhungPanel>
  )
}

export default BangThongBao
