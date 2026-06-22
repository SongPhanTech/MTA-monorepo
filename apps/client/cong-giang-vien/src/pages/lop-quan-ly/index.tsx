import BangDanhSachLopQuanLy from "@components/cong-giang-vien/lop-quan-ly/bang-danh-sach-lop-quan-ly"
import BoLocLopQuanLyBar from "@components/cong-giang-vien/lop-quan-ly/bo-loc-lop-quan-ly"
import PhanTrangLopQuanLy from "@components/cong-giang-vien/lop-quan-ly/phan-trang-lop-quan-ly"
import TieuDeTrangLopQuanLy from "@components/cong-giang-vien/lop-quan-ly/tieu-de-trang"
import { chiTietLopQuanLyPath } from "@/utils/cong-giang-vien-path-helper"
import { useLopQuanLyGiangVien } from "@hooks/use-lop-quan-ly-giang-vien"
import { useRouter } from "next/router"

function LopQuanLyGiangVienPage() {
  const router = useRouter()
  const {
    boLoc,
    capNhatBoLoc,
    timKiem,
    doiLoaiLop,
    danhSach,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    isLoading,
  } = useLopQuanLyGiangVien()

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <TieuDeTrangLopQuanLy />
      <BoLocLopQuanLyBar
        boLoc={boLoc}
        onChange={capNhatBoLoc}
        onDoiLoaiLop={doiLoaiLop}
        onTimKiem={timKiem}
      />
      <BangDanhSachLopQuanLy
        danhSach={danhSach}
        loading={isLoading}
        trang={trang}
        soTrang={soTrang}
        onXemChiTiet={(id) => router.push(chiTietLopQuanLyPath(id))}
      />
      <PhanTrangLopQuanLy
        trang={trang}
        soTrang={soTrang}
        tongSo={tongSo}
        onDoiTrang={setTrang}
        onDoiSoTrang={setSoTrang}
      />
    </div>
  )
}

export default LopQuanLyGiangVienPage
