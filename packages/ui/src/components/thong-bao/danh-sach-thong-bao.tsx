import { NotificationOutlined } from "@ant-design/icons"
import { useFindManyNotification } from "@workspace/db/hooks"
import { Alert, Empty, Space } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"

function DanhSachThongBao() {
  const today = dayjs().endOf("day").toDate()
  const { data = [] } = useFindManyNotification({
    where: {
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
    <div
      style={{
        height: "100%",
        maxHeight: "550px",
        overflowY: "auto",
        paddingRight: "8px",
      }}
    >
      {data?.length > 0 ? (
        <Space direction="vertical">
          {data?.map((item) => {
            return (
              <div key={item?.id} onClick={() => {console.log("open into");onOpen(item?.id)}} className="cursor-pointer">
                <Alert
                  showIcon
                  icon={<NotificationOutlined />}
                  message={
                    <div>
                      <span className="line-clamp-2">{item?.title}</span>
                    </div>
                  }
                  type={item.type === "URGENT" ? "error" : "info"}
                />
              </div>
            )
          })}
        </Space>
      ) : (
        <div className="flex justify-center items-center">
          <Empty description="Không có thông báo" />
        </div>
      )}
    </div>
  )
}

export { DanhSachThongBao }
