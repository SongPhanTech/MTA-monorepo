import { fuzzyMatch } from "@workspace/libs/utils"
import { TreeSelect as AntdTreeSelect, type TreeSelectProps } from "antd"

const TreeSelect = (props: TreeSelectProps) => {
  return (
    <AntdTreeSelect
      showSearch
      treeDefaultExpandAll
      popupMatchSelectWidth={false}
      filterTreeNode={(input, treeNode) =>
        fuzzyMatch(
          input,
          treeNode?.searchText?.toString?.() ||
            treeNode?.title?.toString?.() ||
            treeNode?.label?.toString?.() ||
            ""
        )
      }
      {...props}
    />
  )
}

export default TreeSelect
