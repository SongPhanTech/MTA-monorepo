import { Tooltip } from "antd"
import clsx from "clsx"
import type { LucideProps } from "lucide-react"
import { Pencil } from "lucide-react"

type EditIconProps = LucideProps & {
  title?: string
  disabled?: boolean
}

const EditIcon = ({ title, disabled = false, ...props }: EditIconProps) => {
  return (
    <Tooltip title={title ?? "Chỉnh sửa"} placement="top">
      <span
        className={clsx(
          "inline-flex items-center",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none" // ⬅️ chặn click luôn
        )}
      >
        <Pencil
          size={16}
          strokeWidth={1.5}
          className={clsx(
            "text-base",
            disabled ? "text-gray-400" : "text-orange-500 cursor-pointer"
          )}
          {...(!disabled && { onClick: (e) => e.stopPropagation() })}
          {...props}
        />
      </span>
    </Tooltip>
  )
}

export default EditIcon
