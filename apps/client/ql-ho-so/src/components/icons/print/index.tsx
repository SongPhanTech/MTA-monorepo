import { Tooltip } from "antd"
import type { LucideProps } from "lucide-react"
import { Printer } from "lucide-react"

type PrinterIconProps = LucideProps & {
  title?: string
}

const PrinterIcon = ({ title, ...props }: PrinterIconProps) => {
  return (
    <Tooltip title={title ? title : "In"} placement="top">
      <Printer
        size={16}
        strokeWidth={1.5}
        className="text-basecursor-pointer"
        onClick={(e) => e.stopPropagation()}
        {...props}
      />
    </Tooltip>
  )
}

export default PrinterIcon
