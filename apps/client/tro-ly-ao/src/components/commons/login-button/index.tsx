import { LoginOutlined } from "@ant-design/icons"
import { Button } from "antd"
import type React from "react"
import { useSSOSession } from "@/hooks/useSSOSession"

interface LoginButtonProps {
  className?: string
}

/**
 * Nút đăng nhập SSO cho tro-ly-ao.
 *
 * Dùng `useSSOSession` (có retry + cache) thay vì `useSession` của @workspace/auth
 * để tránh hiện nút "Đăng nhập" mãi khi `get-session` bị 502/timeout tạm thời.
 *
 * Hành vi:
 * - `isLoading` (đang fetch / retry): ẩn button để tránh flicker.
 * - `isAuthenticated`: ẩn button.
 * - Còn lại (unauthenticated thực sự): hiển thị button.
 *
 * Guest (chưa đăng nhập) vẫn chat được — button chỉ là tuỳ chọn để user chủ động đăng nhập.
 */
const LoginButton: React.FC<LoginButtonProps> = ({ className }) => {
  const { isAuthenticated, isLoading, signIn } = useSSOSession()

  // Đang xác thực → chưa quyết định, ẩn để tránh nhấp nháy
  if (isLoading) {
    return null
  }

  // Đã đăng nhập → ẩn nút
  if (isAuthenticated) {
    return null
  }

  return (
    <Button type="primary" icon={<LoginOutlined />} onClick={signIn} className={className}>
      Đăng nhập
    </Button>
  )
}

export default LoginButton
