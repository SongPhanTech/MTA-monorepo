import KhoiThongTin from "@components/cong-giang-vien/ho-so-sinh-vien/khoi-thong-tin"
import type { SuKienCanhBaoKyLuat } from "@components/cong-giang-vien/ho-so-sinh-vien/types"

interface TheLichSuCanhBaoKyLuatProps {
  danhSach: SuKienCanhBaoKyLuat[]
}

const lopNhanTrangThai = (color: string) => {
  switch (color) {
    case "green":
      return "bg-cgv-green/20 text-cgv-green-dark"
    case "yellow":
      return "bg-yellow-50 text-yellow-700"
    case "orange":
      return "bg-orange-50 text-orange-600"
    case "gray":
      return "bg-gray-100 text-gray-600"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

const NhanTrangThai = ({ trangThai }: { trangThai: SuKienCanhBaoKyLuat["trangThai"] }) => (
  <span
    className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${lopNhanTrangThai(trangThai.color)}`}
  >
    {trangThai.label}
  </span>
)

const TheLichSuCanhBaoKyLuat = ({ danhSach }: TheLichSuCanhBaoKyLuatProps) => (
  <KhoiThongTin tieuDe="Lịch sử cảnh báo - Kỷ luật - Xử lý học tập">
    {danhSach.length === 0 ? (
      <p className="m-0 py-2 text-sm text-gray-400">
        Chưa có lịch sử cảnh báo, kỷ luật hoặc xử lý học tập.
      </p>
    ) : (
      <div className="space-y-4 py-2">
        {danhSach.map((item) => (
          <div key={item.id} className="relative border-l-2 border-gray-200 pl-4">
            <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-cgv-green-dark" />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-xs text-gray-400">{item.ngay || "—"}</p>
                <p className="m-0 mt-0.5 text-sm font-semibold text-gray-800">{item.tieuDe}</p>
                {item.lyDo ? (
                  <p className="m-0 mt-1 text-sm text-gray-600">
                    <span className="text-gray-400">Lý do: </span>
                    {item.lyDo}
                  </p>
                ) : null}
              </div>
              <NhanTrangThai trangThai={item.trangThai} />
            </div>
          </div>
        ))}
      </div>
    )}
  </KhoiThongTin>
)

export default TheLichSuCanhBaoKyLuat
