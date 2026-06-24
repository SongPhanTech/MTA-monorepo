import BoLocDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bo-loc-diem-ren-luyen"
import BangDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bang-diem-ren-luyen"
import PhanTrangSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/phan-trang-sinh-vien"
import TheThongKeDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/the-thong-ke-diem-ren-luyen"
import { useDiemRenLuyenLopQuanLy } from "@hooks/use-diem-ren-luyen-lop-quan-ly"

interface TabDiemRenLuyenProps {
  fixedClassId: string
  enabled: boolean
}

const TabDiemRenLuyen = ({ fixedClassId, enabled }: TabDiemRenLuyenProps) => {
  const {
    schoolYearId,
    semesterId,
    apDungBoLoc,
    locDiem,
    chonLocDiem,
    danhSach,
    thongKe,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    dangTai,
  } = useDiemRenLuyenLopQuanLy(fixedClassId, enabled)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BoLocDiemRenLuyen
        schoolYearId={schoolYearId}
        semesterId={semesterId}
        onApDung={apDungBoLoc}
      />
      <TheThongKeDiemRenLuyen
        thongKe={thongKe}
        locDiem={locDiem}
        onChonLocDiem={chonLocDiem}
      />
      <BangDiemRenLuyen danhSach={danhSach} loading={dangTai} trang={trang} soTrang={soTrang} />
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
