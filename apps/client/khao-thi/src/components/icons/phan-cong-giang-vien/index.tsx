import { Tooltip } from "antd"
import clsx from "clsx"
import { type LucideProps, UserPlus } from "lucide-react"

type UserPlusIconProps = LucideProps & {
  title?: string
  disabled?: boolean
}

const UserPlusIcon = ({ title, disabled = false, ...props }: UserPlusIconProps) => {
  return (
    <Tooltip title={title ?? "Phân công giảng viên"} placement="top">
      <span
        className={clsx(
          "inline-flex items-center",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none" // ⬅️ chặn click luôn
        )}
      >
        <UserPlus
          size={16}
          strokeWidth={1.5}
          className={clsx(
            "text-base",
            disabled ? "text-gray-400" : "text-green-900 cursor-pointer"
          )}
          {...(!disabled && { onClick: (e) => e.stopPropagation() })}
          {...props}
        />
      </span>
    </Tooltip>
  )
}

export default UserPlusIcon
