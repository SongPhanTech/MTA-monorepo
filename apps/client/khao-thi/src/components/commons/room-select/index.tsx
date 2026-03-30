import { useFindManyBuilding } from "@workspace/db/hooks"
import type { TreeSelectProps } from "antd"
import { TreeSelect as TreeSelectAnt } from "antd"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import type { TreeNodeType } from "@/utils/convertOrganizationToTree"

interface CustomTreeSelectProps {
  placeholder?: string
  style?: React.CSSProperties
  dropdownStyle?: React.CSSProperties
  defaultValue?: string
  value?: string
  disabled?: boolean
  onChange?: (value: string) => void
  onPopupScroll?: TreeSelectProps["onPopupScroll"]
}

const TreeSelectRoom: React.FC<CustomTreeSelectProps> = ({
  placeholder = "Chọn thi",
  style = { width: "100%" },
  dropdownStyle = { maxHeight: 400, overflow: "auto" },
  defaultValue,
  value: propValue,
  disabled = false,
  onChange,
  onPopupScroll,
}) => {
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue)

  useEffect(() => {
    if (propValue !== undefined) {
      setInternalValue(propValue)
    }
  }, [propValue])

  const { data: buildingsData, isFetching } = useFindManyBuilding({
    where: {
      rooms: {
        some: {},
      },
    },
    include: {
      rooms: true,
    },
    orderBy: { name: "asc" },
  })

  const treeData: TreeNodeType[] = useMemo(() => {
    return (
      buildingsData?.map((sv) => ({
        value: `building-${sv.id}`,
        title: sv.name,
        selectable: false,
        children:
          sv.rooms.map((sc) => ({
            value: sc.id,
            title: `${[sc.code, sc.name].filter(Boolean).join(" - ")}`,
          })) || [],
      })) || []
    )
  }, [buildingsData])

  const handleChange = (newValue: string) => {
    setInternalValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const handlePopupScroll: TreeSelectProps["onPopupScroll"] = (e) => {
    if (onPopupScroll) {
      onPopupScroll(e)
    }
  }

  // Hàm lọc tùy chỉnh cho tìm kiếm
  const filterTreeNode = (input: string, treeNode: any) => {
    return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
  }

  return (
    <TreeSelectAnt
      multiple
      treeCheckable
      disabled={disabled}
      showSearch
      style={style}
      value={internalValue}
      dropdownStyle={dropdownStyle}
      placeholder={placeholder}
      allowClear
      treeDefaultExpandAll
      onChange={handleChange}
      treeData={treeData}
      onPopupScroll={handlePopupScroll}
      filterTreeNode={filterTreeNode}
      treeNodeFilterProp="title"
      loading={isFetching}
      showCheckedStrategy={TreeSelectAnt.SHOW_CHILD}
    />
  )
}

export default TreeSelectRoom
