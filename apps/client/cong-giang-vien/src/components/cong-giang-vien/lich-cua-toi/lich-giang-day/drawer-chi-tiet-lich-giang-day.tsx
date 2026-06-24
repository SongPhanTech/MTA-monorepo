import {
  CHON_CHI_TIET_LICH_GIANG_DAY,
  formatThoiGianChiTietGiangDay,
  MAU_SU_KIEN_LICH_GIANG_DAY,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import { diemDanhGiangDayPath } from "@/utils/cong-giang-vien-path-helper"
import { cn } from "@workspace/ui/lib/utils"
import { useFindUniqueClassSchedule } from "@workspace/db/hooks"
import { formatLecturerName } from "@workspace/libs"
import { Button, Drawer, Spin } from "antd"
import {
  BookOpen,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Monitor,
  User,
  Users,
} from "lucide-react"
import { useRouter } from "next/router"
import dayjs from "dayjs"
import type { ReactNode } from "react"

interface DrawerChiTietLichGiangDayProps {
  open: boolean
  lichId: string | null
  onClose: () => void
}

const HangThongTin = ({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) => (
  <div className="flex gap-3 border-b border-gray-100 py-3.5 last:border-b-0">
    <div className="flex shrink-0 items-center gap-3">
      <span className="inline-flex h-5 w-5 items-center justify-center text-gray-400">{icon}</span>
      <span className="w-[108px] text-sm leading-5 text-gray-500">{label}</span>
    </div>
    <div className="min-w-0 flex-1 self-center text-right text-sm font-semibold leading-snug text-gray-900">
      {children}
    </div>
  </div>
)

const TheMaLopHocPhan = ({ ma }: { ma: string }) => (
  <span
    className="inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
    style={{
      color: MAU_SU_KIEN_LICH_GIANG_DAY,
      backgroundColor: `${MAU_SU_KIEN_LICH_GIANG_DAY}14`,
      border: `1px solid ${MAU_SU_KIEN_LICH_GIANG_DAY}40`,
    }}
  >
    {ma}
  </span>
)

const DrawerChiTietLichGiangDay = ({ open, lichId, onClose }: DrawerChiTietLichGiangDayProps) => {
  const router = useRouter()

  const { data: lich, isLoading } = useFindUniqueClassSchedule(
    {
      where: { id: lichId ?? "" },
      select: CHON_CHI_TIET_LICH_GIANG_DAY,
    },
    { enabled: open && !!lichId }
  )

  const subjectClass = lich?.subjectClass
  const maLop = subjectClass?.code?.trim() || "—"
  const tenMon =
    subjectClass?.subject?.name?.trim() || subjectClass?.name?.trim() || "—"
  const phongHoc = lich?.room?.name?.trim() || "—"
  const hinhThuc =
    subjectClass?.trainingObjectType?.trainingForm?.name?.trim() || "—"
  const giangVien =
    formatLecturerName(lich?.lecturer) ||
    formatLecturerName(lich?.extraLecturer) ||
    formatLecturerName(subjectClass?.mainLecturer) ||
    "—"
  const siSo = subjectClass?.subjectClassStudent?.length ?? 0
  const khoaBoMon = subjectClass?.subject?.managementOrganization?.sTen?.trim() || "—"
  const noiDung = lich?.notes?.trim() || ""

  const moDiemDanh = () => {
    if (!subjectClass?.id || !lich?.classDate) return
    onClose()
    void router.push(
      diemDanhGiangDayPath(subjectClass.id, dayjs(lich.classDate).format("YYYY-MM-DD"))
    )
  }

  return (
    <Drawer
      title={
        <span className="text-sm font-bold uppercase tracking-wide text-gray-900">
          Chi tiết lịch giảng dạy
        </span>
      }
      placement="right"
      width={460}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        header: { borderBottom: "1px solid #f3f4f6", padding: "16px 20px" },
        body: { padding: 0, display: "flex", flexDirection: "column" },
        footer: { padding: "16px 20px 20px", borderTop: "1px solid #f3f4f6" },
      }}
      footer={
        subjectClass?.id ? (
          <Button
            block
            icon={<CheckCircle size={16} className="text-cgv-green-dark" />}
            onClick={moDiemDanh}
            className="!h-11 !border-cgv-green-dark !bg-white !font-medium !text-cgv-green-dark shadow-none hover:!bg-cgv-green/5"
          >
            Điểm danh
          </Button>
        ) : null
      }
    >
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spin />
        </div>
      ) : !lich ? (
        <div className="px-6 py-10 text-center text-sm text-gray-500">Không tìm thấy lịch.</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="border-b border-gray-100 px-5 py-5">
            <TheMaLopHocPhan ma={maLop} />
            <h2 className="mt-3 text-xl font-bold leading-snug text-gray-900">{tenMon}</h2>
          </div>

          <div className="px-5 py-1">
            <HangThongTin icon={<Clock size={16} />} label="Thời gian">
              {formatThoiGianChiTietGiangDay(
                lich.classDate,
                lich.startTime,
                lich.endTime,
                lich.startPeriod,
                lich.endPeriod
              )}
            </HangThongTin>

            <HangThongTin icon={<MapPin size={16} />} label="Phòng học">
              {phongHoc}
            </HangThongTin>

            <HangThongTin icon={<Monitor size={16} />} label="Hình thức">
              {hinhThuc}
            </HangThongTin>

            <HangThongTin icon={<User size={16} />} label="Giảng viên">
              {giangVien}
            </HangThongTin>

            <HangThongTin icon={<Users size={16} />} label="Sĩ số lớp">
              {siSo} sinh viên
            </HangThongTin>

            <HangThongTin icon={<BookOpen size={16} />} label="Lớp học phần">
              {maLop}
            </HangThongTin>

            <HangThongTin icon={<Building2 size={16} />} label="Khoa/Bộ môn">
              {khoaBoMon}
            </HangThongTin>
          </div>

          <div className="mt-auto border-t border-gray-100 px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center text-gray-400">
                <FileText size={16} />
              </span>
              <span className="text-sm font-bold leading-5 text-gray-900">Nội dung buổi học</span>
            </div>
            <p
              className={cn(
                "whitespace-pre-wrap text-sm leading-relaxed",
                noiDung ? "text-gray-700" : "text-gray-400"
              )}
            >
              {noiDung || "Chưa có nội dung buổi học."}
            </p>
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default DrawerChiTietLichGiangDay
