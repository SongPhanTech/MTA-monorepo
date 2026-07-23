import { Tooltip } from "antd"
import type { LucideProps } from "lucide-react"
import { CopyPlus } from "lucide-react"

type CopyPlusIconProps = LucideProps & {
  title?: string
}

const CopyPlusIcon = ({ title, ...props }: CopyPlusIconProps) => {
  return (
    <Tooltip title={title ? title : "Sao chép"} placement="top">
      <CopyPlus
        size={16}
        strokeWidth={1.5}
        className="text-basecursor-pointer"
        onClick={(e) => e.stopPropagation()}
        {...props}
      />
    </Tooltip>
  )
}

export default CopyPlusIcon
