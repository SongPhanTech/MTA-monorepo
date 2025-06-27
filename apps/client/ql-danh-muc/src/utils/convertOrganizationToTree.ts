export const convertToTree = (flatData: any) => {
    const map = new Map()
    const treeData: any[] = []

    flatData.forEach((item: any, index: any) => {
        const node = {
            key: item.id,
            id: item.id,
            code: item.code,
            name: item.name,
            address: item.address,
            type: item.type?.name || null,
            children: [],
        }
        map.set(item.id, node)
    })

    flatData.forEach((item: any) => {
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

export const searchTree2 = (data: any[], searchText: string) => {
    if (!searchText) return data

    const search = searchText.toLowerCase()

    const filterData = data.filter((item: any) => item.name?.toLowerCase().includes(search))
    console.log('search', search)
    console.log(filterData)
    return filterData
}
