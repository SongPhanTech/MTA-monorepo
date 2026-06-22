import BoLocThongBao from "@components/cong-giang-vien/thong-bao/bo-loc-thong-bao"
import DanhSachThongBao from "@components/cong-giang-vien/thong-bao/danh-sach-thong-bao"
import PhanTrangThongBao from "@components/cong-giang-vien/thong-bao/phan-trang-thong-bao"
import TieuDeTrangThongBao from "@components/cong-giang-vien/thong-bao/tieu-de-trang"
import {
  duongDanNhapDiemTheoThongBao,
  type ThongBaoView,
} from "@components/cong-giang-vien/thong-bao/types"
import { useThongBaoGiangVien } from "@hooks/use-thong-bao-giang-vien"
import { message } from "antd"
import { useRouter } from "next/router"

function ThongBaoGiangVienPage() {
  const {
    boLoc,
    capNhatBoLoc,
    danhSach,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    isLoading,
    soChuaDoc,
    danhDauDaDoc,
    danhDauTatCaDaDoc,
  } = useThongBaoGiangVien()

  const router = useRouter()

  const handleChonThongBao = (thongBao: ThongBaoView) => {
    danhDauDaDoc(thongBao.id)
    const duongDan = duongDanNhapDiemTheoThongBao(thongBao)
    if (duongDan) router.push(duongDan)
  }

  const handleDanhDauDaDoc = (id: string) => {
    if (danhDauDaDoc(id)) {
      message.success("Đã đánh dấu đã đọc")
    }
  }

  const handleDanhDauTatCaDaDoc = () => {
    const soLuong = danhDauTatCaDaDoc()
    if (soLuong === 0) {
      message.info("Không còn thông báo chưa đọc")
      return
    }
    message.success(`Đã đánh dấu ${soLuong} thông báo là đã đọc`)
  }

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <TieuDeTrangThongBao />
      <BoLocThongBao
        boLoc={boLoc}
        soChuaDoc={soChuaDoc}
        onChange={capNhatBoLoc}
        onDanhDauTatCaDaDoc={handleDanhDauTatCaDaDoc}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <DanhSachThongBao
          danhSach={danhSach}
          loading={isLoading}
          onChon={handleChonThongBao}
          onDanhDauDaDoc={handleDanhDauDaDoc}
        />
      </div>
      <PhanTrangThongBao
        trang={trang}
        soTrang={soTrang}
        tongSo={tongSo}
        onDoiTrang={setTrang}
        onDoiSoTrang={setSoTrang}
      />
    </div>
  )
}

export default ThongBaoGiangVienPage
