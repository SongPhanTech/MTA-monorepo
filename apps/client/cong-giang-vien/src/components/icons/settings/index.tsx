import { Tooltip } from "antd"
import type { LucideProps } from "lucide-react"
import { Settings } from "lucide-react"

type SettingsIconProps = LucideProps & {
  title?: string
}

const SettingsIcon = ({ title, ...props }: SettingsIconProps) => {
  return (
    <Tooltip title={title ? title : "Cấu hình"} placement="top">
      <Settings size={16} strokeWidth={1.5} className="text-base cursor-pointer" {...props} />
    </Tooltip>
  )
}

export default SettingsIcon
