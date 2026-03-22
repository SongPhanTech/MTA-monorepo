import { useFindManyDM_DonVi, useFindManyLecturer } from '@workspace/db/hooks'
import { formatLecturerName } from '@workspace/libs'
import { message, TreeSelect as TreeSelectAnt, type TreeSelectProps } from 'antd'
import { UserIcon } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo } from 'react'
import type { TreeNodeType } from '@/utils/convertOrganizationToTree'

// Hàm tạo cây đơn vị và giảng viên
function buildOrgAndLectureTree(
    list: Array<{ id: string; name: string | null; parentId: string | null }>,
    lecturers: Array<{
        id: string
        userProfile: { fullName: string }
        organizationId: string
    }>,
    parentId: string | null = null
): Array<TreeNodeType> {
    const organizationLecturers = lecturers
        .filter((lecturer) => lecturer.organizationId === parentId)
        .map((lecturer) => ({
            title: lecturer.userProfile?.fullName || 'Giảng viên không tên',
            value: lecturer.id,
            selectable: true,
            icon: <UserIcon size={16} className="pb-1" />,
        }))

    const children = list
        .filter((item) => (item.parentId ?? null) === parentId)
        .map((item) => ({
            title: item.name || 'Đơn vị không tên',
            value: item.id,
            selectable: false,
            children: buildOrgAndLectureTree(list, lecturers, item.id),
        }))

    return [...organizationLecturers, ...children]
}

// Define props for our custom component
type LectureTreeSelectProps = {
    organizationId?: string | null // ID của tổ chức để lọc giảng viên
    ignoreOrgIds?: string[] // Danh sách ID tổ chức để bỏ qua
    ignoreLectureIds?: string[] // Danh sách ID giảng viên để bỏ qua
} & TreeSelectProps

const LectureTreeSelect: React.FC<LectureTreeSelectProps> = ({
    placeholder = 'Chọn giảng viên',
    style = { width: '100%' },
    dropdownStyle = { maxHeight: 400, overflow: 'auto', width: 600 },
    organizationId,
    ...rest
}) => {
    // Lấy danh sách Organization (Khoa và Bộ môn)
    const {
        data: organizations = [],
        isLoading: organizationsLoading,
        error: organizationsError,
    } = useFindManyDM_DonVi({
        where: {},
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })

    // Lấy danh sách Lecturer
    const {
        data: lecturers = [],
        isLoading: lecturersLoading,
        error: lecturersError,
    } = useFindManyLecturer({
        include: {
            organization: true,
            userProfile: {
                select: {
                    id: true,
                    fullname: true,
                    academicRankType: true,
                    academicDegreeType: true,
                },
            },
        },
        where: {
            userProfile: {
                active: true,
            },
            active: true,
        },
    })

    // Tạo treeData từ organizations và lecturers
    const treeData: TreeNodeType[] = useMemo(() => {
        if (!organizations.length) return []

        return buildOrgAndLectureTree(
            organizations
                .filter((org) => (rest.ignoreOrgIds ? !rest.ignoreOrgIds.includes(org.Id) : true))
                .map((org) => ({
                    id: org.Id,
                    name: org.sTen,
                    parentId: org.sParentId,
                })),
            lecturers
                .filter((lec) =>
                    rest.ignoreLectureIds ? !rest.ignoreLectureIds.includes(lec.id) : true
                )
                .map((lec) => ({
                    id: lec.id,
                    userProfile: {
                        fullName: formatLecturerName(lec),
                    },
                    organizationId: lec.organizationId,
                })),
            organizationId ?? null
        )
    }, [organizations, lecturers, organizationId, rest.ignoreOrgIds, rest.ignoreLectureIds])

    // Xử lý lỗi
    useEffect(() => {
        if (organizationsError || lecturersError) {
            message.error('Không thể tải dữ liệu. Vui lòng thử lại.')
        }
    }, [organizationsError, lecturersError])

    // Hàm lọc tùy chỉnh cho tìm kiếm
    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }

    return (
        <TreeSelectAnt
            style={style}
            dropdownStyle={dropdownStyle}
            allowClear
            treeData={treeData}
            filterTreeNode={filterTreeNode}
            showSearch={true}
            treeNodeFilterProp="title"
            treeExpandAction="click"
            treeIcon
            showCheckedStrategy="SHOW_CHILD"
            placeholder="Chọn giảng viên"
            loading={organizationsLoading || lecturersLoading}
            {...rest}
        />
    )
}

export default LectureTreeSelect
