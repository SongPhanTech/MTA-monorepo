import ChuThichLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/chu-thich-lich-ca-nhan"
import type {
  DongLichCaNhan,
  TagLoaiLich,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import {
  layKhoangThang,
  MAU_LOAI_MAC_DINH,
  taoNgayTrongLichThang,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { CLASS_TIEU_DE_THU, TIEU_DE_THU } from "@components/cong-giang-vien/lich-cua-toi/utils"
import { cn } from "@workspace/ui/lib/utils"
import { Popover, Spin } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useMemo } from "react"

interface LichThangCaNhanProps {
  danhSach: DongLichCaNhan[]
  ngayChon: Dayjs
  tags: TagLoaiLich[]
  dangTai?: boolean
  onChonNgay?: (ngay: Dayjs) => void
  onXemChiTiet?: (id: string) => void
}

const SO_SU_KIEN_TOI_DA = 3

const layMauSuKien = (suKien: DongLichCaNhan) => suKien.mauLoai ?? MAU_LOAI_MAC_DINH

const formatGioSuKien = (suKien: DongLichCaNhan) =>
  suKien.caNgay ? "Cả ngày" : suKien.thoiGianBatDau

const LichThangCaNhan = ({
  danhSach,
  ngayChon,
  tags,
  dangTai,
  onChonNgay,
  onXemChiTiet,
}: LichThangCaNhanProps) => {
  const thangXem = useMemo(() => ngayChon.startOf("month"), [ngayChon])
  const homNay = useMemo(() => dayjs().startOf("day"), [])

  const { dauLich, cuoiLich } = useMemo(() => layKhoangThang(thangXem), [thangXem])

  const ngayTrongLich = useMemo(() => taoNgayTrongLichThang(dauLich, cuoiLich), [dauLich, cuoiLich])

  const suKienTheoNgay = useMemo(() => {
    const map = new Map<string, DongLichCaNhan[]>()
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
    <div className="flex h-full min-h-0 flex-col gap-3">
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
          style={{ gridTemplateRows: `repeat(${soTuan}, minmax(88px, 1fr))` }}
        >
          {ngayTrongLich.map((ngay) => {
            const key = ngay.format("YYYY-MM-DD")
            const trongThang = ngay.isSame(thangXem, "month")
            const laHomNay = ngay.isSame(homNay, "day")
            const laNgayChon = ngay.isSame(ngayChon, "day")
            const suKienNgay = suKienTheoNgay.get(key) ?? []
            const hienThi = suKienNgay.slice(0, SO_SU_KIEN_TOI_DA)
            const suKienConLai = suKienNgay.slice(SO_SU_KIEN_TOI_DA)
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
                  {hienThi.map((suKien) => {
                    const mau = layMauSuKien(suKien)
                    return (
                      <button
                        key={suKien.id}
                        type="button"
                        onClick={() => onXemChiTiet?.(suKien.id)}
                        className="flex min-w-0 items-center gap-1 rounded px-0.5 text-left hover:bg-gray-100/80"
                        title={suKien.tieuDe}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: mau }}
                          aria-hidden
                        />
                        <span className="shrink-0 text-[10px] text-gray-500">
                          {formatGioSuKien(suKien)}
                        </span>
                        <span className="truncate text-[10px] font-medium text-gray-800">
                          {suKien.tieuDe}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {conLai > 0 ? (
                  <Popover
                    trigger="click"
                    placement="bottomRight"
                    overlayClassName="max-w-[280px]"
                    content={
                      <div className="flex max-h-60 w-[260px] flex-col gap-1 overflow-y-auto">
                        {suKienConLai.map((suKien) => {
                          const mau = layMauSuKien(suKien)
                          return (
                            <button
                              key={suKien.id}
                              type="button"
                              onClick={() => onXemChiTiet?.(suKien.id)}
                              className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-gray-100/80"
                              title={suKien.tieuDe}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: mau }}
                                aria-hidden
                              />
                              <span className="shrink-0 text-[10px] text-gray-500">
                                {formatGioSuKien(suKien)}
                              </span>
                              <span className="truncate text-[10px] font-medium text-gray-800">
                                {suKien.tieuDe}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    }
                  >
                    <button
                      type="button"
                      className="mt-auto self-end pt-0.5 text-[10px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      +{conLai}
                    </button>
                  </Popover>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <ChuThichLichCaNhan tags={tags} className="shrink-0" />
    </div>
  )
}

export default LichThangCaNhan
