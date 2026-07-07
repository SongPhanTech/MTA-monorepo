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
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-stretch">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <TheTomTatSinhVien data={hoSo.tomTat} onXemAnhGoc={xemAnhGoc} />
      </div>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-100 bg-white">
        <TabNoiDungHoSoSinhVien hoSo={hoSo} />
      </div>
    </div>
  )
}

export default TrangHoSoSinhVien
