import type { Semester } from '@workspace/db'
import { useFindManySchoolYear, useFindManySemester } from '@workspace/db/hooks'
import type { TreeSelectProps } from 'antd'
import { TreeSelect as TreeSelectAnt } from 'antd'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { TreeNodeType } from '@/utils/convertOrganizationToTree'

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
    filterTimeNow?: boolean
    selectLatestCreated?: boolean
}

const isCurrentSemester = (semester: Semester, now: Date): boolean => {
    try {
        const startDate = new Date(semester.startDate)
        if (startDate > now) return false

        if (!semester.endDate) return true // Nếu không có endDate coi như vẫn còn hiệu lực

        const endDate = new Date(semester.endDate)
        return now <= endDate
    } catch (error) {
        console.error('Error parsing date:', error)
        return false
    }
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
    filterTimeNow = false,
    selectLatestCreated = false,
}) => {
    const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue)

    useEffect(() => {
        if (propValue !== undefined) {
            setInternalValue(propValue)
        }
    }, [propValue])

    // Lấy thông tin SchoolYear
    const { data: schoolYears } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
    })

    const { data: semesters, isLoading: semesterLoading } = useFindManySemester({
        include: {
            schoolYear: true,
        },
        orderBy: selectLatestCreated ? { createdAt: 'desc' } : { startDate: 'desc' },
    })

    // Tạo treeData từ schoolYears và semesters
    const treeData: TreeNodeType[] = useMemo(() => {
        return (
            schoolYears?.map((schoolYear) => ({
                value: `schoolYear-${schoolYear.id}`,
                title: schoolYear.name,
                selectable: false, // Make the node unselectable without changing its color
                children:
                    semesters
                        ?.filter((semester) => semester.schoolYearId === schoolYear.id)
                        .map((semester) => ({
                            value: semester.id,
                            title: `${semester.name} - ${semester?.schoolYear?.name}`,
                        })) || [],
            })) || []
        )
    }, [schoolYears, semesters])

    useEffect(() => {
        if ((filterTimeNow || selectLatestCreated) && !internalValue && semesters?.length) {
            const nowTime = new Date()
            const savedSemesterId = localStorage.getItem('selectedSemesterId')
            if (savedSemesterId) {
                setInternalValue(savedSemesterId)
                onChange?.(savedSemesterId)
                return
            }
            // Ưu tiên filterTimeNow nếu cả hai prop đều true
            if (filterTimeNow) {
                const currentSemester = semesters.find((semester) =>
                    isCurrentSemester(semester, nowTime)
                )

                if (currentSemester) {
                    setInternalValue(currentSemester.id)
                    onChange?.(currentSemester.id)
                    return
                }
            }

            // Nếu selectLatestCreated = true hoặc không tìm thấy học kỳ hiện tại
            if (selectLatestCreated || filterTimeNow) {
                // Phần tử đầu tiên đã là mới nhất do đã sắp xếp trong useQuery
                const latestSemester = semesters[0]
                setInternalValue(latestSemester.id)
                onChange?.(latestSemester.id)
            }
        }
    }, [filterTimeNow, selectLatestCreated, semesters, internalValue, onChange])

    const handleChange = (newValue: string) => {
        setInternalValue(newValue)
        if (onChange) {
            onChange(newValue)
        }
        localStorage.setItem('selectedSemesterId', newValue)
    }

    const handlePopupScroll: TreeSelectProps['onPopupScroll'] = (e) => {
        if (onPopupScroll) {
            onPopupScroll(e)
        }
    }

    // Hàm lọc tùy chỉnh cho tìm kiếm
    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }

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
