import BangLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/bang-lich-ca-nhan"
import LichNgayCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/lich-ngay-ca-nhan"
import LichThangCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/lich-thang-ca-nhan"
import LichTuanCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/lich-tuan-ca-nhan"
import PhanTrangLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/phan-trang"
import ThanhCongCuLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/thanh-cong-cu"
import TheThongKeLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/the-thong-ke"
import { useLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/use-lich-ca-nhan"
import { message } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

/** Tab Lịch cá nhân — chế độ Ngày / Tuần / Tháng + dạng Bảng / Lịch. */
const TabLichCaNhan = () => {
  const { onOpen: moThemLich } = useDisclosure<{ id?: string; ngayMacDinh?: string }>({
    tag: "ModalThemLichCaNhan",
  })

  const {
    cheDoHienThi,
    setCheDoHienThi,
    dangXem,
    setDangXem,
    ngayChon,
    setNgayChon,
    nhanKhoangThoiGian,
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    tags,
    danhSachGoc,
    danhSachLich,
    danhSachTrang,
    danhSachNhomTrang,
    danhSachBangThang,
    dauTuan,
    tongSo,
    trang,
    setTrang,
    soTrang,
    batDau,
    ketThuc,
    isLoading,
    onXoa,
  } = useLichCaNhan()

  const handleThemLich = () => {
    moThemLich({ ngayMacDinh: ngayChon.format("YYYY-MM-DD") })
  }

  const handleSua = (id: string) => {
    moThemLich({ id })
  }

  const handleXoa = async (id: string) => {
    try {
      await onXoa(id)
      message.success("Đã xóa lịch")
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      message.error(err?.info?.message ?? "Không thể xóa lịch")
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-white p-4 shadow-sm">
      <div className="shrink-0">
        <ThanhCongCuLichCaNhan
          cheDoHienThi={cheDoHienThi}
          onDoiCheDoHienThi={setCheDoHienThi}
          ngayChon={ngayChon}
          nhanKhoangThoiGian={nhanKhoangThoiGian}
          onDoiNgay={setNgayChon}
          onLuiNgay={luiNgay}
          onTienNgay={tienNgay}
          dangXem={dangXem}
          onDoiDangXem={setDangXem}
          onThemLich={handleThemLich}
        />
      </div>

      <div className="shrink-0">
        <TheThongKeLichCaNhan thongKe={thongKe} cheDoHienThi={cheDoHienThi} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {dangXem === "bang" ? (
          <BangLichCaNhan
            cheDoHienThi={cheDoHienThi}
            danhSach={danhSachTrang}
            danhSachNhom={danhSachNhomTrang}
            danhSachBangThang={danhSachBangThang}
            tuKhoa={tuKhoa}
            dangTai={isLoading}
            onDoiTuKhoa={onDoiTuKhoa}
            onSua={handleSua}
            onXoa={handleXoa}
          />
        ) : cheDoHienThi === "thang" ? (
          <LichThangCaNhan
            danhSach={danhSachLich}
            ngayChon={ngayChon}
            tags={tags}
            dangTai={isLoading}
            onChonNgay={setNgayChon}
            onSua={handleSua}
          />
        ) : cheDoHienThi === "tuan" ? (
          <LichTuanCaNhan
            danhSach={danhSachGoc}
            dauTuan={dauTuan}
            tags={tags}
            dangTai={isLoading}
            onSua={handleSua}
          />
        ) : (
          <LichNgayCaNhan
            danhSach={danhSachGoc}
            tags={tags}
            dangTai={isLoading}
            onSua={handleSua}
          />
        )}
      </div>

      {dangXem === "bang" ? (
        <div className="shrink-0">
          <PhanTrangLichCaNhan
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

export default TabLichCaNhan
