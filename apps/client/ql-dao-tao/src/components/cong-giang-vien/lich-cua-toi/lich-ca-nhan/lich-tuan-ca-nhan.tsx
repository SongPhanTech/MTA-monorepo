import ChuThichLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/chu-thich-lich-ca-nhan"
import type { DongLichCaNhan, TagLoaiLich } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import { MAU_LOAI_LICH_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { Empty, Spin } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useMemo } from "react"

interface LichTuanCaNhanProps {
  danhSach: DongLichCaNhan[]
  dauTuan: Dayjs
  tags: TagLoaiLich[]
  dangTai?: boolean
  onSua?: (id: string) => void
}

const GIO_BAT_DAU = 7
const GIO_KET_THUC = 17

const TEN_THU = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
] as const

const formatGio = (gio: number) => `${String(gio).padStart(2, "0")}:00`

const formatNhanNgayTuan = (ngay: Dayjs) =>
  `${TEN_THU[ngay.day()]} ${ngay.format("DD/MM")}`

const layMauSuKien = (suKien: DongLichCaNhan) =>
  suKien.mauLoai ?? MAU_LOAI_LICH_MAC_DINH[0]

type SuKienViTri = DongLichCaNhan & {
  top: number
  height: number
  mau: string
  khoangThoiGian: string
  diaDiemHienThi: string
}

const LichTuanCaNhan = ({ danhSach, dauTuan, tags, dangTai, onSua }: LichTuanCaNhanProps) => {
  const gioNhan = useMemo(
    () => Array.from({ length: GIO_KET_THUC - GIO_BAT_DAU + 1 }, (_, i) => GIO_BAT_DAU + i),
    []
  )

  const ngayTrongTuan = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dauTuan.add(i, "day")),
    [dauTuan]
  )

  const suKienTheoNgay = useMemo(() => {
    const tongPhut = (GIO_KET_THUC - GIO_BAT_DAU) * 60
    const map = new Map<string, SuKienViTri[]>()

    for (const ngay of ngayTrongTuan) {
      map.set(ngay.format("YYYY-MM-DD"), [])
    }

    for (const suKien of danhSach) {
      const key = suKien.ngayKey
      if (!map.has(key)) continue

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
        6,
        ((Math.min(phutKetThuc, tongPhut) - Math.max(phutBatDau, 0)) / tongPhut) * 100
      )

      const khoangThoiGian = suKien.caNgay
        ? "Cả ngày"
        : `${batDau.format("HH:mm")} - ${ketThuc.format("HH:mm")}`

      const diaDiemHienThi =
        suKien.diaDiem && suKien.diaDiem !== "—" ? suKien.diaDiem : ""

      map.get(key)!.push({
        ...suKien,
        top,
        height,
        mau,
        khoangThoiGian,
        diaDiemHienThi,
      })
    }

    return map
  }, [danhSach, ngayTrongTuan])

  if (dangTai) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    )
  }

  const coSuKien = danhSach.length > 0

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-auto overflow-x-hidden">
        <div className="sticky top-0 z-10 flex border-b border-gray-200 bg-white pb-2 pt-0.5">
          <div className="flex w-10 shrink-0 items-end pb-0.5 text-[10px] leading-none text-gray-400">
            GMT+7
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-7 gap-1">
            {ngayTrongTuan.map((ngay) => (
              <div
                key={ngay.format("YYYY-MM-DD")}
                className="truncate text-center text-xs font-medium text-gray-700"
              >
                {formatNhanNgayTuan(ngay)}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[360px]">
          <div className="flex w-10 shrink-0 flex-col justify-between py-0.5 text-xs text-gray-400">
            {gioNhan.map((gio) => (
              <span key={gio} className="leading-none">
                {formatGio(gio)}
              </span>
            ))}
          </div>

          <div className="relative grid min-w-0 flex-1 grid-cols-7">
            {ngayTrongTuan.map((ngay) => {
              const key = ngay.format("YYYY-MM-DD")
              const suKienNgay = suKienTheoNgay.get(key) ?? []

              return (
                <div
                  key={key}
                  className="relative border-l border-gray-100 first:border-l-0"
                >
                  {gioNhan.slice(1).map((gio) => (
                    <div
                      key={gio}
                      className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-200"
                      style={{
                        top: `${((gio - GIO_BAT_DAU) / (GIO_KET_THUC - GIO_BAT_DAU)) * 100}%`,
                      }}
                    />
                  ))}

                  {suKienNgay.map((suKien) => (
                    <button
                      key={suKien.id}
                      type="button"
                      onClick={() => onSua?.(suKien.id)}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded-sm border border-gray-100 px-1.5 py-1 text-left transition-shadow hover:shadow-sm"
                      style={{
                        top: `${suKien.top}%`,
                        height: `${suKien.height}%`,
                        minHeight: 28,
                        backgroundColor: `${suKien.mau}14`,
                        borderLeftWidth: 3,
                        borderLeftColor: suKien.mau,
                      }}
                    >
                      <p className="m-0 truncate text-[10px] leading-tight text-gray-500">
                        {suKien.khoangThoiGian}
                      </p>
                      <p className="m-0 truncate text-[11px] font-semibold leading-tight text-gray-800">
                        {suKien.tieuDe}
                      </p>
                      {suKien.diaDiemHienThi ? (
                        <p className="m-0 truncate text-[10px] leading-tight text-gray-500">
                          {suKien.diaDiemHienThi}
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
                  description="Không có sự kiện trong tuần"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="m-0"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ChuThichLichCaNhan tags={tags} className="shrink-0" />
    </div>
  )
}

export default LichTuanCaNhan
