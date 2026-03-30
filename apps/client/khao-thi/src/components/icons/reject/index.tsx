import { Popconfirm, type PopconfirmProps, Tooltip } from "antd"
import clsx from "clsx"
import type { LucideProps } from "lucide-react"
import { SquareX } from "lucide-react"

type RejectIconProps = {
  popConfirm?: Partial<PopconfirmProps>
  title?: string
  disabled?: boolean
} & LucideProps

const RejectIcon = ({ title, popConfirm, disabled = false, ...props }: RejectIconProps) => {
  const icon = (
    <SquareX
      size={16}
      strokeWidth={1.5}
      className={clsx(
        disabled ? "text-gray-300 cursor-not-allowed" : "text-red-600 cursor-pointer"
      )}
      onClick={(e) => disabled && e.stopPropagation()}
      {...props}
    />
  )

  if (disabled) {
    return (
      <span className="inline-flex items-center">
        <Tooltip title={undefined}>{icon}</Tooltip>
      </span>
    )
  }

  return (
    <Tooltip title={title ?? "Từ chối"} placement="top">
      <Popconfirm
        placement="topLeft"
        title="Xác nhận yêu cầu chỉnh sửa tiêu chí?"
        description="Tiêu chí này bị từ chối"
        okText="Đồng ý"
        cancelText="Hủy"
        {...popConfirm}
      >
        {icon}
      </Popconfirm>
    </Tooltip>
  )
}

export default RejectIcon
