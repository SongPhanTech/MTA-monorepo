import HangNhan from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan"
import NhanTrangThai from "@components/cong-giang-vien/ho-so-sinh-vien/nhan-trang-thai"
import type { TomTatSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Avatar, Button } from "antd"
import { UserRound } from "lucide-react"

interface TheTomTatSinhVienProps {
  data: TomTatSinhVien
  onXemAnhGoc?: () => void
}

const TheTomTatSinhVien = ({ data, onXemAnhGoc }: TheTomTatSinhVienProps) => (
  <div className="flex h-full flex-col rounded-lg border border-gray-100 bg-white">
    <div className="border-b border-gray-100 px-4 py-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-cgv-green-dark">
        Thông tin chung sinh viên
      </p>
    </div>

    <div className="border-b border-gray-100 px-4 py-5 text-center">
      <Avatar
        size={72}
        src={data.anhDaiDien}
        icon={<UserRound size={32} />}
        className="mb-3 bg-cgv-green/20 text-cgv-green-dark"
      />
      <p className="m-0 text-base font-bold text-gray-800">{data.hoVaTen}</p>
      <div className="mt-2">
        <NhanTrangThai label={data.trangThai.label} />
      </div>
    </div>

    <div className="flex-1 px-4 py-2">
      <HangNhan label="MSSV" value={data.maSinhVien} />
      <HangNhan label="Ngày sinh" value={data.ngaySinh} />
      <HangNhan label="Giới tính" value={data.gioiTinh} />
      <HangNhan label="Lớp quản lý" value={data.lop} />
      <HangNhan label="Khóa" value={data.khoa} />
      <HangNhan label="Đơn vị quản lý" value={data.donViQuanLy} />
      <HangNhan label="Hệ đào tạo" value={data.heDaoTao} />
    </div>

    {data.anhDaiDien ? (
      <div className="border-t border-gray-100 px-4 py-3">
        <Button
          type="link"
          size="small"
          className="h-auto p-0 text-cgv-green-dark"
          onClick={onXemAnhGoc}
        >
          Xem ảnh hồ sơ gốc
        </Button>
      </div>
    ) : null}
  </div>
)

export default TheTomTatSinhVien
