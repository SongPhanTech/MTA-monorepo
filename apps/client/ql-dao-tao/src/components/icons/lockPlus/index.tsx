import { LockOutlined, UnlockOutlined } from '@ant-design/icons'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
import { Popconfirm, type PopconfirmProps, Tooltip } from 'antd'

type LockIconProps = {
    popConfirm?: Partial<PopconfirmProps>
    isLocked?: boolean
} & Omit<AntdIconProps, 'ref'> &
    React.RefAttributes<HTMLSpanElement>

const LockPlusIcon = ({ popConfirm, isLocked, ...props }: LockIconProps) => {
    const Icon = isLocked ? UnlockOutlined : LockOutlined
    const title = isLocked ? 'Mở khoá' : 'Khoá'
    const confirmTitle = isLocked ? 'Xác nhận mở khoá?' : 'Xác nhận khoá?'
    const description = isLocked
        ? 'CTĐT toàn khoá này sẽ được mở khoá và có thể chỉnh sửa'
        : 'CTĐT toàn khoá này sẽ bị khoá và không thể chỉnh sửa'

    return (
        <Tooltip title={title} placement="top">
            <Popconfirm
                placement="topLeft"
                title={confirmTitle}
                description={description}
                okText="Xác nhận"
                cancelText="Hủy"
                {...popConfirm}
            >
                <Icon
                    className={`text-sm cursor-pointer ${isLocked ? 'text-green-600' : 'text-orange-600'}`}
                    {...props}
                />
            </Popconfirm>
        </Tooltip>
    )
}

export default LockPlusIcon
