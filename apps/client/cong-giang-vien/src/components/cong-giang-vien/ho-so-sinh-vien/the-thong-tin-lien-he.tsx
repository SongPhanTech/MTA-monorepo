import HangNhan from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan"
import type { ThongTinLienHeSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Card } from "antd"

interface TheThongTinLienHeProps {
  data: ThongTinLienHeSinhVien
}

const TheThongTinLienHe = ({ data }: TheThongTinLienHeProps) => (
  <Card
    size="small"
    title={<span className="text-sm font-semibold text-cgv-green-dark">Thông tin liên hệ</span>}
    className="h-full shadow-sm"
    styles={{ body: { padding: "12px 16px" } }}
  >
    <HangNhan label="Thường trú" value={data.thuongTru} />
    <HangNhan label="Hiện tại" value={data.hienTai} />
    <HangNhan label="Liên hệ khẩn" value={data.lienHeKhanCap} />
  </Card>
)

export default TheThongTinLienHe
