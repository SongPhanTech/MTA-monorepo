import type { DongLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import {
  layKhoangThang,
  layMaHienThiLichGiangDay,
  MAU_SU_KIEN_LICH_GIANG_DAY,
  taoNgayTrongLichThang,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import { cn } from "@workspace/ui/lib/utils"
import { Spin } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useMemo } from "react"

interface LichThangGiangDayProps {
  danhSach: DongLichGiangDay[]
  ngayChon: Dayjs
  dangTai?: boolean
  onChonNgay?: (ngay: Dayjs) => void
}

const TIEU_DE_THU = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"] as const
const SO_SU_KIEN_TOI_DA = 3

const LichThangGiangDay = ({ danhSach, ngayChon, dangTai, onChonNgay }: LichThangGiangDayProps) => {
  const thangXem = useMemo(() => ngayChon.startOf("month"), [ngayChon])
  const homNay = useMemo(() => dayjs().startOf("day"), [])

  const { dauLich, cuoiLich } = useMemo(() => layKhoangThang(thangXem), [thangXem])

  const ngayTrongLich = useMemo(() => taoNgayTrongLichThang(dauLich, cuoiLich), [dauLich, cuoiLich])

  const suKienTheoNgay = useMemo(() => {
    const map = new Map<string, DongLichGiangDay[]>()
    for (const ngay of ngayTrongLich) {
      map.set(ngay.format("YYYY-MM-DD"), [])
    }
    for (const suKien of danhSach) {
      const bucket = map.get(suKien.ngayKey)
      if (bucket) bucket.push(suKien)
    }
    return map
  }, [danhSach, ngayTrongLich])

  const soTuan = Math.ceil(ngayTrongLich.length / 7)

  if (dangTai) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-gray-200 bg-white">
          {TIEU_DE_THU.map((thu) => (
            <div
              key={thu}
              className="border-l border-gray-100 px-1 py-2 text-center text-xs font-medium text-gray-600 first:border-l-0"
            >
              {thu}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7"
          style={{ gridTemplateRows: `repeat(${soTuan}, minmax(88px, 1fr))` }}
        >
          {ngayTrongLich.map((ngay) => {
            const key = ngay.format("YYYY-MM-DD")
            const trongThang = ngay.isSame(thangXem, "month")
            const laHomNay = ngay.isSame(homNay, "day")
            const laNgayChon = ngay.isSame(ngayChon, "day")
            const suKienNgay = suKienTheoNgay.get(key) ?? []
            const hienThi = suKienNgay.slice(0, SO_SU_KIEN_TOI_DA)
            const conLai = suKienNgay.length - hienThi.length

            return (
              <div
                key={key}
                className={cn(
                  "relative flex min-h-[88px] flex-col border-b border-l border-gray-100 p-1 first:border-l-0",
                  !trongThang && "bg-gray-50/60",
                  laNgayChon && trongThang && "ring-1 ring-inset ring-cgv-green-dark"
                )}
              >
                <button
                  type="button"
                  onClick={() => onChonNgay?.(ngay)}
                  className={cn(
                    "mb-1 flex h-6 w-6 shrink-0 items-center justify-center self-end rounded-full text-xs font-medium",
                    trongThang ? "text-gray-800" : "text-gray-400",
                    laHomNay &&
                      "bg-cgv-green text-cgv-green-dark ring-2 ring-cgv-green-dark ring-offset-1",
                    laNgayChon && !laHomNay && trongThang && "bg-cgv-green/30 text-cgv-green-dark"
                  )}
                >
                  {ngay.date()}
                </button>

                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {hienThi.map((suKien) => (
                    <div
                      key={suKien.id}
                      className="flex min-w-0 items-center gap-1 rounded px-0.5"
                      title={`${suKien.thoiGianBatDau} ${suKien.hocPhan}`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: MAU_SU_KIEN_LICH_GIANG_DAY }}
                        aria-hidden
                      />
                      <span className="shrink-0 text-[10px] text-gray-500">
                        {suKien.thoiGianBatDau}
                      </span>
                      <span className="truncate text-[10px] font-medium text-gray-800">
                        {layMaHienThiLichGiangDay(suKien)}
                      </span>
                    </div>
                  ))}
                </div>

                {conLai > 0 ? (
                  <span className="absolute bottom-1 right-1 text-[10px] font-medium text-blue-600">
                    +{conLai}
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LichThangGiangDay
