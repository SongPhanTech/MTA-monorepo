import HangNhan from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan"
import KhoiThongTin from "@components/cong-giang-vien/ho-so-sinh-vien/khoi-thong-tin"
import NhanTrangThai from "@components/cong-giang-vien/ho-so-sinh-vien/nhan-trang-thai"
import type { ThongTinHocTapSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"

interface TheThongTinHocTapProps {
  data: ThongTinHocTapSinhVien
}

const TheThongTinHocTap = ({ data }: TheThongTinHocTapProps) => (
  <KhoiThongTin tieuDe="Thông tin học tập">
    <HangNhan label="Hệ đào tạo" value={data.heDaoTao} />
    <HangNhan label="Chương trình" value={data.chuongTrinhDaoTao} />
    <HangNhan label="Ngày nhập học" value={data.ngayNhapHoc} />
    <HangNhan label="Hình thức" value={data.hinhThuc} />
    <HangNhan label="Thời gian ĐT" value={data.thoiGianDaoTao} />
    <div className="py-2">
      <p className="m-0 text-xs text-gray-500">Trạng thái</p>
      <div className="mt-1">
        <NhanTrangThai label={data.trangThai.label} />
      </div>
    </div>
    <HangNhan label="Niên khóa" value={data.nienKhoa} />
  </KhoiThongTin>
)

export default TheThongTinHocTap
