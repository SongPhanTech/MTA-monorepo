import BoLocDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bo-loc-diem-ren-luyen"
import BangTongKet from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bang-tong-ket"
import PhanTrangSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/phan-trang-sinh-vien"
import TheThongKeTongKet from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/the-thong-ke-tong-ket"
import { ketQuaHocTapSinhVienLopQuanLyPath } from "@/utils/cong-giang-vien-path-helper"
import { useTongKetLopQuanLy } from "@hooks/use-tong-ket-lop-quan-ly"
import { useRouter } from "next/router"

interface TabTongKetProps {
  fixedClassId: string
  enabled: boolean
}

const TabTongKet = ({ fixedClassId, enabled }: TabTongKetProps) => {
  const router = useRouter()
  const {
    semesterId,
    apDungHocKy,
    danhSach,
    thongKe,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    dangTai,
  } = useTongKetLopQuanLy(fixedClassId, enabled)

  const xemChiTiet = (studentId: string) => {
    router.push(ketQuaHocTapSinhVienLopQuanLyPath(fixedClassId, studentId))
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BoLocDiemRenLuyen semesterId={semesterId || ""} onApDung={apDungHocKy} />
      <TheThongKeTongKet thongKe={thongKe} />
      <BangTongKet
        danhSach={danhSach}
        loading={dangTai}
        trang={trang}
        soTrang={soTrang}
        onXemChiTiet={xemChiTiet}
      />
      <PhanTrangSinhVien
        trang={trang}
        soTrang={soTrang}
        tongSo={tongSo}
        onDoiTrang={setTrang}
        onDoiSoTrang={setSoTrang}
      />
    </div>
  )
}

export default TabTongKet
