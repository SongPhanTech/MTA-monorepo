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
import { CLASS_TIEU_DE_THU } from "@components/cong-giang-vien/lich-cua-toi/utils"
import { cn } from "@workspace/ui/lib/utils"
import { Empty, Spin } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useMemo } from "react"

interface LichTuanCaNhanProps {
  danhSach: DongLichCaNhan[]
  dauTuan: Dayjs
  tags: TagLoaiLich[]
  dangTai?: boolean
  onXemChiTiet?: (id: string) => void
}

const TEN_THU = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"] as const

const formatNhanNgayTuan = (ngay: Dayjs) => `${TEN_THU[ngay.day()]} ${ngay.format("DD/MM")}`

const layMauSuKien = (suKien: DongLichCaNhan) => suKien.mauLoai ?? MAU_LOAI_MAC_DINH

type SuKienViTri = DongLichCaNhan & {
  topPx: number
  heightPx: number
  mau: string
  khoangThoiGian: string
  diaDiemHienThi: string
}

const LichTuanCaNhan = ({ danhSach, dauTuan, tags, dangTai, onXemChiTiet }: LichTuanCaNhanProps) => {
  const gioNhan = useMemo(() => gioTrongTimeline(), [])

  const ngayTrongTuan = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dauTuan.add(i, "day")),
    [dauTuan]
  )

  const suKienTheoNgay = useMemo(() => {
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
      const { topPx, heightPx } = tinhViTriTimeline(
        suKien.batDauIso,
        suKien.ketThucIso,
        suKien.caNgay,
        28
      )

      const khoangThoiGian = suKien.caNgay
        ? "Cả ngày"
        : `${batDau.format("HH:mm")} - ${ketThuc.format("HH:mm")}`

      const diaDiemHienThi = suKien.diaDiem && suKien.diaDiem !== "—" ? suKien.diaDiem : ""

      map.get(key)!.push({
        ...suKien,
        topPx,
        heightPx,
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
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 z-10 flex border-b border-cgv-green/30 bg-cgv-green/10 pb-2 pt-0.5">
          <div className="flex w-11 shrink-0 items-end pb-0.5 text-[10px] leading-none text-gray-400">
            GMT+7
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-7 gap-1">
            {ngayTrongTuan.map((ngay) => {
              const laHomNay = ngay.isSame(dayjs().startOf("day"), "day")
              return (
                <div
                  key={ngay.format("YYYY-MM-DD")}
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
              const suKienNgay = suKienTheoNgay.get(key) ?? []

              return (
                <div
                  key={key}
                  className="relative border-l border-gray-100 first:border-l-0"
                  style={{ height: CHIEU_CAO_TIMELINE }}
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
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded-sm border border-gray-100 px-1.5 py-1 text-left transition-shadow hover:shadow-sm"
                      style={{
                        top: suKien.topPx,
                        height: suKien.heightPx,
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
      </div>

      <ChuThichLichCaNhan tags={tags} className="shrink-0" />
    </div>
  )
}

export default LichTuanCaNhan
