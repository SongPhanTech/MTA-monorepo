import { Badge, Tooltip } from "antd"
import {
  ChevronRight,
  ClipboardList,
  FolderTree,
  MessageSquare,
  UserCog,
  Users,
} from "lucide-react"

export type GroupKey =
  | "all"
  | "leaders"
  | "secretary"
  | "advisory"
  | "nonCouncilMembers"
  | "specialized"
  | `specialized-${string}`

export interface TreeNode {
  key: GroupKey
  label: React.ReactNode
  count?: number
  icon?: React.ReactNode
  children?: TreeNode[]
}

interface MemberSidebarProps {
  selectedGroup: GroupKey
  onSelectGroup: (key: GroupKey) => void
  expandedNodes: string[]
  onToggleNode: (key: string) => void
  treeData: TreeNode[]
}

interface TreeItemProps {
  node: TreeNode
  level?: number
  selectedGroup: GroupKey
  expandedNodes: string[]
  onSelect: (key: GroupKey) => void
  onToggle: (key: string) => void
}

const TreeItem = ({
  node,
  level = 0,
  selectedGroup,
  expandedNodes,
  onSelect,
  onToggle,
}: TreeItemProps) => {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.includes(node.key)
  const isSelected = selectedGroup === node.key

  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.key)
    }
    onSelect(node.key)
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`
                    flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg cursor-pointer
                    transition-all duration-200 group
                    ${
                      isSelected
                        ? "bg-green-600 text-white shadow-md"
                        : "hover:bg-gray-100 text-gray-700"
                    }
                `}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {hasChildren ? (
            <ChevronRight
              size={16}
              className={`
                                flex-shrink-0 transition-transform duration-200
                                ${isExpanded ? "rotate-90" : ""}
                            `}
            />
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}

          {node.icon && (
            <span className={`flex-shrink-0 ${isSelected ? "text-white" : "text-gray-500"}`}>
              {node.icon}
            </span>
          )}

          <span className="text-sm font-medium break-words">{node.label}</span>
        </div>

        <Badge
          count={node.count}
          showZero
          className="flex-shrink-0"
          style={{
            backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "#f0f0f0",
            color: isSelected ? "white" : "#666",
            boxShadow: "none",
          }}
        />
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-2">
          {node.children?.map((child) => (
            <TreeItem
              key={child.key}
              node={child}
              level={level + 1}
              selectedGroup={selectedGroup}
              expandedNodes={expandedNodes}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default function MemberSidebar({
  selectedGroup,
  onSelectGroup,
  expandedNodes,
  onToggleNode,
  treeData,
}: MemberSidebarProps) {
  return (
    <div className="w-72 border-r border-gray-200 bg-gray-50/50 py-4 h-[calc(100vh-180px)] overflow-y-auto">
      {treeData.map((node) => (
        <TreeItem
          key={node.key}
          node={node}
          selectedGroup={selectedGroup}
          expandedNodes={expandedNodes}
          onSelect={onSelectGroup}
          onToggle={onToggleNode}
        />
      ))}
    </div>
  )
}

export function createTreeData(
  leadersCount: number,
  secretaryCount: number,
  advisoryCount: number,
  nonCouncilMembersCount: number,
  specializedGroups: { key: string; label: string; count: number }[]
): TreeNode[] {
  const totalSpecialized = specializedGroups.reduce((sum, g) => sum + g.count, 0)
  const totalCount =
    leadersCount + secretaryCount + advisoryCount + nonCouncilMembersCount + totalSpecialized

  return [
    {
      key: "all",
      label: "Tất cả thành viên",
      count: totalCount,
      icon: <Users size={16} />,
    },
    {
      key: "leaders",
      label: "Danh sách Hội đồng",
      count: leadersCount,
      icon: <UserCog size={16} />,
    },
    {
      key: "secretary",
      label: "Danh sách Ban thư ký",
      count: secretaryCount,
      icon: <ClipboardList size={16} />,
    },
    {
      key: "advisory",
      label: "Danh sách Ban tư vấn",
      count: advisoryCount,
      icon: <MessageSquare size={16} />,
    },
    {
      key: "nonCouncilMembers",
      label: "Danh sách Thành viên ngoài hội đồng",
      count: nonCouncilMembersCount,
      icon: <MessageSquare size={16} />,
    },
    {
      key: "specialized",
      label: (
        <Tooltip title="Danh sách nhóm chuyên trách">
          <span>Danh sách nhóm chuyên trách</span>
        </Tooltip>
      ),
      icon: <FolderTree size={16} />,
      children: specializedGroups.map((group) => ({
        key: `specialized-${group.key}` as GroupKey,
        label: (
          <Tooltip title={group.label}>
            <span>{group.label}</span>
          </Tooltip>
        ),
        count: group.count,
      })),
    },
  ]
}
