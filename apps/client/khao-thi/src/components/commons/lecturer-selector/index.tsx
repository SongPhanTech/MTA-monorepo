import Select from '@components/commons/select'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { buildOrgTree } from '@lib/utils'
import {
    useCountLecturer,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindUniqueLecturer,
} from '@workspace/db/hooks'
import { Popover } from 'antd'
import { useEffect, useMemo, useState } from 'react'

type LecturerSelectorProps = {
    value?: string
    onChange?: (value?: string) => void
}

const LecturerSelector = ({ value, onChange }: LecturerSelectorProps) => {
    const [visible, setVisible] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedLecturer, setSelectedLecturer] = useState<any>(null)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        organizationId: undefined,
    })

    const handleSelectLecturer = (record: any) => {
        setSelectedLecturer(record)
        onChange?.(record?.id)
        setVisible(false)
    }

    const formatLecturerName = (record: any) => {
        const academicRank = record.userProfile?.academicRankType?.sTen || ''
        const degreeRank = record.userProfile?.academicDegreeType?.sTen || ''
        const fullName = record?.userProfile?.fullname
            ? record?.userProfile?.fullname
            : `${record?.userProfile?.firstName} ${record?.userProfile?.lastName}`
        const academicTitle = [academicRank, degreeRank].filter(Boolean).join('.')
        return `${academicTitle ? `${academicTitle} ` : ''}${fullName}`
    }

    const { data: lecturerById } = useFindUniqueLecturer(
        {
            where: { id: value || '' },
            include: {
                organization: { select: { sTen: true } },
                userProfile: {
                    include: {
                        academicRankType: { select: { sTen: true } },
                        academicDegreeType: { select: { sTen: true } },
                    },
                },
            },
        },
        { enabled: !!value }
    )

    useEffect(() => {
        if (value && lecturerById) {
            setSelectedLecturer(lecturerById as any)
        }
        if (!value) {
            setSelectedLecturer(null)
        }
    }, [value, lecturerById])

    const { data: donViData = [] } = useFindManyDM_DonVi({
        orderBy: { sTen: 'asc' },
    })
    const organizationTreeData = useMemo(() => buildOrgTree(donViData), [donViData])

    const { data = [], isLoading } = useFindManyLecturer(
        {
            where: {
                ...(filters.name
                    ? {
                          userProfile: {
                              OR: [
                                  { fullname: { contains: filters.name, mode: 'insensitive' } },
                                  { firstName: { contains: filters.name, mode: 'insensitive' } },
                                  { lastName: { contains: filters.name, mode: 'insensitive' } },
                              ],
                          },
                      }
                    : {}),
                ...(filters.organizationId
                    ? {
                          organizationId: Array.isArray(filters.organizationId)
                              ? { in: filters.organizationId }
                              : filters.organizationId,
                      }
                    : {}),
            },
            include: {
                organization: { select: { sTen: true, sParentId: true } },
                userProfile: {
                    include: {
                        academicRankType: { select: { sTen: true } },
                        academicDegreeType: { select: { sTen: true } },
                    },
                },
            },
            orderBy: { userProfile: { firstName: 'asc' } },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: visible }
    )

    const { data: count } = useCountLecturer(
        {
            where: {
                ...(filters.name
                    ? {
                          userProfile: {
                              OR: [
                                  { fullname: { contains: filters.name, mode: 'insensitive' } },
                                  { firstName: { contains: filters.name, mode: 'insensitive' } },
                                  { lastName: { contains: filters.name, mode: 'insensitive' } },
                              ],
                          },
                      }
                    : {}),
                ...(filters.organizationId
                    ? {
                          organizationId: Array.isArray(filters.organizationId)
                              ? { in: filters.organizationId }
                              : filters.organizationId,
                      }
                    : {}),
            },
        },
        { enabled: visible }
    )

    const content = (
        <div className="w-[900px]">
            <Table
                rowKey="id"
                loading={isLoading}
                filters={filters}
                setFilters={setFilters}
                onRow={(record) => ({ onClick: () => handleSelectLecturer(record) })}
                columns={[
                    {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
                    },
                    { title: 'Mã giảng viên', width: 100, dataIndex: 'code' },
                    {
                        title: 'Tên giảng viên',
                        width: 230,
                        type: 'input',
                        dataIndex: 'name',
                        render: (_, record) => formatLecturerName(record),
                    },
                    {
                        title: 'Đơn vị',
                        width: 250,
                        type: 'tree_select',
                        dataIndex: 'organizationId',
                        options: organizationTreeData,
                        render: (_, record) => record.organization?.sTen || '',
                    },
                ]}
                data={data}
                pagination={{
                    current: currentPage,
                    pageSize: numberOfPages,
                    total: count,
                    onChange: (page, pageSize) => {
                        if (numberOfPages === pageSize) setCurrentPage(page)
                        else {
                            setCurrentPage(1)
                            setNumberOfPages(pageSize)
                        }
                    },
                    showTotal: (total, range) =>
                        `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                }}
            />
        </div>
    )

    const displayLabel = selectedLecturer
        ? formatLecturerName(selectedLecturer)
        : lecturerById
          ? formatLecturerName(lecturerById as any)
          : undefined

    return (
        <Popover
            content={content}
            trigger="click"
            open={visible}
            onOpenChange={setVisible}
            placement="bottomLeft"
        >
            <Select placeholder="Chọn giảng viên" open={false} value={displayLabel} />
        </Popover>
    )
}

export default LecturerSelector
