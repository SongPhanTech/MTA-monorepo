import { Tooltip } from 'antd'
import type { LucideProps } from 'lucide-react'
import { BookPlus } from 'lucide-react'

type CreateIconProps = LucideProps & {
    title?: string
    disabled?: boolean
}

const CreateIcon = ({ title, disabled = false, ...props }: CreateIconProps) => {
    if (disabled) {
        return (
            <span className="inline-flex items-center">
                <Tooltip title={undefined}>
                    <BookPlus
                        size={16}
                        strokeWidth={1.5}
                        className="text-gray-300 cursor-not-allowed"
                    />
                </Tooltip>
            </span>
        )
    }
    return (
        <Tooltip title={title ? title : 'Thêm mới'} placement="top">
            <BookPlus size={16} strokeWidth={1.5} className="text-base cursor-pointer" {...props} />
        </Tooltip>
    )
}

export default CreateIcon
