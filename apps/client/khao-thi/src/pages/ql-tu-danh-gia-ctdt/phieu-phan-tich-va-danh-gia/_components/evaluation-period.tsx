import Table from '@components/commons/table'
import { useSchoolYearStore } from '@components/selecter-school-year'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { cn, formatDate } from '@lib/utils'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import { $Enums } from '@workspace/db/client'
import {
    useCountEvaluationPeriod,
    useFindManyEvaluationPeriod,
    useFindUniqueLecturer,
} from '@workspace/db/hooks'
import { Col, Row } from 'antd'
import { useMemo, useState } from 'react'

export default function EvaluationPeriod() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '7247c121-ab5a-4a72-a018-4a4090c7948a'
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const { id: schoolYearId } = useSchoolYearStore()

    const { data: lecturer } = useFindUniqueLecturer(
        {
            where: {
                userProfileId: idProfile || '',
            },
        },
        {
            enabled: !!idProfile,
        }
    )

    const whereClause = useMemo(() => {
        return {
            OR: [
                {
                    standards: {
                        some: {
                            criteria: {
                                some: {
                                    analysisCriterions: {
                                        lecturer: {
                                            userProfile: {
                                                id: idProfile,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    council: {
                        members: {
                            some: {
                                lecturerId: lecturer?.id,
                                OR: [
                                    { role: $Enums.EvaluationMemberRole.ADVISORY_BOARD },
                                    { role: $Enums.EvaluationMemberRole.HEAD_SECRETARY },
                                    { role: $Enums.EvaluationMemberRole.HEAD_SPECIALIZED },
                                ],
                            },
                        },
                    },
                },
            ],
            ...(schoolYearId && { schoolYearId }),
            deletedAt: null,
        }
    }, [idProfile, schoolYearId, lecturer?.id])

    const { data: assignments = [], isLoading } = useFindManyEvaluationPeriod(
        {
            where: whereClause,
            include: {
                council: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                schoolYear: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!idProfile,
        }
    )

    const { data: count } = useCountEvaluationPeriod(
        {
            where: whereClause,
        },
        {
            enabled: !!idProfile,
        }
    )

    return (
        <Row gutter={[8, 0]}>
            <Col span={24}>
                <Table
                    rowKey="id"
                    data={assignments}
                    loading={isLoading}
                    className="h-[calc(100vh-200px)]"
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                evaluationPeriodStore.setState({
                                    selectedEvaluationPeriodId: record.id,
                                })
                            },
                            className: cn(
                                selectedEvaluationPeriodId === record.id
                                    ? 'bg-orange-200 hover:bg-orange-200'
                                    : ''
                            ),
                        }
                    }}
                    columns={[
                        {
                            title: 'STT',
                            width: 30,
                            align: 'center',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Tên đợt đánh giá',
                            width: 200,
                            align: 'center',
                            render: (_, record) => {
                                return <div className="text-left">{record?.name}</div>
                            },
                        },
                        {
                            title: 'Hội đồng đánh giá',
                            width: 200,
                            render: (_, record) => {
                                return <div className="text-left">{record.council?.name}</div>
                            },
                        },
                        {
                            title: 'Năm học',
                            width: 180,
                            render: (_, record) => record.schoolYear?.name,
                        },
                        {
                            title: 'Ngày bắt đầu',
                            width: 150,
                            render: (_, record) =>
                                record?.startDate ? formatDate(record.startDate) : undefined,
                        },
                        {
                            title: 'Ngày kết thúc',
                            width: 150,
                            render: (_, record) =>
                                record?.endDate ? formatDate(record.endDate) : undefined,
                        },
                        {
                            title: 'Mô tả',
                            width: 150,
                            render: (_, record) => {
                                return <div className="line-clamp-2">{record?.description}</div>
                            },
                        },
                        // {
                        //     title: 'Trạng thái',
                        //     align: 'center',
                        //     width: 110,
                        //     render: (_, record) => {
                        //         const statusInfo = EVALUATION_PERIOD_STATUS_LABELS[record.status]
                        //         return (
                        //             <Tag color={statusInfo?.color || 'default'}>
                        //                 {statusInfo?.label || record.status}
                        //             </Tag>
                        //         )
                        //     },
                        // },
                    ]}
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
    )
}
