import { Tooltip } from "antd"
import clsx from "clsx"
import { type LucideProps, Printer } from "lucide-react"

type PrintIconProps = LucideProps & {
  title?: string
  disabled?: boolean
}

const PrintIcon = ({ title, disabled = false, ...props }: PrintIconProps) => {
  return (
    <Tooltip title={title ?? "In"} placement="top">
      <span
        className={clsx(
          "inline-flex items-center",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none"
        )}
      >
        <Printer
          size={16}
          strokeWidth="1.5"
          className={clsx(
            "text-base",
            disabled ? "text-gray-400" : "text-green-500 cursor-pointer"
          )}
          {...(!disabled && { onClick: (e) => e.stopPropagation() })}
          {...props}
        />
      </span>
    </Tooltip>
  )
}

export default PrintIcon
