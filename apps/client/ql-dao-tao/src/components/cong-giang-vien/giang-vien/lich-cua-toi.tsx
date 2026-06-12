import DatePicker from "@components/commons/date-picker"
import LichNgay from "@components/cong-giang-vien/giang-vien/lich-ngay"
import LichTuanBang from "@components/cong-giang-vien/giang-vien/lich-tuan-bang"
import type { CheDoLich } from "@components/cong-giang-vien/giang-vien/types"
import { useLichCuaToi } from "@hooks/use-lich-cua-toi"
import { cn } from "@workspace/ui/lib/utils"
import { Button, Segmented } from "antd"
import type { Dayjs } from "dayjs"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, type ReactNode } from "react"

type LichCuaToiProps = {
  /** widget: khối nhỏ trên trang chủ; page: trang Lịch của tôi full màn hình */
  variant?: "widget" | "page"
}

type NhanNgayCoLichProps = {
  /** Nội dung hiển thị (nhãn thời gian) */
  children: ReactNode
  cheDo: CheDoLich
  ngayThamChieu: Dayjs
  dichDenNgay: (ngay: Dayjs) => void
  triggerClassName?: string
}

const NhanNgayCoLich = ({
  children,
  cheDo,
  ngayThamChieu,
  dichDenNgay,
  triggerClassName,
}: NhanNgayCoLichProps) => {
  const [moLich, setMoLich] = useState(false)

  return (
    <div className="relative inline-flex min-w-0">
      <button
        type="button"
        onClick={() => setMoLich(true)}
        className={cn("cursor-pointer border-none bg-transparent p-0", triggerClassName)}
      >
        {children}
      </button>
      <DatePicker
        open={moLich}
        onOpenChange={setMoLich}
        value={ngayThamChieu}
        picker={cheDo === "tuan" ? "week" : "date"}
        allowClear={false}
        inputReadOnly
        className="pointer-events-none invisible absolute inset-0 h-full w-full"
        onChange={(ngay) => {
          if (ngay) {
            dichDenNgay(ngay)
            setMoLich(false)
          }
        }}
      />
    </div>
  )
}

const LichCuaToi = ({ variant = "widget" }: LichCuaToiProps) => {
  const laTrang = variant === "page"
  const {
    cheDo,
    setCheDo,
    nhanThoiGian,
    ngayThamChieu,
    suKienNgay,
    suKienTuan,
    lui,
    tien,
    veHomNay,
    dichDenNgay,
    isLoading,
  } = useLichCuaToi(laTrang ? "tuan" : "ngay")

  return (
    <div
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-col overflow-hidden",
        laTrang ? "h-full rounded-lg bg-white shadow-sm" : "h-full rounded-lg bg-white shadow-sm"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b border-gray-100",
          laTrang ? "px-4 py-2.5" : "px-3 py-1.5"
        )}
      >
        {!laTrang ? (
          <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-cgv-green-dark">
            Lịch của tôi
          </span>
        ) : (
          <NhanNgayCoLich
            cheDo={cheDo}
            ngayThamChieu={ngayThamChieu}
            dichDenNgay={dichDenNgay}
            triggerClassName="shrink-0 text-sm font-semibold text-gray-700 hover:text-primary"
          >
            {nhanThoiGian}
          </NhanNgayCoLich>
        )}

        <div className="flex min-w-0 shrink items-center gap-2">
          <Segmented<CheDoLich>
            size={laTrang ? "middle" : "small"}
            className="shrink-0"
            value={cheDo}
            onChange={(value) => setCheDo(value)}
            options={[
              { label: "Tuần", value: "tuan" },
              { label: "Ngày", value: "ngay" },
            ]}
          />

          <div
            className={cn(
              "flex shrink-0 items-center justify-center gap-0.5",
              laTrang ? "w-[220px]" : "w-[168px]"
            )}
          >
            <Button
              type="text"
              size="small"
              className="shrink-0"
              icon={<ChevronLeft size={laTrang ? 16 : 14} />}
              onClick={lui}
              aria-label="Lùi"
            />
            {!laTrang ? (
              <NhanNgayCoLich
                cheDo={cheDo}
                ngayThamChieu={ngayThamChieu}
                dichDenNgay={dichDenNgay}
                triggerClassName="w-[124px] shrink-0 truncate px-0 text-center text-xs text-gray-700 hover:text-primary"
              >
                {nhanThoiGian}
              </NhanNgayCoLich>
            ) : (
              <Button type="link" size="small" onClick={veHomNay} className="shrink-0 px-1 text-xs">
                Hôm nay
              </Button>
            )}
            <Button
              type="text"
              size="small"
              className="shrink-0"
              icon={<ChevronRight size={laTrang ? 16 : 14} />}
              onClick={tien}
              aria-label="Tiến"
            />
          </div>
        </div>
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", laTrang ? "p-3" : "p-2")}>
        {cheDo === "ngay" ? (
          <LichNgay suKien={suKienNgay} isLoading={isLoading} />
        ) : (
          <LichTuanBang suKien={suKienTuan} isLoading={isLoading} />
        )}
      </div>
    </div>
  )
}

export default LichCuaToi
