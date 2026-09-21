import { AimOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { buildOrgTree, type OrgTreeItem } from "@lib/utils"
import { Empty, Spin, Tree } from "antd"
import type { DataNode } from "antd/es/tree"
import { useMemo, useState } from "react"
import { Panel } from "./shared"

export type DashboardOrg = {
  Id: string
  sTen: string | null
  sParentId: string | null
  sMa: string | null
  iLoaiDonVi: number | null
  lecturerCount: number
}

export const dashboardOrgSelect = {
  Id: true,
  sTen: true,
  sParentId: true,
  sMa: true,
  iLoaiDonVi: true,
  _count: {
    select: {
      lecturers: { where: { active: true, deletedAt: null } },
    },
  },
} as const

export function mapDashboardOrgs(
  rows: Array<{
    Id: string
    sTen: string | null
    sParentId: string | null
    sMa: string | null
    iLoaiDonVi: number | null
    _count: { lecturers: number }
  }>
): DashboardOrg[] {
  return rows.map((o) => ({
    Id: o.Id,
    sTen: o.sTen,
    sParentId: o.sParentId,
    sMa: o.sMa,
    iLoaiDonVi: o.iLoaiDonVi,
    lecturerCount: o._count.lecturers,
  }))
}

function sumLecturersInBranch(node: OrgTreeItem, orgMap: Map<string, DashboardOrg>): number {
  const self = orgMap.get(node.value)?.lecturerCount ?? 0
  return self + (node.children ?? []).reduce((s, c) => s + sumLecturersInBranch(c, orgMap), 0)
}

export function totalAcademyLecturers(orgs: DashboardOrg[]): number {
  const orgMap = new Map(orgs.map((o) => [o.Id, o]))
  return buildOrgTree(orgs).reduce((sum, root) => sum + sumLecturersInBranch(root, orgMap), 0)
}

export function CoCauToChucDonVi({
  orgs,
  isLoading,
}: {
  orgs: DashboardOrg[]
  isLoading: boolean
}) {
  const [selectedKey, setSelectedKey] = useState<string>()

  const { rootHeader, childTreeData, rootKey } = useMemo(() => {
    const orgMap = new Map(orgs.map((o) => [o.Id, o]))
    const roots = buildOrgTree(orgs)

    const toNode = (item: OrgTreeItem): DataNode => {
      const children = (item.children || []).map((child) => toNode(child))
      const displayCount = sumLecturersInBranch(item, orgMap)
      const label = item.label.split(" - ").slice(-1)[0] || item.label
      const isLeaf = !children.length

      return {
        key: item.value,
        icon: isLeaf ? (
          <ArrowRightOutlined className="block text-[11px] leading-none text-[#9ca3af]" />
        ) : undefined,
        title: (
          <div className="org-tree-row flex w-full min-w-0 items-start justify-between gap-1.5 py-1">
            <div className="flex min-w-0 items-start gap-2">
              <span className="org-tree-label break-words text-[11.5px] leading-[18px] text-[#1f2937]">
                {label}
              </span>
            </div>
            <span className="org-tree-count shrink-0 tabular-nums text-[11.5px] leading-[18px] text-[#6b7280]">
              {displayCount}
            </span>
          </div>
        ),
        children: children.length ? children : undefined,
      }
    }

    const [root, ...restRoots] = roots
    if (!root) {
      return { rootHeader: null, childTreeData: [] as DataNode[], rootKey: undefined }
    }

    const rootLabel = root.label.split(" - ").slice(-1)[0] || root.label
    const rootCount = sumLecturersInBranch(root, orgMap)
    const childTreeData = [
      ...(root.children || []).map((c) => toNode(c)),
      ...restRoots.map((r) => toNode(r)),
    ]

    return {
      rootKey: root.value,
      rootHeader: { key: root.value, label: rootLabel, count: rootCount },
      childTreeData,
    }
  }, [orgs])

  const activeKey = selectedKey || rootKey
  const rootSelected = !!rootKey && activeKey === rootKey

  return (
    <Panel
      title="Cơ cấu tổ chức đơn vị"
      className="h-full"
      headerClassName="px-3"
      titleClassName="!text-[12px] !tracking-[0.02em] truncate whitespace-nowrap"
      bodyClassName="relative min-h-0 flex-1 overflow-hidden"
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : !rootHeader ? (
        <div className="flex justify-center py-10">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <button
            type="button"
            onClick={() => setSelectedKey(rootHeader.key)}
            className={`mx-1.5 mt-1.5 mb-0.5 flex w-[calc(100%-12px)] shrink-0 items-start justify-between gap-1.5 rounded-md border-b border-[#eef0f3] px-1.5 py-1 text-left transition-colors
              ${rootSelected ? "bg-[#e8f5e9]" : "bg-white hover:bg-[#f3f4f6]"}`}
          >
            <div className="flex min-w-0 items-start gap-1.5">
              <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#1b7a4b] text-white">
                <AimOutlined className="block text-[10px] leading-none" />
              </span>
              <span
                className={`break-words text-[11.5px] leading-[18px] ${
                  rootSelected ? "font-medium text-[#1b7a4b]" : "text-[#1f2937]"
                }`}
              >
                {rootHeader.label}
              </span>
            </div>
            <span
              className={`shrink-0 tabular-nums text-[11.5px] leading-[18px] ${
                rootSelected ? "font-semibold text-[#1b7a4b]" : "text-[#6b7280]"
              }`}
            >
              {rootHeader.count}
            </span>
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pb-2 pt-0.5">
            {childTreeData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />
            ) : (
              <Tree
                showIcon
                showLine={{ showLeafIcon: false }}
                defaultExpandAll
                selectable
                selectedKeys={activeKey && activeKey !== rootKey ? [activeKey] : []}
                onSelect={(keys) => {
                  if (keys[0]) setSelectedKey(String(keys[0]))
                }}
                treeData={childTreeData}
                className="dashboard-org-tree bg-transparent text-sm
                  [&_.ant-tree-treenode]:w-full [&_.ant-tree-treenode]:items-start
                  [&_.ant-tree-node-content-wrapper]:!flex [&_.ant-tree-node-content-wrapper]:!w-full [&_.ant-tree-node-content-wrapper]:!min-w-0 [&_.ant-tree-node-content-wrapper]:!items-start [&_.ant-tree-node-content-wrapper]:!rounded-md [&_.ant-tree-node-content-wrapper]:!bg-transparent [&_.ant-tree-node-content-wrapper]:!px-1 [&_.ant-tree-node-content-wrapper]:!py-0
                  [&_.ant-tree-node-selected]:!bg-transparent
                  [&_.ant-tree-treenode-selected_.ant-tree-node-content-wrapper]:!bg-[#e8f5e9]
                  [&_.ant-tree-treenode-selected_.org-tree-label]:!font-medium [&_.ant-tree-treenode-selected_.org-tree-label]:!text-[#1b7a4b]
                  [&_.ant-tree-treenode-selected_.org-tree-count]:!font-semibold [&_.ant-tree-treenode-selected_.org-tree-count]:!text-[#1b7a4b]
                  [&_.ant-tree-title]:block [&_.ant-tree-title]:w-full
                  [&_.ant-tree-switcher]:!flex [&_.ant-tree-switcher]:!w-4 [&_.ant-tree-switcher]:!items-start [&_.ant-tree-switcher]:!justify-center [&_.ant-tree-switcher]:!pt-1.5
                  [&_.ant-tree-indent-unit]:!w-2.5
                  [&_.ant-tree-iconEle:not(.ant-tree-icon__customize)]:!hidden
                  [&_.ant-tree-iconEle]:!mr-1 [&_.ant-tree-iconEle]:!mt-1 [&_.ant-tree-iconEle]:!inline-flex [&_.ant-tree-iconEle]:!h-[18px] [&_.ant-tree-iconEle]:!w-auto [&_.ant-tree-iconEle]:!items-center [&_.ant-tree-iconEle]:!justify-center [&_.ant-tree-iconEle]:!leading-none
                  [&_.ant-tree-show-line_.ant-tree-indent-unit::before]:!border-[#d1d5db]"
              />
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}
