import type { ThongKeLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import type { CheDoHienThiLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { Card, Col, Row } from "antd"
import { BookOpen, Building2, CalendarDays } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeLichGiangDayProps {
  thongKe: ThongKeLichGiangDay
  cheDoHienThi: CheDoHienThiLich
}

interface TheDonProps {
  tieuDe: string
  soLuong: number
  icon: ReactNode
  bgIcon: string
  mauChu: string
}

const TheDon = ({ tieuDe, soLuong, icon, bgIcon, mauChu }: TheDonProps) => (
  <Card size="small" className="h-full" styles={{ body: { padding: 12 } }}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-gray-500">{tieuDe}</span>
        <span className={`text-2xl font-bold leading-tight ${mauChu}`}>{soLuong}</span>
      </div>
      <div
        className={`flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-xl ${bgIcon} ${mauChu}`}
      >
        {icon}
      </div>
    </div>
  </Card>
)

const TheThongKeLichGiangDay = ({ thongKe, cheDoHienThi }: TheThongKeLichGiangDayProps) => {
  const donVi = cheDoHienThi === "thang" ? "tháng" : cheDoHienThi === "tuan" ? "tuần" : "ngày"

  return (
    <Row gutter={[12, 12]} className="py-3">
      <Col xs={24} sm={8}>
        <TheDon
          tieuDe={`Tổng tiết giảng trong ${donVi}`}
          soLuong={thongKe.tongTiet}
          icon={<CalendarDays size={20} />}
          bgIcon="bg-cgv-green"
          mauChu="text-cgv-green-dark"
        />
      </Col>
      <Col xs={24} sm={8}>
        <TheDon
          tieuDe="Số lớp học phần"
          soLuong={thongKe.soLopHocPhan}
          icon={<BookOpen size={20} />}
          bgIcon="bg-cgv-blue"
          mauChu="text-blue-600"
        />
      </Col>
      <Col xs={24} sm={8}>
        <TheDon
          tieuDe="Số phòng học"
          soLuong={thongKe.soPhongHoc}
          icon={<Building2 size={20} />}
          bgIcon="bg-cgv-peach"
          mauChu="text-orange-500"
        />
      </Col>
    </Row>
  )
}

export default TheThongKeLichGiangDay
