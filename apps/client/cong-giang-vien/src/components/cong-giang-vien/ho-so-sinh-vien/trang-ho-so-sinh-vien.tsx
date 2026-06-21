import TheLichSuHocTap from "@components/cong-giang-vien/ho-so-sinh-vien/the-lich-su-hoc-tap"
import TheQuaTrinh from "@components/cong-giang-vien/ho-so-sinh-vien/the-qua-trinh"
import TheThongTinCaNhan from "@components/cong-giang-vien/ho-so-sinh-vien/the-thong-tin-ca-nhan"
import TheThongTinHocTap from "@components/cong-giang-vien/ho-so-sinh-vien/the-thong-tin-hoc-tap"
import TheThongTinKhac from "@components/cong-giang-vien/ho-so-sinh-vien/the-thong-tin-khac"
import TheThongTinLienHe from "@components/cong-giang-vien/ho-so-sinh-vien/the-thong-tin-lien-he"
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
        <TheTomTatSinhVien
          data={hoSo.tomTat}
          onXemAnhGoc={xemAnhGoc}
          onInHoSo={() => window.print()}
        />
      </div>
      <div className="lg:col-span-3">
        <TheThongTinCaNhan data={hoSo.caNhan} />
      </div>
      <div className="lg:col-span-3">
        <TheThongTinHocTap data={hoSo.hocTap} />
      </div>
      <div className="lg:col-span-3 lg:row-span-2">
        <TheQuaTrinh danhSach={hoSo.quaTrinh} />
      </div>
      <div className="lg:col-span-3">
        <TheThongTinLienHe data={hoSo.lienHe} />
      </div>
      <div className="lg:col-span-3">
        <TheThongTinKhac data={hoSo.khac} />
      </div>
      <div className="lg:col-span-3">
        <TheLichSuHocTap data={hoSo.lichSuHocTap} />
      </div>
    </div>
  )
}

export default TrangHoSoSinhVien
