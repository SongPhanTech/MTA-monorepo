import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useScheduleOptions } from '@hooks/subjectClassSchedule'
import {
    useCountFixedClass,
    useFindManyFixedClass,
    useFindUniqueSubjectClass,
} from '@workspace/db/hooks'
import { enrollFixedClassOnSubjectClass } from '@workspace/libs/api/training'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'
import { Search } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

interface FilterProps {
    searchText: string | null
}

interface FixedClassProps {
    subjectClassId?: string | null
}

export default function LopCoMonTheoKhgd({ subjectClassId }: FixedClassProps) {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
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
                id: subjectClassId as string,
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
                    select: {
                        id: true,
                    },
                },
            },
        },
        { enabled: !!semesterId && !!subjectClassId }
    )

    const { data: fixedClasses = [] } = useFindManyFixedClass(
        {
            where: {
                planTrainingSubject: {
                    some: {
                        planTraining: {
                            semesterId: semesterId as string,
                            trainingObjectTypeId: trainingObjectTypeId as string,
                        },
                        subjectVersion: {
                            subjectClass: {
                                some: {
                                    id: subjectClassId as string,
                                },
                            },
                        },
                    },
                },
                name: {
                    contains: filters.searchText || undefined,
                    mode: 'insensitive',
                },
            },
            orderBy: {
                code: 'asc',
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
            include: {
                trainingCourse: true,
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
                curriculumVersion: {
                    select: {
                        curriculum: {
                            select: {
                                trainingMajor: true,
                            },
                        },
                    },
                },
                subjectClasses: {
                    where: {
                        semesterId: semesterId as string,
                        trainingObjectTypeId: trainingObjectTypeId as string,
                        subjectId: selectedSubjectClass?.subjectId,
                    },
                },
            },
        },
        {
            enabled: !!semesterId && !!subjectClassId,
        }
    )

    const { data: countFixedClassAll = 0 } = useCountFixedClass({
        where: {
            planTrainingSubject: {
                some: {
                    planTraining: {
                        semesterId: semesterId as string,
                        trainingObjectTypeId: trainingObjectTypeId as string,
                    },
                },
            },
            name: {
                contains: filters.searchText || undefined,
                mode: 'insensitive',
            },
        },
    })

    useEffect(() => {
        if (fixedClasses && selectedSubjectClass) {
            const selectedSubjectClassFixedClassIds = selectedSubjectClass?.fixedClasses.map(
                (fc) => fc.id
            )
            const selectedKeys = fixedClasses
                .filter((item) => selectedSubjectClassFixedClassIds?.includes(item.id))
                .map((item) => item.id)
            setSelectedRowKeys(selectedKeys)
        }
    }, [fixedClasses, selectedSubjectClass])

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
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'FixedClass'],
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
            {/* <Divider orientation="left" orientationMargin={0} className='m-0 my-0'>
                {[
                    selectedSubjectClass?.code,
                    selectedSubjectClass?.name,
                    selectedSubjectClass?.schedule &&
                        getScheduleLabel(selectedSubjectClass.schedule),
                    selectedSubjectClass?.mainLecturer?.userProfile?.fullname,
                    selectedSubjectClass?.extraLecturer?.userProfile?.fullname,
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider> */}
            <Row align="top" justify="space-between">
                <Col span={24}>
                    <Flex>
                        <Col span={20}>
                            <Form.Item className="m-0" name="searchText">
                                <Input
                                    id="search"
                                    placeholder="Tìm kiếm..."
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
                        <Col span={4} className="text-right">
                            {can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_KE_HOACH_MO_LOP_MON_HOC,
                                'THEM'
                            ) && (
                                <Button
                                    type="primary"
                                    className="h-[32px] px-4"
                                    onClick={handleSave}
                                    disabled={!subjectClassId}
                                >
                                    Lưu
                                </Button>
                            )}
                        </Col>
                    </Flex>
                </Col>
            </Row>
            <Table
                rowKey="id"
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                    getCheckboxProps: (record) => ({
                        disabled:
                            record.subjectClasses.length > 0 &&
                            record.subjectClasses?.[0].id !== subjectClassId,
                    }),
                    columnWidth: 35,
                }}
                rowClassName={(record) =>
                    record.subjectClasses.length > 0 &&
                    record.subjectClasses?.[0].id !== subjectClassId
                        ? 'bg-yellow-100'
                        : ''
                }
                onRow={(record) => ({
                    onClick: () => {
                        if (
                            record.subjectClasses.length > 0 &&
                            record.subjectClasses?.[0].id !== subjectClassId
                        )
                            return
                        const selectedKeys = [...selectedRowKeys]
                        const index = selectedKeys.indexOf(record?.id)
                        if (index > -1) {
                            selectedKeys.splice(index, 1)
                        } else {
                            selectedKeys.push(record?.id)
                        }
                        setSelectedRowKeys(selectedKeys)
                    },
                })}
                data={fixedClasses}
                columns={[
                    {
                        title: 'TT',
                        width: 35,
                        align: 'center',
                        render: (_, __, index) =>
                            index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                    },
                    {
                        title: 'Lớp QL',
                        dataIndex: 'code',
                        align: 'center',
                        width: 100,
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
                    total: countFixedClassAll,
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
