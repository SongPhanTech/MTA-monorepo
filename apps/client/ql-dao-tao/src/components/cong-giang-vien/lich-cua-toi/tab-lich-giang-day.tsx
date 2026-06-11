import BangLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/bang-lich-giang-day"
import PhanTrangLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/phan-trang"
import ThanhCongCuLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/thanh-cong-cu"
import TheThongKeLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/the-thong-ke"
import LichNgayGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/lich-ngay-giang-day"
import { useLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/use-lich-giang-day"

/** Tab Lịch giảng dạy — ClassSchedule, chế độ Ngày + Bảng / Lịch. */
const TabLichGiangDay = () => {
  const {
    cheDoHienThi,
    setCheDoHienThi,
    dangXem,
    setDangXem,
    ngayChon,
    setNgayChon,
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    danhSachGoc,
    danhSachTrang,
    tongSo,
    trang,
    setTrang,
    soTrang,
    batDau,
    ketThuc,
    isLoading,
  } = useLichGiangDay()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-white p-4 shadow-sm">
      <div className="shrink-0">
        <ThanhCongCuLichGiangDay
          cheDoHienThi={cheDoHienThi}
          onDoiCheDoHienThi={setCheDoHienThi}
          ngayChon={ngayChon}
          onDoiNgay={setNgayChon}
          onLuiNgay={luiNgay}
          onTienNgay={tienNgay}
          dangXem={dangXem}
          onDoiDangXem={setDangXem}
        />
      </div>

      <div className="shrink-0">
        <TheThongKeLichGiangDay thongKe={thongKe} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {dangXem === "bang" ? (
          <BangLichGiangDay
            danhSach={danhSachTrang}
            tuKhoa={tuKhoa}
            dangTai={isLoading}
            onDoiTuKhoa={onDoiTuKhoa}
          />
        ) : (
          <LichNgayGiangDay danhSach={danhSachGoc} dangTai={isLoading} />
        )}
      </div>

      {dangXem === "bang" ? (
        <div className="shrink-0">
          <PhanTrangLichGiangDay
            trang={trang}
            soTrang={soTrang}
            tongSo={tongSo}
            batDau={batDau}
            ketThuc={ketThuc}
            onDoiTrang={setTrang}
          />
        </div>
      ) : null}
    </div>
  )
}

export default TabLichGiangDay
