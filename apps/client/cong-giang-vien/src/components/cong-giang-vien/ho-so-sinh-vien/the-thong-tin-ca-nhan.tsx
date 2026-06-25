import HangNhan from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan"
import KhoiThongTin from "@components/cong-giang-vien/ho-so-sinh-vien/khoi-thong-tin"
import type { ThongTinCaNhanSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"

interface TheThongTinCaNhanProps {
  data: ThongTinCaNhanSinhVien
}

const TheThongTinCaNhan = ({ data }: TheThongTinCaNhanProps) => (
  <KhoiThongTin tieuDe="Thông tin cá nhân">
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
  </KhoiThongTin>
)

export default TheThongTinCaNhan
