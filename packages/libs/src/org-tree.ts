import type { Prisma } from "@workspace/db/client"

/** Điều kiện chuẩn khi lấy danh sách đơn vị để hiển thị cây: đang hoạt động, chưa xóa. */
export const whereActiveOrganization = {
  bActive: true,
  bDeleted: false,
} satisfies Prisma.DM_DonViWhereInput

/** Thứ tự chuẩn của đơn vị: theo iSTT, cùng iSTT thì theo tên. */
export const ORG_ORDER_BY = [
  { iSTT: "asc" },
  { sTen: "asc" },
] satisfies Prisma.DM_DonViOrderByWithRelationInput[]

export type OrgTreeItem = {
  value: string
  label: string
  title: string
  searchText: string
  children?: OrgTreeItem[]
}

export type OrgListItem = {
  Id: string
  sTen: string | null
  sParentId: string | null
  sMa: string | null
  iSTT?: number | null
}

const ROOT_PARENT_ID = "0"

const orgSttValue = (iSTT?: number | null) => (iSTT != null ? iSTT : Number.MAX_SAFE_INTEGER)

/** Theo iSTT (thiếu iSTT xếp cuối), cùng iSTT thì theo tên tiếng Việt. */
export const compareOrgBySTT = (
  a: { iSTT?: number | null; sTen?: string | null },
  b: { iSTT?: number | null; sTen?: string | null }
) => orgSttValue(a.iSTT) - orgSttValue(b.iSTT) || (a.sTen ?? "").localeCompare(b.sTen ?? "", "vi")

/** Tên hiển thị chuẩn của đơn vị trên cây. */
export const orgLabel = (item: { sTen: string | null; sMa?: string | null }) =>
  item.sTen || item.sMa || ""

/** null, "" và "0" đều là gốc. */
const parentKeyOf = (item: { sParentId?: string | null }) => item.sParentId || ROOT_PARENT_ID

/**
 * Gom đơn vị theo cha. Đơn vị có cha không nằm trong danh sách (cha bị lọc) được đưa lên gốc
 * để không bị mất khỏi cây.
 */
function groupOrgByParent<T extends OrgListItem>(list: T[]) {
  const ids = new Set(list.map((item) => item.Id))
  const groups = new Map<string, T[]>()
  for (const item of list) {
    const parentKey = parentKeyOf(item)
    const key = parentKey !== item.Id && ids.has(parentKey) ? parentKey : ROOT_PARENT_ID
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }
  for (const group of groups.values()) group.sort(compareOrgBySTT)
  return groups
}

/** Chỉ đổi thứ tự các đơn vị cùng cha. Thiếu iSTT thì xếp cuối. */
export function sortOrgSiblings<T extends { sParentId?: string | null; iSTT?: number | null }>(
  items: T[]
): T[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = parentKeyOf(item)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }

  for (const group of groups.values()) {
    group.sort(compareOrgBySTT)
  }

  const cursor = new Map<string, number>()
  return items.map((item) => {
    const key = parentKeyOf(item)
    const index = cursor.get(key) ?? 0
    cursor.set(key, index + 1)
    return groups.get(key)![index]!
  })
}

export function buildOrgTree(list: OrgListItem[], parentId = ROOT_PARENT_ID): OrgTreeItem[] {
  const groups = groupOrgByParent(list)
  const visited = new Set<string>()

  const build = (key: string): OrgTreeItem[] =>
    (groups.get(key) ?? [])
      .filter((item) => !visited.has(item.Id))
      .map((item) => {
        visited.add(item.Id)
        const label = orgLabel(item)
        return {
          label,
          title: label,
          value: item.Id,
          searchText: [item.sTen, item.sMa].filter(Boolean).join(" "),
          children: build(item.Id),
        }
      })

  return build(parentId || ROOT_PARENT_ID)
}

export const limitTreeDepth = (
  nodes: OrgTreeItem[],
  maxDepth: number,
  currentDepth = 1
): OrgTreeItem[] => {
  if (currentDepth > maxDepth) return []

  return nodes.map((node) => ({
    ...node,
    children:
      currentDepth === maxDepth
        ? undefined
        : limitTreeDepth(node.children || [], maxDepth, currentDepth + 1),
  }))
}

/** Danh sách phẳng theo thứ tự duyệt cây (cha trước, con sau). */
export const buildOrgFlat = (list: OrgListItem[], parentId = ROOT_PARENT_ID): OrgTreeItem[] => {
  const result: OrgTreeItem[] = []
  const walk = (nodes: OrgTreeItem[]) => {
    for (const { children, ...node } of nodes) {
      result.push(node)
      walk(children ?? [])
    }
  }
  walk(buildOrgTree(list, parentId))
  return result
}
