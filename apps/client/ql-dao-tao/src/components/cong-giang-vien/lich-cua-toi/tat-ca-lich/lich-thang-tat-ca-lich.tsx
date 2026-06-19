import ChuThichTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/chu-thich-tat-ca-lich"
import type { DongTatCaLich } from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/types"
import type { TagLoaiLich } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import {
  layKhoangThang,
  taoNgayTrongLichThang,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import { CLASS_TIEU_DE_THU, TIEU_DE_THU } from "@components/cong-giang-vien/lich-cua-toi/utils"
import { cn } from "@workspace/ui/lib/utils"
import { Spin } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useMemo } from "react"

interface LichThangTatCaLichProps {
  danhSach: DongTatCaLich[]
  ngayChon: Dayjs
  tags: TagLoaiLich[]
  dangTai?: boolean
  onChonNgay?: (ngay: Dayjs) => void
}

const SO_SU_KIEN_TOI_DA = 3

const formatGioSuKien = (suKien: DongTatCaLich) => {
  if (suKien.caNgay) return "Cả ngày"
  return dayjs(suKien.batDauIso).format("HH:mm")
}

const LichThangTatCaLich = ({
  danhSach,
  ngayChon,
  tags,
  dangTai,
  onChonNgay,
}: LichThangTatCaLichProps) => {
  const thangXem = useMemo(() => ngayChon.startOf("month"), [ngayChon])
  const homNay = useMemo(() => dayjs().startOf("day"), [])

  const { dauLich, cuoiLich } = useMemo(() => layKhoangThang(thangXem), [thangXem])

  const ngayTrongLich = useMemo(() => taoNgayTrongLichThang(dauLich, cuoiLich), [dauLich, cuoiLich])

  const suKienTheoNgay = useMemo(() => {
    const map = new Map<string, DongTatCaLich[]>()
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
        <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-cgv-green/30 bg-cgv-green/10">
          {TIEU_DE_THU.map((thu) => (
            <div key={thu} className={CLASS_TIEU_DE_THU}>
              {thu}
            </div>
          ))}
        </div>

        <div
          className="grid min-h-[320px] grid-cols-7"
          style={{ gridTemplateRows: `repeat(${soTuan}, minmax(96px, 1fr))` }}
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
                  "relative flex min-h-[96px] flex-col border-b border-l border-gray-100 p-1 first:border-l-0",
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
                      className="flex min-w-0 items-center gap-1 overflow-hidden rounded-sm border border-gray-100 px-1 py-0.5"
                      style={{
                        backgroundColor: `${suKien.mauLoai}14`,
                        borderLeftWidth: 3,
                        borderLeftColor: suKien.mauLoai,
                      }}
                      title={`${formatGioSuKien(suKien)} ${suKien.tieuDeHienThi}`}
                    >
                      <span className="shrink-0 text-[10px] text-gray-500">
                        {formatGioSuKien(suKien)}
                      </span>
                      <span className="truncate text-[10px] font-medium text-gray-800">
                        {suKien.tieuDeHienThi}
                      </span>
                    </div>
                  ))}
                </div>

                {conLai > 0 ? (
                  <span className="mt-auto pt-0.5 text-[10px] font-medium text-blue-600">
                    + {conLai} lịch khác
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <ChuThichTatCaLich tags={tags} />
    </div>
  )
}

export default LichThangTatCaLich
