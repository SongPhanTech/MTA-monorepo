import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { cn, formatDate } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import { useCountExamRoom, useFindManyExamRoom } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import {Row, Col } from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

export default function PhongThi({ selectedRowKeys, setSelectedRowKeys }: any) {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const router = useRouter()

    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    // const { onOpen } = useDisclosure<{
    //     dataTable: DataTable[]
    //     type: number // 1: In phiếu điểm và khóa, 0: In phiếu điểm nháp
    // }>({
    //     tag: 'ModalPrintStudentSubjectScore',
    // })



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

    const { data = [], refetch } = useFindManyExamRoom({
        where,
        include: {
            room: {
                include: {
                    building: {
                        include: {
                            trainingLocation: true,
                        },
                    },
                },
            },
            exam: {
                include: {
                    subjectClass: {
                        include: {
                            subject: true,
                        },
                    },
                    studentSubjectScore: true,
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
                {/* <Col span={24}></Col> */}
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="student-subject-score"
                        filters={filters}
                        setFilters={setFilters}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    console.log(record);
                                    
                                    setSelectedRowKeys(record.id)
                                },
                                className: cn(
                                    selectedRowKeys === record.id ? 'bg-orange-200' : ''
                                ),
                            }
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Phòng thi',
                                dataIndex: 'name',
                                width: 150,
                                type: 'input',
                                render: (_, record) => record?.room?.name || '',
                            },
                            {
                                title: 'Địa chỉ',
                                dataIndex: 'fullname',
                                width: 150,
                                type: 'input',
                                render: (_, record) =>
                                    `${record?.room?.building?.name} ${record?.room?.building?.trainingLocation?.name}`,
                            },
                            {
                                title: 'Môn học',
                                dataIndex: 'fullname',
                                width: 150,
                                type: 'input',
                                render: (_, record) => {
                                    return record?.exam?.subjectClass?.length ? (
                                        <TextTruncate
                                            arr={record?.exam?.subjectClass.map((i: any) => {
                                                return {
                                                    key: i?.id,
                                                    label: `${i?.subject?.name}`,
                                                }
                                            })}
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
                                render: (_, record) =>
                                    `${record?.start || ''} - ${record?.end || ''}`,
                            },
                            {
                                title: 'Ngày thi',
                                dataIndex: 'fullname',
                                width: 150,
                                render: (_, record) =>
                                    `${formatDate(record?.exam?.subjectClass[0]?.examDate) || ''}`,
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
