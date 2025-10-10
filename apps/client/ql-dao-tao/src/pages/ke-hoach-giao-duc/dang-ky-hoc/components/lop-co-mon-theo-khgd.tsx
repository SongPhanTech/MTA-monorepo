import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useScheduleOptions } from '@hooks/subjectClassSchedule'
import {
    useCountFixedClass,
    useFindManyFixedClass,
    useFindUniqueSubjectClass,
} from '@workspace/db/hooks'
import type { FixedClassBySubjectClassSemester } from '@workspace/libs/api/schemas/fixedClassBySubjectClassSemester'
import {
    enrollFixedClassOnSubjectClass,
    useFixedClassBySubjectClassSemester,
} from '@workspace/libs/api/training'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Checkbox, Col, Divider, Flex, Form, Input, message, Row } from 'antd'
import { Search } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

interface FilterProps {
    searchText: string | null
}

interface FixedClassProps {
    subjectClassId?: string | null
}

export default function FixedClass({ subjectClassId }: FixedClassProps) {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [isShowAllFixedClass, setIsShowAllFixedClass] = useState(true)
    const { id: semesterId } = useSemesterStore()
    const { getScheduleLabel } = useScheduleOptions()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: selectedSubjectClass } = useFindUniqueSubjectClass(
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
                subject: true,
            },
        },
        { enabled: !!semesterId && !!subjectClassId }
    )

    const { data: fixedClass } = useFixedClassBySubjectClassSemester(
        {
            semesterId: semesterId || '',
            subjectClassId: subjectClassId || '',
            search: filters.searchText || '',
            page: `${currentPage}`,
            pageSize: `${numberOfPages}`,
            trainingObjectTypeId: trainingObjectTypeId || '',
            isShowAllFixedClass: 'true',
        },
        {
            query: {
                enabled: !!semesterId && !!subjectClassId,
            },
        },
        queryClient
    )

    const { data: fixedClassAll } = useFindManyFixedClass({
        where: {
            curriculumVersion: {
                trainingBlocks: {
                    some: {
                        subjects: {
                            some: {
                                subjectId: selectedSubjectClass?.subjectId,
                            },
                        },
                    },
                },
            },
        },
        take: numberOfPages,
        skip: currentPage === 1 ? 0 : (currentPage - 1) * numberOfPages,
        include: {
            trainingCourse: true,
            _count: {
                select: {
                    students: true,
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                },
            },
        },
        orderBy: { name: 'asc' },
    })

    const { data: countFixedClassAll } = useCountFixedClass({
        where: {
            curriculumVersion: {
                trainingBlocks: {
                    some: {
                        subjects: {
                            some: {
                                subjectId: selectedSubjectClass?.subjectId,
                            },
                        },
                    },
                },
            },
        },
    })

    useEffect(() => {
        if (fixedClass?.data?.data) {
            const selectedKeys = fixedClass.data.data
                .filter((item: FixedClassBySubjectClassSemester) => item.checked)
                .map((item: FixedClassBySubjectClassSemester) => item.id)
            setSelectedRowKeys(selectedKeys)
        } else {
            setSelectedRowKeys([])
        }
    }, [fixedClass?.data?.data])

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            return newFilters
        })
    }

    const handleSave = async () => {
        if (!subjectClassId) return

        try {
            await enrollFixedClassOnSubjectClass({
                fixedClassIds: selectedRowKeys as string[],
                subjectClassId,
            })
            message.success('Gán lớp cố định thành công!')
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'SubjectClass'],
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Có lỗi xảy ra khi gán lớp!')
        }
    }

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[
                    selectedSubjectClass?.code,
                    selectedSubjectClass?.name,
                    selectedSubjectClass?.schedule &&
                        getScheduleLabel(selectedSubjectClass.schedule),
                    selectedSubjectClass?.mainLecturer?.userProfile?.fullname,
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
                        <Col span={12}>
                            <Form.Item name="isShowAllFixedClass">
                                <Checkbox
                                    checked={isShowAllFixedClass}
                                    onChange={(e) => {
                                        setIsShowAllFixedClass(e.target.checked)
                                        setCurrentPage(1)
                                    }}
                                >
                                    Lớp quản lý có môn theo kỳ học dự kiến
                                </Checkbox>
                            </Form.Item>
                        </Col>
                    </Flex>
                </Col>
            </Row>
            {!isShowAllFixedClass ? (
                <Table
                    rowKey="id"
                    id="fixed-class"
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    data={fixedClassAll}
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
                            title: 'Lớp QL',
                            dataIndex: 'code',
                            align: 'center',
                            width: 120,
                        },
                        {
                            title: 'Khoá học',
                            dataIndex: 'trainingCourse',
                            width: 100,
                            align: 'center',
                            render: (record) => (record.name ? record.name : ''),
                        },
                        {
                            title: 'Chuyên ngành',
                            dataIndex: ['curriculumVersion', 'curriculum', 'trainingMajor', 'name'],
                            width: 160,
                            align: 'center',
                        },
                        {
                            title: 'Số HV, SV',
                            dataIndex: ['_count', 'students'],
                            align: 'center',
                            width: 80,
                        },
                    ]}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: countFixedClassAll ?? 0,
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
            ) : (
                <Table
                    rowKey="id"
                    id="fixed-class"
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    dataSource={fixedClass?.data?.data}
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
                            title: 'Lớp QL',
                            dataIndex: 'code',
                            align: 'center',
                            width: 120,
                        },
                        {
                            title: 'Khoá học',
                            dataIndex: 'trainingCourse',
                            width: 100,
                            align: 'center',
                            render: (record) => (record.name ? record.name : ''),
                        },
                        {
                            title: 'Chuyên ngành',
                            dataIndex: ['curriculumVersion', 'curriculum', 'trainingMajor', 'name'],
                            width: 160,
                            align: 'center',
                        },
                        {
                            title: 'Số HV, SV',
                            dataIndex: ['_count', 'students'],
                            align: 'center',
                            width: 80,
                        },
                    ]}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: fixedClass?.data?.count ?? 0,
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
            )}
            <Flex justify="end" style={{ marginTop: 16 }}>
                {can(
                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_KE_HOACH_MO_LOP_MON_HOC,
                    'THEM'
                ) && (
                    <Button type="primary" className="h-[32px] px-4" onClick={handleSave}>
                        Lưu
                    </Button>
                )}
            </Flex>
        </div>
    )
}
