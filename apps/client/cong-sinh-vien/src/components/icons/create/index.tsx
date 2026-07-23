import { Tooltip } from "antd"
import type { LucideProps } from "lucide-react"
import { BookPlus } from "lucide-react"

type CreateIconProps = LucideProps & {
  title?: string
}

const CreateIcon = ({ title, ...props }: CreateIconProps) => {
  return (
    <Tooltip title={title ? title : "Thêm mới"} placement="top">
      <BookPlus size={16} strokeWidth={1.5} className="text-base cursor-pointer" {...props} />
    </Tooltip>
  )
}

export default CreateIcon
