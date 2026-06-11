import ChuThichLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/chu-thich-lich-giang-day"
import type { DongLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import {
  CHIEU_CAO_MOI_GIO,
  CHIEU_CAO_TIMELINE,
  formatGioTimeline,
  gioTrongTimeline,
  tinhViTriTimeline,
} from "@components/cong-giang-vien/lich-cua-toi/timeline/constants"
import { LOAI_LICH_META } from "@components/cong-giang-vien/giang-vien/types"
import { Empty, Spin } from "antd"
import { useMemo } from "react"

interface LichNgayGiangDayProps {
  danhSach: DongLichGiangDay[]
  dangTai?: boolean
}

const LichNgayGiangDay = ({ danhSach, dangTai }: LichNgayGiangDayProps) => {
  const gioNhan = useMemo(() => gioTrongTimeline(), [])

  const viTriSuKien = useMemo(() => {
    return danhSach.map((suKien) => {
      const { topPx, heightPx } = tinhViTriTimeline(suKien.batDauIso, suKien.ketThucIso)
      const meta = LOAI_LICH_META[suKien.periodType]
      const phuDe = [suKien.lopHocPhan, suKien.phongHoc]
        .filter((v) => v && v !== "—")
        .join(" | ")

      return {
        ...suKien,
        topPx,
        heightPx,
        meta,
        khoangThoiGian: `${suKien.thoiGianBatDau} - ${suKien.thoiGianKetThuc}`,
        phuDe,
      }
    })
  }, [danhSach])

  const loaiTiet = useMemo(
    () => [...new Set(danhSach.map((item) => item.periodType))],
    [danhSach]
  )

  if (dangTai) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative flex" style={{ height: CHIEU_CAO_TIMELINE }}>
          <div className="relative w-11 shrink-0">
            {gioNhan.map((gio) => (
              <span
                key={gio}
                className="absolute right-1 -translate-y-1/2 text-xs leading-none text-gray-400"
                style={{ top: gio * CHIEU_CAO_MOI_GIO }}
              >
                {formatGioTimeline(gio)}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1 pr-1">
            {gioNhan.slice(1).map((gio) => (
              <div
                key={gio}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-200"
                style={{ top: gio * CHIEU_CAO_MOI_GIO }}
              />
            ))}

            {viTriSuKien.length === 0 ? (
              <div
                className="flex items-center justify-center"
                style={{ height: CHIEU_CAO_TIMELINE }}
              >
                <Empty
                  description="Không có lịch giảng dạy trong ngày"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="m-0"
                />
              </div>
            ) : (
              viTriSuKien.map((suKien) => (
                <div
                  key={suKien.id}
                  className={`absolute left-0 right-0 overflow-hidden rounded-md border border-gray-100 px-3 py-2 ${suKien.meta.blockBg} ${suKien.meta.blockBorder}`}
                  style={{
                    top: suKien.topPx,
                    height: suKien.heightPx,
                    borderLeftWidth: 3,
                  }}
                >
                  <p className="m-0 text-xs text-gray-500">{suKien.khoangThoiGian}</p>
                  <p className="m-0 truncate text-sm font-semibold leading-snug text-gray-800">
                    {suKien.hocPhan}
                  </p>
                  {suKien.phuDe ? (
                    <p className="m-0 truncate text-xs text-gray-500">{suKien.phuDe}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ChuThichLichGiangDay loaiTiet={loaiTiet} />
    </div>
  )
}

export default LichNgayGiangDay
