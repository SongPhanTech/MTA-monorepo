import {
  AppstoreOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import { Modal } from "antd"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import APPS_TYPES from "@/navigations/header-content/app_types"

const APP_ICONS: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  TRO_LY_AO: MessageOutlined,
  TIM_KIEM_VAN_BAN: SearchOutlined,
  XU_LY_VAN_BAN: FileTextOutlined,
  CAU_HOI_THUONG_GAP: QuestionCircleOutlined,
  QUAN_TRI_DU_LIEU: DatabaseOutlined,
}

const AppSwitcherModal = () => {
  const pathname = usePathname()
  const { isOpen, onClose } = useDisclosure({
    tag: "AppSwitcherModal",
  })

  const visibleApps = APPS_TYPES.filter((item) => item.isShow)

  return (
    <Modal
      title="Chọn ứng dụng"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={320}
      className="app-switcher-modal"
      centered
    >
      <div className="grid grid-cols-1 gap-3">
        {visibleApps.map((app) => {
          const paths = app.matchPaths || [app.path]
          const isActive = pathname && paths.some((path) => pathname.startsWith(path))

          return (
            <Link
              key={app.key}
              href={app.path}
              onClick={onClose}
              className={`h-14 flex items-center justify-start gap-3 px-4 rounded-lg border transition-all duration-200 no-underline ${
                isActive
                  ? "bg-primary/15 text-primary border-primary/30 cursor-default"
                  : "hover:bg-primary/10 hover:text-primary border-gray-200 hover:border-primary/25 text-gray-700"
              }`}
              style={{ pointerEvents: isActive ? "none" : "auto" }}
            >
              {React.createElement(APP_ICONS[app.key] || AppstoreOutlined, {
                style: { fontSize: "20px" },
              })}
              <span className="text-sm font-medium">{app.label}</span>
            </Link>
          )
        })}
      </div>
    </Modal>
  )
}

export default AppSwitcherModal
