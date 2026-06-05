import { useFindManySchoolYear } from "@workspace/db/hooks"
import { fuzzyMatch } from "@workspace/libs/utils"
import { TreeSelect as AntdTreeSelect, type TreeSelectProps as AntdTreeSelectProps } from "antd"
import type React from "react"
import { useMemo } from "react"

interface TreeNodeType {
  value: string
  title: React.ReactNode
  children?: TreeNodeType[]
  selectable?: boolean
}

type TTreeSelectFloat = AntdTreeSelectProps & {
  label?: React.ReactNode
}

const TreeSelectFloat = ({ label, className, ...props }: TTreeSelectFloat) => {
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

  const treeSelect = (
    <AntdTreeSelect
      popupMatchSelectWidth={false}
      allowClear
      showSearch
      treeDefaultExpandAll
      treeData={treeData}
      loading={schoolYearLoading}
      treeNodeFilterProp="title"
      filterTreeNode={(input, treeNode) => fuzzyMatch(input, treeNode?.title?.toString() || "")}
      notFoundContent="Không có dữ liệu"
      className={`${label ? "h-10 w-full" : (className ?? "")}`}
      {...props}
    />
  )

  if (!label) return treeSelect

  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <span className="pointer-events-none absolute -top-2 left-2.5 z-10 bg-white px-1 text-xs leading-none text-gray-500">
        {label}
      </span>
      {treeSelect}
    </div>
  )
}

export { TreeSelectFloat }
