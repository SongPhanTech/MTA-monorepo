import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { Search } from 'lucide-react'
import { Col, Flex, Form, Input, Row, Select } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
    useFindManySemester,
    useFindManySubjectClass,
} from '@workspace/db/hooks'
import dayjs from 'dayjs'
import type { ExamType, Semester, SubjectClassSchedule } from '@workspace/db'
import { useScheduleOptions } from '@hooks/subjectClassSchedule'
import { useExamTypeOptions } from '@hooks/examType'

interface FilterProps {
    searchText: string | null
    semesterId: string | null
}

interface RegisterClassProps {
    setSemesterId?: (id: string | null) => void
    setSubjectClassId?: (id: string | null) => void
}

export default function RegisterResult({
    setSemesterId,
    setSubjectClassId,
}: RegisterClassProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: null,
    })
    const { getScheduleLabel } = useScheduleOptions()
    const { getExamTypeLabel } = useExamTypeOptions()

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
            ...(filters.semesterId
                ? {
                      semesterId: filters.semesterId,
                  }
                : {}),
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
                    _count: true,
                },
            },
            room: {
                include: {
                    building: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    type SubjectClassData = (typeof subjectClassData)[number]

    const { data: semester = [] } = useFindManySemester({
        orderBy: {
            createdAt: 'desc',
        },
    })

    useEffect(() => {
        if (semester.length > 0 && !filters.semesterId) {
            const latestSemesterId = semester[0].id
            setFilters((prev) => {
                const newFilters = { ...prev, semesterId: latestSemesterId }
                debouncedRefetch()
                return newFilters
            })
        }
    }, [semester, filters])

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
                                        handleFilterChange(
                                            'searchText',
                                            e.target.value
                                        )
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
                        <Col span={8}>
                            <Form.Item
                                className="mb-0"
                                name="semesterId"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn kì học"
                                    value={filters.semesterId || undefined}
                                    options={semester.map((i: Semester) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    onChange={(val) =>
                                        handleFilterChange('semesterId', val)
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
                id="subject-class"
                dataSource={subjectClassData}
                // onRow={(record) => ({
                //     onClick: () => {
                //         setSemesterId?.(record.semesterId)
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
                        title: 'STT',
                        dataIndex: '',
                        width: 60,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index) =>
                            index +
                            1 +
                            (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                    },
                    {
                        title: 'Lớp môn học',
                        dataIndex: 'name',
                        align: 'center',
                        width: 200,
                        fixed: 'left',
                    },
                    {
                        title: 'Thời gian học',
                        dataIndex: 'startDate',
                        width: 150,
                        render: (value: string) =>
                            dayjs(value).format('DD/MM/YYYY'),
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
                        render: (value: SubjectClassSchedule) =>
                            getScheduleLabel(value),
                    },
                    {
                        title: 'Giảng viên 1',
                        dataIndex: ['mainLecturer', 'userProfile'],
                        width: 250,
                        render: (record) =>
                            record && `${record.code} - ${record.fullname}`,
                    },
                    {
                        title: 'Số tín chỉ',
                        dataIndex: ['subject', 'credit'],
                        align: 'center',
                        width: 120,
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
                        dataIndex: ['room', 'building', 'name'],
                        align: 'center',
                        width: 180,
                    },
                    {
                        title: 'Phòng học',
                        dataIndex: ['room', 'name'],
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
                                (acc: number, curr) =>
                                    acc + (curr?._count?.students ?? 0),
                                0
                            ),
                    },
                    {
                        title: 'Lớp QL đã ĐK',
                        align: 'center',
                        fixed: 'right',
                        width: 150,
                        render: (record: SubjectClassData) =>
                            record.fixedClasses.map((e) => e.name).join(', '),
                    },
                ]}
            />
        </div>
    )
}
