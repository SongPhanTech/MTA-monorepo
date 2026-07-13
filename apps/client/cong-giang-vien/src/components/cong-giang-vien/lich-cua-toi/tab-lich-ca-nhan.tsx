import BangLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/bang-lich-ca-nhan"
import DrawerChiTietLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/drawer-chi-tiet-lich-ca-nhan"
import LichNgayCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/lich-ngay-ca-nhan"
import LichThangCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/lich-thang-ca-nhan"
import LichTuanCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/lich-tuan-ca-nhan"
import PhanTrangLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/phan-trang"
import ThanhCongCuLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/thanh-cong-cu"
import TheThongKeLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/the-thong-ke"
import { useLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/use-lich-ca-nhan"
import { message } from "antd"
import { useState } from "react"
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
    onHoanThanh,
  } = useLichCaNhan()

  const [lichChiTietId, setLichChiTietId] = useState<string | null>(null)
  const [dangHoanThanh, setDangHoanThanh] = useState(false)

  const handleThemLich = () => {
    moThemLich({ ngayMacDinh: ngayChon.format("YYYY-MM-DD") })
  }

  const handleSua = (id: string) => {
    setLichChiTietId(null)
    moThemLich({ id })
  }

  const handleXemChiTiet = (id: string) => {
    setLichChiTietId(id)
  }

  const handleHoanThanh = async (id: string) => {
    setDangHoanThanh(true)
    try {
      await onHoanThanh(id)
      message.success("Đã đánh dấu hoàn thành")
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      message.error(err?.info?.message ?? "Không thể cập nhật trạng thái lịch")
    } finally {
      setDangHoanThanh(false)
    }
  }

  const handleXoa = async (id: string) => {
    try {
      await onXoa(id)
      setLichChiTietId(null)
      message.success("Đã xóa lịch")
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      message.error(err?.info?.message ?? "Không thể xóa lịch")
    }
  }

  const handleXoaTuBang = async (id: string) => {
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
            onXoa={handleXoaTuBang}
            onXemChiTiet={handleXemChiTiet}
          />
        ) : cheDoHienThi === "thang" ? (
          <LichThangCaNhan
            danhSach={danhSachLich}
            ngayChon={ngayChon}
            tags={tags}
            dangTai={isLoading}
            onChonNgay={setNgayChon}
            onXemChiTiet={handleXemChiTiet}
          />
        ) : cheDoHienThi === "tuan" ? (
          <LichTuanCaNhan
            danhSach={danhSachGoc}
            dauTuan={dauTuan}
            tags={tags}
            dangTai={isLoading}
            onXemChiTiet={handleXemChiTiet}
          />
        ) : (
          <LichNgayCaNhan
            danhSach={danhSachGoc}
            tags={tags}
            dangTai={isLoading}
            onXemChiTiet={handleXemChiTiet}
          />
        )}
      </div>

      <DrawerChiTietLichCaNhan
        open={!!lichChiTietId}
        lichId={lichChiTietId}
        onClose={() => setLichChiTietId(null)}
        onChinhSua={handleSua}
        onXoa={handleXoa}
        onHoanThanh={handleHoanThanh}
        dangHoanThanh={dangHoanThanh}
      />

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
