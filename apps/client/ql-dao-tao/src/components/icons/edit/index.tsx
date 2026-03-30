import { Tooltip } from "antd"
import type { LucideProps } from "lucide-react"
import { Pencil } from "lucide-react"

type EditIconProps = LucideProps & {
  title?: string
  disabled?: boolean
}

const EditIcon = ({ title, disabled = false, ...props }: EditIconProps) => {
  if (disabled) {
    return (
      <span className="inline-flex items-center">
        <Tooltip title={undefined}>
          <Pencil size={16} strokeWidth={1.5} className="text-gray-300 cursor-not-allowed" />
        </Tooltip>
      </span>
    )
  }
  return (
    <Tooltip title={title ? title : "Chỉnh sửa"} placement="top">
      <Pencil
        size={16}
        strokeWidth={1.5}
        className="text-base text-blue-700 cursor-pointer"
        onClick={(e) => disabled && e.stopPropagation()}
        {...props}
      />
    </Tooltip>
  )
}

export default EditIcon
