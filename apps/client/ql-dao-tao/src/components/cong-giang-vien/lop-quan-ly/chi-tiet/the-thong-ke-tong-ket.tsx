import type { ThongKeTongKet } from "@components/cong-giang-vien/lop-quan-ly/types"
import { dinhDangGpa, dinhDangNguong } from "@lib/tong-ket-hoc-ky"
import { Card, Col, Row } from "antd"
import { Award, BarChart3, TrendingDown, TrendingUp } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeTongKetProps {
  thongKe: ThongKeTongKet
}

interface TheDonProps {
  tieuDe: string
  giaTriChinh: string | number
  phuDeChinh?: string
  giaTriPhu?: string
  phuDePhu?: string
  icon: ReactNode
  bgIcon: string
  mauChu: string
}

const TheDon = ({
  tieuDe,
  giaTriChinh,
  phuDeChinh,
  giaTriPhu,
  phuDePhu,
  icon,
  bgIcon,
  mauChu,
}: TheDonProps) => (
  <Card size="small" className="h-full shadow-sm" styles={{ body: { padding: 14 } }}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-col gap-1">
        <span className="text-xs text-gray-500">{tieuDe}</span>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-xl font-bold leading-tight ${mauChu}`}>{giaTriChinh}</span>
          {phuDeChinh ? <span className="text-xs text-gray-500">{phuDeChinh}</span> : null}
        </div>
        {giaTriPhu ? (
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pt-0.5">
            <span className="text-sm font-semibold text-gray-700">{giaTriPhu}</span>
            {phuDePhu ? <span className="text-xs text-gray-400">{phuDePhu}</span> : null}
          </div>
        ) : null}
      </div>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgIcon} ${mauChu}`}
      >
        {icon}
      </div>
    </div>
  </Card>
)

const TheThongKeTongKet = ({ thongKe }: TheThongKeTongKetProps) => {
  const nguongDat =
    thongKe.nguongDat != null
      ? `≥ ${dinhDangNguong(thongKe.nguongDat)}`
      : thongKe.heDiem === 4
        ? "≥ 2,00"
        : "≥ 5,50"
  const nguongDuoi =
    thongKe.nguongDat != null
      ? `< ${dinhDangNguong(thongKe.nguongDat)}`
      : thongKe.heDiem === 4
        ? "< 2,00"
        : "< 5,50"

  return (
    <div className="shrink-0 px-4 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Thống kê tổng kết
      </p>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <TheDon
            tieuDe="Chất lượng học tập"
            giaTriChinh={dinhDangGpa(thongKe.diemTrungBinh)}
            phuDeChinh={`Hệ ${thongKe.heDiem}`}
            giaTriPhu={`${thongKe.soDuoiNguong} (${thongKe.tyLeDuoiNguong})`}
            phuDePhu={`Dưới ngưỡng ${nguongDuoi}`}
            icon={<BarChart3 size={20} />}
            bgIcon="bg-blue-50"
            mauChu="text-blue-600"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <TheDon
            tieuDe="Xuất sắc đến Giỏi"
            giaTriChinh={`${thongKe.soXuatSac + thongKe.soGioi} (${tinhTyLeTong(thongKe.soXuatSac + thongKe.soGioi, thongKe.tongSinhVien)})`}
            phuDeChinh="Sinh viên"
            giaTriPhu={`${thongKe.soKha} (${thongKe.tyLeKha})`}
            phuDePhu="Khá"
            icon={<TrendingUp size={20} />}
            bgIcon="bg-green-50"
            mauChu="text-green-600"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <TheDon
            tieuDe="SV đạt ngưỡng đạt"
            giaTriChinh={`${thongKe.soDatNguong} (${thongKe.tyLeDatNguong})`}
            phuDeChinh="Sinh viên"
            giaTriPhu={nguongDat}
            phuDePhu="Ngưỡng đạt"
            icon={<Award size={20} />}
            bgIcon="bg-cyan-50"
            mauChu="text-cyan-600"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <TheDon
            tieuDe="SV học lực TB trở xuống"
            giaTriChinh={`${thongKe.soTbTroXuong} (${thongKe.tyLeTbTroXuong})`}
            phuDeChinh="Sinh viên"
            giaTriPhu={`${thongKe.soXuatSac} (${thongKe.tyLeXuatSac})`}
            phuDePhu="Xuất sắc"
            icon={<TrendingDown size={20} />}
            bgIcon="bg-orange-50"
            mauChu="text-orange-500"
          />
        </Col>
      </Row>
    </div>
  )
}

const tinhTyLeTong = (so: number, tong: number) =>
  tong > 0 ? `${Math.round((so / tong) * 10000) / 100}%` : "0%"

export default TheThongKeTongKet
