import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import { useScheduleOptions } from '@hooks/subjectClassSchedule'
import type { ExamType, SubjectClassSchedule } from '@workspace/db/client'
import { useCountSubjectClass, useFindManySubjectClass } from '@workspace/db/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Flex, Form, Input, Row } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'

interface FilterProps {
    searchText: string | null
}

export default function KeQuaDangKyHocLopQuanLy() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })
    const { id: semesterId } = useSemesterStore()

    const { getScheduleLabel } = useScheduleOptions()
    const { getExamTypeLabel } = useExamTypeOptions()
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
            ...(semesterId
                ? {
                      semesterId,
                  }
                : {}),
            trainingObjectTypeId,
        },
        include: {
            mainLecturer: {
                select: {
                    userProfile: {
                        select: {
                            fullname: true,
                        },
                    },
                },
            },
            extraLecturer: {
                select: {
                    userProfile: {
                        select: {
                            fullname: true,
                        },
                    },
                },
            },
            subject: true,
            fixedClasses: {
                include: {
                    _count: true,
                },
            },
            room: {
                include: {
                    building: true,
                },
            },
            trainingLocation: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })
    const { data: countSubjectClass = 0 } = useCountSubjectClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      name: {
                          contains: filters.searchText,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(semesterId
                ? {
                      semesterId,
                  }
                : {}),
            trainingObjectTypeId,
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
                data={subjectClassData}
                // onRow={(record) => ({
                //     onClick: () => {
                //         setSubjectClassId?.(record.id)
                //         setSelectedRowKey(record.id)
                //     },
                //     style: { cursor: 'pointer' },
                //     className:
                //         record.id === selectedRowKey
                //             ? '!bg-[#b3c7bb] !hover:bg-[#b3c7bb]'
                //             : '',
                // })}
                selectedRow={selectedRowKey}
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
                        title: 'Lớp môn học',
                        dataIndex: 'name',
                        align: 'center',
                        width: 200,
                    },
                    {
                        title: 'Thời gian học',
                        dataIndex: 'startDate',
                        width: 120,
                        align: 'center',
                        render: (value: string) => dayjs(value).format('DD/MM/YYYY'),
                    },
                    {
                        title: 'Kíp học',
                        dataIndex: 'schedule',
                        width: 150,
                        align: 'center',
                        // filters: scheduleOptions.map((opt) => ({
                        //     text: opt.label,
                        //     value: opt.value,
                        // })),
                        filterSearch: true,
                        render: (value: SubjectClassSchedule) => getScheduleLabel(value),
                    },
                    {
                        title: 'Giảng viên 1',
                        dataIndex: ['mainLecturer', 'userProfile'],
                        width: 150,
                        render: (record) => record && `${record.fullname}`,
                    },
                    {
                        title: 'Giảng viên 2',
                        dataIndex: ['extraLecturer', 'userProfile'],
                        width: 150,
                        render: (record) => record && `${record.fullname}`,
                    },
                    {
                        title: 'Số tín chỉ',
                        dataIndex: ['subject', 'credit'],
                        align: 'center',
                        width: 100,
                    },
                    {
                        title: 'Hình thức thi',
                        dataIndex: ['subject', 'examType'],
                        align: 'center',
                        width: 180,
                        render: (value: ExamType) => getExamTypeLabel(value),
                    },
                    {
                        title: 'Địa điểm',
                        dataIndex: ['trainingLocation', 'name'],
                        align: 'center',
                        width: 180,
                    },
                    {
                        title: 'Số SV max',
                        dataIndex: 'maxStudent',
                        align: 'center',
                        width: 120,
                    },
                    {
                        title: 'Số SV đã ĐK',
                        align: 'center',
                        fixed: 'right',
                        width: 120,
                        render: (record: SubjectClassData) =>
                            record?.fixedClasses?.reduce(
                                (acc: number, curr) => acc + (curr?._count?.students ?? 0),
                                0
                            ),
                    },
                    {
                        title: 'Lớp QL đã ĐK',
                        align: 'center',
                        width: 150,
                        render: (__, record: any) => {
                            return record?.fixedClasses.length ? (
                                <TextTruncate
                                    arr={record?.fixedClasses.map((i: any) => {
                                        return { key: i?.id, label: i?.name }
                                    })}
                                    key="fixedClasses"
                                />
                            ) : (
                                ''
                            )
                        },
                    },
                ]}
                pagination={{
                    current: currentPage,
                    pageSize: numberOfPages,
                    total: countSubjectClass,
                    onChange: (page, pageSize) => {
                        if (numberOfPages === pageSize) {
                            setCurrentPage(page)
                        } else {
                            setCurrentPage(1)
                            setNumberOfPages(pageSize)
                        }
                    },
                }}
            />
        </div>
    )
}
