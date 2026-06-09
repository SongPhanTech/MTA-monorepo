import BoLocThongBao from "@components/cong-giang-vien/thong-bao/bo-loc-thong-bao"
import DanhSachThongBao from "@components/cong-giang-vien/thong-bao/danh-sach-thong-bao"
import PhanTrangThongBao from "@components/cong-giang-vien/thong-bao/phan-trang-thong-bao"
import TieuDeTrangThongBao from "@components/cong-giang-vien/thong-bao/tieu-de-trang"
import { useThongBaoGiangVien } from "@hooks/use-thong-bao-giang-vien"
import { useDisclosure } from "react-hook-disclosure-modal"

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
    danhDauDaDoc,
    danhDauTatCaDaDoc,
  } = useThongBaoGiangVien()

  const { onOpen: moChiTiet } = useDisclosure<string>({
    tag: "ViewNotificationModal",
  })

  const handleChonThongBao = (id: string) => {
    danhDauDaDoc(id)
    moChiTiet(id)
  }

  return (
    <div className="flex flex-col gap-4">
      <TieuDeTrangThongBao />
      <BoLocThongBao
        boLoc={boLoc}
        onChange={capNhatBoLoc}
        onDanhDauTatCaDaDoc={danhDauTatCaDaDoc}
      />
      <DanhSachThongBao danhSach={danhSach} loading={isLoading} onChon={handleChonThongBao} />
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
