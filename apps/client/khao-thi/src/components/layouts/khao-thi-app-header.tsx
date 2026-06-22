import logo_mta from "@assets/images/khaothi.svg"
import SidebarMenuToggle from "@components/layouts/sidebar-menu-toggle"
import { KHAO_THI_PORTAL_TITLE } from "@constants/khao-thi-layout"
import Image from "next/image"
import type { ReactNode } from "react"
import HeaderApp from "@/components/header"

interface KhaoThiAppHeaderProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
  children?: ReactNode
}

const KhaoThiAppHeader = ({ collapsed, onToggle, children }: KhaoThiAppHeaderProps) => {
  return (
    <header className="khao-thi-header fixed top-0 left-0 right-0 z-[1000] flex h-16 items-center justify-between border-none px-4">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarMenuToggle collapsed={collapsed} onToggle={onToggle} />
        <div className="khao-thi-header-logo">
          <Image src={logo_mta} alt="logo MTA" className="h-9 w-9" />
        </div>
        <span className="truncate text-base font-bold text-primary">{KHAO_THI_PORTAL_TITLE}</span>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-4 pl-6">
        {children}
        <HeaderApp />
      </div>
    </header>
  )
}

export default KhaoThiAppHeader
