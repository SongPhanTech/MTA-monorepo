import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { cn, formatDate } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import { useCountExamRoom, useFindManyExamList } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Row } from 'antd'
import _ from 'lodash'
import { useCallback, useMemo, useState } from 'react'

export default function PhongThi({ selectedRowKeys, setSelectedRowKeys }: any) {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: session } = useSession()
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    const where: any = useMemo(() => {
        return {
            ...(trainingObjectTypeId || semesterId
                ? {
                      exam: {
                          subjectClass: {
                              some: {
                                  trainingObjectTypeId,
                                  semesterId,
                              },
                          },
                      },
                  }
                : {}),
        }
    }, [filters, trainingObjectTypeId, semesterId])

    const { data = [], refetch } = useFindManyExamList({
        where,
        include: {
            examPapers: {
                include: {
                    studentSubjectScore: true,
                },
            },
            examRoom: {
                include: {
                    exam: {
                        include: {
                            subjectClass: {
                                include: {
                                    subject: true,
                                },
                            },
                        },
                    },
                    room: {
                        include: {
                            building: {
                                include: {
                                    trainingLocation: true,
                                },
                            },
                        },
                    },
                },
            },
            _count: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    data[0].examRoom?.room.building?.trainingLocation?.name

    const { data: count } = useCountExamRoom({
        where: {
            ...where,
            deletedAt: null,
        },
    })
    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    return (
        <div className="bg-white">
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    setSelectedRowKeys(record.id)
                                },
                                className: cn(selectedRowKeys === record.id ? 'bg-orange-200' : ''),
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
                                title: 'Phòng thi',
                                dataIndex: 'name',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => record?.examRoom.room.name || '',
                            },
                            {
                                title: 'Địa chỉ',
                                dataIndex: 'fullname',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) =>
                                    `${record?.examRoom?.room.building?.name} ${record?.examRoom?.room.building?.trainingLocation?.name}`,
                            },
                            {
                                title: 'Môn học',
                                dataIndex: 'fullname',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => {
                                    return record?.examRoom?.exam?.subjectClass?.length ? (
                                        <TextTruncate
                                            arr={record?.examRoom?.exam?.subjectClass.map(
                                                (i: any) => {
                                                    return {
                                                        key: i?.id,
                                                        label: `${i?.subject?.name}`,
                                                    }
                                                }
                                            )}
                                        />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Tiết',
                                dataIndex: 'fullname',
                                width: 150,
                                align: 'center',
                                render: (_, record) =>
                                    `${record?.start || ''} - ${record?.end || ''}`,
                            },
                            {
                                title: 'Ngày thi',
                                dataIndex: 'fullname',
                                width: 150,
                                align: 'center',
                                render: (_, record) =>
                                    `${formatDate(record?.examRoom?.exam?.subjectClass[0]?.examDate) || ''}`,
                            },
                            {
                                title: 'Số thí sinh',
                                dataIndex: 'fullname',
                                width: 150,
                                align: 'center',
                                render: (_, record) => {
                                    return record?._count?.examSessions
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
