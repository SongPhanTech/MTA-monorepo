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
import { useStudentBySubjectClassSemester } from '@workspace/libs/api/training'
import { StudentClassBySubjectClassSemester } from '@workspace/libs/api/schemas/studentClassBySubjectClassSemester'

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
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const queryClient = new QueryClient()

    const { data: studentData, refetch } = useStudentBySubjectClassSemester(
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
    const students = studentData?.data?.data

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
                            title: 'Chuyên ngành',
                            align: 'center',
                            width: 130,
                            render: (record) => {
                                const trainingMajor =
                                    record.fixedClass?.curriculumVersion
                                        ?.curriculum?.trainingMajor
                                return trainingMajor?.name || ''
                            },
                        },
                    ]}
                    data={students}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: currentPage,
                        onChange: setCurrentPage,
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
