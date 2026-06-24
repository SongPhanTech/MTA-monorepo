import BangDiemDanh from "@components/cong-giang-vien/lop-tro-giang/diem-danh/bang-diem-danh"
import BoLocDiemDanh from "@components/cong-giang-vien/lop-tro-giang/diem-danh/bo-loc-diem-danh"
import DongTomTatDiemDanh from "@components/cong-giang-vien/lop-tro-giang/diem-danh/dong-tom-tat-diem-danh"
import ThongTinBuoiHocCard from "@components/cong-giang-vien/lop-tro-giang/diem-danh/thong-tin-buoi-hoc"
import TieuDeDiemDanh from "@components/cong-giang-vien/lop-tro-giang/diem-danh/tieu-de-diem-danh"
import NutLuuDiemDanh from "@components/cong-giang-vien/lop-tro-giang/diem-danh/nut-luu-diem-danh"
import TongKetDiemDanhCard from "@components/cong-giang-vien/lop-tro-giang/diem-danh/tong-ket-diem-danh"
import { useDiemDanhGiangDay } from "@hooks/use-diem-danh-giang-day"
import { ROUTER_PATH } from "@workspace/router"
import { Empty } from "antd"
import { useRouter } from "next/router"

const TrangDiemDanhGiangDay = () => {
  const router = useRouter()
  const lopIdMacDinh = router.query.lopId as string | undefined

  const {
    monHocId,
    lopId,
    ngay,
    monHocOptions,
    lopOptions,
    dangTaiLop,
    doiMonHoc,
    setLopId,
    setNgay,
    layDanhSach,
    danhSach,
    thongTinBuoiHoc,
    tongKet,
    ghiChuBuoiHoc,
    setGhiChuBuoiHoc,
    daLayDanhSach,
    dangTaiChiTiet,
    doiTrangThaiSinhVien,
    doiGhiChuSinhVien,
    luuDiemDanh,
    dangLuu,
  } = useDiemDanhGiangDay(lopIdMacDinh)

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <TieuDeDiemDanh
        danhMucLabel="Lớp giảng dạy"
        danhMucPath={ROUTER_PATH.CONG_GIANG_VIEN.LOP_GIANG_DAY_DANH_SACH_LOP_GIANG_DAY}
      />

      <BoLocDiemDanh
        monHocId={monHocId}
        lopId={lopId}
        ngay={ngay}
        monHocOptions={monHocOptions}
        lopOptions={lopOptions}
        dangTaiLop={dangTaiLop}
        onDoiMonHoc={doiMonHoc}
        onDoiLop={setLopId}
        onDoiNgay={setNgay}
        onLayDanhSach={layDanhSach}
      />

      {!daLayDanhSach ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-100 bg-white">
          <Empty description="Chọn lớp và ngày rồi bấm 'Lấy danh sách' để điểm danh" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
            <DongTomTatDiemDanh tongKet={tongKet} />
            <BangDiemDanh
              danhSach={danhSach}
              loading={dangTaiChiTiet}
              onDoiTrangThai={doiTrangThaiSinhVien}
              onDoiGhiChu={doiGhiChuSinhVien}
            />
          </div>

          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4">
                <ThongTinBuoiHocCard
                  thongTin={thongTinBuoiHoc}
                  ghiChuBuoiHoc={ghiChuBuoiHoc}
                  onDoiGhiChu={setGhiChuBuoiHoc}
                />
                <TongKetDiemDanhCard tongKet={tongKet} />
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-100 bg-white pt-3">
              <NutLuuDiemDanh dangLuu={dangLuu} onLuu={luuDiemDanh} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrangDiemDanhGiangDay
