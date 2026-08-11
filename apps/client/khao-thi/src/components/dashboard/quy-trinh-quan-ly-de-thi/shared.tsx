import { type ReactNode } from "react"

export const cardClass =
  "rounded-lg border border-[#e8eaed] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"

export interface PanelProps {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  headerClassName?: string
  titleClassName?: string
}

export function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  titleClassName = "",
}: PanelProps) {
  return (
    <div className={`${cardClass} flex h-full min-h-0 flex-col overflow-hidden ${className}`}>
      <div
        className={`flex items-center justify-between gap-2 border-b border-[#eef0f3] px-4 py-1.5 ${headerClassName}`}
      >
        <div
          className={`m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#1f2937] flex items-center gap-2 flex-1 ${titleClassName}`}
        >
          {title}
        </div>
        {action}
      </div>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  )
}
