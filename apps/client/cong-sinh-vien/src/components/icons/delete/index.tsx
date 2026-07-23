import { Popconfirm, type PopconfirmProps, Tooltip } from "antd"
import clsx from "clsx"
import type { LucideProps } from "lucide-react"
import { Trash2 } from "lucide-react"

type DeleteIconProps = {
  popConfirm?: Partial<PopconfirmProps>
  title?: string
  disabled?: boolean
} & LucideProps

const DeleteIcon = ({ title, popConfirm, disabled = false, ...props }: DeleteIconProps) => {
  const icon = (
    <Trash2
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
    <Tooltip title={title ?? "Xóa"} placement="top">
      <Popconfirm
        placement="topLeft"
        title="Xác nhận xóa dữ liệu?"
        description="Dữ liệu sẽ bị xóa vĩnh viễn"
        okText="Đồng ý"
        cancelText="Hủy"
        {...popConfirm}
      >
        {icon}
      </Popconfirm>
    </Tooltip>
  )
}

export default DeleteIcon
