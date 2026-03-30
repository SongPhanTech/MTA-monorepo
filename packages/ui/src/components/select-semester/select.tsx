import { useFindManySchoolYear } from "@workspace/db/hooks"
import { fuzzyMatch } from "@workspace/libs/utils"
import { TreeSelect as TreeSelectAnt, type TreeSelectProps } from "antd"
import type React from "react"
import { useMemo } from "react"
import { useSemesterStore } from "./hook"
export interface TreeNodeType {
  value: string
  title: React.ReactNode
  children?: TreeNodeType[]
  selectable?: boolean
}
// Define props for our custom component
interface CustomTreeSelectProps extends TreeSelectProps {
  placeholder?: string
  style?: React.CSSProperties
  dropdownStyle?: React.CSSProperties
}

export const SelectSemester: React.FC<CustomTreeSelectProps> = (props) => {
  const { data: schoolYears, isLoading: schoolYearLoading } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        orderBy: { createdAt: "desc" },
      },
    },
    take: 1000,
  })

  // Tạo treeData từ schoolYears và semesters
  const treeData: TreeNodeType[] = useMemo(() => {
    return (
      schoolYears?.map((schoolYear) => ({
        value: `schoolYear-${schoolYear.id}`,
        title: schoolYear.name,
        selectable: false,
        children:
          schoolYear.semesters.map((semester) => ({
            value: semester.id,
            title: `${semester.name}`,
          })) || [],
      })) || []
    )
  }, [schoolYears])

  const filterTreeNode = (input: string, treeNode: any) => {
    return fuzzyMatch(input, treeNode?.title?.toString() || "")
  }

  return (
    <TreeSelectAnt
      showSearch
      allowClear
      treeDefaultExpandAll
      treeData={treeData}
      filterTreeNode={filterTreeNode}
      treeNodeFilterProp="title"
      loading={schoolYearLoading}
      {...props}
    />
  )
}

export const TreeSelectSemester: React.FC<CustomTreeSelectProps> = ({
  placeholder = "Chọn học kỳ",
  style = { width: 200 },
  dropdownStyle = { maxHeight: 400, overflow: "auto", width: 300 },
}) => {
  const { id: semesterId, onSelect } = useSemesterStore()

  const { data: schoolYears, isLoading: schoolYearLoading } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  // Tạo treeData từ schoolYears và semesters
  const treeData: TreeNodeType[] = useMemo(() => {
    return (
      schoolYears?.map((schoolYear) => ({
        value: `schoolYear-${schoolYear.id}`,
        title: schoolYear.name,
        selectable: false,
        children:
          schoolYear.semesters.map((semester) => ({
            value: semester.id,
            title: `${semester.name}`,
          })) || [],
      })) || []
    )
  }, [schoolYears])

  const handleChange = (newValue: string) => {
    onSelect(newValue)
  }

  const filterTreeNode = (input: string, treeNode: any) => {
    return fuzzyMatch(input, treeNode?.title?.toString() || "")
    // return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
  }

  return (
    <TreeSelectAnt
      showSearch
      style={style}
      value={semesterId}
      dropdownStyle={dropdownStyle}
      placeholder={placeholder}
      allowClear
      treeDefaultExpandAll
      onChange={handleChange}
      treeData={treeData}
      filterTreeNode={filterTreeNode}
      treeNodeFilterProp="title"
      loading={schoolYearLoading}
    />
  )
}
