import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
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
import { Col, Row } from 'antd'
import { type Key, useState, useMemo } from 'react'

export default function EvaluationPeriodCriteriaAnalysis() {
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || ''

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
                    councils: {
                        some: {
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
                },
            ],
        }
    }, [idProfile, lecturer?.id])

    const { data: assignments = [], isLoading } = useFindManyEvaluationPeriod(
        {
            where: whereClause,
            include: {
                councils: {
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
            enabled: !!idProfile && !!lecturer,
        }
    )

    const { data: count } = useCountEvaluationPeriod(
        {
            where: whereClause,
        },
        {
            enabled: !!idProfile && !!lecturer,
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
                                if (!record.councils || record.councils.length === 0) return

                                return (
                                    <div className="text-left">
                                        {record.councils.map(
                                            (council: { id: string; name: string }) => (
                                                <div key={council.id} className="py-0.5">
                                                    - {council.name}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )
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
