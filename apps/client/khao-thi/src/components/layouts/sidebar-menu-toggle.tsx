import { ChevronLeft, ChevronRight } from "lucide-react"

interface SidebarMenuToggleProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
}

const SidebarMenuToggle = ({ collapsed, onToggle }: SidebarMenuToggleProps) => {
  return (
    <button
      type="button"
      aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
      className="khao-thi-sider-toggle-btn"
      onClick={() => onToggle(!collapsed)}
    >
      {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
    </button>
  )
}

export default SidebarMenuToggle
