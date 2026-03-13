import { buildOrgTree } from '@lib/utils'
import { useFindManyDM_DonVi } from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import type { TreeSelectProps } from 'antd'
import { TreeSelect as TreeSelectAnt } from 'antd'

// Define props for our custom component
type TreeSelectDepartmentProps = {
    rootId?: string
    treeCheckable?: boolean
    multiple?: boolean
} & TreeSelectProps

const TreeSelectDepartment: React.FC<TreeSelectDepartmentProps> = ({
    placeholder = 'Chọn đơn vị',
    style = { width: '100%' },
    dropdownStyle = { maxHeight: 400, overflow: 'auto', width: 600 },
    rootId,
    treeCheckable = true,
    multiple,
    ...rest
}) => {
    const { data: organizationData = [] } = useFindManyDM_DonVi({
        where: {
            bActive: true,
            ...whereOrganization,
        },
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })
    // Tạo treeData từ schoolYears và semesters
    const treeData = buildOrgTree(organizationData, rootId)

    // Hàm lọc tùy chỉnh cho tìm kiếm
    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.label?.toLowerCase()?.includes(input?.toLowerCase())
    }

    return (
        <TreeSelectAnt
            treeCheckable={treeCheckable}
            multiple={multiple}
            showSearch
            style={style}
            dropdownStyle={dropdownStyle}
            placeholder={placeholder}
            allowClear
            treeData={treeData}
            maxTagCount={1}
            showCheckedStrategy="SHOW_ALL"
            filterTreeNode={filterTreeNode}
            treeNodeFilterProp="title"
            {...rest}
        />
    )
}

export default TreeSelectDepartment
