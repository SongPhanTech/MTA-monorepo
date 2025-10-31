import Select from '@components/commons/select'
import RoomSelector from '@components/commons/select-room-table'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import { formatDate } from '@lib/utils'
import type { SubjectVersion } from '@workspace/db/client'
import { useCountSubjectClass, useFindManyRoom, useFindManySubjectClass } from '@workspace/db/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Checkbox, Col, Flex, Form, Input, Row } from 'antd'
import type { TableRowSelection } from 'antd/lib/table/interface'
import _ from 'lodash'
import { useCallback, useState } from 'react'

interface Props {
    onSelectSubjectClass: (id: string | null) => void
    setActiveKey: (key: string) => void
}

interface SubjectClassFormType {
    list: Record<
        string,
        {
            isLockScore?: boolean
            isLockFinalScore?: boolean
            isAnonymous?: boolean
            isLockAnonymous?: boolean
            rooms?: string[]
            merge?: string
        }
    >
}

// Component hiển thị bảng chọn phòng

export default function DanhSachKeHoachThi({ onSelectSubjectClass, setActiveKey }: Props) {
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

    const [form] = Form.useForm<SubjectClassFormType>()

    const { data: subjectClass = [] } = useFindManySubjectClass(
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
                ...(filters.examType &&
                    filters.examType.length > 0 && {
                        subject: {
                            examType: {
                                in: filters.examType,
                            },
                        },
                    }),
            },
            include: {
                mainLecturer: {
                    include: {
                        userProfile: {
                            select: {
                                fullname: true,
                            },
                        },
                    },
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                    },
                },
                subject: {
                    include: {
                        managementOrganization: {
                            select: {
                                sTen: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        subjectClassStudent: true,
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
            ...(filters.examType &&
                filters.examType.length > 0 && {
                    subject: {
                        examType: {
                            in: filters.examType,
                        },
                    },
                }),
        },
    })

    const { data: rooms = [] } = useFindManyRoom({
        where: {
            deletedAt: null,
            OR: [{ trainingRoom: true }, { examRoom: true }],
        },
        select: {
            id: true,
            name: true,
            capacity: true,
        },
    })

    const rowSelection: TableRowSelection = {
        selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKey(selectedKeys[0])
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
                {parts.map((part) =>
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

    const handleSubmitExam = () => {
        const data = form.getFieldsValue()
        console.log(data)
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
                    <Flex justify="end" gap={8}>
                        <Button type="primary" onClick={handleSubmitExam}>
                            Lưu
                        </Button>
                        <Button type="primary">Hủy</Button>
                    </Flex>
                </Flex>
            </Col>

            <Col span={24}>
                <Form form={form}>
                    <Table
                        rowKey="id"
                        rowSelection={{
                            type: 'radio',
                            ...rowSelection,
                        }}
                        onRow={(record) => ({
                            onClick: () => {
                                setSelectedRowKey(record?.id)
                            },
                            onDoubleClick: (e) => {
                                const target = e.target as HTMLElement
                                // Kiểm tra xem có click vào Select, Popover hoặc các component con của RoomSelector không
                                if (
                                    target.closest('.ant-select') ||
                                    target.closest('.ant-popover') ||
                                    target.closest('.ant-input') ||
                                    target.closest('.ant-table-row-selection')
                                ) {
                                    e.stopPropagation()
                                    return
                                }
                                onSelectSubjectClass(record?.id)
                                setSelectedRowKey(record?.id)
                                setActiveKey?.('2')
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
                                width: 50,
                                render: (_, record: { subject?: SubjectVersion }) =>
                                    record.subject?.credit || '',
                            },
                            {
                                title: 'Số sinh viên',
                                align: 'center',
                                width: 60,
                                render: (_, record) => {
                                    return record._count?.subjectClassStudent || 0
                                },
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
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'isLockScore']}
                                            valuePropName="checked"
                                        >
                                            <span className="pointer-events-none">
                                                <Checkbox checked={record.isLockScore} />
                                            </span>
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Khóa DTS',
                                align: 'center',
                                width: 40,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'isLockFinalScore']}
                                            valuePropName="checked"
                                        >
                                            <span className="pointer-events-none">
                                                <Checkbox checked={false} />
                                            </span>
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Đánh phách',
                                align: 'center',
                                width: 40,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'isAnonymous']}
                                            valuePropName="checked"
                                        >
                                            <span className="pointer-events-none">
                                                <Checkbox checked={false} />
                                            </span>
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Khóa phách',
                                align: 'center',
                                width: 40,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'isLockAnonymous']}
                                            valuePropName="checked"
                                        >
                                            <span className="pointer-events-none">
                                                <Checkbox checked={false} />
                                            </span>
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Danh sách phòng',
                                align: 'center',
                                width: 170,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'rooms']}
                                            initialValue={
                                                record.room
                                                    ? [
                                                          {
                                                              name: record.room.name,
                                                              roomId: record.room.id,
                                                              quantity: record.room.capacity,
                                                          },
                                                      ]
                                                    : []
                                            }
                                        >
                                            <RoomSelector rooms={rooms} />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Giảng viên 1',
                                align: 'center',
                                width: 100,
                                render: (_, record) => {
                                    return (
                                        <div className="text-left">
                                            {record.mainLecturer?.userProfile?.fullname || ''}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Ngày thi',
                                align: 'center',
                                width: 20,
                                render: (_, record) =>
                                    record.examDate ? formatDate(record.examDate) : undefined,
                            },
                            {
                                title: 'Ghép lớp',
                                align: 'center',
                                width: 10,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="mb-0 w-full"
                                            name={['list', record.id, 'merge']}
                                            initialValue="rieng"
                                        >
                                            <Select
                                                options={[
                                                    {
                                                        label: 'Riêng',
                                                        value: 'rieng',
                                                    },
                                                    {
                                                        label: 'Ghép',
                                                        value: 'ghep',
                                                    },
                                                ]}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                        ]}
                        data={subjectClass}
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
                </Form>
            </Col>
        </Row>
    )
}
