import LichNgay from "@components/cong-giang-vien/giang-vien/lich-ngay"
import LichTuanBang from "@components/cong-giang-vien/giang-vien/lich-tuan-bang"
import type { CheDoLich } from "@components/cong-giang-vien/giang-vien/types"
import { useLichCuaToi } from "@hooks/use-lich-cua-toi"
import { Button, Segmented } from "antd"
import { ChevronLeft, ChevronRight } from "lucide-react"

const LichCuaToi = () => {
  const {
    cheDo,
    setCheDo,
    nhanThoiGian,
    suKienNgay,
    suKienTuan,
    lui,
    tien,
    veHomNay,
    isLoading,
  } = useLichCuaToi()

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-gray-100 px-3 py-1.5">
        <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-cgv-green-dark">
          Lịch của tôi
        </span>

        <div className="flex min-w-0 shrink items-center gap-1">
          <Segmented<CheDoLich>
            size="small"
            className="shrink-0 text-xs"
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

          <div className="flex w-[168px] shrink-0 items-center justify-center gap-0.5">
            <Button
              type="text"
              size="small"
              className="shrink-0"
              icon={<ChevronLeft size={14} />}
              onClick={lui}
              aria-label="Lùi"
            />
            <button
              type="button"
              onClick={veHomNay}
              className="w-[124px] shrink-0 cursor-pointer truncate border-none bg-transparent px-0 text-center text-xs text-gray-700 hover:text-primary"
              title={nhanThoiGian}
            >
              {nhanThoiGian}
            </button>
            <Button
              type="text"
              size="small"
              className="shrink-0"
              icon={<ChevronRight size={14} />}
              onClick={tien}
              aria-label="Tiến"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-2">
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
