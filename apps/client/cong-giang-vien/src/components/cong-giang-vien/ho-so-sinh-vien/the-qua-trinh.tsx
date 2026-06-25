import KhoiThongTin from "@components/cong-giang-vien/ho-so-sinh-vien/khoi-thong-tin"
import type { SuKienQuaTrinh } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Button } from "antd"
import { useState } from "react"

interface TheQuaTrinhProps {
  danhSach: SuKienQuaTrinh[]
}

const SO_SU_KIEN_MAC_DINH = 4

const NhanLoai = ({ loai, tieuDe }: { loai: SuKienQuaTrinh["loai"]; tieuDe: string }) => {
  if (loai === "khen-thuong") {
    return (
      <span className="inline-block rounded-full bg-cgv-green/20 px-2 py-0.5 text-xs font-medium text-cgv-green-dark">
        {tieuDe}
      </span>
    )
  }
  if (loai === "canh-bao") {
    return (
      <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
        {tieuDe}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
      {tieuDe}
    </span>
  )
}

const TheQuaTrinh = ({ danhSach }: TheQuaTrinhProps) => {
  const [moRong, setMoRong] = useState(false)
  const hienThi = moRong ? danhSach : danhSach.slice(0, SO_SU_KIEN_MAC_DINH)

  return (
    <KhoiThongTin tieuDe="Khen thưởng — Kỷ luật">
      {hienThi.length === 0 ? (
        <p className="m-0 py-2 text-sm text-gray-400">Chưa có dữ liệu.</p>
      ) : (
        <div className="space-y-4 py-2">
          {hienThi.map((item) => (
            <div key={item.id} className="relative border-l-2 border-gray-200 pl-4">
              <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-cgv-green-dark" />
              <p className="m-0 text-xs text-gray-400">{item.ngay || "—"}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <NhanLoai loai={item.loai} tieuDe={item.tieuDe} />
              </div>
              <p className="m-0 mt-1 text-sm text-gray-700">{item.moTa || "—"}</p>
            </div>
          ))}
        </div>
      )}

      {danhSach.length > SO_SU_KIEN_MAC_DINH ? (
        <Button
          type="link"
          size="small"
          className="mb-2 h-auto p-0 text-cgv-green-dark"
          onClick={() => setMoRong((v) => !v)}
        >
          {moRong ? "Thu gọn" : "Xem tất cả"}
        </Button>
      ) : null}
    </KhoiThongTin>
  )
}

export default TheQuaTrinh
