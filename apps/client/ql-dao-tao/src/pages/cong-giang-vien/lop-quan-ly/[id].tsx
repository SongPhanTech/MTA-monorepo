import TabNoiDungLopQuanLy from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/tab-noi-dung-lop-quan-ly"
import TheThongTinLop from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/the-thong-tin-lop"
import TieuDeChiTietLopQuanLy from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/tieu-de-chi-tiet"
import { CONG_GIANG_VIEN_LOP_QUAN_LY_PATH } from "@constants/cong-giang-vien-path"
import { useChiTietLopQuanLyGiangVien } from "@hooks/use-chi-tiet-lop-quan-ly-giang-vien"
import { Alert } from "antd"
import Link from "next/link"
import { useRouter } from "next/router"

function TrangChiTietLopQuanLy() {
  const router = useRouter()
  const fixedClassId = router.query.id as string

  const {
    thongTinLop,
    coQuyenXem,
    dangTaiLop,
    boLoc,
    capNhatBoLoc,
    timKiem,
    doiBoLocNgay,
    danhSachSinhVien,
    tongSinhVien,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    dangTaiSinhVien,
    layNhanTrangThai,
  } = useChiTietLopQuanLyGiangVien(fixedClassId)

  const daTaiXong = !dangTaiLop && !!fixedClassId

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <TieuDeChiTietLopQuanLy />

      {daTaiXong && !coQuyenXem ? (
        <Alert
          type="warning"
          showIcon
          message="Bạn không có quyền xem lớp quản lý này."
          description={
            <Link href={CONG_GIANG_VIEN_LOP_QUAN_LY_PATH} className="text-cgv-green-dark">
              Quay lại danh sách lớp quản lý
            </Link>
          }
        />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-stretch">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <TheThongTinLop thongTin={thongTinLop} loading={dangTaiLop} />
          </div>

          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-100 bg-white">
            <TabNoiDungLopQuanLy
              fixedClassId={fixedClassId}
              coQuyenXem={coQuyenXem}
              tabProps={{
                boLoc,
                capNhatBoLoc,
                timKiem,
                doiBoLocNgay,
                danhSachSinhVien,
                dangTaiSinhVien,
                trang,
                soTrang,
                tongSinhVien,
                setTrang,
                setSoTrang,
                layNhanTrangThai,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default TrangChiTietLopQuanLy
