import { LOAI_LICH_META, type SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import { Empty, Spin } from "antd"
import dayjs from "dayjs"
import { useMemo } from "react"

interface LichNgayProps {
  suKien: SuKienLich[]
  isLoading?: boolean
}

const GIO_BAT_DAU = 8
const GIO_KET_THUC = 16

const formatThuGio = (gio: number) => `${String(gio).padStart(2, "0")}:00`

const LichNgay = ({ suKien, isLoading }: LichNgayProps) => {
  const gioNhan = useMemo(
    () => Array.from({ length: GIO_KET_THUC - GIO_BAT_DAU + 1 }, (_, i) => GIO_BAT_DAU + i),
    []
  )

  const viTriSuKien = useMemo(() => {
    const tongPhut = (GIO_KET_THUC - GIO_BAT_DAU) * 60
    return suKien.map((item) => {
      const batDau = dayjs(item.thoiGianBatDau)
      const ketThuc = dayjs(item.thoiGianKetThuc)
      const phutBatDau = batDau.hour() * 60 + batDau.minute() - GIO_BAT_DAU * 60
      const phutKetThuc = ketThuc.hour() * 60 + ketThuc.minute() - GIO_BAT_DAU * 60
      const top = Math.max(0, (phutBatDau / tongPhut) * 100)
      const height = Math.max(10, ((phutKetThuc - phutBatDau) / tongPhut) * 100)
      const meta = LOAI_LICH_META[item.loaiLich]
      return { ...item, top, height, meta }
    })
  }, [suKien])

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spin size="small" />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full min-w-0 gap-2 overflow-hidden">
      <div className="flex w-8 shrink-0 flex-col justify-between py-0.5 text-[10px] leading-none text-gray-400">
        {gioNhan.map((gio) => (
          <span key={gio}>{formatThuGio(gio)}</span>
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        {suKien.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Empty
              description="Không có lịch"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="m-0"
            />
          </div>
        ) : (
          <div className="relative h-full">
            {gioNhan.slice(1).map((gio) => (
              <div
                key={gio}
                className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                style={{ top: `${((gio - GIO_BAT_DAU) / (GIO_KET_THUC - GIO_BAT_DAU)) * 100}%` }}
              />
            ))}

            {viTriSuKien.map((item) => (
              <div
                key={item.id}
                className={`absolute left-0 right-1 overflow-hidden rounded border-l-[3px] px-1.5 py-0.5 ${item.meta.blockBg} ${item.meta.blockBorder}`}
                style={{
                  top: `${item.top}%`,
                  height: `${item.height}%`,
                  minHeight: 28,
                }}
              >
                <p className="m-0 truncate text-[11px] font-semibold leading-tight text-gray-800">
                  {item.tieuDe}
                </p>
                <p className="m-0 truncate text-[10px] leading-tight text-gray-500">
                  {item.thoiGian}
                  {item.diaDiem ? ` · ${item.diaDiem}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LichNgay
