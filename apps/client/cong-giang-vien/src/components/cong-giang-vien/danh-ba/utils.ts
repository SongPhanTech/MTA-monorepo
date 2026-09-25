import { buildOrgTree, type OrgTreeItem } from "@lib/utils"
import { normalizeVietnamese } from "@workspace/libs/utils"
import type { DataNode } from "antd/es/tree"
import type { DanhBaRow, DonViDanhBa, LecturerDanhBa } from "./types"

export function getInitials(fullname?: string | null) {
  if (!fullname?.trim()) return "?"
  const parts = fullname.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

export function findFirstRootId(list: Array<{ Id: string; sParentId: string | null }>) {
  const root = list.find((item) => !item.sParentId || item.sParentId === "0")
  return root?.Id ?? list[0]?.Id ?? null
}

export function getDescendantOrgIds(
  list: Array<{ Id: string; sParentId: string | null }>,
  rootId: string
) {
  const ids = new Set<string>([rootId])
  const childrenMap = new Map<string, string[]>()

  for (const item of list) {
    const parentId = item.sParentId && item.sParentId !== "0" ? item.sParentId : "0"
    const siblings = childrenMap.get(parentId) ?? []
    siblings.push(item.Id)
    childrenMap.set(parentId, siblings)
  }

  const queue = [rootId]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    for (const childId of childrenMap.get(current) ?? []) {
      if (!ids.has(childId)) {
        ids.add(childId)
        queue.push(childId)
      }
    }
  }

  return ids
}

export type LecturerDanhBaWithOrg = LecturerDanhBa & { donViTen: string }

export function collectLecturersFromOrgIds(donViData: DonViDanhBa[], orgIds: Set<string>) {
  const lecturers: LecturerDanhBaWithOrg[] = []

  for (const donVi of donViData) {
    if (orgIds.has(donVi.Id)) {
      for (const profile of donVi.userProfiles) {
        lecturers.push({ ...profile, donViTen: donVi.sTen || "" })
      }
    }
  }

  return lecturers
}

export function mapLecturerToRow(lecturer: LecturerDanhBaWithOrg, index: number): DanhBaRow {
  return {
    key: lecturer.code || `lecturer-${index}`,
    maCanBo: lecturer.code ?? "",
    hoTen: lecturer.fullname || "",
    gioiTinh: lecturer.gender?.sTen ?? "",
    email: lecturer.email || "",
    soDienThoai: lecturer.phoneNumber || "",
    donVi: lecturer.donViTen || "",
  }
}

export function filterLecturersBySearch(lecturers: LecturerDanhBaWithOrg[], keyword: string) {
  const normalizedKeyword = normalizeVietnamese(keyword.trim())
  if (!normalizedKeyword) return lecturers

  return lecturers.filter((lecturer) => {
    const haystack = [
      lecturer.code,
      lecturer.fullname,
      lecturer.gender?.sTen,
      lecturer.email,
      lecturer.phoneNumber,
      lecturer.donViTen,
      lecturer.lecturer?.lecturerType?.name,
    ]
      .filter(Boolean)
      .map((value) => normalizeVietnamese(String(value)))

    return haystack.some((value) => value.includes(normalizedKeyword))
  })
}

export function buildDonViTreeNodes(
  list: Array<{ Id: string; sTen: string | null; sParentId: string | null; sMa: string | null }>
): DataNode[] {
  const donViIds = new Set(list.map((item) => item.Id))
  const orgsThatAreParents = new Set(
    list
      .filter((item) => item.sParentId && donViIds.has(item.sParentId))
      .map((item) => item.sParentId as string)
  )

  const normalizedList = list
    .filter((item) => {
      if (!item.sParentId || donViIds.has(item.sParentId)) return true
      return orgsThatAreParents.has(item.Id)
    })
    .map((item) => ({
      Id: item.Id,
      sTen: item.sTen,
      sParentId: donViIds.has(item.sParentId ?? "") ? item.sParentId : null,
      sMa: item.sMa,
    }))

  const convert = (items: OrgTreeItem[]): DataNode[] =>
    items.map((item) => ({
      key: item.value,
      title: item.label,
      children: item.children?.length ? convert(item.children) : undefined,
    }))

  return convert(buildOrgTree(normalizedList))
}

export function getDefaultExpandedKeys(treeNodes: DataNode[], maxDepth = 2): string[] {
  const keys: string[] = []

  const walk = (nodes: DataNode[], depth: number) => {
    if (depth >= maxDepth) return

    for (const node of nodes) {
      keys.push(String(node.key))
      if (node.children?.length) {
        walk(node.children, depth + 1)
      }
    }
  }

  walk(treeNodes, 0)
  return keys
}

export function getAllTreeNodeKeys(treeNodes: DataNode[]): string[] {
  const keys: string[] = []

  const walk = (nodes: DataNode[]) => {
    for (const node of nodes) {
      keys.push(String(node.key))
      if (node.children?.length) {
        walk(node.children)
      }
    }
  }

  walk(treeNodes)
  return keys
}

export function filterDonViByKeyword(
  list: Array<{ Id: string; sTen: string | null; sParentId: string | null; sMa: string | null }>,
  keyword: string
) {
  const normalizedKeyword = normalizeVietnamese(keyword.trim())
  if (!normalizedKeyword) return list

  const idMap = new Map(list.map((item) => [item.Id, item]))
  const matchingIds = new Set<string>()

  for (const item of list) {
    const haystack = [item.sMa, item.sTen]
      .filter(Boolean)
      .map((value) => normalizeVietnamese(String(value)))

    if (!haystack.some((value) => value.includes(normalizedKeyword))) continue

    matchingIds.add(item.Id)

    let parentId = item.sParentId
    while (parentId && parentId !== "0") {
      matchingIds.add(parentId)
      parentId = idMap.get(parentId)?.sParentId ?? null
    }
  }

  return list.filter((item) => matchingIds.has(item.Id))
}
