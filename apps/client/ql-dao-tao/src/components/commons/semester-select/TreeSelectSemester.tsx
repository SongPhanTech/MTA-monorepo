import React, { useMemo, useState } from 'react'
import { TreeSelect as TreeSelectAnt } from 'antd'
import type { TreeSelectProps } from 'antd'
import { TreeNodeType } from '@/utils/convertOrganizationToTree'
import {
    useFindManySchoolYear,
    useFindManySemester,
} from '@workspace/db/hooks'

// Define props for our custom component
interface CustomTreeSelectProps {
    placeholder?: string
    style?: React.CSSProperties
    dropdownStyle?: React.CSSProperties
    defaultValue?: string
    disabled?: boolean
    onChange?: (value: string) => void
    onPopupScroll?: TreeSelectProps['onPopupScroll']
}

const TreeSelectSemester: React.FC<CustomTreeSelectProps> = ({
    placeholder = 'Chọn học kỳ',
    style = { width: '100%' },
    dropdownStyle = { maxHeight: 400, overflow: 'auto' },
    defaultValue,
    disabled = false,
    onChange,
    onPopupScroll,
}) => {
    const [value, setValue] = useState<string | undefined>(defaultValue)

    // Lấy thông tin SchoolYear
    const { data: schoolYears } =
        useFindManySchoolYear({
            orderBy: { startDate: 'desc' },
        })


    const { data: semesters, isLoading: semesterLoading } = useFindManySemester({
        orderBy: { startDate: 'desc' },
    })

    // Tạo treeData từ schoolYears và semesters
    const treeData: TreeNodeType[] = useMemo(() => {
        return schoolYears?.map((schoolYear) => ({
            value: `schoolYear-${schoolYear.id}`,
            title: schoolYear.name,
            selectable: false, // Make the node unselectable without changing its color
            children:
            semesters
                ?.filter(
                (semester) => semester.schoolYearId === schoolYear.id
                )
                .map((semester) => ({
                value: semester.id,
                title: semester.name,
                })) || [],
        })) || []
    }, [schoolYears, semesters])

    const handleChange = (newValue: string) => {
        setValue(newValue)
        if (onChange) {
            onChange(newValue)
        }
    }

    const handlePopupScroll: TreeSelectProps['onPopupScroll'] = (e) => {
        if (onPopupScroll) {
            onPopupScroll(e)
        }
    }

    // Hàm lọc tùy chỉnh cho tìm kiếm
    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode.title.toLowerCase().includes(input.toLowerCase())
    }

    return (
        <TreeSelectAnt
            // multiple
            // treeCheckable
            disabled={disabled}
            showSearch
            style={style}
            value={value}
            dropdownStyle={dropdownStyle}
            placeholder={placeholder}
            allowClear
            treeDefaultExpandAll
            onChange={handleChange}
            treeData={treeData}
            onPopupScroll={handlePopupScroll}
            filterTreeNode={filterTreeNode}
            treeNodeFilterProp="title"
            loading={
                semesterLoading
            }
        />
    )
}

export default TreeSelectSemester
