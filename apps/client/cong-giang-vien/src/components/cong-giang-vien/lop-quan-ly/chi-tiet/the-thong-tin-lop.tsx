import type { ThongTinLopQuanLyTomTat } from "@components/cong-giang-vien/lop-quan-ly/types"
import { Skeleton, Tag } from "antd"
import { BookOpen, GraduationCap, Layers, School, Target, UserRound, Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongTinLopProps {
  thongTin?: ThongTinLopQuanLyTomTat | null
  loading?: boolean
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

const TheThongTinLop = ({ thongTin, loading }: TheThongTinLopProps) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-gray-100 bg-cgv-green p-4">
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    )
  }

  if (!thongTin) return null

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0 rounded-lg border border-gray-100 bg-cgv-green px-4 py-5 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-cgv-green-dark shadow-sm ring-1 ring-cgv-green-dark/15">
          <Users size={28} />
        </div>
        <p className="m-0 text-sm font-semibold text-cgv-green-dark">{thongTin.maLop}</p>
        <p className="m-0 mt-1 text-base font-bold text-gray-800">{thongTin.tenLop}</p>
        <Tag color={thongTin.trangThaiLop.color} className="mt-2">
          {thongTin.trangThaiLop.label}
        </Tag>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-gray-100 bg-white px-4 py-2">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Thông tin lớp quản lý
        </p>
        <HangThongTin
          icon={<Users size={15} />}
          label="Sĩ số"
          value={`${thongTin.siSo} sinh viên`}
        />
        <HangThongTin
          icon={<School size={15} />}
          label="Đơn vị quản lý"
          value={thongTin.donViQuanLy}
        />
        <HangThongTin
          icon={<BookOpen size={15} />}
          label="Chuyên ngành"
          value={thongTin.chuyenNganh}
        />
        <HangThongTin icon={<Layers size={15} />} label="Khóa" value={thongTin.khoa} />
        <HangThongTin
          icon={<GraduationCap size={15} />}
          label="Bậc đào tạo"
          value={thongTin.bacDaoTao}
        />
        <HangThongTin
          icon={<BookOpen size={15} />}
          label="Chương trình đào tạo"
          value={thongTin.chuongTrinhDaoTao}
        />
        <HangThongTin
          icon={<Target size={15} />}
          label="Đối tượng đào tạo"
          value={thongTin.doiTuongDaoTao}
        />
        <HangThongTin
          icon={<UserRound size={15} />}
          label="Trạng thái"
          value={thongTin.trangThaiLop.label}
        />
      </div>
    </div>
  )
}

export default TheThongTinLop
