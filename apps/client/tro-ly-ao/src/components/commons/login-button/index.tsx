import { LoginOutlined } from "@ant-design/icons"
import { signIn, useSession } from "@workspace/auth/react"
import { Button } from "antd"
import type React from "react"

interface LoginButtonProps {
  className?: string
}

const LoginButton: React.FC<LoginButtonProps> = ({ className }) => {
  const { status } = useSession()

  // Không hiển thị nếu đã đăng nhập
  if (status === "authenticated") {
    return null
  }

  const handleLogin = () => {
    signIn()
  }

  return (
    <Button type="primary" icon={<LoginOutlined />} onClick={handleLogin} className={className}>
      Đăng nhập
    </Button>
  )
}

export default LoginButton
