import { Popconfirm, type PopconfirmProps, Tooltip } from "antd"
import type { LucideProps } from "lucide-react"
import { Trash2 } from "lucide-react"

type DeleteIconProps = {
  popConfirm?: Partial<PopconfirmProps>
  title?: string
  disabled?: boolean
} & LucideProps
const DeleteIcon = ({ title, popConfirm, disabled, ...props }: DeleteIconProps) => {
  return (
    <Tooltip title={title ? title : "Xóa"} placement="top">
      <Popconfirm
        placement="topLeft"
        title="Xác nhận xóa dữ liệu?"
        description="Dữ liệu sẽ bị xóa vĩnh viễn"
        okText="Đồng ý"
        cancelText="Hủy"
        {...popConfirm}
      >
        <Trash2
          size={16}
          strokeWidth={1.5}
          className={
            disabled ? "text-gray-300 cursor-not-allowed" : "text-sm text-red-600 cursor-pointer"
          }
          onClick={(e) => e.stopPropagation()}
          {...props}
        />
      </Popconfirm>
    </Tooltip>
  )
}

export default DeleteIcon
