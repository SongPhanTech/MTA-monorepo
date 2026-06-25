import TabNoiDungHoSoSinhVien from "@components/cong-giang-vien/ho-so-sinh-vien/tab-noi-dung-ho-so-sinh-vien"
import TheTomTatSinhVien from "@components/cong-giang-vien/ho-so-sinh-vien/the-tom-tat"
import type { HoSoSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"

interface TrangHoSoSinhVienProps {
  hoSo: HoSoSinhVien
}

const TrangHoSoSinhVien = ({ hoSo }: TrangHoSoSinhVienProps) => {
  const xemAnhGoc = () => {
    if (hoSo.tomTat.anhDaiDien) window.open(hoSo.tomTat.anhDaiDien, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
      <div className="lg:col-span-3">
        <TheTomTatSinhVien data={hoSo.tomTat} onXemAnhGoc={xemAnhGoc} />
      </div>
      <div className="lg:col-span-9">
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
          <TabNoiDungHoSoSinhVien hoSo={hoSo} />
        </div>
      </div>
    </div>
  )
}

export default TrangHoSoSinhVien
