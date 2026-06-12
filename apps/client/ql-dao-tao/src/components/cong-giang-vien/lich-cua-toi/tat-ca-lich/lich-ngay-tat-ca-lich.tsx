import ChuThichTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/chu-thich-tat-ca-lich"
import {
  CHIEU_CAO_LICH_NGAY,
  CHIEU_CAO_MOI_GIO_LICH_NGAY,
  formatGioLichNgay,
  gioTrongLichNgay,
  tinhViTriLichNgay,
} from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/constants"
import type { DongTatCaLich } from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/types"
import type { TagLoaiLich } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import { Empty, Spin } from "antd"
import { useMemo } from "react"

interface LichNgayTatCaLichProps {
  danhSach: DongTatCaLich[]
  tags: TagLoaiLich[]
  dangTai?: boolean
}

const LichNgayTatCaLich = ({ danhSach, tags, dangTai }: LichNgayTatCaLichProps) => {
  const gioNhan = useMemo(() => gioTrongLichNgay(), [])

  const viTriSuKien = useMemo(
    () =>
      danhSach.map((suKien) => {
        const { topPx, heightPx } = tinhViTriLichNgay(
          suKien.batDauIso,
          suKien.ketThucIso,
          suKien.caNgay
        )
        const phuDe =
          suKien.diaDiem !== "—" ? `${suKien.thoiGian} - ${suKien.diaDiem}` : suKien.thoiGian

        return { ...suKien, topPx, heightPx, phuDe }
      }),
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative flex" style={{ height: CHIEU_CAO_LICH_NGAY }}>
          <div className="relative w-11 shrink-0">
            {gioNhan.map((gio) => (
              <span
                key={gio}
                className="absolute right-1 -translate-y-1/2 text-xs leading-none text-gray-400"
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
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-200"
                style={{ top: (gio - gioNhan[0]) * CHIEU_CAO_MOI_GIO_LICH_NGAY }}
              />
            ))}

            {viTriSuKien.length === 0 ? (
              <div
                className="flex items-center justify-center"
                style={{ height: CHIEU_CAO_LICH_NGAY }}
              >
                <Empty
                  description="Không có lịch trong ngày"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="m-0"
                />
              </div>
            ) : (
              viTriSuKien.map((suKien) => (
                <div
                  key={suKien.id}
                  className="absolute left-0 right-0 overflow-hidden rounded-md border border-gray-100 px-3 py-2"
                  style={{
                    top: suKien.topPx,
                    height: suKien.heightPx,
                    backgroundColor: `${suKien.mauLoai}14`,
                    borderLeftWidth: 3,
                    borderLeftColor: suKien.mauLoai,
                  }}
                >
                  <p className="m-0 truncate text-sm font-semibold leading-snug text-gray-800">
                    {suKien.tieuDeHienThi}
                  </p>
                  <p className="m-0 truncate text-xs text-gray-500">{suKien.phuDe}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ChuThichTatCaLich tags={tags} />
    </div>
  )
}

export default LichNgayTatCaLich
