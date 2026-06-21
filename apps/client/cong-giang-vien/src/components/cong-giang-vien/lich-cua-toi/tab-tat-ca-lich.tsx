import BangTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/bang-tat-ca-lich"
import LichNgayTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/lich-ngay-tat-ca-lich"
import LichThangTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/lich-thang-tat-ca-lich"
import LichTuanTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/lich-tuan-tat-ca-lich"
import PhanTrangTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/phan-trang"
import ThanhCongCuTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/thanh-cong-cu"
import TheThongKeTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/the-thong-ke"
import { useTatCaLich } from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/use-tat-ca-lich"

/** Tab Tất cả lịch — gộp lịch giảng dạy + lịch cá nhân. */
const TabTatCaLich = () => {
  const {
    cheDoHienThi,
    setCheDoHienThi,
    dangXem,
    setDangXem,
    ngayChon,
    dauTuan,
    onDoiNgay,
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    danhSachHop,
    danhSachGoc,
    danhSachTrang,
    danhSachBangTuan,
    danhSachBangThang,
    tags,
    tongSo,
    trang,
    setTrang,
    soTrang,
    batDau,
    ketThuc,
    isLoading,
  } = useTatCaLich()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-white p-4 shadow-sm">
      <div className="shrink-0">
        <ThanhCongCuTatCaLich
          cheDoHienThi={cheDoHienThi}
          onDoiCheDoHienThi={setCheDoHienThi}
          ngayChon={ngayChon}
          onDoiNgay={onDoiNgay}
          onLuiNgay={luiNgay}
          onTienNgay={tienNgay}
          dangXem={dangXem}
          onDoiDangXem={setDangXem}
        />
      </div>

      <div className="shrink-0">
        <TheThongKeTatCaLich thongKe={thongKe} cheDoHienThi={cheDoHienThi} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {dangXem === "bang" ? (
          <BangTatCaLich
            cheDoHienThi={cheDoHienThi}
            danhSach={danhSachTrang}
            danhSachBangTuan={danhSachBangTuan}
            danhSachBangThang={danhSachBangThang}
            tuKhoa={tuKhoa}
            dangTai={isLoading}
            onDoiTuKhoa={onDoiTuKhoa}
          />
        ) : cheDoHienThi === "tuan" ? (
          <LichTuanTatCaLich
            danhSach={danhSachGoc}
            dauTuan={dauTuan}
            tags={tags}
            dangTai={isLoading}
          />
        ) : cheDoHienThi === "thang" ? (
          <LichThangTatCaLich
            danhSach={danhSachHop}
            ngayChon={ngayChon}
            tags={tags}
            dangTai={isLoading}
            onChonNgay={onDoiNgay}
          />
        ) : cheDoHienThi === "ngay" ? (
          <LichNgayTatCaLich danhSach={danhSachGoc} tags={tags} dangTai={isLoading} />
        ) : null}
      </div>

      {dangXem === "bang" ? (
        <div className="shrink-0">
          <PhanTrangTatCaLich
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

export default TabTatCaLich
