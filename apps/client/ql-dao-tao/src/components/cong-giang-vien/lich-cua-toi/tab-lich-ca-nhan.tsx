import BangLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/bang-lich-ca-nhan"
import PhanTrangLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/phan-trang"
import ThanhCongCuLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/thanh-cong-cu"
import TheThongKeLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/the-thong-ke"
import { useLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/use-lich-ca-nhan"
import { message } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

/** Tab Lịch cá nhân — chế độ Ngày + dạng Bảng. */
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
    danhSachTrang,
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
    <div className="flex min-h-[320px] flex-1 flex-col rounded-lg bg-white p-4 shadow-sm">
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

      <TheThongKeLichCaNhan thongKe={thongKe} />

      {dangXem === "bang" ? (
        <>
          <BangLichCaNhan
            danhSach={danhSachTrang}
            tuKhoa={tuKhoa}
            dangTai={isLoading}
            onDoiTuKhoa={onDoiTuKhoa}
            onSua={handleSua}
            onXoa={handleXoa}
          />
          <PhanTrangLichCaNhan
            trang={trang}
            soTrang={soTrang}
            tongSo={tongSo}
            batDau={batDau}
            ketThuc={ketThuc}
            onDoiTrang={setTrang}
          />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-gray-500">
          Chế độ xem Lịch — đang phát triển.
        </div>
      )}
    </div>
  )
}

export default TabLichCaNhan
