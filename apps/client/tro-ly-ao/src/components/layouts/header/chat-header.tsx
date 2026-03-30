import {
  AppstoreOutlined,
  ExportOutlined,
  LoginOutlined,
  MenuOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons"
import { ROUTER_PATH } from "@workspace/router"
import { useAbility } from "@workspace/permissions/hooks"
import { Button, Layout, Typography } from "antd"
import { usePathname } from "next/navigation"
import { useRouter } from "next/router"
import { useDisclosure } from "react-hook-disclosure-modal"
import HeaderApp from "@/components/header"
import APPS_TYPES from "@/navigations/header-content/app_types"

const { Header } = Layout
const { Title } = Typography

interface ChatHeaderProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  showCollapseButton?: boolean
  isSSOAuthenticated?: boolean
  onSignIn?: () => void
}

const ChatHeader = ({
  collapsed,
  onCollapse,
  showCollapseButton = true,
  isSSOAuthenticated = false,
  onSignIn,
}: ChatHeaderProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const { can } = useAbility()
  const { onOpen: openAppSwitcher } = useDisclosure({
    tag: "AppSwitcherModal",
  })

  const currentApp = APPS_TYPES.find((app) => {
    const paths = app.matchPaths || [app.path]
    return paths.some((path) => pathname?.startsWith(path))
  })

  const isInIframe = typeof window !== "undefined" && window.self !== window.top

  const handleExpandToNewTab = () => {
    if (typeof window !== "undefined" && pathname) {
      window.open(window.location.href, "_blank")
    }
  }

  const handleNavigateToAdmin = () => {
    router.push(ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU_TAI_LIEU)
  }

  return (
    <Header className="bg-white rounded-xl px-4 h-14 flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {showCollapseButton && (
          <Button
            type="text"
            icon={collapsed ? <UnorderedListOutlined /> : <MenuOutlined />}
            onClick={() => onCollapse(!collapsed)}
            className="flex items-center justify-center hover:bg-gray-100"
            title={collapsed ? "Hiện danh sách chat" : "Ẩn danh sách chat"}
          />
        )}
        {/* App Switcher - bên trái tên app */}
        <Button
          type="text"
          icon={<AppstoreOutlined />}
          onClick={openAppSwitcher}
          className="flex items-center justify-center hover:bg-gray-100"
          title="Chuyển ứng dụng"
        />
        {currentApp && (
          <Title level={5} className="!mb-0 !text-primary">
            {currentApp.label}
          </Title>
        )}

        {/* Nút Quản trị - chỉ hiện khi đã đăng nhập SSO và có quyền QUAN_TRI */}
        {isSSOAuthenticated && can("QUAN_TRI" as any, "XEM") && (
          <Button
            type="link"
            onClick={handleNavigateToAdmin}
            className="!text-primary hover:!text-primary/80 font-medium"
            title="Chuyển sang trang quản trị"
          >
            Quản trị →
          </Button>
        )}
      </div>

      {/* Menu SSO bên phải */}
      <div className="flex items-center gap-2">
        {isInIframe && (
          <Button
            type="text"
            icon={<ExportOutlined />}
            onClick={handleExpandToNewTab}
            className="flex items-center justify-center hover:bg-primary/10 hover:text-primary text-gray-500 transition-all duration-200"
            title="Mở trong tab mới"
          />
        )}
        {!isSSOAuthenticated && onSignIn && (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={onSignIn}
            className="flex items-center justify-center"
          >
            Đăng nhập
          </Button>
        )}
        {isSSOAuthenticated && <HeaderApp />}
      </div>
    </Header>
  )
}

export default ChatHeader
