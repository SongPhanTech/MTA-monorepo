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
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <TieuDeTrangThongBao />
      <BoLocThongBao
        boLoc={boLoc}
        onChange={capNhatBoLoc}
        onDanhDauTatCaDaDoc={danhDauTatCaDaDoc}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <DanhSachThongBao danhSach={danhSach} loading={isLoading} onChon={handleChonThongBao} />
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
