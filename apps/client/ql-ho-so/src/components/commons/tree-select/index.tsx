import { fuzzyMatch } from "@workspace/libs/utils"
import { TreeSelect as AntdTreeSelect, type TreeSelectProps } from "antd"

const TreeSelect = (props: TreeSelectProps) => {
  return (
    <AntdTreeSelect
      showSearch
      treeDefaultExpandAll
      filterTreeNode={(input, treeNode) => fuzzyMatch(input, treeNode.label?.toString() || "")}
      {...props}
    />
  )
}

export default TreeSelect
