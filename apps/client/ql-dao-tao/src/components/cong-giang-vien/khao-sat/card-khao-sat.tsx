import { getTrangThaiKhaoSat, type KhaoSatItem, type TrangThaiKhaoSat } from "@hooks/use-khao-sat-giang-vien"
import { Button, Card, Tag, Typography } from "antd"
import dayjs from "dayjs"
import { CalendarCheck, CalendarDays, ClipboardCheck, ClipboardList, FileClock } from "lucide-react"
import type React from "react"

interface CardKhaoSatProps {
  khaoSat: KhaoSatItem
}

interface CauHinhTrangThai {
  icon: React.ReactNode
  bgIcon: string
  mauChu: string
  nhanBadge: string
  mauBadge: string
}

const CAU_HINH_TRANG_THAI: Record<TrangThaiKhaoSat, CauHinhTrangThai> = {
  dang_dien_ra: {
    icon: <ClipboardCheck size={20} />,
    bgIcon: "bg-cgv-blue",
    mauChu: "text-blue-600",
    nhanBadge: "Đang diễn ra",
    mauBadge: "green",
  },
  sap_dien_ra: {
    icon: <FileClock size={20} />,
    bgIcon: "bg-cgv-peach",
    mauChu: "text-orange-500",
    nhanBadge: "Sắp diễn ra",
    mauBadge: "orange",
  },
  da_ket_thuc: {
    icon: <CalendarCheck size={20} />,
    bgIcon: "bg-cgv-purple",
    mauChu: "text-purple-600",
    nhanBadge: "Đã kết thúc",
    mauBadge: "red",
  },
}

const dinhDangThoiGian = (giaTri?: string | null) =>
  giaTri ? dayjs(giaTri).format("DD/MM/YYYY HH:mm") : "—"

const CardKhaoSat = ({ khaoSat }: CardKhaoSatProps) => {
  const trangThai = getTrangThaiKhaoSat(khaoSat.startDate, khaoSat.endDate)
  const cauHinh = CAU_HINH_TRANG_THAI[trangThai]
  const daHoanThanh = khaoSat.surveySessions?.some((s) => s.isCompleted) ?? false

  return (
    <Card size="small" className="mb-3" styles={{ body: { padding: 12 } }}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 min-w-10 items-center justify-center rounded-xl ${cauHinh.bgIcon} ${cauHinh.mauChu}`}
        >
          {cauHinh.icon ?? <ClipboardList size={20} />}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Typography.Text strong className="text-sm text-cgv-green-dark">
            {khaoSat.name}
          </Typography.Text>
          <div className="flex flex-wrap items-center gap-1">
            {khaoSat.surveyTopic?.name && (
              <Tag color="cyan" className="m-0">
                {khaoSat.surveyTopic.name}
              </Tag>
            )}
            {khaoSat.subjectClass?.name && (
              <Tag color="blue" className="m-0">
                {khaoSat.subjectClass.name}
              </Tag>
            )}
            {khaoSat.tenHocKy && (
              <Tag color="geekblue" className="m-0">
                {khaoSat.tenHocKy}
              </Tag>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-2 text-xs text-gray-500 md:flex">
          <CalendarDays size={18} className="text-gray-400" />
          <div className="flex flex-col">
            <span>Thời gian bắt đầu</span>
            <span className="font-medium text-gray-700">
              {dinhDangThoiGian(khaoSat.startDate)}
            </span>
          </div>
        </div>

        <div className="ml-6 hidden items-center gap-2 text-xs text-gray-500 md:flex">
          <CalendarDays size={18} className="text-gray-400" />
          <div className="flex flex-col">
            <span>Thời gian kết thúc</span>
            <span className="font-medium text-gray-700">
              {dinhDangThoiGian(khaoSat.endDate)}
            </span>
          </div>
        </div>

        <Tag color={cauHinh.mauBadge} className="m-0">
          {cauHinh.nhanBadge}
        </Tag>

        {trangThai !== "da_ket_thuc" && (
          <Button
            type="primary"
            size="small"
            disabled={trangThai === "sap_dien_ra"}
            onClick={() => {
              // TODO: điều hướng sang trang trả lời khảo sát khi có route
            }}
          >
            {daHoanThanh ? "Xem lại" : "Trả lời khảo sát"}
          </Button>
        )}
      </div>
    </Card>
  )
}

export default CardKhaoSat
