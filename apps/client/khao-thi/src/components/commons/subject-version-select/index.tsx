import { useFindManySubjectVersion } from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import type { TreeSelectProps } from "antd"
import { TreeSelect as TreeSelectAnt } from "antd"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import type { TreeNodeType } from "@/utils/convertOrganizationToTree"

interface CustomTreeSelectProps {
  placeholder?: string
  style?: React.CSSProperties
  dropdownStyle?: React.CSSProperties
  defaultValue?: string[]
  value?: string[]
  disabled?: boolean
  onChange?: (value: string[]) => void
  onPopupScroll?: TreeSelectProps["onPopupScroll"]
  semesterId?: string
  subjectVersionId?: string
  edit?: boolean
}

const TreeSelectSubjectVersion: React.FC<CustomTreeSelectProps> = ({
  placeholder = "Chọn thi",
  style = { width: "100%" },
  dropdownStyle = { maxHeight: 400, overflow: "auto" },
  defaultValue,
  value: propValue,
  disabled = false,
  onChange,
  onPopupScroll,
  semesterId,
  subjectVersionId,
  edit = false,
}) => {
  const [internalValue, setInternalValue] = useState<string[] | undefined>(defaultValue)

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  useEffect(() => {
    if (propValue !== undefined) {
      setInternalValue(propValue)
    }
  }, [propValue])

  const { data: subjectVersions, isFetching } = useFindManySubjectVersion(
    {
      where: {
        ...(subjectVersionId && {
          id: subjectVersionId,
        }),
        subjectClass: {
          some: {
            cancelled: false,
            trainingObjectTypeId,
            ...(semesterId && {
              semesterId,
            }),
          },
        },
      },
      include: {
        subjectClass: {
          include: {
            exam: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }
    // { enabled: !!subjectVersionId }
  )

  const selectedParentId = useMemo(() => {
    if (!internalValue || internalValue.length === 0) return null
    const firstValue = internalValue[0]

    if (firstValue.startsWith("subjectVersion-")) {
      return firstValue.replace("subjectVersion-", "")
    }
    const parent = subjectVersions?.find((sv) =>
      sv.subjectClass?.some((sc) => internalValue.includes(sc.id))
    )
    return parent?.id || null
  }, [internalValue, subjectVersions])

  const treeData: TreeNodeType[] = useMemo(() => {
    return (
      subjectVersions
        ?.filter((sv) => edit || !sv.subjectClass?.some((sc) => sc.exam))
        .map((sv) => {
          const isOtherParentDisabled = selectedParentId && selectedParentId !== sv.id

          return {
            value: `subjectVersion-${sv.id}`,
            title: `${[sv.code, sv.name].filter(Boolean).join(" - ")} (${sv.credit} tín chỉ)`,
            selectable: false,
            disabled: isOtherParentDisabled,
            children:
              sv.subjectClass
                ?.filter((sc) => edit || !sc.exam)
                .map((sc) => ({
                  value: sc.id,
                  title: `${[sc.code, sc.name].filter(Boolean).join(" - ")}`,
                  disabled: isOtherParentDisabled,
                })) || [],
          }
        }) || []
    )
  }, [subjectVersions, edit, selectedParentId])

  const handleChange = (newValue: string[]) => {
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

export default TreeSelectSubjectVersion
