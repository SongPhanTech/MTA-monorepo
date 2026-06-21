import type { ReactNode } from "react"

interface OChiSoThongKeProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  variant?: "default" | "blue" | "green"
  extra?: ReactNode
  valueClassName?: string
  plain?: boolean
  compact?: boolean
}

const MAU_NEN: Record<NonNullable<OChiSoThongKeProps["variant"]>, string> = {
  default: "bg-gray-50",
  blue: "bg-blue-50",
  green: "bg-green-50",
}

const MAU_ICON: Record<NonNullable<OChiSoThongKeProps["variant"]>, string> = {
  default: "bg-white text-cgv-green-dark",
  blue: "bg-white text-blue-600",
  green: "bg-white text-cgv-green-dark",
}

const MAU_ICON_PLAIN: Record<NonNullable<OChiSoThongKeProps["variant"]>, string> = {
  default: "bg-gray-50 text-cgv-green-dark",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-cgv-green-dark",
}

const OChiSoThongKe = ({
  label,
  value,
  icon,
  variant = "default",
  extra,
  valueClassName = "",
  plain = false,
  compact = false,
}: OChiSoThongKeProps) => (
  <div
    className={`flex h-full flex-col items-center text-center ${
      plain
        ? `justify-center ${compact ? "px-2 py-2" : "px-3 py-3"}`
        : `rounded-lg ${compact ? "p-2" : "p-3"} ${MAU_NEN[variant]}`
    }`}
  >
    <p className={`m-0 text-gray-500 ${compact ? "text-[10px] leading-tight" : "text-xs"}`}>
      {label}
    </p>
    {icon ? (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl shadow-sm ${
          compact ? "my-1 h-7 w-7" : "my-2 h-9 w-9"
        } ${plain ? MAU_ICON_PLAIN[variant] : MAU_ICON[variant]}`}
      >
        {icon}
      </div>
    ) : null}
    <div
      className={`font-bold leading-tight text-gray-800 ${
        compact ? "text-base" : "text-xl"
      } ${valueClassName}`}
    >
      {value}
    </div>
    {extra}
  </div>
)

export default OChiSoThongKe
