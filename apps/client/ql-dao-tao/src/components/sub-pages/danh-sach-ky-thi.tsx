import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import { cn, formatDate } from '@lib/utils'
import { diemPhongThiStore, kythiStore } from '@pages/quan-ly-diem/ql-diem-lop-mon-hoc'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import type { Prisma } from '@workspace/db/client'
import { useCountExam, useFindManyExam } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Flex, Input, Row } from 'antd'
import _ from 'lodash'
import { useCallback, useMemo, useState } from 'react'

export default function KyThi() {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: examTypeOptions, getExamTypeLabel } = useExamTypeOptions()

    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: session } = useSession()
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        searchText: '',
        examType: undefined,
    })

    const { examId } = useStore(kythiStore)

    const where: Prisma.ExamWhereInput = useMemo(() => {
        return {
            subjectClass: {
                some: {
                    trainingObjectTypeId,
                    semesterId,
                    ...(filters.examType && filters.examType.length > 0
                        ? {
                              examType: {
                                  in: filters.examType,
                              },
                          }
                        : {}),
                },
            },
            lockExamSessions: true,
        }
    }, [trainingObjectTypeId, semesterId, filters])

    const { data = [], refetch } = useFindManyExam({
        where,
        include: {
            subjectVersion: true,
            subjectClass: true,
            _count: {
                select: {
                    examRooms: true,
                },
            },
        },
        orderBy: {
            subjectVersion: {
                name: 'asc',
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountExam({
        where: { ...where, deletedAt: null },
    })
    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 300),
        []
    )
    const debouncedSearch = useCallback(
        _.debounce((value: string) => {
            setFilters((prev) => ({
                ...prev,
                searchText: value,
            }))
        }, 300),
        []
    )

    return (
        <div className="bg-white">
            <Row gutter={[16, 16]}>
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
                <Col span={24}>
                    <Table
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    kythiStore.setState({ examId: record.id })
                                    diemPhongThiStore.setState({ selectedExamListId: undefined })
                                    debouncedRefetch()
                                },
                                className: cn(examId === record.id ? 'bg-orange-200' : ''),
                            }
                        }}
                        columns={[
                            {
                                title: 'TT',
                                width: 35,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã MH',
                                dataIndex: 'code',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => record?.subjectVersion?.code || '',
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => record?.subjectVersion?.name || '',
                            },
                            {
                                title: 'Hình thức thi',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        getExamTypeLabel(record?.subjectClass?.[0]?.examType) || ''
                                    )
                                },
                            },
                            {
                                title: 'Lớp môn học',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => {
                                    return record?.subjectClass?.length ? (
                                        <TextTruncate
                                            arr={record?.subjectClass.map((i: any) => {
                                                return {
                                                    key: i?.id,
                                                    label: `${i?.code} ${i?.examScoreDaeadline ? formatDate(i?.examScoreDaeadline) : ''}`,
                                                }
                                            })}
                                        />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Số ca thi',
                                width: 150,
                                align: 'center',
                                render: (_, record) => {
                                    return record?.session
                                },
                            },
                            {
                                title: 'Số phòng thi',
                                width: 150,
                                align: 'center',
                                render: (_, record) => {
                                    return record?._count.examRooms
                                },
                            },
                        ]}
                        data={data}
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
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}
