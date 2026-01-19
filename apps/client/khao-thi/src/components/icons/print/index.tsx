import { Tooltip } from 'antd'
import { Printer, type LucideProps } from 'lucide-react'
import clsx from 'clsx'

type PrintIconProps = LucideProps & {
    title?: string
    disabled?: boolean
}

const PrintIcon = ({ title, disabled = false, ...props }: PrintIconProps) => {
    return (
        <Tooltip title={title ?? 'In'} placement="top">
            <span
                className={clsx(
                    'inline-flex items-center',
                    disabled && 'cursor-not-allowed opacity-50 pointer-events-none'
                )}
            >
                <Printer
                    size={16}
                    strokeWidth="1.5"
                    className={clsx(
                        'text-base',
                        disabled ? 'text-gray-400' : 'text-green-500 cursor-pointer'
                    )}
                    {...(!disabled && { onClick: (e) => e.stopPropagation() })}
                    {...props}
                />
            </span>
        </Tooltip>
    )
}

export default PrintIcon
