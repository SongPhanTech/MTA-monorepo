import BangLopTroGiang from "@components/cong-giang-vien/lop-tro-giang/bang-lop-tro-giang"
import BoLocLopTroGiangBar from "@components/cong-giang-vien/lop-tro-giang/bo-loc-lop-tro-giang"
import PhanTrangLopQuanLy from "@components/cong-giang-vien/lop-quan-ly/phan-trang-lop-quan-ly"
import { useLopTroGiangGiangVien } from "@hooks/use-lop-tro-giang-giang-vien"
import { Breadcrumb, Typography } from "antd"

const LopTroGiang = () => {
  const {
    boLoc,
    capNhatBoLoc,
    timKiem,
    doiTrangThai,
    danhSach,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    isLoading,
  } = useLopTroGiangGiangVien()

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <Typography.Title level={2} className="text-cgv-green-dark">
          Danh sách lớp trợ giảng
        </Typography.Title>
        <Breadcrumb>
          <Breadcrumb.Item href="/" className="text-sm">
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item className="text-sm">Danh sách lớp trợ giảng</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <BoLocLopTroGiangBar
        boLoc={boLoc}
        onChange={capNhatBoLoc}
        onDoiTrangThai={doiTrangThai}
        onTimKiem={timKiem}
      />

      <BangLopTroGiang danhSach={danhSach} loading={isLoading} trang={trang} soTrang={soTrang} />

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

export default LopTroGiang
