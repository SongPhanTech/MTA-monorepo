import { EditOutlined } from "@ant-design/icons"
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon"
import { Tooltip } from "antd"

type EditIconProps = {} & Omit<AntdIconProps, "ref"> & React.RefAttributes<HTMLSpanElement>

const EditIcon = (props: EditIconProps) => {
  return (
    <Tooltip title="Chỉnh sửa" placement="leftTop">
      <EditOutlined className="text-orange-500 cursor-pointer" {...props} />
    </Tooltip>
  )
}

export default EditIcon
