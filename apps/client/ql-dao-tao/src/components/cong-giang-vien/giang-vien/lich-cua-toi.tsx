import LichNgay from "@components/cong-giang-vien/giang-vien/lich-ngay"
import LichTuanBang from "@components/cong-giang-vien/giang-vien/lich-tuan-bang"
import type { CheDoLich } from "@components/cong-giang-vien/giang-vien/types"
import { useLichCuaToi } from "@hooks/use-lich-cua-toi"
import { cn } from "@workspace/ui/lib/utils"
import { Button, Segmented } from "antd"
import { ChevronLeft, ChevronRight } from "lucide-react"

type LichCuaToiProps = {
  /** widget: khối nhỏ trên trang chủ; page: trang Lịch của tôi full màn hình */
  variant?: "widget" | "page"
}

const LichCuaToi = ({ variant = "widget" }: LichCuaToiProps) => {
  const laTrang = variant === "page"
  const { cheDo, setCheDo, nhanThoiGian, suKienNgay, suKienTuan, lui, tien, veHomNay, isLoading } =
    useLichCuaToi(laTrang ? "tuan" : "ngay")

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
          <span className="shrink-0 text-sm font-semibold text-gray-700">{nhanThoiGian}</span>
        )}

        <div className="flex min-w-0 shrink items-center gap-2">
          <Segmented<CheDoLich>
            size={laTrang ? "middle" : "small"}
            className="shrink-0"
            value={cheDo}
            onChange={(value) => {
              setCheDo(value)
              veHomNay()
            }}
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
              <button
                type="button"
                onClick={veHomNay}
                className="w-[124px] shrink-0 cursor-pointer truncate border-none bg-transparent px-0 text-center text-xs text-gray-700 hover:text-primary"
                title={nhanThoiGian}
              >
                {nhanThoiGian}
              </button>
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

      <div className={cn("min-h-0 flex-1 overflow-hidden", laTrang ? "p-3" : "p-2")}>
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
