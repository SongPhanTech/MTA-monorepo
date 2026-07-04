import ChuThichTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/chu-thich-tat-ca-lich"
import {
  CHIEU_CAO_LICH_TUAN,
  CHIEU_CAO_MOI_GIO_LICH_TUAN,
  formatGioLichNgay,
  gioTrongLichTuan,
  tinhViTriLichTuan,
} from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/constants"
import type { DongTatCaLich } from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/types"
import type { TagLoaiLich } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import {
  formatNhanNgayTuan,
  taoNgayTrongTuan,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import { CLASS_TIEU_DE_THU } from "@components/cong-giang-vien/lich-cua-toi/utils"
import { cn } from "@workspace/ui/lib/utils"
import { Empty, Spin } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import { useEffect, useMemo, useRef } from "react"

dayjs.extend(isoWeek)

interface LichTuanTatCaLichProps {
  danhSach: DongTatCaLich[]
  dauTuan: Dayjs
  tags: TagLoaiLich[]
  dangTai?: boolean
  onXemChiTiet?: (suKien: DongTatCaLich) => void
}

type SuKienViTri = DongTatCaLich & {
  topPx: number
  heightPx: number
}

const LichTuanTatCaLich = ({
  danhSach,
  dauTuan,
  tags,
  dangTai,
  onXemChiTiet,
}: LichTuanTatCaLichProps) => {
  const homNay = useMemo(() => dayjs().startOf("day"), [])
  const vungCuonRef = useRef<HTMLDivElement>(null)
  const cotHomNayRef = useRef<HTMLDivElement>(null)

  const gioNhan = useMemo(() => gioTrongLichTuan(), [])
  const ngayTrongTuan = useMemo(() => taoNgayTrongTuan(dauTuan), [dauTuan])

  const suKienTheoNgay = useMemo(() => {
    const map = new Map<string, SuKienViTri[]>()

    for (const ngay of ngayTrongTuan) {
      map.set(ngay.format("YYYY-MM-DD"), [])
    }

    for (const suKien of danhSach) {
      const bucket = map.get(suKien.ngayKey)
      if (!bucket) continue

      const { topPx, heightPx } = tinhViTriLichTuan(
        suKien.batDauIso,
        suKien.ketThucIso,
        suKien.caNgay
      )

      bucket.push({ ...suKien, topPx, heightPx })
    }

    return map
  }, [danhSach, ngayTrongTuan])

  const tuanHienTai = useMemo(() => homNay.isSame(dauTuan, "isoWeek"), [dauTuan, homNay])

  useEffect(() => {
    if (!tuanHienTai || !cotHomNayRef.current || !vungCuonRef.current) return

    const cot = cotHomNayRef.current
    const vung = vungCuonRef.current
    const offsetLeft = cot.offsetLeft - vung.clientWidth / 2 + cot.clientWidth / 2
    vung.scrollTo({ left: Math.max(0, offsetLeft), behavior: "smooth" })
  }, [tuanHienTai, dauTuan, danhSach, dangTai])

  if (dangTai) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    )
  }

  const coSuKien = danhSach.length > 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={vungCuonRef} className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[840px]">
          <div className="sticky top-0 z-10 flex border-b border-cgv-green/30 bg-cgv-green/10 pb-2">
            <div className="w-11 shrink-0" />
            <div className="grid min-w-0 flex-1 grid-cols-7">
              {ngayTrongTuan.map((ngay) => {
                const laHomNay = ngay.isSame(homNay, "day")
                return (
                  <div
                    key={ngay.format("YYYY-MM-DD")}
                    ref={laHomNay ? cotHomNayRef : undefined}
                    className={cn(
                      CLASS_TIEU_DE_THU,
                      laHomNay && "bg-cgv-green/35 ring-1 ring-inset ring-cgv-green-dark/30"
                    )}
                  >
                    {formatNhanNgayTuan(ngay)}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative flex" style={{ height: CHIEU_CAO_LICH_TUAN }}>
            <div className="relative w-11 shrink-0">
              {gioNhan.map((gio) => (
                <span
                  key={gio}
                  className="absolute right-1 -translate-y-1/2 text-xs leading-none text-gray-400"
                  style={{ top: (gio - gioNhan[0]) * CHIEU_CAO_MOI_GIO_LICH_TUAN }}
                >
                  {formatGioLichNgay(gio)}
                </span>
              ))}
            </div>

            <div className="relative grid min-w-0 flex-1 grid-cols-7">
              {ngayTrongTuan.map((ngay) => {
                const key = ngay.format("YYYY-MM-DD")
                const laHomNay = ngay.isSame(homNay, "day")
                const suKienNgay = suKienTheoNgay.get(key) ?? []

                return (
                  <div
                    key={key}
                    className={cn(
                      "relative border-l border-gray-100 first:border-l-0",
                      laHomNay && "bg-cgv-green/10"
                    )}
                  >
                    {gioNhan.slice(1).map((gio) => (
                      <div
                        key={gio}
                        className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-200"
                        style={{ top: (gio - gioNhan[0]) * CHIEU_CAO_MOI_GIO_LICH_TUAN }}
                      />
                    ))}

                    {suKienNgay.map((suKien) => (
                      <button
                        key={suKien.id}
                        type="button"
                        onClick={() => onXemChiTiet?.(suKien)}
                        className="absolute left-0.5 right-0.5 z-[1] min-h-[28px] cursor-pointer overflow-hidden rounded-sm border border-gray-100 px-1.5 py-1 text-left transition-opacity hover:z-[2] hover:opacity-90"
                        style={{
                          top: suKien.topPx,
                          height: suKien.heightPx,
                          backgroundColor: `${suKien.mauLoai}14`,
                          borderLeftWidth: 3,
                          borderLeftColor: suKien.mauLoai,
                        }}
                      >
                        <p className="m-0 truncate text-[11px] font-semibold leading-tight text-gray-800">
                          {suKien.tieuDeHienThi}
                        </p>
                        <p className="m-0 truncate text-[10px] leading-tight text-gray-500">
                          {suKien.thoiGian}
                        </p>
                        {suKien.diaDiem !== "—" ? (
                          <p className="m-0 truncate text-[10px] leading-tight text-gray-500">
                            {suKien.diaDiem}
                          </p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )
              })}

              {!coSuKien ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Empty
                    description="Không có lịch trong tuần"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="m-0"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ChuThichTatCaLich tags={tags} />
    </div>
  )
}

export default LichTuanTatCaLich
