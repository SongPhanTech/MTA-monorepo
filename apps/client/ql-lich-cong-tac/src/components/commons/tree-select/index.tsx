import { normalizeVietnamese } from "@workspace/libs/utils"
import { TreeSelect as AntdTreeSelect, type TreeSelectProps } from "antd"

const TreeSelect = (props: TreeSelectProps) => {
  // Fuzzy match đơn giản
  function fuzzyMatch(input: string, label: string): boolean {
    const normInput = normalizeVietnamese(input)
    const normLabel = normalizeVietnamese(label)

    if (normLabel.includes(normInput)) return true

    // cho phép viết tắt (vd: "hn" -> "ha noi")
    let i = 0
    let j = 0
    while (i < normInput.length && j < normLabel.length) {
      if (normInput[i] === normLabel[j]) i++
      j++
    }
    return i === normInput.length
  }

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
