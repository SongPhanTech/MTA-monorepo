import { type TrangThaiKhaoSat, useKhaoSatGiangVien } from "@hooks/use-khao-sat-giang-vien"
import { Button, TreeSelectFloat } from "@workspace/ui"
import { Breadcrumb, Input, Select, Typography } from "antd"
import { RefreshCcw, Search } from "lucide-react"
import { useState } from "react"
import StatCardsKhaoSat from "@components/cong-giang-vien/khao-sat/stat-cards-khao-sat"
import DanhSachKhaoSat from "@components/cong-giang-vien/khao-sat/danh-sach-khao-sat"

type TrangThaiLoc = TrangThaiKhaoSat | "tat_ca"

const TUY_CHON_TRANG_THAI: { label: string; value: TrangThaiLoc }[] = [
  { label: "Tất cả", value: "tat_ca" },
  { label: "Đang diễn ra", value: "dang_dien_ra" },
  { label: "Sắp diễn ra", value: "sap_dien_ra" },
  { label: "Đã kết thúc", value: "da_ket_thuc" },
]

const KhaoSatGiangVien = () => {
  const [semesterId, setSemesterId] = useState<string>()
  const [tuKhoa, setTuKhoa] = useState("")
  const [trangThai, setTrangThai] = useState<TrangThaiLoc>("tat_ca")

  const { tongSo, thongKe, nhomTheoTrangThai, isLoading, isFetching, refetch } =
    useKhaoSatGiangVien({
      semesterId,
      tuKhoa,
      trangThai,
    })

  // Làm mới = tải lại dữ liệu mới, GIỮ NGUYÊN bộ lọc đang chọn
  const lamMoi = () => {
    refetch()
  }

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col">
      <div className="flex justify-between items-center">
        <Typography.Title level={2} className="text-cgv-green-dark">
          KHẢO SÁT
        </Typography.Title>
        <Breadcrumb>
          <Breadcrumb.Item href="/" className="text-sm">
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item className="text-sm">Khảo sát</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <StatCardsKhaoSat
        thongKe={{
          tongSo,
          dangDienRa: thongKe.dangDienRa,
          sapDienRa: thongKe.sapDienRa,
          daKetThuc: thongKe.daKetThuc,
        }}
      />

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm kiếm theo tiêu đề khảo sát..."
          prefix={<Search size="12" />}
          className="text-sm w-[35%] h-10"
          size="small"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          allowClear
        />

        <div className="flex h-10 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2">
          <span className="text-xs text-gray-500">Trạng thái:</span>
          <Select
            variant="borderless"
            size="small"
            className="min-w-[120px]"
            options={TUY_CHON_TRANG_THAI}
            value={trangThai}
            onChange={(value) => setTrangThai((value as TrangThaiLoc) ?? "tat_ca")}
          />
        </div>

        <div className="flex h-10 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2">
          <span className="text-xs text-gray-500">Năm học:</span>
          <TreeSelectFloat
            variant="borderless"
            size="small"
            placeholder="Chọn năm học"
            className="min-w-[150px]"
            value={semesterId}
            onChange={(value) => setSemesterId(value as string | undefined)}
          />
        </div>

        <Button
          type="primary"
          className="inline-flex h-10 items-center justify-center gap-1 text-sm leading-none"
          loading={isFetching}
          icon={<RefreshCcw size={16} className="block" />}
          onClick={lamMoi}
        >
          Làm mới
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <DanhSachKhaoSat nhomTheoTrangThai={nhomTheoTrangThai} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default KhaoSatGiangVien
