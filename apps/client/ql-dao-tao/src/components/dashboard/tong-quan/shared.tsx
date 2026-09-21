import type { ReactNode } from "react"

export const cardClass =
  "rounded-lg border border-[#e8eaed] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"

export function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  titleClassName = "",
  fitContent = false,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  headerClassName?: string
  titleClassName?: string
  fitContent?: boolean
}) {
  return (
    <div
      className={`${cardClass} flex min-h-0 flex-col overflow-hidden ${fitContent ? "h-auto" : "h-full"} ${className}`}
    >
      <div
        className={`flex items-center justify-between gap-2 border-b border-[#eef0f3] px-4 py-1.5 ${headerClassName}`}
      >
        <h3
          className={`m-0 min-w-0 flex-1 text-[13px] font-semibold uppercase leading-tight tracking-[0.04em] text-[#1f2937] ${titleClassName}`}
        >
          {title}
        </h3>
        {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      </div>
      <div className={`min-h-0 ${fitContent ? "" : "flex-1"} ${bodyClassName}`}>{children}</div>
    </div>
  )
}

export function LinkAction({
  label,
  onClick,
  className = "",
}: {
  label: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap text-[13px] font-medium text-[#0f8a4b] hover:text-[#0b6e3c] ${className}`}
    >
      {label} →
    </button>
  )
}

export type KpiCardProps = {
  icon: ReactNode
  title: string
  value: number | string
  hint?: string
  hintTone?: "muted" | "success" | "danger"
  loading?: boolean
  onClick?: () => void
  hoverOnly?: boolean
}

export function KpiCard({
  icon,
  title,
  value,
  hint,
  hintTone = "muted",
  loading,
  onClick,
  hoverOnly,
}: KpiCardProps) {
  const clickable = !!onClick
  const className = `${cardClass} flex h-full min-h-[72px] w-full items-center gap-2.5 px-3 py-2 text-left transition-all duration-200 ${
    clickable
      ? "cursor-pointer hover:-translate-y-0.5 hover:border-[#1b7a4b]/50 hover:bg-[#f3faf5] hover:shadow-[0_6px_16px_rgba(27,122,75,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7a4b] active:translate-y-0"
      : hoverOnly
        ? "cursor-default hover:border-[#d1d5db] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        : ""
  }`

  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f5e9] text-[18px] text-[#1b7a4b] transition-colors group-hover:bg-[#d4edda]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] leading-tight text-[#6b7280]">{title}</div>
        <div className="mt-0.5 text-[22px] font-bold leading-none tabular-nums text-[#111827]">
          {loading ? "…" : typeof value === "number" ? value.toLocaleString("vi-VN") : value}
        </div>
        {hint ? (
          <div
            className={`mt-0.5 truncate text-[11px] leading-tight ${
              hintTone === "success"
                ? "font-medium text-[#1b7a4b]"
                : hintTone === "danger"
                  ? "font-medium text-[#dc2626]"
                  : "text-[#9ca3af]"
            }`}
          >
            {hint}
          </div>
        ) : null}
      </div>
    </>
  )

  if (clickable) {
    return (
      <button type="button" onClick={onClick} className={`group ${className}`}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}
