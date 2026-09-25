import { useFindManyDM_DonVi, useFindManyLecturer } from "@workspace/db/hooks"
import { formatLecturerName } from "@workspace/libs"
import { message, TreeSelect as TreeSelectAnt, type TreeSelectProps, Switch, Divider } from "antd"
import { UserIcon } from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { TreeNodeType } from "@/utils/convertOrganizationToTree"
import { whereOrganization } from "@workspace/libs/constants"

// Hàm tạo cây đơn vị và giảng viên
function buildOrgAndLectureTree(
  list: Array<{ id: string; name: string | null; parentId: string | null }>,
  lecturers: Array<{
    id: string
    userProfile: { fullName: string; sDM_DonViId: string | null }
  }>,
  parentId: string | null = null
): Array<TreeNodeType> {
  const organizationLecturers = lecturers
    .filter((lecturer) => lecturer.userProfile?.sDM_DonViId === parentId)
    .map((lecturer) => ({
      title: lecturer.userProfile?.fullName || "Giảng viên không tên",
      value: lecturer.id,
      selectable: true,
      icon: <UserIcon size={16} className="pb-1" />,
    }))

  const children = list
    .filter((item) => (item.parentId ?? null) === parentId)
    .map((item) => ({
      title: item.name || "Đơn vị không tên",
      value: item.id,
      selectable: false,
      children: buildOrgAndLectureTree(list, lecturers, item.id),
    }))

  return [...organizationLecturers, ...children]
}

// để auto-expand cho thấy ngay giảng viên đã chọn
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

// Define props for our custom component
type LectureTreeSelectProps = {
  organizationId?: string | null // ID của tổ chức để lọc giảng viên
  ignoreOrgIds?: string[] // Danh sách ID tổ chức để bỏ qua
  ignoreLectureIds?: string[] // Danh sách ID giảng viên để bỏ qua
} & TreeSelectProps

const LectureTreeSelect: React.FC<LectureTreeSelectProps> = ({
  placeholder = "Chọn giảng viên",
  style = { width: "100%" },
  dropdownStyle = { maxHeight: 400, overflow: "auto", width: 600 },
  organizationId,
  ...rest
}) => {
  const [isSelectAllOrgs, setIsSelectAllOrgs] = useState(false)
  const lastAutoAdjustedValue = useRef<string | undefined>(undefined)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // Lấy danh sách Organization (Khoa và Bộ môn)
  const {
    data: organizations = [],
    isLoading: organizationsLoading,
    error: organizationsError,
  } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  // Lấy danh sách Lecturer
  const {
    data: lecturers = [],
    isLoading: lecturersLoading,
    error: lecturersError,
  } = useFindManyLecturer({
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
  })

  // Tạo treeData từ organizations và lecturers
  const treeData: TreeNodeType[] = useMemo(() => {
    if (!organizations.length) return []

    const mappedOrgs = organizations
      .filter((org) => (rest.ignoreOrgIds ? !rest.ignoreOrgIds.includes(org.Id) : true))
      .map((org) => ({
        id: org.Id,
        name: org.sTen,
        parentId: org.sParentId,
      }))

    const mappedLecturers = lecturers
      .filter((lec) => (rest.ignoreLectureIds ? !rest.ignoreLectureIds.includes(lec.id) : true))
      .map((lec) => ({
        id: lec.id,
        userProfile: {
          fullName: formatLecturerName(lec),
          sDM_DonViId: lec.userProfile?.sDM_DonViId ?? null,
        },
      }))

    return buildOrgAndLectureTree(
      mappedOrgs,
      mappedLecturers,
      isSelectAllOrgs ? null : (organizationId ?? null)
    )
  }, [
    organizations,
    lecturers,
    organizationId,
    rest.ignoreOrgIds,
    rest.ignoreLectureIds,
    isSelectAllOrgs,
  ])

  useEffect(() => {
    const selectedValue = rest.value as string | undefined
    // Chưa load xong lecturers thì khoan xử lý (không đánh dấu đã xử lý)
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

  // Auto-expand các đơn vị cha chứa giảng viên đã chọn để hiện ngay khi mở dropdown
  useEffect(() => {
    const selectedValue = rest.value as string | undefined
    if (!selectedValue || !treeData.length) {
      setExpandedKeys([])
      return
    }
    setExpandedKeys(findAncestorKeys(treeData, selectedValue) ?? [])
  }, [rest.value, treeData])

  // Xử lý lỗi
  useEffect(() => {
    if (organizationsError || lecturersError) {
      message.error("Không thể tải dữ liệu. Vui lòng thử lại.")
    }
  }, [organizationsError, lecturersError])

  // Hàm lọc tùy chỉnh cho tìm kiếm
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
      placeholder="Chọn giảng viên"
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
    />
  )
}

export default LectureTreeSelect
