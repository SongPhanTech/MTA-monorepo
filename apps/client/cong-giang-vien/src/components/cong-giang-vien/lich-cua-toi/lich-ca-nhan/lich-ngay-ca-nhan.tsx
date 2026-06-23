import ChuThichLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/chu-thich-lich-ca-nhan"
import type {
  DongLichCaNhan,
  TagLoaiLich,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import { MAU_LOAI_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import {
  CHIEU_CAO_MOI_GIO,
  CHIEU_CAO_TIMELINE,
  formatGioTimeline,
  gioTrongTimeline,
  tinhViTriTimeline,
} from "@components/cong-giang-vien/lich-cua-toi/timeline/constants"
import { Empty, Spin } from "antd"
import dayjs from "dayjs"
import { BookOpen, User, Users } from "lucide-react"
import { type ReactNode, useMemo } from "react"

interface LichNgayCaNhanProps {
  danhSach: DongLichCaNhan[]
  tags: TagLoaiLich[]
  dangTai?: boolean
  onSua?: (id: string) => void
}

const iconTheoTenTag = (ten: string, mau: string): ReactNode => {
  const props = { size: 14, style: { color: mau } }
  const chuan = ten.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  if (chuan.includes("hop") || chuan.includes("giang") || chuan.includes("day")) {
    return <Users {...props} />
  }
  if (chuan.includes("ca nhan")) return <User {...props} />
  return <BookOpen {...props} />
}

const layMauSuKien = (suKien: DongLichCaNhan) => suKien.mauLoai ?? MAU_LOAI_MAC_DINH

const LichNgayCaNhan = ({ danhSach, tags, dangTai, onSua }: LichNgayCaNhanProps) => {
  const gioNhan = useMemo(() => gioTrongTimeline(), [])

  const viTriSuKien = useMemo(() => {
    return danhSach.map((suKien) => {
      const batDau = dayjs(suKien.batDauIso)
      const ketThuc = dayjs(suKien.ketThucIso)
      const mau = layMauSuKien(suKien)
      const { topPx, heightPx } = tinhViTriTimeline(
        suKien.batDauIso,
        suKien.ketThucIso,
        suKien.caNgay
      )

      const khoangThoiGian = suKien.caNgay
        ? "Cả ngày"
        : `${batDau.format("HH:mm")} - ${ketThuc.format("HH:mm")}`

      const diaDiemHienThi = suKien.diaDiem && suKien.diaDiem !== "—" ? ` - ${suKien.diaDiem}` : ""

      return {
        ...suKien,
        topPx,
        heightPx,
        mau,
        khoangThoiGian,
        tieuDeDayDu: `${suKien.tieuDe}${diaDiemHienThi}`,
      }
    })
  }, [danhSach])

  if (dangTai) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-2">
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

          <div className="relative min-w-0 flex-1 pr-1">
            {gioNhan.slice(1).map((gio) => (
              <div
                key={gio}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-200"
                style={{ top: (gio - gioNhan[0]) * CHIEU_CAO_MOI_GIO }}
              />
            ))}

            {viTriSuKien.length === 0 ? (
              <div
                className="flex items-center justify-center"
                style={{ height: CHIEU_CAO_TIMELINE }}
              >
                <Empty
                  description="Không có sự kiện trong ngày"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="m-0"
                />
              </div>
            ) : (
              viTriSuKien.map((suKien) => (
                <button
                  key={suKien.id}
                  type="button"
                  onClick={() => onSua?.(suKien.id)}
                  className="absolute left-0 right-0 flex min-h-[36px] items-center gap-2 overflow-hidden rounded-md border border-gray-100 px-3 py-2 text-left transition-shadow hover:shadow-sm"
                  style={{
                    top: suKien.topPx,
                    height: suKien.heightPx,
                    backgroundColor: `${suKien.mau}14`,
                    borderLeftWidth: 3,
                    borderLeftColor: suKien.mau,
                  }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: suKien.mau }}
                    aria-hidden
                  />

                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-xs text-gray-500">{suKien.khoangThoiGian}</p>
                    <p className="m-0 truncate text-sm font-medium text-gray-800">
                      {suKien.tieuDeDayDu}
                    </p>
                  </div>

                  <span
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium"
                    style={{ color: suKien.mau }}
                  >
                    {suKien.tenLoai !== "—" ? suKien.tenLoai : "Loại lịch"}
                    {iconTheoTenTag(suKien.tenLoai, suKien.mau)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <ChuThichLichCaNhan tags={tags} className="shrink-0" />
    </div>
  )
}

export default LichNgayCaNhan
