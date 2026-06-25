import TheQuaTrinh from "@components/cong-giang-vien/ho-so-sinh-vien/the-qua-trinh"
import TheThongTinCaNhan from "@components/cong-giang-vien/ho-so-sinh-vien/the-thong-tin-ca-nhan"
import TheThongTinHocTap from "@components/cong-giang-vien/ho-so-sinh-vien/the-thong-tin-hoc-tap"
import type { HoSoSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"

interface TabThongTinCoBanProps {
  hoSo: HoSoSinhVien
}

const TabThongTinCoBan = ({ hoSo }: TabThongTinCoBanProps) => (
  <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
    <TheThongTinCaNhan data={hoSo.caNhan} />
    <TheThongTinHocTap data={hoSo.hocTap} />
    <TheQuaTrinh danhSach={hoSo.quaTrinh} />
  </div>
)

export default TabThongTinCoBan
