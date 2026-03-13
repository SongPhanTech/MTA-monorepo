import { useFindManyDM_DonVi, useFindManyLecturer } from '@workspace/db/hooks'
import type { SelectProps } from 'antd'
import { message, TreeSelect as TreeSelectAnt } from 'antd'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { TreeNodeType } from '@/utils/convertOrganizationToTree'

// Hàm tạo cây đơn vị và giảng viên
function buildOrgTree(
    list: Array<{ id: string; name: string | null; parentId: string | null }>,
    lecturers: Array<{
        id: string
        userProfile: { fullName: string }
        organizationId: string
    }>,
    parentId: string | null = null
): Array<TreeNodeType> {
    return list
        .filter((item) => (item.parentId ?? null) === parentId)
        .map((item) => ({
            title: item.name || 'Đơn vị không tên',
            value: item.id,
            selectable: item.parentId !== null,
            children: [
                ...lecturers
                    .filter((lecturer) => lecturer.organizationId === item.id)
                    .map((lecturer) => ({
                        title: lecturer.userProfile?.fullName || 'Giảng viên không tên',
                        value: `${lecturer.id}`,
                        selectable: true,
                        children: [],
                    })),
                ...buildOrgTree(list, lecturers, item.id),
            ],
        }))
}

// Define props for our custom component
interface CustomTreeSelectProps {
    placeholder?: string
    style?: React.CSSProperties
    dropdownStyle?: React.CSSProperties
    defaultValue?: string[]
    onChange?: (value: string[]) => void
    onPopupScroll?: SelectProps['onPopupScroll']
}

const TreeSelect: React.FC<CustomTreeSelectProps> = ({
    placeholder = 'Please select',
    style = { width: '100%' },
    dropdownStyle = { maxHeight: 400, overflow: 'auto' },
    defaultValue,
    onChange,
    onPopupScroll,
}) => {
    const [value, setValue] = useState<string[] | undefined>(defaultValue)

    // Lấy danh sách Organization (Khoa và Bộ môn)
    const {
        data: organizations = [],
        isLoading: organizationsLoading,
        error: organizationsError,
    } = useFindManyDM_DonVi({
         orderBy: { iSTT: 'desc' }
    })

    // Lấy danh sách Lecturer
    const {
        data: lecturers = [],
        isLoading: lecturersLoading,
        error: lecturersError,
    } = useFindManyLecturer({
        include: {
            organization: true,
            userProfile: true,
        },
        where: {
            userProfile: {
                active: true,
            },
        },
    })

    // Tạo treeData từ organizations và lecturers
    const treeData: TreeNodeType[] = useMemo(() => {
        if (!organizations.length) return []

        return buildOrgTree(
            organizations.map((org) => ({
                id: org.Id,
                name: org.sTen,
                parentId: org.sParentId,
            })),
            lecturers.map((lec) => ({
                id: lec.id,
                userProfile: {
                    fullName:
                        `${lec.userProfile?.lastName ?? ''} ${lec.userProfile?.firstName ?? ''}`.trim() ||
                        'Giảng viên không tên',
                },
                organizationId: lec.organizationId,
            })),
            null
        )
    }, [organizations, lecturers])

    // Xử lý lỗi
    useEffect(() => {
        if (organizationsError || lecturersError) {
            message.error('Không thể tải dữ liệu. Vui lòng thử lại.')
        }
    }, [organizationsError, lecturersError])

    const handleChange = (newValue: string[]) => {
        setValue(newValue)
        if (onChange) {
            onChange(newValue)
        }
    }

    const handlePopupScroll: SelectProps['onPopupScroll'] = (e) => {
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
            loading={organizationsLoading || lecturersLoading}
        />
    )
}

export default TreeSelect
