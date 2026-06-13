import HangNhan from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan"
import type { ThongTinHocTapSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Card, Tag } from "antd"

interface TheThongTinHocTapProps {
  data: ThongTinHocTapSinhVien
}

const TheThongTinHocTap = ({ data }: TheThongTinHocTapProps) => (
  <Card
    size="small"
    title={<span className="text-sm font-semibold text-cgv-green-dark">Thông tin học tập</span>}
    className="h-full shadow-sm"
    styles={{ body: { padding: "12px 16px" } }}
  >
    <HangNhan label="Hệ đào tạo" value={data.heDaoTao} />
    <HangNhan label="Chương trình" value={data.chuongTrinhDaoTao} />
    <HangNhan label="Ngày nhập học" value={data.ngayNhapHoc} />
    <HangNhan label="Cố vấn HT" value={data.coVanHocTap} />
    <HangNhan label="Hình thức" value={data.hinhThuc} />
    <HangNhan label="Thời gian ĐT" value={data.thoiGianDaoTao} />
    <div className="flex gap-2 py-1.5 text-sm">
      <span className="w-[130px] shrink-0 text-gray-500">Trạng thái</span>
      <Tag color={data.trangThai.color}>{data.trangThai.label}</Tag>
    </div>
    <HangNhan label="Niên khóa" value={data.nienKhoa} />
  </Card>
)

export default TheThongTinHocTap
