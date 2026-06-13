import type { ThongKeDiemRenLuyen } from "@components/cong-giang-vien/lop-quan-ly/types"
import { Card, Col, Row } from "antd"
import { CheckCircle2, Star, Users, XCircle } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeDiemRenLuyenProps {
  thongKe: ThongKeDiemRenLuyen
}

interface TheDonProps {
  tieuDe: string
  giaTri: string | number
  phuDe?: string
  icon: ReactNode
  bgIcon: string
  mauChu: string
}

const TheDon = ({ tieuDe, giaTri, phuDe, icon, bgIcon, mauChu }: TheDonProps) => (
  <Card size="small" className="h-full shadow-sm" styles={{ body: { padding: 14 } }}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-col gap-0.5">
        <span className="text-xs text-gray-500">{tieuDe}</span>
        <span className={`text-2xl font-bold leading-tight ${mauChu}`}>{giaTri}</span>
        {phuDe ? <span className="text-xs text-gray-400">{phuDe}</span> : null}
      </div>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgIcon} ${mauChu}`}
      >
        {icon}
      </div>
    </div>
  </Card>
)

const TheThongKeDiemRenLuyen = ({ thongKe }: TheThongKeDiemRenLuyenProps) => {
  const tyLeDat =
    thongKe.tongSinhVien > 0
      ? `${Math.round((thongKe.soDat / thongKe.tongSinhVien) * 10000) / 100}%`
      : "0%"
  const tyLeKhongDat =
    thongKe.tongSinhVien > 0
      ? `${Math.round((thongKe.soKhongDat / thongKe.tongSinhVien) * 10000) / 100}%`
      : "0%"

  return (
    <div className="shrink-0 px-4 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Thống kê</p>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <TheDon
            tieuDe="Tổng sinh viên"
            giaTri={thongKe.tongSinhVien}
            icon={<Users size={20} />}
            bgIcon="bg-blue-50"
            mauChu="text-blue-600"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <TheDon
            tieuDe="Đạt"
            giaTri={thongKe.soDat}
            phuDe={tyLeDat}
            icon={<CheckCircle2 size={20} />}
            bgIcon="bg-green-50"
            mauChu="text-green-600"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <TheDon
            tieuDe="Không đạt"
            giaTri={thongKe.soKhongDat}
            phuDe={tyLeKhongDat}
            icon={<XCircle size={20} />}
            bgIcon="bg-red-50"
            mauChu="text-red-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <TheDon
            tieuDe="Điểm TB lớp"
            giaTri={thongKe.diemTrungBinh ?? "—"}
            icon={<Star size={20} />}
            bgIcon="bg-orange-50"
            mauChu="text-orange-500"
          />
        </Col>
      </Row>
    </div>
  )
}

export default TheThongKeDiemRenLuyen
