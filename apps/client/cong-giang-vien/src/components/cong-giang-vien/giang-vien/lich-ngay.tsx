import {
  CHIEU_CAO_LICH_NGAY,
  CHIEU_CAO_MOI_GIO_LICH_NGAY,
  formatGioLichNgay,
  gioTrongLichNgay,
  tinhViTriLichNgay,
} from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/constants"
import type { SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import { Empty, Spin } from "antd"
import { useMemo } from "react"

interface LichNgayProps {
  suKien: SuKienLich[]
  isLoading?: boolean
}

const LichNgay = ({ suKien, isLoading }: LichNgayProps) => {
  const gioNhan = useMemo(() => gioTrongLichNgay(), [])

  const viTriSuKien = useMemo(
    () =>
      suKien.map((item) => {
        const { topPx, heightPx } = tinhViTriLichNgay(
          item.thoiGianBatDau,
          item.thoiGianKetThuc,
          item.caNgay,
          28
        )
        const phuDe = item.diaDiem ? `${item.thoiGian} · ${item.diaDiem}` : item.thoiGian

        return { ...item, topPx, heightPx, phuDe }
      }),
    [suKien]
  )

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spin size="small" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-2">
        <div className="relative flex" style={{ height: CHIEU_CAO_LICH_NGAY }}>
          <div className="relative w-8 shrink-0">
            {gioNhan.map((gio) => (
              <span
                key={gio}
                className="absolute right-0 -translate-y-1/2 text-[10px] leading-none text-gray-400"
                style={{ top: (gio - gioNhan[0]) * CHIEU_CAO_MOI_GIO_LICH_NGAY }}
              >
                {formatGioLichNgay(gio)}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1 pr-1">
            {gioNhan.slice(1).map((gio) => (
              <div
                key={gio}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-100"
                style={{ top: (gio - gioNhan[0]) * CHIEU_CAO_MOI_GIO_LICH_NGAY }}
              />
            ))}

            {viTriSuKien.length === 0 ? (
              <div
                className="flex items-center justify-center"
                style={{ height: CHIEU_CAO_LICH_NGAY }}
              >
                <Empty
                  description="Không có lịch"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="m-0"
                />
              </div>
            ) : (
              viTriSuKien.map((item) => (
                <div
                  key={item.id}
                  className="absolute left-0 right-0 overflow-hidden rounded border-l-[3px] px-1.5 py-0.5"
                  style={{
                    top: item.topPx,
                    height: item.heightPx,
                    backgroundColor: `${item.mauLoai}14`,
                    borderLeftColor: item.mauLoai,
                  }}
                >
                  <p className="m-0 truncate text-[11px] font-semibold leading-tight text-gray-800">
                    {item.tieuDe}
                  </p>
                  <p className="m-0 truncate text-[10px] leading-tight text-gray-500">
                    {item.phuDe}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LichNgay
