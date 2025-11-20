import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE, EVALUATION_PERIOD_STATUS_LABELS } from '@constants/constants'
import { formatDate } from '@lib/utils'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import {
    useCountEvaluationPeriod,
    useFindManyEvaluationPeriod,
    useFindUniqueLecturer,
} from '@workspace/db/hooks'
import { $Enums } from '@workspace/db/client'
import { Col, Row, Tag } from 'antd'
import { type Key, useState, useMemo } from 'react'

export default function EvaluationPeriodCriteriaEvaluation() {
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'd4a3bb87-f834-44b7-98a4-f7b76556cbfe'

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

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
                                    evaluationCriterion: {
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
                                role: {
                                    hasSome: [
                                        $Enums.EvaluationMemberRole.ADVISORY_BOARD,
                                        $Enums.EvaluationMemberRole.HEAD_SECRETARY,
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    createdBy: idProfile,
                },
            ],
        }
    }, [idProfile, lecturer?.id])

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
                    rowSelection={{
                        type: 'radio',
                        selectedRowKeys: [selectedEvaluationPeriodId as Key],
                        onChange: (selectedRowKeys) => {
                            evaluationPeriodStore.setState({
                                selectedEvaluationPeriodId: selectedRowKeys[0] as string,
                            })
                        },
                    }}
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                evaluationPeriodStore.setState({
                                    selectedEvaluationPeriodId: record.id,
                                })
                            },
                        }
                    }}
                    className="h-[calc(100vh-200px)]"
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
                            render: (_, record) => record?.name || '',
                        },
                        {
                            title: 'Hội đồng đánh giá',
                            width: 200,
                            render: (_, record) => {
                                return <div className="text-left">{record.council?.name}</div>
                            },
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
                            title: 'Trạng thái',
                            align: 'center',
                            width: 110,
                            render: (_, record) => {
                                const statusInfo = EVALUATION_PERIOD_STATUS_LABELS[record.status]
                                return (
                                    <Tag color={statusInfo?.color || 'default'}>
                                        {statusInfo?.label || record.status}
                                    </Tag>
                                )
                            },
                        },
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
