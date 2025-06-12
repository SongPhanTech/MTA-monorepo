import type { Organization } from '@workspace/db'

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
}
export const convertToTree = (flatData: Organization[]) => {
    const map = new Map()
    const treeData: TreeNodeOrganization[] = []

    flatData.forEach((item: Organization, index: number) => {
        const node = {
            key: item.id,
            id: item.id,
            code: item.code,
            name: item.name,
            address: item.address,
            value: item.id,
            label: item.id,
            // type: item.type?.name || null,
            children: [],
        }
        map.set(item.id, node)
    })

    flatData.forEach((item: Organization) => {
        const node = map.get(item.id)
        if (item.parentId === null || item.parentId === '0') {
            // This is a root node
            const node_root = {
                ...node,
                key: 'root',
            }
            treeData.push(node_root)
        } else {
            const parentNode = map.get(item.parentId)
            if (parentNode) {
                parentNode.children.push(node)
            }
        }
    })

    return treeData
}

export const convertToTreeSelect = (flatData: Organization[]) => {
    const map = new Map()
    const treeData: TreeNodeType[] = []

    flatData.forEach((item: Organization, index: number) => {
        const node = {
            value: item.id,
            title: item.name,
            children: [],
        }
        map.set(item.id, node)
    })

    flatData.forEach((item: Organization) => {
        const node = map.get(item.id)
        if (item.parentId === null || item.parentId === '0') {
            treeData.push(node)
        } else {
            const parentNode = map.get(item.parentId)
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
        if (node.children && node.children.length) {
            const found = findNodeById(node.children, id)
            if (found) return found
        }
    }
    return null
}

export const getAllDescendants = (
    node: TreeNodeOrganization
): TreeNodeOrganization[] => {
    let result: TreeNodeOrganization[] = []
    if (node.children && node.children.length) {
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
