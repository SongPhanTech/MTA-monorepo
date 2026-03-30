import DashboardLayout from "@layouts/dashboard-layout"
import { Typography } from "antd"

const { Title } = Typography

function Page() {
  return <div>Trang quản lý hồ sơ</div>
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>
}
