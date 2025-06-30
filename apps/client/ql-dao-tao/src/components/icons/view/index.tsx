import { Tooltip } from 'antd'
import type { LucideProps } from 'lucide-react'
import { Eye } from 'lucide-react'

type ViewIconProps = LucideProps

const ViewIcon = (props: ViewIconProps) => {
    return (
        <Tooltip title="Xem chi tiết" placement="top">
            <Eye
                size={16}
                strokeWidth={1.5}
                className="text-base cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                {...props}
            />
        </Tooltip>
    )
}

export default ViewIcon
