import { normalizeVietnamese } from "@workspace/libs/utils"
import { Input, Tree } from "antd"
import { Search } from "lucide-react"
import { useState } from "react"
import type { FilterProps } from "../typeFilter"

type TreeNode = {
  value: string
  label: string
  children?: TreeNode[]
}
export default function FilterTreeSelect({ item, filtersTable, setFiltersTable }: any) {
  function searchVietnamese(
    data: { value: string; label: string }[],
    keyword: string
  ): { value: string; label: string }[] {
    const normalizedKeyword = normalizeVietnamese(keyword.trim())
    if (!normalizedKeyword) return data

    return data.filter((item) => {
      const normalizedLabel = normalizeVietnamese(item.label)
      const normalizedValue = normalizeVietnamese(item.value)
      return (
        normalizedLabel.includes(normalizedKeyword) || normalizedValue.includes(normalizedKeyword)
      )
    })
  }
  function searchVietnameseTree(data: TreeNode[], keyword: string): TreeNode[] {
    const normalizedKeyword = normalizeVietnamese(keyword.trim())
    if (!normalizedKeyword) return data

    const searchRecursive = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = []

      for (const node of nodes) {
        const normalizedLabel = normalizeVietnamese(node.label)
        const normalizedValue = normalizeVietnamese(node.value)

        const matchSelf =
          normalizedLabel.includes(normalizedKeyword) || normalizedValue.includes(normalizedKeyword)

        const matchedChildren = node.children ? searchRecursive(node.children) : []

        // Nếu node hiện tại match hoặc có con match => giữ lại
        if (matchSelf || matchedChildren.length > 0) {
          result.push({
            ...node,
            children: matchedChildren.length > 0 ? matchedChildren : undefined,
          })
        }
      }

      return result
    }

    return searchRecursive(data)
  }
  const [input, setInput] = useState("")
  const [optionsSearch, setOptionsSearch] = useState(item?.options)
  console.log(optionsSearch, "2", item?.options)
  const handleSearchTree = async (value: string) => {
    if (!value.trim()) {
      setOptionsSearch(item?.options || [])
      return
    }

    try {
      const response = searchVietnameseTree(item?.options || [], value.trim())
      setOptionsSearch(response)
    } catch (_error: unknown) {
      setOptionsSearch(item?.options || [])
    }
  }

  return (
    <div className="w-full min-w-[200px] max-w-[300px]">
      <div className="mb-2">Tìm kiếm</div>
      <Input
        placeholder="Nhập từ khoá cần tìm kiếm"
        prefix={
          <Search
            size={15}
            style={{
              color: "rgba(0, 0, 0, 0.25)",
            }}
          />
        }
        allowClear
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          handleSearchTree(e.target.value)
        }}
        style={{ height: 36, width: "100%", marginBottom: 16 }}
      />
      <Tree
        autoExpandParent={true}
        checkable={true}
        defaultExpandAll={true}
        multiple={true}
        treeData={optionsSearch}
        checkedKeys={filtersTable[item.dataIndex as keyof FilterProps] as string[]}
        onCheck={(checkedKeys) => {
          setFiltersTable({
            ...filtersTable,
            [item.dataIndex as keyof FilterProps]: checkedKeys,
          })
        }}
        checkStrictly={!!input}
        fieldNames={{ title: "label", key: "value", children: "children" }}
        className="w-full mb-3 max-h-[500px] overflow-y-auto"
      />
    </div>
  )
}
