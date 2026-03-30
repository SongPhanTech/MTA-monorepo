import { Popconfirm, type PopconfirmProps, Tooltip } from "antd"
import { type LucideProps, SquareX } from "lucide-react"

type RejectIconProps = {
  popConfirm?: Partial<PopconfirmProps>
  title?: string
  disabled?: boolean
} & LucideProps
const RejectIcon = ({ title, popConfirm, disabled, ...props }: RejectIconProps) => {
  return (
    <Tooltip title={title ? title : "Từ chối"} placement="top">
      <Popconfirm
        placement="topLeft"
        title="Xác nhận từ chối đơn?"
        description="Đơn này bị từ chối"
        okText="Đồng ý"
        cancelText="Hủy"
        {...popConfirm}
      >
        <SquareX
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

export default RejectIcon
