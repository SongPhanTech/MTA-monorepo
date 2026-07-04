import ChuThichLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/chu-thich-lich-giang-day"
import type { DongLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import {
  formatNhanNgayTuan,
  layTenHocPhan,
  taoNgayTrongTuan,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import {
  CHIEU_CAO_MOI_GIO,
  CHIEU_CAO_TIMELINE,
  formatGioTimeline,
  gioTrongTimeline,
  tinhViTriTimeline,
} from "@components/cong-giang-vien/lich-cua-toi/timeline/constants"
import { CLASS_TIEU_DE_THU } from "@components/cong-giang-vien/lich-cua-toi/utils"
import { LOAI_LICH_META } from "@components/cong-giang-vien/giang-vien/types"
import { cn } from "@workspace/ui/lib/utils"
import { Empty, Spin } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import { useEffect, useMemo, useRef } from "react"

dayjs.extend(isoWeek)

interface LichTuanGiangDayProps {
  danhSach: DongLichGiangDay[]
  dauTuan: Dayjs
  dangTai?: boolean
  onXemChiTiet?: (id: string) => void
}

const LichTuanGiangDay = ({ danhSach, dauTuan, dangTai, onXemChiTiet }: LichTuanGiangDayProps) => {
  const homNay = useMemo(() => dayjs().startOf("day"), [])
  const vungCuonRef = useRef<HTMLDivElement>(null)
  const cotHomNayRef = useRef<HTMLDivElement>(null)

  const gioNhan = useMemo(() => gioTrongTimeline(), [])
  const ngayTrongTuan = useMemo(() => taoNgayTrongTuan(dauTuan), [dauTuan])

  const suKienTheoNgay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof mapSuKien>[]>()
    for (const ngay of ngayTrongTuan) {
      map.set(ngay.format("YYYY-MM-DD"), [])
    }
    for (const suKien of danhSach) {
      const bucket = map.get(suKien.ngayKey)
      if (bucket) bucket.push(mapSuKien(suKien))
    }
    return map
  }, [danhSach, ngayTrongTuan])

  const loaiTiet = useMemo(() => [...new Set(danhSach.map((item) => item.periodType))], [danhSach])

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div ref={vungCuonRef} className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[840px]">
          <div className="sticky top-0 z-10 flex border-b border-cgv-green/30 bg-cgv-green/10">
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
                    <div className="truncate">{formatNhanNgayTuan(ngay)}</div>
                    {laHomNay ? (
                      <span className="mt-1 inline-block rounded-full bg-cgv-green px-2 py-0.5 text-[10px] font-semibold text-gray-900">
                        Hôm nay
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-2">
            <div className="relative flex" style={{ height: CHIEU_CAO_TIMELINE }}>
              <div className="relative w-11 shrink-0">
                {gioNhan.map((gio) => (
                  <span
                    key={gio}
                    className="absolute right-1 -translate-y-1/2 text-xs leading-none text-gray-400"
                    style={{ top: (gio - gioNhan[0]) * CHIEU_CAO_MOI_GIO }}
                  >
                    {formatGioTimeline(gio)}
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
                          style={{ top: (gio - gioNhan[0]) * CHIEU_CAO_MOI_GIO }}
                        />
                      ))}

                      {suKienNgay.map((suKien) => (
                        <button
                          key={suKien.id}
                          type="button"
                          onClick={() => onXemChiTiet?.(suKien.id)}
                          className={cn(
                            "absolute left-0.5 right-0.5 z-[1] min-h-[28px] cursor-pointer overflow-hidden rounded-md border border-gray-100 px-1.5 py-1 text-left transition-opacity hover:z-[2] hover:opacity-90",
                            suKien.meta.blockBg,
                            suKien.meta.blockBorder
                          )}
                          style={{
                            top: suKien.topPx,
                            height: suKien.heightPx,
                            borderLeftWidth: 3,
                          }}
                        >
                          <p className="m-0 truncate text-[11px] font-bold leading-tight text-blue-600">
                            {suKien.lopHocPhan}
                          </p>
                          <p className="m-0 truncate text-[10px] leading-tight text-gray-500">
                            {suKien.khoangThoiGian}
                          </p>
                          <p className="m-0 truncate text-[10px] leading-tight text-gray-500">
                            {suKien.phongHoc}
                          </p>
                          <p className="m-0 truncate text-[10px] font-medium leading-tight text-gray-800">
                            {suKien.tenHocPhan}
                          </p>
                        </button>
                      ))}
                    </div>
                  )
                })}

                {danhSach.length === 0 ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <Empty
                      description="Không có lịch giảng dạy trong tuần"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      className="m-0"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChuThichLichGiangDay loaiTiet={loaiTiet} />
    </div>
  )
}

const mapSuKien = (suKien: DongLichGiangDay) => {
  const { topPx, heightPx } = tinhViTriTimeline(suKien.batDauIso, suKien.ketThucIso)
  const meta = LOAI_LICH_META[suKien.periodType]

  return {
    ...suKien,
    topPx,
    heightPx,
    meta,
    tenHocPhan: layTenHocPhan(suKien.hocPhan),
    khoangThoiGian: `${suKien.thoiGianBatDau} - ${suKien.thoiGianKetThuc}`,
  }
}

export default LichTuanGiangDay
