import { cn } from "@lib/utils"
import type { ReactNode } from "react"

interface KhungPanelProps {
  tieuDe: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

// Khung thẻ trắng dùng chung: tiêu đề bên trái, hành động (link) bên phải.
const KhungPanel = ({ tieuDe, action, children, className, bodyClassName }: KhungPanelProps) => {
  return (
    <div className={cn("flex min-h-0 flex-col rounded-lg bg-white ", className)}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <span className="text-sm font-bold uppercase tracking-wide text-cgv-green-dark">
          {tieuDe}
        </span>
        {action ? <div className="shrink-0 text-sm">{action}</div> : null}
      </div>
      <div className={cn("min-h-0 flex-1 p-2", bodyClassName)}>{children}</div>
    </div>
  )
}

export default KhungPanel
