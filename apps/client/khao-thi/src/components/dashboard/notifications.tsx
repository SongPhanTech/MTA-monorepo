import { NotificationOutlined } from "@ant-design/icons"
import { Alert, Space } from "antd"
import Link from "next/link"

interface NotificationData {
  ID: number
  title: string
  content: string
  type: "IMPORTANT" | "NOTICE"
  createdAt: string
  updatedAt: string
}

const fakeData: NotificationData[] = [
  {
    ID: 1,
    title: "Đề nghị bổ nhiệm chức vụ",
    content: "Kính gửi các cơ quan, đơn vị trực thuộc...",
    type: "IMPORTANT",
    createdAt: "2023-12-01 08:45:00",
    updatedAt: "2023-12-01 09:15:00",
  },
  {
    ID: 2,
    title: "Thông báo kế hoạch huấn luyện",
    content: "Lịch trình huấn luyện sẽ diễn ra theo kế hoạch...",
    type: "NOTICE",
    createdAt: "2023-12-02 14:00:00",
    updatedAt: "2023-12-02 14:30:00",
  },
  {
    ID: 3,
    title: "Điều động nhân sự",
    content: "Quyết định điều động một số cán bộ sang đơn vị mới...",
    type: "IMPORTANT",
    createdAt: "2023-12-03 09:30:00",
    updatedAt: "2023-12-03 10:00:00",
  },
  {
    ID: 4,
    title: "Chính sách hỗ trợ sĩ quan",
    content: "Các chế độ hỗ trợ mới dành cho sĩ quan sẽ được áp dụng...",
    type: "IMPORTANT",
    createdAt: "2023-12-04 11:15:00",
    updatedAt: "2023-12-04 11:45:00",
  },
  {
    ID: 5,
    title: "Lệnh tập trung khẩn cấp",
    content: "Toàn bộ đơn vị phải có mặt tại hội trường trước 18h...",
    type: "IMPORTANT",
    createdAt: "2023-12-05 16:00:00",
    updatedAt: "2023-12-05 16:30:00",
  },
]

function Notification() {
  return (
    <div
      style={{
        height: "100%",
        maxHeight: "550px",
        overflowY: "auto",
        paddingRight: "8px",
      }}
    >
      <Space direction="vertical">
        {fakeData?.length > 0 &&
          fakeData?.map((item: NotificationData) => {
            return (
              <Link key={item.ID} href="#">
                <Alert
                  showIcon
                  icon={<NotificationOutlined />}
                  message={
                    <div>
                      <span>{item?.title}</span>: <span>{item.content}</span>
                    </div>
                  }
                  type={item.type === "IMPORTANT" ? "error" : "info"}
                />
              </Link>
            )
          })}
      </Space>
    </div>
  )
}

export default Notification
