import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN } from '@constants/constants'
import { useScheduleOptions } from '@hooks/subjectClassSchedule'
import { useFindUniqueSubjectClass } from '@workspace/db/hooks'
import type { StudentClassBySubjectClassSemester } from '@workspace/libs/api/schemas/studentClassBySubjectClassSemester'
import {
    enrollStudentOnSubjectClass,
    useStudentBySubjectClassSemester,
} from '@workspace/libs/api/training'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { App, Button, Col, Divider, Flex, Form, Input, message, Row } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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

    const { getScheduleLabel } = useScheduleOptions()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [initialSelectedKeys, setInitialSelectedKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: initialValue } = useFindUniqueSubjectClass(
        {
            where: {
                semesterId: semesterId as string,
                id: subjectClassId as string,
                trainingObjectTypeId,
            },
            include: {
                mainLecturer: {
                    include: {
                        userProfile: true,
                    },
                },
            },
        },
        { enabled: !!semesterId && !!subjectClassId }
    )

    const { data: studentData, refetch } = useStudentBySubjectClassSemester(
        {
            semesterId: semesterId || '',
            subjectClassId: subjectClassId || '',
            search: filters.searchText || '',
            page: `${currentPage}`,
            pageSize: `${numberOfPages}`,
            trainingObjectTypeId: trainingObjectTypeId || '',
        },
        {
            query: {
                enabled: !!semesterId && !!subjectClassId,
            },
        },
        queryClient
    )

    const students = useMemo(() => {
        return studentData?.data?.data || []
    }, [studentData?.data?.data])

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

    const handleSaveStudentClass = async () => {
        if (!subjectClassId) return

        const removedStudents = initialSelectedKeys.filter((key) => !selectedRowKeys.includes(key))

        try {
            await enrollStudentOnSubjectClass({
                addStudentIds: selectedRowKeys as string[],
                removeStudentIds: removedStudents as string[],
                subjectClassId,
            })
            message.success('Gán học sinh vào lớp thành công!')
            setInitialSelectedKeys(selectedRowKeys)
            queryClient.invalidateQueries({ queryKey: ['zenstack'] })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Có lỗi xảy ra khi gán lớp!')
        }
    }

    useEffect(() => {
        if (students) {
            const checkedStudentIds = students
                .filter((item: StudentClassBySubjectClassSemester) => item.checked)
                .map((item: StudentClassBySubjectClassSemester) => item.id)

            setSelectedRowKeys(checkedStudentIds)
            setInitialSelectedKeys(checkedStudentIds)
        }
    }, [students])

    return (
        <App>
            <Divider orientation="left" orientationMargin={0}>
                {[
                    initialValue?.code,
                    initialValue?.name,
                    initialValue?.schedule && getScheduleLabel(initialValue.schedule),
                    initialValue?.mainLecturer?.userProfile?.fullname,
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>

            <Row gutter={[16, 16]} align="top" justify="space-between">
                <Col span={24}>
                    <Flex>
                        <Col span={12}>
                            <Form.Item name="searchText">
                                <Input
                                    id="search"
                                    placeholder="Nhập tên học viên"
                                    onChange={(e) =>
                                        handleFilterChange('searchText', e.target.value)
                                    }
                                    prefix={
                                        <Search
                                            size={15}
                                            style={{
                                                color: 'rgba(0, 0, 0, 0.25)',
                                            }}
                                        />
                                    }
                                    className="h-8"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Flex>
                </Col>
            </Row>
            <Col span={24}>
                <Table
                    rowKey="id"
                    id="student-by-subject-class-semester"
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Mã sinh viên',
                            dataIndex: 'code',
                            width: 120,
                            align: 'center',
                            fixed: 'left',
                        },
                        {
                            title: 'Họ',
                            align: 'center',
                            width: 150,
                            render: (record) =>
                                record.userProfile ? `${record.userProfile.lastName}` : '',
                        },
                        {
                            title: 'Tên',
                            align: 'center',
                            width: 150,
                            sorter: (
                                a: StudentClassBySubjectClassSemester,
                                b: StudentClassBySubjectClassSemester
                            ) => {
                                const nameA = a.userProfile ? `${a.userProfile.firstName}` : ''
                                const nameB = b.userProfile ? `${b.userProfile.firstName}` : ''
                                return nameA.localeCompare(nameB, 'vi', {
                                    sensitivity: 'base',
                                })
                            },
                            defaultSortOrder: 'ascend',
                            render: (record) =>
                                record.userProfile ? `${record.userProfile.firstName}` : '',
                        },
                        {
                            title: 'Ngày sinh',
                            align: 'center',
                            width: 100,
                            render: (record) =>
                                record.userProfile?.dateOfBirth
                                    ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                    : '',
                        },
                        {
                            title: 'Giới tính',
                            align: 'center',
                            width: 80,
                            render: (record) =>
                                record?.userProfile?.gender
                                    ? GENDER_MEAN[
                                          record.userProfile.gender as keyof typeof GENDER_MEAN
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
                                const trainingCourse = record.fixedClass?.trainingCourse
                                return trainingCourse ? trainingCourse.name : ''
                            },
                        },
                        {
                            title: 'Chuyên ngành',
                            align: 'center',
                            width: 130,
                            render: (record) => {
                                const trainingMajor =
                                    record.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                                return trainingMajor?.name || ''
                            },
                        },
                    ]}
                    data={students as unknown as Record<string, unknown>[]}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: studentData?.data?.count ?? 0,
                        onChange: (page, pageSize) => {
                            if (numberOfPages === pageSize) {
                                setCurrentPage(page)
                            } else {
                                setCurrentPage(1)
                                setNumberOfPages(pageSize)
                            }
                        },
                    }}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (selectedKeys) => {
                            setSelectedRowKeys(selectedKeys)
                        },
                    }}
                />
                <Flex justify="end" style={{ marginTop: 16 }}>
                    <Button
                        type="primary"
                        className="h-[32px] px-4"
                        onClick={handleSaveStudentClass}
                        disabled={!subjectClassId || !semesterId || selectedRowKeys.length <= 0}
                    >
                        Lưu
                    </Button>
                </Flex>
            </Col>
        </App>
    )
}
