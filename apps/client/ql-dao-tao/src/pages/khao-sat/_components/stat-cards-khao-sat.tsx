import { Card, Col, Row, Skeleton } from "antd"
import { CalendarCheck, ClipboardCheck, ClipboardList, FileClock } from "lucide-react"
import type React from "react"

interface ThongKeKhaoSat {
  tongSo: number
  dangDienRa: number
  sapDienRa: number
  daKetThuc: number
}

interface StatCardsKhaoSatProps {
  thongKe: ThongKeKhaoSat
  isLoading?: boolean
}

interface ItemThongKe {
  key: string
  icon: React.ReactNode
  soLuong: number
  nhan: React.ReactNode
  bgIcon: string
  mauChu: string
}

const StatCardsKhaoSat = ({ thongKe, isLoading }: StatCardsKhaoSatProps) => {
  const items: ItemThongKe[] = [
    {
      key: "tat-ca",
      icon: <ClipboardList size={22} />,
      soLuong: thongKe.tongSo,
      nhan: (
        <>
          Tất cả
          <br />
          khảo sát
        </>
      ),
      bgIcon: "bg-cgv-green",
      mauChu: "text-cgv-green-dark",
    },
    {
      key: "dang-dien-ra",
      icon: <ClipboardCheck size={22} />,
      soLuong: thongKe.dangDienRa,
      nhan: "Đang diễn ra",
      bgIcon: "bg-cgv-blue",
      mauChu: "text-blue-600",
    },
    {
      key: "sap-dien-ra",
      icon: <FileClock size={22} />,
      soLuong: thongKe.sapDienRa,
      nhan: "Sắp diễn ra",
      bgIcon: "bg-cgv-peach",
      mauChu: "text-orange-500",
    },
    {
      key: "da-ket-thuc",
      icon: <CalendarCheck size={22} />,
      soLuong: thongKe.daKetThuc,
      nhan: "Đã kết thúc",
      bgIcon: "bg-cgv-purple",
      mauChu: "text-purple-600",
    },
  ]

  return (
    <Row gutter={[16, 16]} className="my-4">
      {items.map((item) => (
        <Col key={item.key} xs={24} sm={12} lg={6}>
          <Card size="small" className="h-full" styles={{ body: { padding: 16 } }}>
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 min-w-12 items-center justify-center rounded-xl ${item.bgIcon} ${item.mauChu}`}
              >
                {item.icon}
              </div>
              <div className="flex flex-col">
                {isLoading ? (
                  <Skeleton.Button active size="small" style={{ width: 40, height: 28 }} />
                ) : (
                  <span className={`text-2xl font-bold leading-tight ${item.mauChu}`}>
                    {String(item.soLuong).padStart(2, "0")}
                  </span>
                )}
                <span className="text-sm text-gray-500">{item.nhan}</span>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export { StatCardsKhaoSat }
