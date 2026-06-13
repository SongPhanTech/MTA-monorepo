import BoLocDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bo-loc-diem-ren-luyen"
import BangDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bang-diem-ren-luyen"
import PhanTrangSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/phan-trang-sinh-vien"
import TheThongKeDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/the-thong-ke-diem-ren-luyen"
import { useDiemRenLuyenLopQuanLy } from "@hooks/use-diem-ren-luyen-lop-quan-ly"
import { useDisclosure } from "react-hook-disclosure-modal"

interface TabDiemRenLuyenProps {
  fixedClassId: string
  enabled: boolean
}

const TabDiemRenLuyen = ({ fixedClassId, enabled }: TabDiemRenLuyenProps) => {
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
  } = useDiemRenLuyenLopQuanLy(fixedClassId, enabled)

  const { onOpen: moChiTietSinhVien } = useDisclosure<string>({ tag: "ModalChiTietSinhVien" })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BoLocDiemRenLuyen semesterId={semesterId || ""} onApDung={apDungHocKy} />
      <TheThongKeDiemRenLuyen thongKe={thongKe} />
      <BangDiemRenLuyen
        danhSach={danhSach}
        loading={dangTai}
        trang={trang}
        soTrang={soTrang}
        onXemChiTiet={moChiTietSinhVien}
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

export default TabDiemRenLuyen
