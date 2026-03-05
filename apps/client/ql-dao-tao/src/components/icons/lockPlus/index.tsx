import { LockOutlined, UnlockOutlined } from '@ant-design/icons'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
import { Popconfirm, type PopconfirmProps, Tooltip } from 'antd'

type LockIconProps = {
    popConfirm?: Partial<PopconfirmProps>
    isLocked?: boolean
    title?: string
    description?: string
} & Omit<AntdIconProps, 'ref'> &
    React.RefAttributes<HTMLSpanElement>

const LockPlusIcon = ({
    popConfirm,
    isLocked,
    title,
    description,
    className,
    ...props
}: LockIconProps) => {
    const Icon = isLocked ? LockOutlined : UnlockOutlined
    const defaultTitle = isLocked ? 'Mở khoá' : 'Khoá'
    const confirmTitle = isLocked ? 'Xác nhận mở khoá?' : 'Xác nhận khoá?'
    const defaultDescription = isLocked
        ? 'CTĐT toàn khoá này sẽ được mở khoá'
        : 'CTĐT toàn khoá này sẽ bị khoá'

    return (
        <Tooltip title={title ?? defaultTitle} placement="top">
            <Popconfirm
                placement="topLeft"
                title={confirmTitle}
                description={description ?? defaultDescription}
                okText="Xác nhận"
                cancelText="Hủy"
                {...popConfirm}
            >
                <Icon
                    className={`cursor-pointer ${isLocked ? 'text-red-600' : 'text-green-600'} ${className ?? 'text-sm'}`}
                    {...props}
                />
            </Popconfirm>
        </Tooltip>
    )
}

export default LockPlusIcon
