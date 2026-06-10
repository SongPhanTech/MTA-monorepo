import type { CheDoHienThiLich, DangXemLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { cn } from "@workspace/ui/lib/utils"
import { Button, DatePicker, Select } from "antd"
import type { Dayjs } from "dayjs"
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Plus, Table2 } from "lucide-react"

interface ThanhCongCuLichCaNhanProps {
  cheDoHienThi: CheDoHienThiLich
  onDoiCheDoHienThi: (value: CheDoHienThiLich) => void
  ngayChon: Dayjs
  onDoiNgay: (ngay: Dayjs) => void
  onLuiNgay: () => void
  onTienNgay: () => void
  dangXem: DangXemLich
  onDoiDangXem: (value: DangXemLich) => void
  onThemLich?: () => void
}

const ThanhCongCuLichCaNhan = ({
  cheDoHienThi,
  onDoiCheDoHienThi,
  ngayChon,
  onDoiNgay,
  onLuiNgay,
  onTienNgay,
  dangXem,
  onDoiDangXem,
  onThemLich,
}: ThanhCongCuLichCaNhanProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Loại hiển thị:</span>
          <Select<CheDoHienThiLich>
            value={cheDoHienThi}
            onChange={onDoiCheDoHienThi}
            className="min-w-[100px]"
            options={[
              { value: "ngay", label: "Ngày" },
              { value: "tuan", label: "Tuần", disabled: true },
              { value: "thang", label: "Tháng", disabled: true },
            ]}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<ChevronLeft size={16} />}
            onClick={onLuiNgay}
            aria-label="Ngày trước"
          />
          <DatePicker
            value={ngayChon}
            onChange={(value) => value && onDoiNgay(value)}
            allowClear={false}
            format="dddd, DD/MM/YYYY"
            className="w-[200px]"
            suffixIcon={<CalendarDays size={14} className="text-gray-400" />}
            inputReadOnly
          />
          <Button
            type="text"
            size="small"
            icon={<ChevronRight size={16} />}
            onClick={onTienNgay}
            aria-label="Ngày sau"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={onThemLich}
          className="!bg-cgv-green-dark hover:!bg-cgv-green-dark/90"
        >
          Thêm lịch
        </Button>

        <div className="flex items-center rounded-md border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => onDoiDangXem("bang")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              dangXem === "bang"
                ? "bg-cgv-green-dark text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
            aria-pressed={dangXem === "bang"}
          >
            <Table2 size={14} />
            Bảng
          </button>
          <button
            type="button"
            onClick={() => onDoiDangXem("lich")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              dangXem === "lich"
                ? "bg-cgv-green-dark text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
            aria-pressed={dangXem === "lich"}
          >
            <LayoutGrid size={14} />
            Lịch
          </button>
        </div>
      </div>
    </div>
  )
}

export default ThanhCongCuLichCaNhan
