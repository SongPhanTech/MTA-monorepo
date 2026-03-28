import { Tooltip } from "antd"
import clsx from "clsx"
import { Download, type LucideProps } from "lucide-react"

type DownloadIconProps = LucideProps & {
  title?: string
  disabled?: boolean
}

const DownloadIcon = ({ title, disabled = false, ...props }: DownloadIconProps) => {
  return (
    <Tooltip title={title ?? "Tải xuống"} placement="top">
      <span
        className={clsx(
          "inline-flex items-center",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none"
        )}
      >
        <Download
          size={16}
          strokeWidth="1.5"
          className={clsx(
            "text-base",
            disabled ? "text-gray-400" : "text-indigo-500 cursor-pointer"
          )}
          {...(!disabled && { onClick: (e) => e.stopPropagation() })}
          {...props}
        />
      </span>
    </Tooltip>
  )
}

export default DownloadIcon
