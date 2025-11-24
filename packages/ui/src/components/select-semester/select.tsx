import { useFindManySchoolYear } from '@workspace/db/hooks'
import { TreeSelect as TreeSelectAnt } from 'antd'
import type React from 'react'
import { useMemo } from 'react'
import { useSemesterStore } from './hook'
export interface TreeNodeType {
    value: string
    title: React.ReactNode
    children?: TreeNodeType[]
    selectable?: boolean
}
// Define props for our custom component
interface CustomTreeSelectProps {
    placeholder?: string
    style?: React.CSSProperties
    dropdownStyle?: React.CSSProperties
}

const TreeSelectSemester: React.FC<CustomTreeSelectProps> = ({
    placeholder = 'Chọn học kỳ',
    style = { width: 200 },
    dropdownStyle = { maxHeight: 400, overflow: 'auto', width: 300 },
}) => {
    const { id: semesterId, onSelect } = useSemesterStore()

    const { data: schoolYears, isLoading: schoolYearLoading } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
        include: {
            semesters: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    // Tạo treeData từ schoolYears và semesters
    const treeData: TreeNodeType[] = useMemo(() => {
        return (
            schoolYears?.map((schoolYear) => ({
                value: `schoolYear-${schoolYear.id}`,
                title: schoolYear.name,
                selectable: false,
                children:
                    schoolYear.semesters.map((semester) => ({
                        value: semester.id,
                        title: `${semester.name}`,
                    })) || [],
            })) || []
        )
    }, [schoolYears])

    const handleChange = (newValue: string) => {
        onSelect(newValue)
    }

    // Hàm lọc tùy chỉnh cho tìm kiếm
    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }

    return (
        <TreeSelectAnt
            showSearch
            style={style}
            value={semesterId}
            dropdownStyle={dropdownStyle}
            placeholder={placeholder}
            allowClear
            treeDefaultExpandAll
            onChange={handleChange}
            treeData={treeData}
            filterTreeNode={filterTreeNode}
            treeNodeFilterProp="title"
            loading={schoolYearLoading}
        />
    )
}

export { TreeSelectSemester }
