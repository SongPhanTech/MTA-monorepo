import TheDieuKienCard from "@components/cong-giang-vien/ho-so-sinh-vien/the-dieu-kien-card"
import type { DieuKienTotNghiep } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Activity, Info, Languages, Monitor, Shield } from "lucide-react"

interface TabDieuKienTotNghiepProps {
  data: DieuKienTotNghiep
}

const TabDieuKienTotNghiep = ({ data }: TabDieuKienTotNghiepProps) => (
  <div className="flex flex-col gap-3 p-4">
    <div>
      <div className="flex items-center gap-2">
        <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-cgv-green-dark">
          Điều kiện tốt nghiệp
        </h2>
        <Info size={16} className="text-cgv-green-dark/60" />
      </div>
      <p className="m-0 mt-1 text-xs text-gray-500">
        Quản lý và theo dõi các điều kiện, tiêu chuẩn bắt buộc để sinh viên được xét tốt nghiệp.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <TheDieuKienCard
        kieu="chung-chi"
        icon={<Languages size={18} />}
        tieuDe="Chứng chỉ ngoại ngữ"
        dieuKien={data.ngoaiNgu}
      />
      <TheDieuKienCard
        kieu="chung-chi"
        icon={<Monitor size={18} />}
        tieuDe="Chứng chỉ tin học"
        dieuKien={data.tinHoc}
      />
      <TheDieuKienCard
        kieu="hoc-phan"
        icon={<Shield size={18} />}
        tieuDe="Giáo dục quốc phòng"
        dieuKien={data.giaoDucQuocPhong}
      />
      <TheDieuKienCard
        kieu="tieu-chuan"
        icon={<Activity size={18} />}
        tieuDe="Rèn luyện sức khỏe"
        dieuKien={data.renLuyenSucKhoe}
      />
    </div>
  </div>
)

export default TabDieuKienTotNghiep
