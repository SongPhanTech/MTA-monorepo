import type { CheDoHienThiLich, DangXemLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { formatNgayChonHienThi } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { formatNhanTuan } from "@components/cong-giang-vien/lich-cua-toi/utils"
import { cn } from "@workspace/ui/lib/utils"
import { Button, DatePicker, Select } from "antd"
import locale from "antd/locale/vi_VN"
import type { Dayjs } from "dayjs"
import "dayjs/locale/vi"
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
              { value: "tuan", label: "Tuần" },
              { value: "thang", label: "Tháng" },
            ]}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<ChevronLeft size={16} />}
            onClick={onLuiNgay}
            aria-label={
              cheDoHienThi === "thang"
                ? "Tháng trước"
                : cheDoHienThi === "tuan"
                  ? "Tuần trước"
                  : "Ngày trước"
            }
          />
          {cheDoHienThi === "tuan" ? (
            <DatePicker
              picker="week"
              value={ngayChon}
              onChange={(value) => value && onDoiNgay(value.startOf("isoWeek"))}
              allowClear={false}
              format={(value) => (value ? formatNhanTuan(value) : "")}
              locale={locale.DatePicker}
              className="min-w-[220px]"
              suffixIcon={<CalendarDays size={14} className="text-gray-400" />}
              inputReadOnly
            />
          ) : cheDoHienThi === "thang" ? (
            <DatePicker
              picker="month"
              value={ngayChon}
              onChange={(value) => value && onDoiNgay(value.startOf("month"))}
              allowClear={false}
              format="MM/YYYY"
              locale={locale.DatePicker}
              className="w-[120px]"
              suffixIcon={<CalendarDays size={14} className="text-gray-400" />}
              inputReadOnly
            />
          ) : (
            <DatePicker
              value={ngayChon}
              onChange={(value) => value && onDoiNgay(value)}
              allowClear={false}
              format={(value) => (value ? formatNgayChonHienThi(value) : "")}
              locale={locale.DatePicker}
              className="w-[200px]"
              suffixIcon={<CalendarDays size={14} className="text-gray-400" />}
              inputReadOnly
            />
          )}
          <Button
            type="text"
            size="small"
            icon={<ChevronRight size={16} />}
            onClick={onTienNgay}
            aria-label={
              cheDoHienThi === "thang"
                ? "Tháng sau"
                : cheDoHienThi === "tuan"
                  ? "Tuần sau"
                  : "Ngày sau"
            }
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
          Bảng
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
