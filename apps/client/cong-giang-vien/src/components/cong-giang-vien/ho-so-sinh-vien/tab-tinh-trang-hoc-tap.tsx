import TheHocBong from "@components/cong-giang-vien/ho-so-sinh-vien/the-hoc-bong"
import TheLichSuCanhBaoKyLuat from "@components/cong-giang-vien/ho-so-sinh-vien/the-lich-su-canh-bao-ky-luat"
import type { TinhTrangHocTapSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { BarChart3 } from "lucide-react"

interface TabTinhTrangHocTapProps {
  data: TinhTrangHocTapSinhVien
}

const TabTinhTrangHocTap = ({ data }: TabTinhTrangHocTapProps) => (
  <div className="flex flex-col gap-3 p-4">
    <div>
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-cgv-green-dark/70" />
        <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-cgv-green-dark">
          Tình trạng học tập
        </h2>
      </div>
      <p className="m-0 mt-1 text-xs text-gray-500">
        Theo dõi học bổng, cảnh báo học tập, kỷ luật và các quyết định xử lý học vụ của sinh viên.
      </p>
    </div>

    <TheHocBong danhSach={data.hocBong} capNhatCuoi={data.capNhatCuoi} />
    <TheLichSuCanhBaoKyLuat danhSach={data.lichSuCanhBaoKyLuat} />
  </div>
)

export default TabTinhTrangHocTap
