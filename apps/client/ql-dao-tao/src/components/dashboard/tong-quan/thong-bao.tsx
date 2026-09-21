import { RightOutlined } from "@ant-design/icons"
import { useFindManyNotification } from "@workspace/db/hooks"
import { ViewNotificationModal, dayjs } from "@workspace/ui"
import { Empty, Spin } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"
import { LinkAction, Panel } from "./shared"

export function ThongBaoHocVien({
  onViewAll,
  className = "",
}: {
  onViewAll?: () => void
  className?: string
}) {
  const today = dayjs().endOf("day").toDate()
  // Cùng bộ lọc với DanhSachThongBao (packages/ui) — không lọc theo loại
  const { data = [], isLoading } = useFindManyNotification({
    where: {
      active: true,
      publishedAt: { lte: today },
      OR: [{ expiresAt: null }, { expiresAt: { gte: today } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  })
  const { onOpen } = useDisclosure<string>({ tag: "ViewNotificationModal" })

  return (
    <Panel
      title="Thông báo học viện"
      action={
        onViewAll ? (
          <LinkAction
            label="Xem tất cả"
            onClick={onViewAll}
            className="text-white/90 hover:text-white"
          />
        ) : null
      }
      headerClassName="border-[#166534] bg-[#1b7a4b]"
      titleClassName="text-white"
      className={`flex h-full min-h-0 flex-col ${className}`}
      bodyClassName="min-h-0 flex-1 overflow-hidden"
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center py-8">
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center py-8">
          <Empty description="Không có thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <div className="h-full overflow-y-auto overflow-x-hidden px-2 py-1 [scrollbar-width:thin]">
          <ul className="m-0 list-none p-0">
            {data.map((item) => {
              const urgent = item.type === "URGENT"
              return (
                <li
                  key={item.id}
                  onClick={() => onOpen(item.id)}
                  className="flex cursor-pointer items-start gap-2 border-b border-[#f3f4f6] px-1 py-2.5 last:border-0 hover:bg-[#f9fafb]"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${
                      urgent ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#e8f7ef] text-[#0f8a4b]"
                    }`}
                  >
                    {urgent ? "Khẩn" : "Thông báo"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13px] font-medium leading-snug text-[#111827]">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[11px] text-[#9ca3af]">
                      {item.publishedAt ? dayjs(item.publishedAt).format("DD/MM/YYYY HH:mm") : ""}
                    </div>
                  </div>
                  <RightOutlined className="mt-1 text-[10px] text-[#c0c4cc]" />
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <ViewNotificationModal />
    </Panel>
  )
}
