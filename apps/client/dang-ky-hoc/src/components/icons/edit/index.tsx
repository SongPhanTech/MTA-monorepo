import { Tooltip } from "antd"
import type { LucideProps } from "lucide-react"
import { Pencil } from "lucide-react"

type EditIconProps = LucideProps & {
  title?: string
}

const EditIcon = ({ title, ...props }: EditIconProps) => {
  return (
    <Tooltip title={title ? title : "Chỉnh sửa"} placement="top">
      <Pencil
        size={16}
        strokeWidth={1.5}
        className="text-base text-orange-500 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
        {...props}
      />
    </Tooltip>
  )
}

export default EditIcon
