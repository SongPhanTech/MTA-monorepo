import {
    useFindFirstSchoolYear,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import type { TreeSelectProps } from 'antd'
import { TreeSelect as TreeSelectAnt } from 'antd'
import type React from 'react'
import { useMemo, useState } from 'react'
import type { TreeNodeType } from '@/utils/convertOrganizationToTree'

// Define props for our custom component
interface CustomTreeSelectProps {
    placeholder?: string
    schoolYearId?: string
    style?: React.CSSProperties
    dropdownStyle?: React.CSSProperties
    defaultValue?: string
    onChange?: (value: string) => void
    onPopupScroll?: TreeSelectProps['onPopupScroll']
}

const TreeSelectFixClassMulti: React.FC<CustomTreeSelectProps> = ({
    placeholder = 'Please select',
    schoolYearId,
    style = { width: '100%' },
    dropdownStyle = { maxHeight: 400, overflow: 'auto' },
    defaultValue,
    onChange,
    onPopupScroll,
}) => {
    const [value, setValue] = useState<string | undefined>(defaultValue)

    // Lấy thông tin SchoolYear
    const { data: schoolYear, isLoading: schoolYearLoading } = useFindFirstSchoolYear({
        where: {
            id: schoolYearId || undefined,
        },
        skip: schoolYearId ? 0 : 1,
    })

    // Lấy danh sách TrainingCourse
    const { data: trainingCourses = [], isLoading: trainingCoursesLoading } =
        useFindManyTrainingCourse({
            orderBy: {
                semesterStart: {
                    startDate: 'desc',
                },
            },
        })

    // Lấy danh sách FixedClass
    const { data: fixedClasses = [], isLoading: fixedClassesLoading } = useFindManyFixedClass({
        where: {
            trainingCourseId: {
                in: trainingCourses.map((course) => course.id),
            },
        },
        orderBy: {
            name: 'asc',
        },
    })

    // Tạo treeData từ trainingCourses và fixedClasses
    const treeData: TreeNodeType[] = useMemo(() => {
        return trainingCourses.map((course) => ({
            value: `course-${course.id}`,
            title: course.name,
            children: fixedClasses
                .filter((fixedClass) => fixedClass.trainingCourseId === course.id)
                .map((fixedClass) => ({
                    value: fixedClass.id,
                    title: fixedClass.name,
                })),
        }))
    }, [trainingCourses, fixedClasses])

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
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }

    return (
        <TreeSelectAnt
            multiple
            treeCheckable
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
            loading={schoolYearLoading || trainingCoursesLoading || fixedClassesLoading}
        />
    )
}

export default TreeSelectFixClassMulti
