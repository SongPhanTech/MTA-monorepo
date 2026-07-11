import type { TomTatSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Avatar, Button, Tag } from "antd"
import { Calendar, GraduationCap, Layers, School, UserRound, Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheTomTatSinhVienProps {
  data: TomTatSinhVien
  onXemAnhGoc?: () => void
}

const HangThongTin = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) => (
  <div className="flex items-start gap-2.5 border-b border-gray-50 py-2.5 last:border-b-0">
    <span className="mt-0.5 shrink-0 text-cgv-green-dark/70">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="m-0 text-xs text-gray-500">{label}</p>
      <p className="m-0 text-sm font-medium text-gray-800">{value || "—"}</p>
    </div>
  </div>
)

const TheTomTatSinhVien = ({ data, onXemAnhGoc }: TheTomTatSinhVienProps) => (
  <div className="flex h-full min-h-0 flex-col gap-3">
    <div className="shrink-0 rounded-lg border border-gray-100 bg-cgv-green px-4 py-5 text-center">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-cgv-green-dark/15">
        <Avatar
          size={64}
          src={data.anhDaiDien}
          icon={<UserRound size={28} />}
          className="bg-cgv-green/20 text-cgv-green-dark"
        />
      </div>
      <p className="m-0 text-sm font-semibold text-cgv-green-dark">{data.maSinhVien}</p>
      <p className="m-0 mt-1 text-base font-bold text-gray-800">{data.hoVaTen}</p>
      <Tag color={data.trangThai.color} className="mt-2">
        {data.trangThai.label}
      </Tag>
    </div>

    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-gray-100 bg-white px-4 py-2">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Thông tin chung sinh viên
      </p>
      <HangThongTin icon={<Calendar size={15} />} label="Ngày sinh" value={data.ngaySinh} />
      <HangThongTin icon={<UserRound size={15} />} label="Giới tính" value={data.gioiTinh} />
      <HangThongTin icon={<Users size={15} />} label="Lớp quản lý" value={data.lop} />
      <HangThongTin icon={<Layers size={15} />} label="Khóa" value={data.khoa} />
      <HangThongTin icon={<School size={15} />} label="Đơn vị quản lý" value={data.donViQuanLy} />
      <HangThongTin icon={<GraduationCap size={15} />} label="Hệ đào tạo" value={data.heDaoTao} />

      {data.anhDaiDien ? (
        <div className="border-t border-gray-50 py-2.5">
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
  </div>
)

export default TheTomTatSinhVien
