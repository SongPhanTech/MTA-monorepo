import { useFindManyDM_DonVi, useFindManyLecturer } from "@workspace/db/hooks"
import { formatLecturerName } from "@workspace/libs"
import { message, TreeSelect as TreeSelectAnt, type TreeSelectProps, Switch, Divider } from "antd"
import { UserIcon } from "lucide-react"
import type React from "react"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import type { TreeNodeType } from "@/utils/convertOrganizationToTree"
import { whereOrganization } from "@workspace/libs/constants"

type OrgNode = { id: string; name: string | null; parentId: string | null }
type LecturerNode = {
  id: string
  userProfile: { fullName: string; sDM_DonViId: string | null }
}

function groupByParent<T>(items: T[], getParentId: (item: T) => string | null): Map<string | null, T[]> {
  const map = new Map<string | null, T[]>()
  for (const item of items) {
    const key = getParentId(item)
    const list = map.get(key)
    if (list) list.push(item)
    else map.set(key, [item])
  }
  return map
}

function buildOrgAndLectureTree(
  orgsByParent: Map<string | null, OrgNode[]>,
  lecturersByOrg: Map<string | null, LecturerNode[]>,
  parentId: string | null = null
): Array<TreeNodeType> {
  const organizationLecturers = (lecturersByOrg.get(parentId) ?? []).map((lecturer) => ({
    title: lecturer.userProfile?.fullName || "Giảng viên không tên",
    value: lecturer.id,
    selectable: true,
    icon: <UserIcon size={16} className="pb-1" />,
  }))

  const children = (orgsByParent.get(parentId) ?? []).map((item) => ({
    title: item.name || "Đơn vị không tên",
    value: item.id,
    selectable: false,
    children: buildOrgAndLectureTree(orgsByParent, lecturersByOrg, item.id),
  }))

  return [...organizationLecturers, ...children]
}

function findAncestorKeys(
  nodes: Array<TreeNodeType>,
  targetValue: string,
  ancestors: string[] = []
): string[] | null {
  for (const node of nodes) {
    if (node.value === targetValue) return ancestors
    if (node.children?.length) {
      const found = findAncestorKeys(node.children, targetValue, [...ancestors, node.value])
      if (found) return found
    }
  }
  return null
}

type LectureTreeSelectProps = {
  organizationId?: string | null
  ignoreOrgIds?: string[]
  ignoreLectureIds?: string[]
} & TreeSelectProps

const LectureTreeSelect: React.FC<LectureTreeSelectProps> = memo(function LectureTreeSelect({
  placeholder = "Chọn giảng viên",
  style = { width: "100%" },
  dropdownStyle = { maxHeight: 400, overflow: "auto", width: 600 },
  organizationId,
  ignoreOrgIds,
  ignoreLectureIds,
  onDropdownVisibleChange,
  defaultOpen,
  open,
  ...rest
}) {
  const [isSelectAllOrgs, setIsSelectAllOrgs] = useState(false)
  const lastAutoAdjustedValue = useRef<string | undefined>(undefined)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(!!open || !!defaultOpen)
  const [hasOpened, setHasOpened] = useState(!!open || !!defaultOpen)

  const {
    data: organizations = [],
    isLoading: organizationsLoading,
    error: organizationsError,
  } = useFindManyDM_DonVi(
    {
      where: whereOrganization,
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    },
    { enabled: hasOpened, refetchOnWindowFocus: false, staleTime: 60_000 }
  )

  const {
    data: lecturers = [],
    isLoading: lecturersLoading,
    error: lecturersError,
  } = useFindManyLecturer(
    {
      include: {
        userProfile: {
          select: {
            id: true,
            code: true,
            fullname: true,
            sDM_DonViId: true,
            academicRankType: true,
            academicDegreeType: true,
          },
        },
      },
      where: {
        userProfile: {
          active: true,
        },
        active: true,
      },
    },
    { enabled: hasOpened, refetchOnWindowFocus: false, staleTime: 60_000 }
  )

  const ignoreOrgKey = ignoreOrgIds?.join("\0") ?? ""
  const ignoreLectureKey = ignoreLectureIds?.join("\0") ?? ""

  const lecturerNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const lec of lecturers) {
      map.set(lec.id, formatLecturerName(lec) || "Giảng viên không tên")
    }
    return map
  }, [lecturers])

  const selectedValues = useMemo(() => {
    const value = rest.value
    if (value == null || value === "") return [] as string[]
    return (Array.isArray(value) ? value : [value]).filter(Boolean) as string[]
  }, [rest.value])

  const closedTreeData = useMemo(
    () =>
      selectedValues.map((id) => ({
        title: lecturerNameById.get(id) || id,
        value: id,
        selectable: true,
      })),
    [selectedValues, lecturerNameById]
  )

  const fullTreeData: TreeNodeType[] = useMemo(() => {
    if (!dropdownOpen || !organizations.length) return []

    const ignoreOrgSet = ignoreOrgKey ? new Set(ignoreOrgKey.split("\0")) : null
    const ignoreLectureSet = ignoreLectureKey ? new Set(ignoreLectureKey.split("\0")) : null

    const mappedOrgs = organizations
      .filter((org) => (ignoreOrgSet ? !ignoreOrgSet.has(org.Id) : true))
      .map((org) => ({
        id: org.Id,
        name: org.sTen,
        parentId: org.sParentId,
      }))

    const mappedLecturers = lecturers
      .filter((lec) => (ignoreLectureSet ? !ignoreLectureSet.has(lec.id) : true))
      .map((lec) => ({
        id: lec.id,
        userProfile: {
          fullName: formatLecturerName(lec),
          sDM_DonViId: lec.userProfile?.sDM_DonViId ?? null,
        },
      }))

    return buildOrgAndLectureTree(
      groupByParent(mappedOrgs, (org) => org.parentId ?? null),
      groupByParent(mappedLecturers, (lec) => lec.userProfile?.sDM_DonViId ?? null),
      isSelectAllOrgs ? null : (organizationId ?? null)
    )
  }, [
    dropdownOpen,
    organizations,
    lecturers,
    organizationId,
    ignoreOrgKey,
    ignoreLectureKey,
    isSelectAllOrgs,
  ])

  const treeData = dropdownOpen ? fullTreeData : closedTreeData

  useEffect(() => {
    const selectedValue = rest.value as string | undefined
    if (!selectedValue || !organizationId || lecturers.length === 0) return
    if (selectedValue === lastAutoAdjustedValue.current) return
    lastAutoAdjustedValue.current = selectedValue
    const isInCurrentOrg = lecturers.some(
      (l) => l.id === selectedValue && l.userProfile?.sDM_DonViId === organizationId
    )
    if (!isInCurrentOrg) {
      setIsSelectAllOrgs(true)
    }
  }, [rest.value, lecturers, organizationId])

  useEffect(() => {
    const selectedValue = rest.value as string | undefined
    if (!dropdownOpen || !selectedValue || !fullTreeData.length) {
      if (!dropdownOpen) setExpandedKeys([])
      return
    }
    setExpandedKeys(findAncestorKeys(fullTreeData, selectedValue) ?? [])
  }, [rest.value, fullTreeData, dropdownOpen])

  useEffect(() => {
    if (organizationsError || lecturersError) {
      message.error("Không thể tải dữ liệu. Vui lòng thử lại.")
    }
  }, [organizationsError, lecturersError])

  const filterTreeNode = (input: string, treeNode: any) => {
    return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
  }

  return (
    <TreeSelectAnt
      style={style}
      dropdownStyle={dropdownStyle}
      allowClear
      treeData={treeData}
      popupMatchSelectWidth={false}
      filterTreeNode={filterTreeNode}
      showSearch={true}
      treeNodeFilterProp="title"
      treeExpandAction="click"
      treeExpandedKeys={expandedKeys}
      onTreeExpand={(keys) => setExpandedKeys(keys as string[])}
      treeIcon
      showCheckedStrategy="SHOW_CHILD"
      placeholder={placeholder}
      loading={organizationsLoading || lecturersLoading}
      dropdownRender={(menu) => (
        <>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium">Hiển thị giảng viên toàn học viện</span>
            <Switch size="small" checked={isSelectAllOrgs} onChange={setIsSelectAllOrgs} />
          </div>
          <Divider style={{ margin: 0 }} />
          {menu}
        </>
      )}
      {...rest}
      defaultOpen={defaultOpen}
      open={open}
      onDropdownVisibleChange={(visible) => {
        if (visible) setHasOpened(true)
        setDropdownOpen(visible)
        onDropdownVisibleChange?.(visible)
      }}
    />
  )
})

export default LectureTreeSelect
