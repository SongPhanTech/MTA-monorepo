import type { CheDoHienThiLich, DangXemLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { cn } from "@workspace/ui/lib/utils"
import { Button, DatePicker, Select } from "antd"
import type { Dayjs } from "dayjs"
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Plus } from "lucide-react"

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

const NUT_OUTLINE =
  "inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors"

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
        <button
          type="button"
          onClick={onThemLich}
          className={cn(
            NUT_OUTLINE,
            "border-cgv-green-dark bg-white text-cgv-green-dark hover:bg-cgv-green/40"
          )}
        >
          <Plus size={16} strokeWidth={2.5} />
          Thêm lịch
        </button>

        <button
          type="button"
          onClick={() => onDoiDangXem("bang")}
          className={cn(
            NUT_OUTLINE,
            dangXem === "bang"
              ? "border-cgv-green-dark bg-cgv-green text-cgv-green-dark"
              : "border-cgv-green-dark bg-white text-cgv-green-dark hover:bg-cgv-green/40"
          )}
          aria-pressed={dangXem === "bang"}
        >
          <LayoutGrid size={16} strokeWidth={2} />
          Table
        </button>

        <button
          type="button"
          onClick={() => onDoiDangXem("lich")}
          className={cn(
            NUT_OUTLINE,
            dangXem === "lich"
              ? "border-cgv-green-dark bg-cgv-green text-cgv-green-dark"
              : "border-gray-200 bg-white text-[#1e3a5f] hover:bg-gray-50"
          )}
          aria-pressed={dangXem === "lich"}
        >
          <CalendarDays size={16} strokeWidth={2} />
          Lịch
        </button>
      </div>
    </div>
  )
}

export default ThanhCongCuLichCaNhan
