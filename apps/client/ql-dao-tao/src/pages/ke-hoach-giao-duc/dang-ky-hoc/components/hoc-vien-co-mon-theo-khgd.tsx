import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN } from '@constants/constants'
import { Search } from 'lucide-react'
import { Col, Flex, Form, Image, Input, Row, Tag } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useCountStudent, useFindManyStudent } from '@workspace/db/hooks'
import dayjs from 'dayjs'
import { UserOutlined } from '@ant-design/icons'
import { getMinioUrl } from '@workspace/constant'
import { QueryClient } from '@tanstack/react-query'

interface FilterProps {
    searchText: string | null
}

interface StudentCourseByPlanProps {
    semesterId?: string | null
    subjectClassId?: string | null
}

export default function StudentCourseByPlan({
    semesterId,
    subjectClassId,
}: StudentCourseByPlanProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const { data = [], refetch } = useFindManyStudent({
        where: {
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.searchText,
                            mode: 'insensitive',
                        },
                    },
                    {
                        lastName: {
                            contains: filters.searchText,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
        },
        include: {
            userProfile: true,
            trainingObjectType: {
                include: {
                    trainingFields: {
                        include: {
                            trainingField: true,
                        },
                    },
                    trainingMajors: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                },
            },
            fixedClass: {
                include: {
                    trainingCourse: true,
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const queryClient = new QueryClient()

    const { data: fixedClass } = useStudent(
        {
            semesterId: semesterId || '',
            subjectClassId: subjectClassId || '',
            // search: filters.searchText,
            page: '1',
            pageSize: '10',
        },
        {
            query: {
                enabled: !!semesterId && !!subjectClassId,
            },
        },
        queryClient
    )

    const { data: count } = useCountStudent({
        where: {
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.searchText,
                            mode: 'insensitive',
                        },
                    },
                    {
                        lastName: {
                            contains: filters.searchText,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
        },
    })

    // console.log(fixedClassData);

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
                        <Col span={12}>
                            <Form.Item name="searchText">
                                <Input
                                    id="search"
                                    placeholder="Nhập tên học viên"
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'searchText',
                                            e.target.value
                                        )
                                    }
                                    style={{ height: 40 }}
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
            <Col span={24}>
                <Table
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) =>
                                index +
                                1 +
                                (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Ảnh',
                            align: 'center',
                            width: 120,
                            render: (_, record) => {
                                const avatar = record.userProfile?.avatar

                                return avatar ? (
                                    <Image
                                        src={getMinioUrl(avatar)}
                                        width={100}
                                        height={80}
                                    />
                                ) : (
                                    <div className="flex justify-center items-center ml-[10px] w-20 h-16 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                        <UserOutlined
                                            style={{
                                                fontSize: 32,
                                                color: '#bfbfbf',
                                            }}
                                        />
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Mã sinh viên',
                            dataIndex: 'code',
                            width: 120,
                            align: 'center',
                        },
                        {
                            title: 'Họ và tên',
                            align: 'center',
                            width: 150,
                            render: (record) =>
                                record.userProfile
                                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                    : '',
                        },
                        {
                            title: 'Ngày sinh',
                            align: 'center',
                            width: 100,
                            render: (record) =>
                                record.userProfile?.dateOfBirth
                                    ? dayjs(
                                          record.userProfile.dateOfBirth
                                      ).format('DD/MM/YYYY')
                                    : '',
                        },
                        {
                            title: 'Giới tính',
                            align: 'center',
                            width: 80,
                            render: (record) =>
                                record.userProfile?.gender
                                    ? GENDER_MEAN[
                                          record.userProfile
                                              .gender as keyof typeof GENDER_MEAN
                                      ]
                                    : '',
                        },
                        {
                            title: 'Đối tượng ĐT',
                            align: 'center',
                            width: 120,
                            render: (record) =>
                                record.trainingObjectType
                                    ? record.trainingObjectType.name
                                    : '',
                        },
                        {
                            title: 'Lớp',
                            align: 'center',
                            width: 140,
                            render: (record) => {
                                const fiexedClass = `${record.fixedClass?.code}-${record.fixedClass?.name}`
                                return fiexedClass || ''
                            },
                        },
                        {
                            title: 'Khóa',
                            align: 'center',
                            width: 100,
                            render: (record) => {
                                const trainingCourse =
                                    record.fixedClass?.trainingCourse
                                return trainingCourse ? trainingCourse.name : ''
                            },
                        },
                        {
                            title: 'Ngành',
                            align: 'center',
                            width: 120,
                            render: (record) => {
                                const trainingField =
                                    record.trainingObjectType
                                        ?.trainingFields?.[0]?.trainingField
                                return trainingField?.name || ''
                            },
                        },
                        {
                            title: 'Chuyên ngành',
                            align: 'center',
                            width: 130,
                            render: (record) => {
                                const trainingMajor =
                                    record.trainingObjectType
                                        ?.trainingMajors?.[0]?.trainingMajor
                                return trainingMajor?.name || ''
                            },
                        },
                    ]}
                    data={data}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: count,
                        onChange: setCurrentPage,
                        onShowSizeChange: setNumberOfPages,
                    }}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                />
            </Col>
        </div>
    )
}
