import BangLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/bang-lich-giang-day"
import PhanTrangLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/phan-trang"
import ThanhCongCuLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/thanh-cong-cu"
import TheThongKeLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/the-thong-ke"
import LichNgayGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/lich-ngay-giang-day"
import LichThangGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/lich-thang-giang-day"
import LichTuanGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/lich-tuan-giang-day"
import { useLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/use-lich-giang-day"

/** Tab Lịch giảng dạy — ClassSchedule, chế độ Ngày / Tuần / Tháng + Bảng / Lịch. */
const TabLichGiangDay = () => {
  const {
    cheDoHienThi,
    setCheDoHienThi,
    dangXem,
    setDangXem,
    ngayChon,
    onDoiNgay,
    veHomNay,
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    dauTuan,
    ngayHomNayKey,
    danhSachGoc,
    danhSachTrang,
    danhSachBangTheoNgay,
    tongSo,
    trang,
    setTrang,
    soTrang,
    batDau,
    ketThuc,
    donViPhanTrang,
    isLoading,
  } = useLichGiangDay()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-white p-4 shadow-sm">
      <div className="shrink-0">
        <ThanhCongCuLichGiangDay
          cheDoHienThi={cheDoHienThi}
          onDoiCheDoHienThi={setCheDoHienThi}
          ngayChon={ngayChon}
          onDoiNgay={onDoiNgay}
          onVeHomNay={veHomNay}
          onLuiNgay={luiNgay}
          onTienNgay={tienNgay}
          dangXem={dangXem}
          onDoiDangXem={setDangXem}
        />
      </div>

      <div className="shrink-0">
        <TheThongKeLichGiangDay thongKe={thongKe} cheDoHienThi={cheDoHienThi} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {dangXem === "bang" ? (
          <BangLichGiangDay
            cheDoHienThi={cheDoHienThi}
            danhSach={danhSachTrang}
            danhSachBangTheoNgay={danhSachBangTheoNgay}
            ngayHomNayKey={ngayHomNayKey}
            tuKhoa={tuKhoa}
            dangTai={isLoading}
            onDoiTuKhoa={onDoiTuKhoa}
          />
        ) : cheDoHienThi === "thang" ? (
          <LichThangGiangDay
            danhSach={danhSachGoc}
            ngayChon={ngayChon}
            dangTai={isLoading}
            onChonNgay={onDoiNgay}
          />
        ) : cheDoHienThi === "tuan" ? (
          <LichTuanGiangDay danhSach={danhSachGoc} dauTuan={dauTuan} dangTai={isLoading} />
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
            donVi={donViPhanTrang}
            onDoiTrang={setTrang}
          />
        </div>
      ) : null}
    </div>
  )
}

export default TabLichGiangDay
