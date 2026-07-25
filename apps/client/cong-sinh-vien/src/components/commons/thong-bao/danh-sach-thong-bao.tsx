import { $Enums } from "@workspace/db/client"
import { useFindManyNotification } from "@workspace/db/hooks"
import { Empty } from "antd"
import dayjs from "dayjs"
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Info,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { useDisclosure } from "react-hook-disclosure-modal"
import notificationHelpers from "./helper"

interface NotificationMeta {
  tagLabel: string
  iconBg: string
  iconColor: string
  tagBg: string
  tagColor: string
  accentBg: string
  Icon: LucideIcon
}

const NOTIFICATION_META_MAP: Record<string, NotificationMeta> = {
  [$Enums.NotificationType.URGENT]: {
    tagLabel: "Khẩn cấp",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    tagBg: "bg-red-50",
    tagColor: "text-red-700",
    accentBg: "bg-red-500",
    Icon: Bell,
  },
  [$Enums.NotificationType.EXAM]: {
    tagLabel: "Kỳ thi",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    tagBg: "bg-emerald-50",
    tagColor: "text-emerald-800",
    accentBg: "bg-emerald-500",
    Icon: FileText,
  },
  [$Enums.NotificationType.TUITION]: {
    tagLabel: "Học phí",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    tagBg: "bg-amber-50",
    tagColor: "text-amber-800",
    accentBg: "bg-amber-500",
    Icon: Clock,
  },
  [$Enums.NotificationType.ACADEMIC]: {
    tagLabel: "Học tập",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    tagBg: "bg-blue-50",
    tagColor: "text-blue-700",
    accentBg: "bg-blue-500",
    Icon: BookOpen,
  },
  [$Enums.NotificationType.SCHOLARSHIP]: {
    tagLabel: "Học bổng",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    tagBg: "bg-violet-50",
    tagColor: "text-violet-800",
    accentBg: "bg-violet-500",
    Icon: Award,
  },
  [$Enums.NotificationType.EVENT]: {
    tagLabel: "Sự kiện",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    tagBg: "bg-sky-50",
    tagColor: "text-sky-800",
    accentBg: "bg-sky-500",
    Icon: Calendar,
  },
  DEFAULT: {
    tagLabel: "Thông báo",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    tagBg: "bg-blue-50",
    tagColor: "text-blue-700",
    accentBg: "bg-blue-500",
    Icon: Info,
  },
}

function DanhSachThongBao() {
  const today = dayjs().endOf("day").toDate()
  const { data = [] } = useFindManyNotification({
    where: {
      type: {
        in: [
          $Enums.NotificationType.GENERAL,
          $Enums.NotificationType.URGENT,
          $Enums.NotificationType.MAINTENANCE,
          $Enums.NotificationType.ACADEMIC,
          $Enums.NotificationType.EXAM,
          $Enums.NotificationType.EVENT,
          $Enums.NotificationType.SCHOLARSHIP,
          $Enums.NotificationType.TUITION,
        ],
      },
      active: true,
      publishedAt: {
        lte: today,
      },
      OR: [{ expiresAt: null }, { expiresAt: { gte: today } }],
    },
    orderBy: {
      publishedAt: "desc",
    },
  })

  const { onOpen } = useDisclosure<string>({
    tag: "ViewNotificationModal",
  })

  return (
    <div className="w-full space-y-2">
      {data?.length > 0 ? (
        data.map((item) => {
          const meta = NOTIFICATION_META_MAP[item.type] || NOTIFICATION_META_MAP.DEFAULT
          const Icon = meta.Icon
          const isNew = dayjs().diff(dayjs(item.publishedAt || item.createdAt), "hours") < 24
          const timeDisplay = dayjs(item.publishedAt || item.createdAt).format("HH:mm")

          return (
            <div
              key={item.id}
              className="flex w-full items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 hover:shadow"
            >
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-stretch gap-0 border-none bg-transparent p-0 text-left"
              >
                <div className={`w-1 shrink-0 ${meta.accentBg}`} />

                <div className="flex min-w-0 flex-1 items-center gap-3 p-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}
                  >
                    <Icon size={16} className={meta.iconColor} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      {isNew ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                          <Sparkles size={10} strokeWidth={2.5} />
                          NEW
                        </span>
                      ) : null}
                      <p className="m-0 truncate text-xs font-bold uppercase text-gray-900">
                        {item.title}
                      </p>
                    </div>

                    <p className="m-0 mt-0.5 line-clamp-1 text-[11px] text-gray-500">
                      {notificationHelpers.stripHtml(item.content)}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-1">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.tagBg} ${meta.tagColor}`}
                      >
                        {meta.tagLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-between gap-1 pl-1">
                    <span className="whitespace-nowrap text-[10px] font-medium text-gray-500">
                      {timeDisplay}
                    </span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )
        })
      ) : (
        <div className="flex h-full min-h-[120px] items-center justify-center">
          <Empty description="Không có thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )}
    </div>
  )
}

export default DanhSachThongBao
