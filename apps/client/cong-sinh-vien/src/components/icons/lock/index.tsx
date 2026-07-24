import { LockOutlined } from "@ant-design/icons"
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon"
import { Popconfirm, type PopconfirmProps, Tooltip } from "antd"

type DeleteIconProps = {
  popConfirm?: Partial<PopconfirmProps>
} & Omit<AntdIconProps, "ref"> &
  React.RefAttributes<HTMLSpanElement>
const LockIcon = ({ popConfirm, ...props }: DeleteIconProps) => {
  return (
    <Tooltip title="Khoá" placement="leftTop">
      <Popconfirm
        placement="topLeft"
        title="Xác nhận khoá tài khoản?"
        description="Tài khoản này sẽ bị khoá"
        okText="Đồng ý"
        cancelText="Hủy"
        {...popConfirm}
      >
        <LockOutlined className="text-sm text-red-500 cursor-pointer" {...props} />
      </Popconfirm>
    </Tooltip>
  )
}

export default LockIcon
