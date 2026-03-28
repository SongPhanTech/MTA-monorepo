import type { DM_DonVi } from "@workspace/db/client"

export interface TreeNodeOrganization extends Record<string, unknown> {
  key: string
  id: string
  code: string
  name: string
  address: string
  children: TreeNodeOrganization[]
}

export interface TreeNodeType {
  value: string
  title: React.ReactNode
  children?: TreeNodeType[]
  selectable?: boolean
}
export const convertToTree = (flatData: DM_DonVi[]) => {
  const map = new Map()
  const treeData: TreeNodeOrganization[] = []

  flatData.forEach((item: DM_DonVi, index: number) => {
    const node = {
      key: item.Id,
      id: item.Id,
      code: item.sMa,
      name: item.sTen,
      address: item.sDiaChi,
      value: item.Id,
      label: item.Id,
      // type: item.type?.name || null,
      children: [],
    }
    map.set(item.Id, node)
  })

  flatData.forEach((item: DM_DonVi) => {
    const node = map.get(item.Id)
    if (item.sParentId === null || item.sParentId === "0") {
      // This is a root node
      const node_root = {
        ...node,
        key: "root",
      }
      treeData.push(node_root)
    } else {
      const parentNode = map.get(item.sParentId)
      if (parentNode) {
        parentNode.children.push(node)
      }
    }
  })

  return treeData
}

export const convertToTreeSelect = (flatData: DM_DonVi[]) => {
  const map = new Map()
  const treeData: TreeNodeType[] = []

  flatData.forEach((item: DM_DonVi, index: number) => {
    const node = {
      value: item.Id,
      title: item.sTen,
      children: [],
    }
    map.set(item.Id, node)
  })

  flatData.forEach((item: DM_DonVi) => {
    const node = map.get(item.Id)
    if (item.sParentId === null || item.sParentId === "0") {
      treeData.push(node)
    } else {
      const parentNode = map.get(item.sParentId)
      if (parentNode) {
        parentNode.children.push(node)
      }
    }
  })

  return treeData
}

export const findNodeById = (
  data: TreeNodeOrganization[],
  id: string | number
): TreeNodeOrganization | null => {
  for (const node of data) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export const getAllDescendants = (node: TreeNodeOrganization): TreeNodeOrganization[] => {
  let result: TreeNodeOrganization[] = []
  if (node.children?.length) {
    for (const child of node.children) {
      result.push(child)
      result = result.concat(getAllDescendants(child))
    }
  }
  return result
}

export const getAllChildrenByParentId = (
  treeData: TreeNodeOrganization[],
  parentId: string | number
): TreeNodeOrganization[] => {
  console.log(treeData)
  console.log(parentId)
  const parentNode = findNodeById(treeData, parentId)
  if (!parentNode) return []
  return [parentNode, ...getAllDescendants(parentNode)]
}

export const searchTree = (data: any, searchText: any) => {
  if (!searchText) return data

  const search = searchText.toLowerCase()

  return data
    .map((item: any) => {
      // Create a deep copy of the item
      const node = { ...item }

      // Check if current node matches search
      const nodeMatches = node.name?.toLowerCase().includes(search)

      // Recursively search children
      if (node.children?.length) {
        node.children = searchTree(node.children, searchText)
      }

      if (nodeMatches || (node.children && node.children.length > 0)) {
        return node
      }

      return null
    })
    .filter(Boolean)
}

export const genOptionsFilter = (data: any[], key: string) => {
  const uniqueAges = [...new Set(data.map((item) => item.age))]
  return uniqueAges.map((i) => {
    return {
      value: i,
      label: i,
    }
  })
}
