import DrawerChiTietLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/drawer-chi-tiet-lich-ca-nhan"
import DrawerChiTietLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/drawer-chi-tiet-lich-giang-day"
import BangTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/bang-tat-ca-lich"
import LichNgayTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/lich-ngay-tat-ca-lich"
import LichThangTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/lich-thang-tat-ca-lich"
import LichTuanTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/lich-tuan-tat-ca-lich"
import PhanTrangTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/phan-trang"
import ThanhCongCuTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/thanh-cong-cu"
import TheThongKeTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/the-thong-ke"
import type {
  DongTatCaLich,
  LichChiTietTatCa,
} from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/types"
import { useTatCaLich } from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/use-tat-ca-lich"
import { queryClient } from "@api/index"
import {
  useDeleteIndividualSchedule,
  useUpdateIndividualSchedule,
} from "@workspace/db/hooks"
import { message } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

/** Tab Tất cả lịch — gộp lịch giảng dạy + lịch cá nhân. */
const TabTatCaLich = () => {
  const { onOpen: moThemLich } = useDisclosure<{ id?: string; ngayMacDinh?: string }>({
    tag: "ModalThemLichCaNhan",
  })
  const { mutateAsync: xoaLichCaNhan } = useDeleteIndividualSchedule()
  const { mutateAsync: capNhatLichCaNhan } = useUpdateIndividualSchedule()

  const [lichChiTiet, setLichChiTiet] = useState<LichChiTietTatCa | null>(null)
  const [dangHoanThanh, setDangHoanThanh] = useState(false)

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

  const handleXemChiTiet = (suKien: DongTatCaLich) => {
    setLichChiTiet({ nguon: suKien.nguon, id: suKien.idGoc })
  }

  const dongChiTiet = () => setLichChiTiet(null)

  const handleSuaLichCaNhan = (id: string) => {
    setLichChiTiet(null)
    moThemLich({ id })
  }

  const handleXoaLichCaNhan = async (id: string) => {
    try {
      await xoaLichCaNhan({ where: { id } })
      await queryClient.invalidateQueries({ queryKey: ["IndividualSchedule"] })
      setLichChiTiet(null)
      message.success("Đã xóa lịch")
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      message.error(err?.info?.message ?? "Không thể xóa lịch")
    }
  }

  const handleHoanThanhLichCaNhan = async (id: string) => {
    setDangHoanThanh(true)
    try {
      await capNhatLichCaNhan({
        where: { id },
        data: { isCompleted: true },
      })
      await queryClient.invalidateQueries({ queryKey: ["IndividualSchedule"] })
      message.success("Đã đánh dấu hoàn thành")
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      message.error(err?.info?.message ?? "Không thể cập nhật trạng thái lịch")
    } finally {
      setDangHoanThanh(false)
    }
  }

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
            onXemChiTiet={handleXemChiTiet}
          />
        ) : cheDoHienThi === "tuan" ? (
          <LichTuanTatCaLich
            danhSach={danhSachGoc}
            dauTuan={dauTuan}
            tags={tags}
            dangTai={isLoading}
            onXemChiTiet={handleXemChiTiet}
          />
        ) : cheDoHienThi === "thang" ? (
          <LichThangTatCaLich
            danhSach={danhSachHop}
            ngayChon={ngayChon}
            tags={tags}
            dangTai={isLoading}
            onChonNgay={onDoiNgay}
            onXemChiTiet={handleXemChiTiet}
          />
        ) : cheDoHienThi === "ngay" ? (
          <LichNgayTatCaLich
            danhSach={danhSachGoc}
            tags={tags}
            dangTai={isLoading}
            onXemChiTiet={handleXemChiTiet}
          />
        ) : null}
      </div>

      <DrawerChiTietLichGiangDay
        open={lichChiTiet?.nguon === "giang-day"}
        lichId={lichChiTiet?.nguon === "giang-day" ? lichChiTiet.id : null}
        onClose={dongChiTiet}
      />

      <DrawerChiTietLichCaNhan
        open={lichChiTiet?.nguon === "ca-nhan"}
        lichId={lichChiTiet?.nguon === "ca-nhan" ? lichChiTiet.id : null}
        onClose={dongChiTiet}
        onChinhSua={handleSuaLichCaNhan}
        onXoa={handleXoaLichCaNhan}
        onHoanThanh={handleHoanThanhLichCaNhan}
        dangHoanThanh={dangHoanThanh}
      />

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
