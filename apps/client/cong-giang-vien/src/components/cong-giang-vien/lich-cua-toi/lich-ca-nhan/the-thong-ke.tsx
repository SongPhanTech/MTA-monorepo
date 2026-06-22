import type { ThongKeLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import type { CheDoHienThiLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { Card, Col, Row } from "antd"
import { BookOpen, CalendarDays, User, Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeLichCaNhanProps {
  thongKe: ThongKeLichCaNhan
  cheDoHienThi: CheDoHienThiLich
}

interface TheDonProps {
  tieuDe: string
  soLuong: number
  bienDong: string
  icon: ReactNode
  bgIcon: string
  mauChu: string
}

const TheDon = ({ tieuDe, soLuong, bienDong, icon, bgIcon, mauChu }: TheDonProps) => (
  <Card size="small" className="h-full" styles={{ body: { padding: 12 } }}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-gray-500">{tieuDe}</span>
        <span className={`text-2xl font-bold leading-tight ${mauChu}`}>{soLuong}</span>
        <span className="text-xs text-gray-400">{bienDong}</span>
      </div>
      <div
        className={`flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-xl ${bgIcon} ${mauChu}`}
      >
        {icon}
      </div>
    </div>
  </Card>
)

const TheThongKeLichCaNhan = ({ thongKe, cheDoHienThi }: TheThongKeLichCaNhanProps) => {
  const donVi = cheDoHienThi === "thang" ? "tháng" : cheDoHienThi === "tuan" ? "tuần" : "ngày"

  return (
    <Row gutter={[12, 12]} className="py-3">
      <Col xs={24} sm={12} lg={6}>
        <TheDon
          tieuDe={`Tổng sự kiện trong ${donVi}`}
          soLuong={thongKe.tongSuKien}
          bienDong={thongKe.tongBienDong}
          icon={<CalendarDays size={20} />}
          bgIcon="bg-cgv-green"
          mauChu="text-cgv-green-dark"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <TheDon
          tieuDe="Công việc"
          soLuong={thongKe.congViec}
          bienDong={thongKe.congViecBienDong}
          icon={<BookOpen size={20} />}
          bgIcon="bg-cgv-blue"
          mauChu="text-blue-600"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <TheDon
          tieuDe="Cuộc họp"
          soLuong={thongKe.cuocHop}
          bienDong={thongKe.cuocHopBienDong}
          icon={<Users size={20} />}
          bgIcon="bg-cgv-peach"
          mauChu="text-orange-500"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <TheDon
          tieuDe="Cá nhân"
          soLuong={thongKe.caNhan}
          bienDong={thongKe.caNhanBienDong}
          icon={<User size={20} />}
          bgIcon="bg-cgv-purple"
          mauChu="text-purple-600"
        />
      </Col>
    </Row>
  )
}

export default TheThongKeLichCaNhan
