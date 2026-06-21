import { Card, Col, Row } from "antd"
import { Bell, Briefcase, GraduationCap, Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeProps {
  soLopGiangDay: number
  soLopQuanLy: number
  soLopTroGiang: number
  tongKhaoSat: number
  khaoSatDangDienRa: number
  khaoSatSapDienRa: number
  onXemLopGiangDay?: () => void
  onXemLopQuanLy?: () => void
  onXemLopTroGiang?: () => void
  onXemKhaoSat?: () => void
}

interface TheDonProps {
  icon: ReactNode
  bgIcon: string
  mauChu: string
  soLuong: number
  nhan: string
  onXem?: () => void
}

const TheDon = ({ icon, bgIcon, mauChu, soLuong, nhan, onXem }: TheDonProps) => (
  <Card size="small" className="h-full" styles={{ body: { padding: 8 } }}>
    <div className="flex items-start gap-2">
      <div
        className={`flex h-9 w-9 min-w-9 items-center justify-center rounded-lg ${bgIcon} ${mauChu}`}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className={`text-xl font-bold leading-tight ${mauChu}`}>{soLuong}</span>
        <span className="text-xs text-gray-500">{nhan}</span>
        {onXem ? (
          <button
            type="button"
            onClick={onXem}
            className="mt-1 w-fit cursor-pointer border-none bg-transparent p-0 text-xs text-primary hover:underline"
          >
            Xem chi tiết →
          </button>
        ) : null}
      </div>
    </div>
  </Card>
)

// Hàng thẻ thống kê: Lớp giảng dạy / Lớp quản lý / Lớp trợ giảng / Khảo sát.
const TheThongKe = ({
  soLopGiangDay,
  soLopQuanLy,
  soLopTroGiang,
  tongKhaoSat,
  khaoSatDangDienRa,
  khaoSatSapDienRa,
  onXemLopGiangDay,
  onXemLopQuanLy,
  onXemLopTroGiang,
  onXemKhaoSat,
}: TheThongKeProps) => {
  return (
    <Row gutter={[8, 8]}>
      <Col xs={24} sm={12} lg={5}>
        <TheDon
          icon={<GraduationCap size={18} />}
          bgIcon="bg-cgv-green"
          mauChu="text-cgv-green-dark"
          soLuong={soLopGiangDay}
          nhan="Lớp giảng dạy"
          onXem={onXemLopGiangDay}
        />
      </Col>
      <Col xs={24} sm={12} lg={5}>
        <TheDon
          icon={<Users size={18} />}
          bgIcon="bg-cgv-blue"
          mauChu="text-blue-600"
          soLuong={soLopQuanLy}
          nhan="Lớp quản lý"
          onXem={onXemLopQuanLy}
        />
      </Col>
      <Col xs={24} sm={12} lg={5}>
        <TheDon
          icon={<Briefcase size={18} />}
          bgIcon="bg-cgv-peach"
          mauChu="text-orange-500"
          soLuong={soLopTroGiang}
          nhan="Lớp trợ giảng"
          onXem={onXemLopTroGiang}
        />
      </Col>
      <Col xs={24} lg={9}>
        <Card size="small" className="h-full" styles={{ body: { padding: 8 } }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-lg bg-cgv-purple text-amber-500">
                <Bell size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight text-cgv-green-dark">
                  {tongKhaoSat}
                </span>
                <span className="text-xs text-gray-500">Tất cả khảo sát</span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-base font-bold text-blue-600">{khaoSatDangDienRa}</span>
                <span className="text-[10px] text-gray-500">Đang diễn ra</span>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex flex-col items-center">
                <span className="text-base font-bold text-orange-500">{khaoSatSapDienRa}</span>
                <span className="text-[10px] text-gray-500">Sắp diễn ra</span>
              </div>
            </div>
          </div>
          {onXemKhaoSat ? (
            <button
              type="button"
              onClick={onXemKhaoSat}
              className="mt-1 w-fit cursor-pointer border-none bg-transparent p-0 text-[10px] text-primary hover:underline"
            >
              Xem chi tiết →
            </button>
          ) : null}
        </Card>
      </Col>
    </Row>
  )
}

export default TheThongKe
