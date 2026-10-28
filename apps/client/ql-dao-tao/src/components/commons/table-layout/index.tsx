import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

export type TableLayoutProps = {
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}

export default function TableLayout({ toolbar, children, className }: TableLayoutProps) {
  return (
    <div className={cn("flex h-full min-h-0 min-w-0 w-full flex-col", className)}>
      {toolbar && <div className="shrink-0 px-0 py-2">{toolbar}</div>}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
