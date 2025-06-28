import type { TreeNodeType } from '@/utils/convertOrganizationToTree'
import { useFindManySchoolYear, useFindManySemester } from '@workspace/db/hooks'
import { TreeSelect as TreeSelectAnt } from 'antd'
import type { TreeSelectProps } from 'antd'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'

// Define props for our custom component
interface CustomTreeSelectProps {
    placeholder?: string
    style?: React.CSSProperties
    dropdownStyle?: React.CSSProperties
    defaultValue?: string
    value?: string
    disabled?: boolean
    onChange?: (value: string) => void
    onPopupScroll?: TreeSelectProps['onPopupScroll']
}

const TreeSelectSemester: React.FC<CustomTreeSelectProps> = ({
    placeholder = 'Chọn học kỳ',
    style = { width: '100%' },
    dropdownStyle = { maxHeight: 400, overflow: 'auto' },
    defaultValue,
    value: propValue,
    disabled = false,
    onChange,
    onPopupScroll,
}) => {
    const [internalValue, setInternalValue] = useState<string | undefined>(
        defaultValue
    )

    useEffect(() => {
        if (propValue !== undefined) {
            setInternalValue(propValue)
        }
    }, [propValue])

    // Lấy thông tin SchoolYear
    const { data: schoolYears } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
    })

    const { data: semesters, isLoading: semesterLoading } = useFindManySemester(
        {
            orderBy: { startDate: 'desc' },
        }
    )

    // Tạo treeData từ schoolYears và semesters
    const treeData: TreeNodeType[] = useMemo(() => {
        return (
            schoolYears?.map((schoolYear) => ({
                value: `schoolYear-${schoolYear.id}`,
                title: schoolYear.name,
                selectable: false, // Make the node unselectable without changing its color
                children:
                    semesters
                        ?.filter(
                            (semester) =>
                                semester.schoolYearId === schoolYear.id
                        )
                        .map((semester) => ({
                            value: semester.id,
                            title: semester.name,
                        })) || [],
            })) || []
        )
    }, [schoolYears, semesters])

    const handleChange = (newValue: string) => {
        setInternalValue(newValue)
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

    // useEffect(() => {
    //     const nowTime = new Date()
    //     // Tự động chọn học kỳ hiện tại nếu có
    //     const currentSemester = semesters?.find((semester) => {
    //         const startDate = new Date(semester.startDate)
    //         const endDate = new Date(semester.endDate)
    //         return startDate <= nowTime && endDate >= nowTime
    //     })
    //     if (currentSemester) {
    //         setInternalValue(currentSemester.id)
    //         if (onChange) {
    //             onChange(currentSemester.id)
    //         }
    //     } else {
    //         // Nếu không có học kỳ hiện tại, chọn học kỳ đầu tiên
    //         const firstSemester = semesters?.[0]
    //         if (firstSemester) {
    //             setInternalValue(firstSemester.id)
    //             if (onChange) {
    //                 onChange(firstSemester.id)
    //             }
    //         }
    //     }
    // })

    return (
        <TreeSelectAnt
            // multiple
            // treeCheckable
            disabled={disabled}
            showSearch
            style={style}
            value={internalValue}
            dropdownStyle={dropdownStyle}
            placeholder={placeholder}
            allowClear
            treeDefaultExpandAll
            onChange={handleChange}
            treeData={treeData}
            onPopupScroll={handlePopupScroll}
            filterTreeNode={filterTreeNode}
            treeNodeFilterProp="title"
            loading={semesterLoading}
        />
    )
}

export default TreeSelectSemester
