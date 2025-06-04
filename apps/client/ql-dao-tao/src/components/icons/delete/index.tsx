import { Popconfirm, type PopconfirmProps, Tooltip } from 'antd'
import { LucideProps, Trash2 } from 'lucide-react'
type DeleteIconProps = {
    popConfirm?: Partial<PopconfirmProps>
} & LucideProps
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
                <Trash2 size={16} strokeWidth={1.5}
                    className="text-base text-red-600 cursor-pointer"
                    {...props}
                />
            </Popconfirm>
        </Tooltip>
    )
}

export default DeleteIcon
