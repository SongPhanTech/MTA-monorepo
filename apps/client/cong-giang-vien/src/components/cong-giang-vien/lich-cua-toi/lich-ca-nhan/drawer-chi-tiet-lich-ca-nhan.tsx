import {
  CHON_NGUOI_LIEN_QUAN,
  formatGioChiTietLich,
  layChuCaiVietTat,
  layNhanLapLai,
  layNhanNhacLichChiTiet,
  MAU_LOAI_MAC_DINH,
  taoNhanNguoiLienQuan,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { cn } from "@workspace/ui/lib/utils"
import { useFindUniqueIndividualSchedule, useFindUniqueUserProfile } from "@workspace/db/hooks"
import { Button, Drawer, Modal, Spin } from "antd"
import {
  Bell,
  Check,
  Clock,
  FileText,
  FolderOpen,
  MapPin,
  Pencil,
  RefreshCw,
  Trash2,
  User,
  Users,
} from "lucide-react"
import type { ReactNode } from "react"

const MAU_AVATAR = ["#dc2626", "#6b7280", "#ea580c", "#2563eb", "#9333ea", "#028850"] as const

interface DrawerChiTietLichCaNhanProps {
  open: boolean
  lichId: string | null
  onClose: () => void
  onChinhSua: (id: string) => void
  onXoa: (id: string) => void
  onHoanThanh: (id: string) => void
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

const TheTagLoaiLich = ({ ten, mau }: { ten: string; mau: string }) => (
  <span
    className="inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
    style={{
      color: mau,
      backgroundColor: `${mau}14`,
      border: `1px solid ${mau}40`,
    }}
  >
    {ten}
  </span>
)

const DrawerChiTietLichCaNhan = ({
  open,
  lichId,
  onClose,
  onChinhSua,
  onXoa,
  onHoanThanh,
}: DrawerChiTietLichCaNhanProps) => {
  const { data: lich, isLoading } = useFindUniqueIndividualSchedule(
    {
      where: { id: lichId ?? "" },
      include: {
        tags: { select: { id: true, name: true, color: true } },
        relatedUserProfiles: { select: CHON_NGUOI_LIEN_QUAN },
      },
    },
    { enabled: open && !!lichId }
  )

  const { data: nguoiTao } = useFindUniqueUserProfile(
    {
      where: { id: lich?.createdBy ?? "" },
      select: { fullname: true },
    },
    { enabled: open && !!lich?.createdBy }
  )

  const tag = lich?.tags[0]
  const mauTag = tag?.color ?? MAU_LOAI_MAC_DINH
  const tenTag = tag?.name ?? "Loại lịch"
  const nguoiLienQuan = lich?.relatedUserProfiles ?? []
  const hienThiNguoiLienQuan = nguoiLienQuan.slice(0, 3)
  const conLaiNguoi = nguoiLienQuan.length - hienThiNguoiLienQuan.length
  const thoiGian = lich ? formatGioChiTietLich(lich.startTime, lich.endTime, lich.allDay) : null

  const xacNhanXoa = () => {
    if (!lichId) return

    Modal.confirm({
      title: "Xóa lịch này?",
      content: "Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => onXoa(lichId),
    })
  }

  return (
    <Drawer
      title={
        <span className="text-sm font-bold uppercase tracking-wide text-gray-900">
          Chi tiết lịch cá nhân
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
        lichId ? (
          <div className="flex gap-2">
            <Button
              icon={<Pencil size={15} />}
              onClick={() => onChinhSua(lichId)}
              className="!h-10 flex-1 !border-gray-300 !bg-white !px-2 !text-xs !font-medium !text-gray-800 shadow-none hover:!border-gray-400 hover:!bg-gray-50"
            >
              Chỉnh sửa
            </Button>
            <Button
              icon={<Check size={15} className="text-cgv-green-dark" />}
              onClick={() => onHoanThanh(lichId)}
              className="!h-10 flex-1 !border-cgv-green-dark !bg-white !px-2 !text-xs !font-medium !text-cgv-green-dark shadow-none hover:!bg-cgv-green/5"
            >
              Hoàn thành
            </Button>
            <Button
              icon={<Trash2 size={15} className="text-red-500" />}
              onClick={xacNhanXoa}
              className="!h-10 flex-1 !border-red-400 !bg-white !px-2 !text-xs !font-medium !text-red-500 shadow-none hover:!bg-red-50"
            >
              Xóa lịch
            </Button>
          </div>
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
            <TheTagLoaiLich ten={tenTag} mau={mauTag} />
            <h2 className="mt-3 text-xl font-bold leading-snug text-gray-900">{lich.title}</h2>
          </div>

          <div className="px-5 py-1">
            <HangThongTin icon={<Clock size={16} />} label="Thời gian">
              <div className="flex flex-col items-end gap-0.5">
                <span>{thoiGian?.gio}</span>
                <span className="font-semibold text-gray-700">{thoiGian?.ngay}</span>
              </div>
            </HangThongTin>

            <HangThongTin icon={<MapPin size={16} />} label="Địa điểm">
              {lich.location?.trim() || "—"}
            </HangThongTin>

            <HangThongTin icon={<User size={16} />} label="Người tạo">
              {nguoiTao?.fullname?.trim() || "—"}
            </HangThongTin>

            <HangThongTin icon={<FolderOpen size={16} />} label="Danh mục">
              <span className="inline-flex justify-end">
                <TheTagLoaiLich ten={tenTag} mau={mauTag} />
              </span>
            </HangThongTin>

            <HangThongTin icon={<Bell size={16} />} label="Nhắc nhở">
              {layNhanNhacLichChiTiet(lich.reminderMinutes)}
            </HangThongTin>

            <HangThongTin icon={<RefreshCw size={16} />} label="Lặp lại">
              {layNhanLapLai(lich.repeatType)}
            </HangThongTin>

            <HangThongTin icon={<Users size={16} />} label="Người tham gia">
              {nguoiLienQuan.length === 0 ? (
                "—"
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {hienThiNguoiLienQuan.map((nguoi, index) => {
                    const ten = nguoi.fullname?.trim() || nguoi.email || "?"
                    const mau = MAU_AVATAR[index % MAU_AVATAR.length]
                    return (
                      <span
                        key={nguoi.id}
                        title={taoNhanNguoiLienQuan(nguoi)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: mau }}
                      >
                        {layChuCaiVietTat(ten)}
                      </span>
                    )
                  })}
                  {conLaiNguoi > 0 ? (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
                      +{conLaiNguoi}
                    </span>
                  ) : null}
                </div>
              )}
            </HangThongTin>
          </div>

          <div className="mt-auto border-t border-gray-100 px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center text-gray-400">
                <FileText size={16} />
              </span>
              <span className="text-sm font-bold leading-5 text-gray-900">Mô tả</span>
            </div>
            <p
              className={cn(
                "whitespace-pre-wrap text-sm leading-relaxed",
                lich.content?.trim() ? "text-gray-700" : "text-gray-400"
              )}
            >
              {lich.content?.trim() || "Chưa có mô tả."}
            </p>
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default DrawerChiTietLichCaNhan
