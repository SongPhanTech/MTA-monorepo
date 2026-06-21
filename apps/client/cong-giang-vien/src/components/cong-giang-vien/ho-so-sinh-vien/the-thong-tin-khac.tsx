import HangNhan from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan"
import type { ThongTinKhacSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Card } from "antd"

interface TheThongTinKhacProps {
  data: ThongTinKhacSinhVien
}

const TheThongTinKhac = ({ data }: TheThongTinKhacProps) => (
  <Card
    size="small"
    title={<span className="text-sm font-semibold text-cgv-green-dark">Thông tin khác</span>}
    className="h-full shadow-sm"
    styles={{ body: { padding: "12px 16px" } }}
  >
    <HangNhan label="Ngày vào Đảng" value={data.ngayVaoDang} />
    <HangNhan label="Ngày vào Đoàn" value={data.ngayVaoDoan} />
    <HangNhan label="Học bổng" value={data.hocBong} />
    <HangNhan label="Ưu tiên" value={data.uuTien} />
  </Card>
)

export default TheThongTinKhac
