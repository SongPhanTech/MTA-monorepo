import { Popconfirm, type PopconfirmProps, Tooltip } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
type DeleteIconProps = {
    popConfirm?: Partial<PopconfirmProps>
} & Omit<AntdIconProps, 'ref'> &
    React.RefAttributes<HTMLSpanElement>
const DeleteIcon = ({ popConfirm, ...props }: DeleteIconProps) => {
    return (
        <Tooltip title="Xóa" placement="leftTop">
            <Popconfirm
                placement="topLeft"
                title="Xác nhận xóa dữ liệu?"
                description="Dữ liệu sẽ bị xóa vĩnh viễn"
                okText="Đồng ý"
                cancelText="Hủy"
                {...popConfirm}
            >
                <DeleteOutlined
                    className="text-sm text-red-600 cursor-pointer"
                    {...props}
                />
            </Popconfirm>
        </Tooltip>
    )
}

export default DeleteIcon
