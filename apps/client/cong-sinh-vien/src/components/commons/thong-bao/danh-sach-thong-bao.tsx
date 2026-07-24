import { useFindManyNotification } from "@workspace/db/hooks"
import { Empty } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import notificationHelpers from "./helper"
import { $Enums } from "@workspace/db/client"

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
    <div className="h-full max-h-[500px] overflow-y-auto w-full scrollbar-hidden">
      {data?.length > 0 ? (
        <div className="flex flex-col">
          {data?.map((item) => {
            return (
              <div
                key={item?.id}
                onClick={() => {
                  onOpen(item?.id)
                }}
                className="group cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-all duration-200 py-4 px-4 last:border-b-0"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-[#1a1a1a] text-[15px] leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                      {item?.title}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[14px] line-clamp-2 leading-snug">
                    {notificationHelpers.stripHtml(item?.content)}
                  </div>
                  <div className="text-slate-400 text-[12px] font-medium mt-1 uppercase tracking-tight">
                    {notificationHelpers.formatTime(item?.createdAt)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex h-full justify-center items-center">
          <Empty description="Không có thông báo" />
        </div>
      )}
    </div>
  )
}

export default DanhSachThongBao
