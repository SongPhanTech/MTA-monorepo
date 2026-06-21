import type { SuKienQuaTrinh } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Button, Card, Tag } from "antd"
import { useState } from "react"

interface TheQuaTrinhProps {
  danhSach: SuKienQuaTrinh[]
}

const MAU_LOAI: Record<SuKienQuaTrinh["loai"], string> = {
  "khen-thuong": "green",
  "canh-bao": "orange",
  "ky-luat": "red",
}

const SO_SU_KIEN_MAC_DINH = 4

const TheQuaTrinh = ({ danhSach }: TheQuaTrinhProps) => {
  const [moRong, setMoRong] = useState(false)
  const hienThi = moRong ? danhSach : danhSach.slice(0, SO_SU_KIEN_MAC_DINH)

  return (
    <Card
      size="small"
      title={
        <span className="text-sm font-semibold text-cgv-green-dark">
          Quá trình công tác — Khen thưởng — Kỷ luật
        </span>
      }
      className="h-full shadow-sm"
      styles={{ body: { padding: "12px 16px" } }}
    >
      {hienThi.length === 0 ? (
        <p className="m-0 text-sm text-gray-400">Chưa có dữ liệu.</p>
      ) : (
        <div className="space-y-4">
          {hienThi.map((item) => (
            <div key={item.id} className="relative border-l-2 border-gray-200 pl-4">
              <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-cgv-green-dark" />
              <p className="m-0 text-xs text-gray-400">{item.ngay || "—"}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <Tag color={MAU_LOAI[item.loai]}>{item.tieuDe}</Tag>
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
          className="mt-3 h-auto p-0 text-cgv-green-dark"
          onClick={() => setMoRong((v) => !v)}
        >
          {moRong ? "Thu gọn" : "Xem tất cả"}
        </Button>
      ) : null}
    </Card>
  )
}

export default TheQuaTrinh
