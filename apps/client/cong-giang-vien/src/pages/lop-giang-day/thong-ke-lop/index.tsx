import BangThongKeLop from "@components/cong-giang-vien/lop-giang-day/bang-thong-ke-lop"
import BoLocLopGiangDayBar from "@components/cong-giang-vien/lop-giang-day/bo-loc-lop-giang-day"
import PhanTrangLopQuanLy from "@components/cong-giang-vien/lop-quan-ly/phan-trang-lop-quan-ly"
import { useLopGiangDayGiangVien } from "@hooks/use-lop-giang-day-giang-vien"
import { Breadcrumb, Typography } from "antd"

const ThongKeLopGiangDay = () => {
  const {
    boLoc,
    capNhatBoLoc,
    timKiem,
    doiTrangThaiNhapDiem,
    danhSach,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    isLoading,
  } = useLopGiangDayGiangVien()

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <Typography.Title level={2} className="!mb-0 text-cgv-green-dark">
          Thống kê giảng dạy
        </Typography.Title>
        <Breadcrumb>
          <Breadcrumb.Item href="/" className="text-sm">
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item className="text-sm">Thống kê giảng dạy</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <BoLocLopGiangDayBar
        boLoc={boLoc}
        onChange={capNhatBoLoc}
        onDoiTrangThaiNhapDiem={doiTrangThaiNhapDiem}
        onTimKiem={timKiem}
      />

      <BangThongKeLop danhSach={danhSach} loading={isLoading} trang={trang} soTrang={soTrang} />

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

export default ThongKeLopGiangDay
