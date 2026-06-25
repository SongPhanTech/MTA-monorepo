import TheLichSuGiaiThuong from "@components/cong-giang-vien/ho-so-sinh-vien/the-lich-su-giai-thuong"
import type { GiaiThuongSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Award, Info } from "lucide-react"

interface TabGiaiThuongProps {
  danhSach: GiaiThuongSinhVien[]
}

const TabGiaiThuong = ({ danhSach }: TabGiaiThuongProps) => (
  <div className="flex flex-col gap-3 p-4">
    <div>
      <div className="flex items-center gap-2">
        <Award size={16} className="text-cgv-green-dark/70" />
        <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-cgv-green-dark">
          Giải thưởng
        </h2>
      </div>
      <p className="m-0 mt-1 text-xs text-gray-500">
        Theo dõi lịch sử giải thưởng, thành tích và điểm cộng của sinh viên.
      </p>
    </div>

    <TheLichSuGiaiThuong danhSach={danhSach} />
  </div>
)

export default TabGiaiThuong
