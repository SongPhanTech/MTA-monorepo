import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import { formatDate } from '@lib/utils'
import type { Prisma, SubjectVersion } from '@workspace/db/client'
import { useCountSubjectClass, useFindManySubjectClass } from '@workspace/db/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Checkbox, Col, Flex, Input, Row } from 'antd'
import type { TableRowSelection } from 'antd/es/table/interface'
import _ from 'lodash'
import { useCallback, useState } from 'react'

type SubjectVersionWithOrg = Prisma.SubjectVersionGetPayload<{
    include: {
        managementOrganization: { select: { sTen: true } }
    }
}>

interface Props {
    onSelectSubjectClass: (id: string | null) => void
}

export default function DanhSachKeHoachThi({ onSelectSubjectClass }: Props) {
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()
    const { options: examTypeOptions, getExamTypeLabel } = useExamTypeOptions()

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKey, setSelectedRowKey] = useState<React.Key | null>(null)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        examType: undefined,
    })

    const { data: subjectVersions = [] } = useFindManySubjectClass(
        {
            where: {
                trainingObjectTypeId,
                semesterId,
                deletedAt: null,
                cancelled: false,
                active: true,
                ...(filters.searchText && {
                    name: {
                        contains: filters.searchText,
                        mode: 'insensitive',
                    },
                }),
                ...(filters.examType && {
                    subject: {
                        examType: {
                            in: filters.examType,
                        },
                    },
                }),
            },
            include: {
                subject: {
                    include: {
                        managementOrganization: {
                            select: {
                                sTen: true,
                            },
                        },
                    },
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
            orderBy: {
                code: 'asc',
            },
        },
        { enabled: !!trainingObjectTypeId && !!semesterId }
    )

    const { data: count } = useCountSubjectClass({
        where: {
            trainingObjectTypeId,
            semesterId,
            deletedAt: null,
            cancelled: false,
            active: true,
            ...(filters.searchText && {
                name: {
                    contains: filters.searchText,
                    mode: 'insensitive',
                },
            }),
            ...(filters.examType && {
                subject: {
                    examType: {
                        in: filters.examType,
                    },
                },
            }),
        },
    })

    const rowSelection: TableRowSelection = {
        selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
        onChange: (selectedKeys: React.Key[]) => {
            const newSelectedKey = selectedKeys[0] || null
            setSelectedRowKey(newSelectedKey)
            onSelectSubjectClass(newSelectedKey as string | null)
        },
    }

    const debouncedSearch = useCallback(
        _.debounce((value: string) => {
            setFilters((prev) => ({
                ...prev,
                searchText: value,
            }))
        }, 500),
        []
    )

    const HighlightText = ({ text, searchText }: { text: string; searchText?: string }) => {
        if (!searchText) return <>{text}</>

        const parts = text.split(new RegExp(`(${searchText})`, 'gi'))

        return (
            <>
                {parts.map((part, index) =>
                    part.toLowerCase() === searchText.toLocaleLowerCase() ? (
                        <span key={part} className="text-yellow-800 bg-yellow-300 font-semibold">
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </>
        )
    }

    return (
        <Row gutter={[8, 0]}>
            <Col span={24}>
                <Flex justify="space-between" align="center">
                    <Flex gap={8}>
                        <Input
                            placeholder="Tìm kiếm"
                            className="w-60"
                            allowClear
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                        <Select
                            allowClear
                            mode="multiple"
                            placeholder="Chọn hình thức thi"
                            className="w-60"
                            options={examTypeOptions.map((opt) => ({
                                label: opt.label,
                                value: opt.value,
                            }))}
                            onChange={(value) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    examType: value,
                                }))
                            }
                        />
                    </Flex>
                    <Button type="primary">Lưu</Button>
                </Flex>
            </Col>

            <Col span={24}>
                <Table
                    rowKey="id"
                    rowSelection={{
                        type: 'radio',
                        ...rowSelection,
                    }}
                    onRow={(record) => ({
                        onClick: () => {
                            const newSelectedKey = selectedRowKey === record.id ? null : record.id
                            setSelectedRowKey(newSelectedKey)
                            onSelectSubjectClass(newSelectedKey)
                        },
                    })}
                    columns={[
                        {
                            title: 'STT',
                            align: 'center',
                            width: 30,
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Mã LMH',
                            align: 'center',
                            width: 30,
                            render: (_, record) => record.code || '',
                        },
                        {
                            title: 'Tên môn học',
                            align: 'center',
                            width: 150,
                            render: (_, record: { subject?: SubjectVersion }) => {
                                const name = record.subject?.name || ''
                                return (
                                    <div className="text-left">
                                        <HighlightText
                                            text={name}
                                            searchText={filters.searchText}
                                        />
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Số tín chỉ',
                            align: 'center',
                            width: 40,
                            render: (_, record: { subject?: SubjectVersion }) =>
                                record.subject?.credit || '',
                        },
                        {
                            title: 'Số sinh viên',
                            align: 'center',
                            width: 50,
                        },
                        {
                            title: 'Hình thức thi',
                            align: 'center',
                            width: 60,
                            render: (_, record: { subject?: SubjectVersion }) => {
                                return record?.subject?.examType ? (
                                    <div>{getExamTypeLabel(record?.subject?.examType)}</div>
                                ) : (
                                    ''
                                )
                            },
                        },
                        {
                            title: 'Khóa nhập ĐQT',
                            align: 'center',
                            width: 60,
                            render: (_, record) => {
                                return <Checkbox checked={record.isLockScore} />
                            },
                        },
                        {
                            title: 'Khóa DTS',
                            align: 'center',
                            width: 40,
                        },
                        {
                            title: 'Đánh phách',
                            align: 'center',
                            width: 40,
                        },
                        {
                            title: 'Khóa phách',
                            align: 'center',
                            width: 40,
                        },
                        {
                            title: 'Danh sách phòng',
                            align: 'center',
                            width: 150,
                        },
                        {
                            title: 'Đơn vị',
                            align: 'center',
                            width: 200,
                            render: (_, record: { subject?: SubjectVersionWithOrg }) => {
                                return (
                                    <div className="text-left">
                                        {record.subject?.managementOrganization?.sTen || ''}
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Ngày thi',
                            align: 'center',
                            width: 80,
                            render: (_, record) =>
                                record.examDate ? formatDate(record.examDate) : undefined,
                        },
                        {
                            title: 'Ghép lớp',
                            align: 'center',
                            width: 80,
                        },
                    ]}
                    data={subjectVersions}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: count,
                        onChange: (page, pageSize) => {
                            if (numberOfPages === pageSize) {
                                setCurrentPage(page)
                            } else {
                                setCurrentPage(1)
                                setNumberOfPages(pageSize)
                            }
                        },
                        showTotal: (total, range) =>
                            `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                    }}
                />
            </Col>
        </Row>
    )
}
