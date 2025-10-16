import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useFindManySubjectClass } from '@workspace/db/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Flex, Form, Input, Row } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { type Key, useCallback, useState } from 'react'

interface FilterProps {
    searchText: string | null
}

interface RegisterClassProps {
    setSubjectClassId?: (id: string | null) => void
}

export default function RegisterClassManager({ setSubjectClassId }: RegisterClassProps) {
    const [currentPage, _setCurrentPage] = useState(1)
    const [selectedRowKey, setSelectedRowKey] = useState<Key>('')

    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: subjectClassData = [], refetch } = useFindManySubjectClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      name: {
                          contains: filters.searchText,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            semesterId,
            trainingObjectTypeId,
            subject: {
                planTrainingSubject: {
                    some: {
                        planTraining: {
                            semesterId,
                            trainingObjectTypeId,
                        },
                    },
                },
            },
            cancelled: false,
            active: true,
        },
        include: {
            mainLecturer: {
                include: {
                    userProfile: true,
                },
            },
            subject: true,
            fixedClasses: {
                include: {
                    _count: {
                        select: {
                            students: {
                                where: {
                                    active: true,
                                    status: 'ENROLLED',
                                    deletedAt: null,
                                },
                            },
                        },
                    },
                },
            },
            room: {
                include: {
                    building: true,
                },
            },
            subjectClassTimes: true,
        },
        orderBy: {
            code: 'asc',
        },
    })
    type SubjectClassData = (typeof subjectClassData)[number]

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const handleRowSelection = (record: any) => {
        setSubjectClassId?.(record.id)
        setSelectedRowKey(record.id)
    }

    return (
        <div>
            <Row gutter={[16, 16]} align="top" justify="space-between">
                <Col span={24}>
                    <Flex>
                        <Col span={8}>
                            <Form.Item name="searchText">
                                <Input
                                    id="search"
                                    placeholder="Nhập tên lớp..."
                                    onChange={(e) =>
                                        handleFilterChange('searchText', e.target.value)
                                    }
                                    style={{ height: 32 }}
                                    prefix={
                                        <Search
                                            size={15}
                                            style={{
                                                color: 'rgba(0, 0, 0, 0.25)',
                                            }}
                                        />
                                    }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Flex>
                </Col>
            </Row>
            <Table
                rowKey="id"
                dataSource={subjectClassData}
                onRow={(record) => ({
                    onClick: () => handleRowSelection(record),
                    style: { cursor: 'pointer' },
                    columnWidth: 35,
                })}
                rowSelection={{
                    selectedRowKeys: [selectedRowKey],
                    onChange: (selectedRowKeys) => {
                        setSelectedRowKey(selectedRowKeys?.[0] as string)
                    },
                    type: 'radio',
                    columnWidth: 35,
                }}
                columns={[
                    {
                        title: 'TT',
                        dataIndex: '',
                        width: 35,
                        align: 'center',
                        render: (_, __, index) =>
                            index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                    },
                    {
                        title: 'Mã LMH',
                        dataIndex: 'code',
                        align: 'center',
                        width: 150,
                    },
                    {
                        title: 'Tên môn',
                        dataIndex: 'name',
                        align: 'center',
                        width: 150,
                        render: (text: string) => <p className="text-left">{text}</p>,
                    },
                    // {
                    //     title: 'Thời gian học',
                    //     dataIndex: 'startDate',
                    //     align: 'center',
                    //     width: 150,
                    //     render: (record: string) =>
                    //         record ? dayjs(record).format('DD/MM/YYYY') : '',
                    // },
                    // {
                    //     title: 'Thời khoá biểu',
                    //     width: 150,
                    //     align: 'center',
                    //     render: (_, record) => {
                    //         return record.subjectClassTimes?.map?.((tkb: SubjectClassTime) => {
                    //             return (
                    //                 <p>
                    //                     {tkb.dayOfWeek === 8 ? 'CN' : `T${tkb.dayOfWeek}`} -{' '}
                    //                     {tkb.startPeriod} - {tkb.endPeriod}
                    //                 </p>
                    //             )
                    //         })
                    //     },
                    // },
                    // {
                    //     title: 'Kíp học',
                    //     dataIndex: 'schedule',
                    //     width: 80,
                    //     align: 'center',
                    //     // filters: scheduleOptions.map((opt) => ({
                    //     //     text: opt.label,
                    //     //     value: opt.value,
                    //     // })),
                    //     filterSearch: true,
                    //     render: (value) => getScheduleLabel(value),
                    // },
                    // {
                    //     title: 'Giảng viên 1',
                    //     dataIndex: ['mainLecturer', 'userProfile'],
                    //     width: 250,
                    //     render: (record) => record && `${record?.code || ''} - ${record.fullname}`,
                    // },
                    {
                        title: 'Số TC',
                        dataIndex: ['subject', 'credit'],
                        align: 'center',
                        width: 80,
                    },
                    // {
                    //     title: 'Hình thức thi',
                    //     dataIndex: ['subject', 'examType'],
                    //     align: 'center',
                    //     width: 180,
                    //     render: (value) => getExamTypeLabel(value),
                    // },
                    {
                        title: 'Khu vực',
                        dataIndex: ['room', 'building', 'name'],
                        align: 'center',
                        width: 120,
                    },
                    // {
                    //     title: 'Phòng học',
                    //     dataIndex: ['room', 'name'],
                    //     align: 'center',
                    //     width: 100,
                    // },
                    // {
                    //     title: 'Số SV max',
                    //     dataIndex: 'maxStudent',
                    //     align: 'center',
                    //     width: 120,
                    // },
                    {
                        title: 'Số SV đã ĐK',
                        align: 'center',
                        width: 100,
                        render: (record: SubjectClassData) =>
                            record?.fixedClasses?.reduce(
                                (acc: number, curr) => acc + (curr?._count?.students ?? 0),
                                0
                            ),
                    },
                    {
                        title: 'Lớp QL đã ĐK',
                        align: 'center',
                        width: 120,
                        render: (__, record: any) => {
                            return record?.fixedClasses.length ? (
                                <TextTruncate
                                    arr={record?.fixedClasses.map((i: any) => {
                                        return {
                                            key: i?.id,
                                            label: `${i.code} (${i?._count.students})`,
                                        }
                                    })}
                                    key="fixedClasses"
                                />
                            ) : (
                                ''
                            )
                        },
                    },
                ]}
            />
        </div>
    )
}
