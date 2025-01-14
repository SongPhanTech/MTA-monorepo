import { Tooltip } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
type EditIconProps = {} & Omit<AntdIconProps, 'ref'> &
    React.RefAttributes<HTMLSpanElement>

const EditIcon = (props: EditIconProps) => {
    return (
        <Tooltip title="Chỉnh sửa" placement="leftTop">
            <EditOutlined
                className="text-sm text-orange-500 cursor-pointer"
                {...props}
            />
        </Tooltip>
    )
}

export default EditIcon
