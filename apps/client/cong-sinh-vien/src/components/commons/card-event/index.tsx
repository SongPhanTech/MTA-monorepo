import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteFilled,
  EditFilled,
  SendOutlined,
} from "@ant-design/icons"
import { Card, ConfigProvider, Popconfirm, Tooltip } from "antd"

interface CardDashBoardProps {
  time?: string
  date?: string
  type?: "primary" | "default" | "success" | "error" | "warning" | "disabled" | string
  title: string
  content: string | number
  location: string
}
export const CardEvent = ({ type, title, content, location, time, date }: CardDashBoardProps) => {
  function getTypeColor(type: string) {
    switch (type) {
      case "primary":
        return {
          bg: "#d5ebdb",
          color: "#7bd198",
        }
      case "success":
        return {
          bg: "#f6ffed",
          color: "#b7eb8f",
        }
      case "error":
        return {
          bg: "#fff2f0",
          color: "#ffccc7",
        }
      case "warning":
        return {
          bg: "#fffbe6",
          color: "#ffe58f",
        }
      case "disabled":
        return {
          bg: "#b7eb8f",
          color: "#f6ffed",
        }
      default:
        return {
          bg: "white",
          color: "#d9d9d9",
        }
    }
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            colorBorderSecondary: `${getTypeColor(type || "default").color}`,
            colorBgContainer: `${getTypeColor(type || "default").bg}`,
          },
        },
      }}
    >
      <Card
        style={{ minHeight: "120px" }}
        size="small"
        bordered={true}
        title={
          <div className="flex justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center text-base text-black">
                <ClockCircleOutlined className="mr-2" />
                <span className="font-semibold">{time}</span>
              </div>
              <div className="h-5 w-px bg-gray-500" /> {/* Divider */}
              <div className="flex items-center text-base text-black">
                <CalendarOutlined className="mr-2" />
                <span className="font-semibold">{date}</span>
              </div>
              <div className="h-5 w-px bg-gray-500" /> {/* Divider */}
              <div className="flex items-center text-base text-black">
                <SendOutlined className="mr-2" />
                <span className="font-semibold">{location}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Tooltip title="Chỉnh sửa" placement="top">
                <EditFilled className="text-sm bg-orange-600 w-7 h-7 rounded-full text-white cursor-pointer flex items-center justify-center" />
              </Tooltip>
              <Tooltip title="Xóa" placement="top">
                <Popconfirm
                  placement="leftTop"
                  title="Xác nhận xóa sự kiện này?"
                  description="Sự kiện sẽ bị xóa vĩnh viễn"
                  okText="Đồng ý"
                  cancelText="Hủy"
                >
                  <DeleteFilled className="text-sm bg-red-600 w-7 h-7 rounded-full text-white cursor-pointer flex items-center justify-center" />
                </Popconfirm>
              </Tooltip>
            </div>
          </div>
        }
      >
        <p className="text-black text-xl font-semibold my-2 mt-0">{title}</p>
        <p className="text-gray-900 text-base">{content}</p>
      </Card>
    </ConfigProvider>
  )
}
