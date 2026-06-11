import ChuThichLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/chu-thich-lich-ca-nhan"
import type { DongLichCaNhan, TagLoaiLich } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import { MAU_LOAI_LICH_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
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

const GIO_BAT_DAU = 7
const GIO_KET_THUC = 17

const formatGio = (gio: number) => `${String(gio).padStart(2, "0")}:00`

const iconTheoTenTag = (ten: string, mau: string): ReactNode => {
  const props = { size: 14, style: { color: mau } }
  const chuan = ten.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  if (chuan.includes("hop") || chuan.includes("giang") || chuan.includes("day")) {
    return <Users {...props} />
  }
  if (chuan.includes("ca nhan")) return <User {...props} />
  return <BookOpen {...props} />
}

const layMauSuKien = (suKien: DongLichCaNhan) =>
  suKien.mauLoai ?? MAU_LOAI_LICH_MAC_DINH[0]

const LichNgayCaNhan = ({ danhSach, tags, dangTai, onSua }: LichNgayCaNhanProps) => {
  const gioNhan = useMemo(
    () => Array.from({ length: GIO_KET_THUC - GIO_BAT_DAU + 1 }, (_, i) => GIO_BAT_DAU + i),
    []
  )

  const viTriSuKien = useMemo(() => {
    const tongPhut = (GIO_KET_THUC - GIO_BAT_DAU) * 60
    return danhSach.map((suKien) => {
      const batDau = dayjs(suKien.batDauIso)
      const ketThuc = dayjs(suKien.ketThucIso)
      const mau = layMauSuKien(suKien)

      let phutBatDau: number
      let phutKetThuc: number

      if (suKien.caNgay) {
        phutBatDau = 0
        phutKetThuc = tongPhut
      } else {
        phutBatDau = batDau.hour() * 60 + batDau.minute() - GIO_BAT_DAU * 60
        phutKetThuc = ketThuc.hour() * 60 + ketThuc.minute() - GIO_BAT_DAU * 60
      }

      const top = Math.max(0, (phutBatDau / tongPhut) * 100)
      const height = Math.max(
        8,
        ((Math.min(phutKetThuc, tongPhut) - Math.max(phutBatDau, 0)) / tongPhut) * 100
      )

      const khoangThoiGian = suKien.caNgay
        ? "Cả ngày"
        : `${batDau.format("HH:mm")} - ${ketThuc.format("HH:mm")}`

      const diaDiemHienThi =
        suKien.diaDiem && suKien.diaDiem !== "—" ? ` - ${suKien.diaDiem}` : ""

      return {
        ...suKien,
        top,
        height,
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
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex h-full min-h-[360px] gap-3">
          <div className="flex w-10 shrink-0 flex-col justify-between py-0.5 text-xs text-gray-400">
            {gioNhan.map((gio) => (
              <span key={gio} className="leading-none">
                {formatGio(gio)}
              </span>
            ))}
          </div>

          <div className="relative min-h-0 min-w-0 flex-1">
            {gioNhan.slice(1).map((gio) => (
              <div
                key={gio}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-200"
                style={{
                  top: `${((gio - GIO_BAT_DAU) / (GIO_KET_THUC - GIO_BAT_DAU)) * 100}%`,
                }}
              />
            ))}

            {viTriSuKien.length === 0 ? (
              <div className="flex h-full items-center justify-center">
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
                    top: `${suKien.top}%`,
                    height: `${suKien.height}%`,
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
