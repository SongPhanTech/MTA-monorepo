import HangNhan from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan"
import type { ThongTinCaNhanSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Card } from "antd"

interface TheThongTinCaNhanProps {
  data: ThongTinCaNhanSinhVien
}

const TheThongTinCaNhan = ({ data }: TheThongTinCaNhanProps) => (
  <Card
    size="small"
    title={<span className="text-sm font-semibold text-cgv-green-dark">Thông tin cá nhân</span>}
    className="h-full shadow-sm"
    styles={{ body: { padding: "12px 16px" } }}
  >
    <HangNhan label="Họ và tên" value={data.hoVaTen} />
    <HangNhan label="Ngày sinh" value={data.ngaySinh} />
    <HangNhan label="Giới tính" value={data.gioiTinh} />
    <HangNhan label="CCCD/CMND" value={data.cccd} />
    <HangNhan label="Số điện thoại" value={data.soDienThoai} />
    <HangNhan label="Email" value={data.email} />
    <HangNhan label="Quê quán" value={data.queQuan} />
    <HangNhan label="Dân tộc" value={data.danToc} />
    <HangNhan label="Tôn giáo" value={data.tonGiao} />
    <HangNhan label="Đối tượng" value={data.doiTuongUuTien} />
  </Card>
)

export default TheThongTinCaNhan
