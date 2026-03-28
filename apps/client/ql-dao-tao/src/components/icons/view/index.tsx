import { Tooltip } from "antd"
import type { LucideProps } from "lucide-react"
import { Eye } from "lucide-react"

type ViewIconProps = LucideProps & {
  title?: string
  disabled?: boolean
}

const ViewIcon = ({ title, disabled = false, ...props }: ViewIconProps) => {
  if (disabled) {
    return (
      <span className="inline-flex items-center">
        <Tooltip title={undefined}>
          <Eye size={16} strokeWidth={1.5} className="text-gray-300 cursor-not-allowed" />
        </Tooltip>
      </span>
    )
  }
  return (
    <Tooltip title={title ? title : "Xem chi tiết"} placement="top">
      <Eye
        size={16}
        strokeWidth={1.5}
        className="text-base cursor-pointer"
        onClick={(e) => e.stopPropagation()}
        {...props}
      />
    </Tooltip>
  )
}

export default ViewIcon
