import { Button, Result } from "antd"
import { ArrowLeftOutlined, LockOutlined } from "@ant-design/icons"

export const getSsoPortalUrl = () => {
  if (typeof window === "undefined") return "/sso-portal"
  return `${window.location.origin}/sso-portal`
}

const KhongCoQuyenTruyCap = () => {
  const handleQuayVePortal = () => {
    window.location.href = getSsoPortalUrl()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <Result
          icon={<LockOutlined className="text-[#1677ff]" />}
          status="403"
          title="Bạn không có quyền truy cập ứng dụng"
          subTitle={`Tài khoản của bạn không có vai trò giảng viên. Vui lòng quay lại trang chủ.`}
          extra={
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleQuayVePortal}>
              Quay về trang chủ
            </Button>
          }
        />
      </div>
    </div>
  )
}

export default KhongCoQuyenTruyCap
