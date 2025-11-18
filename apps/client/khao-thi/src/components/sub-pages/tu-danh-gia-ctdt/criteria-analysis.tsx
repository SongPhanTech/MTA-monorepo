import CommentList from '@components/commons/comment-list'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { getStatusEvaluation } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { formatDate } from '@lib/utils'
import type { DataTabType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/criteria-analysis'
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from '@workspace/db'
import { $Enums } from '@workspace/db/client'
import { useUpdateAnalysisCriterion } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Badge, Button, message, Popconfirm, Tag } from 'antd'
import dayjs from 'dayjs'
import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const CriteriaAnalysisSubPage = ({
    data,
    userRole,
    idx,
    refetch,
}: {
    data: DataTabType
    userRole: 'P13' | 'GV'
    idx: number
    refetch: () => void
}) => {
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
    const { can } = useAbility()

    const { onOpen } = useDisclosure<{
        id?: string
        analysisCriterionId?: string
        refetch?: () => void
    }>({
        tag: 'PutTieuChiMinhChungModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const toggleCommentRow = (recordId: string) => {
        setExpandedRowKeys((prev) =>
            prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
        )
    }

    const getDeadlineStatus = (deadline: Date | string) => {
        const now = dayjs()
        const deadlineDate = dayjs(deadline)
        const daysUntilDeadline = deadlineDate.diff(now, 'day')

        if (daysUntilDeadline < 0) {
            return {
                color: 'red',
                text: 'Quá hạn',
            }
        }
        if (daysUntilDeadline <= 3) {
            return {
                color: 'orange',
                text: 'Sắp quá hạn',
            }
        }

        return { color: 'blue', text: '' }
    }

    const { mutateAsync: updateCriterion } = useUpdateAnalysisCriterion()

    const handleSubmitCriterion = async (analysisCriterionId: string) => {
        try {
            showSpinner()
            await updateCriterion({
                where: {
                    id: analysisCriterionId,
                },
                data: {
                    status: $Enums.EvaluationCriterionStatus.SUBMITTED,
                },
            })

            message.success('Nộp tiêu chí thành công.')
        } catch (error) {
            message.error('Nộp tiêu chí thất bại. Vui lòng thử lại.')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div className="h-[calc(100vh-200px)] overflow-y-auto p-4">
            <div className="text-base mb-3">
                <span className="font-bold">Tiêu chuẩn {idx}: </span>
                <span>{data?.name}</span>
            </div>
            {data?.criteria?.map((item, idx: number) => {
                if (!item.analysisCriterions) return null
                const status = item.analysisCriterions?.status
                const statusConfig = getStatusEvaluation(status)
                const deadline = item.analysisCriterions?.deadline
                const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null

                return (
                    <div key={item.id} className="ml-4 mb-6">
                        <div className="mb-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="text-base flex items-start gap-2 mb-2">
                                        <span className="font-bold whitespace-nowrap">
                                            Tiêu chí {idx + 1}:
                                        </span>
                                        <span className="flex-1">{item?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {userRole === 'P13' && (
                                            <span className="text-sm text-gray-600">
                                                Người thực hiện:{' '}
                                                {item?.analysisCriterions?.lecturer?.userProfile
                                                    ?.fullname || 'Chưa phân công'}
                                            </span>
                                        )}
                                        {deadline && deadlineStatus && (
                                            <Tag color={deadlineStatus.color}>
                                                Hạn: {formatDate(deadline)}
                                                {deadlineStatus.text && ` (${deadlineStatus.text})`}
                                            </Tag>
                                        )}
                                        <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
                                    </div>
                                </div>
                                {userRole !== 'P13' && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                                            'THEM'
                                        ) &&
                                            status !== $Enums.EvaluationCriterionStatus.APPROVED &&
                                            status !==
                                                $Enums.EvaluationCriterionStatus.COMPLETED && (
                                                <Popconfirm
                                                    title="Xác nhận nộp tiêu chí"
                                                    description="Bạn chắc chắn muốn nộp tiêu chí này?"
                                                    onConfirm={() => {
                                                        const id = item.analysisCriterions?.id
                                                        if (id) {
                                                            handleSubmitCriterion(id)
                                                        }
                                                    }}
                                                    okText="Đồng ý"
                                                    cancelText="Hủy"
                                                    placement="topRight"
                                                >
                                                    <Button type="primary" className="bg-blue-500">
                                                        Nộp tiêu chí
                                                    </Button>
                                                </Popconfirm>
                                            )}

                                        {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                                            'THEM'
                                        ) &&
                                            status !== $Enums.EvaluationCriterionStatus.APPROVED &&
                                            status !==
                                                $Enums.EvaluationCriterionStatus.COMPLETED && (
                                                <Button
                                                    type="primary"
                                                    onClick={() =>
                                                        onOpen({
                                                            analysisCriterionId:
                                                                item.analysisCriterions?.id,
                                                            refetch: refetch,
                                                        })
                                                    }
                                                >
                                                    Thêm mới
                                                </Button>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <Table
                                rowKey="id"
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 30,
                                        align: 'center',
                                        render: (_, __, index) => index + 1,
                                    },
                                    {
                                        title: 'Phân tích tiêu chí',
                                        children: [
                                            {
                                                title: 'Các yêu cầu',
                                                dataIndex: 'name',
                                                width: 200,
                                                align: 'center',
                                                type: 'input',
                                            },
                                            {
                                                title: 'Các câu hỏi đặt ra',
                                                dataIndex: 'questions',
                                                width: 150,
                                                render: (questions: string[]) => {
                                                    return (
                                                        <div className="flex flex-col gap-2">
                                                            {questions?.map((question: string) => {
                                                                return (
                                                                    <div key={question}>
                                                                        - {question}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        title: 'Thông tin minh chứng',
                                        children: [
                                            {
                                                title: 'Tên minh chứng',
                                                width: 200,
                                                align: 'left',
                                                render: (record: {
                                                    evidences: AnalysisFormEvidence[]
                                                }) => {
                                                    return record?.evidences.length ? (
                                                        <div className="flex flex-col gap-2">
                                                            {record?.evidences?.map(
                                                                (
                                                                    evidence: AnalysisFormEvidence & {
                                                                        evidence?: Evidence
                                                                    }
                                                                ) => {
                                                                    return (
                                                                        <div key={evidence.id}>
                                                                            -{' '}
                                                                            {
                                                                                evidence?.evidence
                                                                                    ?.name
                                                                            }
                                                                        </div>
                                                                    )
                                                                }
                                                            )}
                                                        </div>
                                                    ) : (
                                                        ''
                                                    )
                                                },
                                            },
                                            {
                                                title: 'Nơi thu thập',
                                                width: 150,
                                                align: 'center',
                                                render: (record: RequirementCriterion) => {
                                                    return record?.evidencePlaces || ''
                                                },
                                            },
                                            {
                                                title: 'Phương pháp thu thập',
                                                width: 150,
                                                align: 'center',
                                                render: (record: RequirementCriterion) => {
                                                    return record?.collectionMethod || ''
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        title: 'Thao tác',
                                        width: 100,
                                        align: 'center',
                                        render: (__, record) => {
                                            const commentCount =
                                                record.evaluationCriterionComment?.length || 0

                                            return (
                                                <div className="flex gap-2 items-center justify-center">
                                                    {can(
                                                        KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                                                        'SUA'
                                                    ) &&
                                                        status !==
                                                            $Enums.EvaluationCriterionStatus
                                                                .APPROVED &&
                                                        status !==
                                                            $Enums.EvaluationCriterionStatus
                                                                .COMPLETED && (
                                                            <EditIcon
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    onOpen({
                                                                        id: record.id,
                                                                        analysisCriterionId:
                                                                            record.analysisCriterionId,
                                                                        refetch: refetch,
                                                                    })
                                                                }}
                                                                className="text-sm text-blue-700 cursor-pointer"
                                                            />
                                                        )}

                                                    {commentCount > 0 && (
                                                        <Badge count={commentCount} size="small">
                                                            <MessageCircle
                                                                size={16}
                                                                strokeWidth={1.5}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleCommentRow(record.id)
                                                                }}
                                                            />
                                                        </Badge>
                                                    )}
                                                </div>
                                            )
                                        },
                                    },
                                ]}
                                data={item?.analysisCriterions?.requirementCriterions || []}
                                pagination={false}
                                expandable={{
                                    expandedRowKeys: expandedRowKeys,
                                    expandedRowRender: (record) => {
                                        return (
                                            <div>
                                                <CommentList
                                                    comments={
                                                        record.evaluationCriterionComment || []
                                                    }
                                                />
                                            </div>
                                        )
                                    },
                                    rowExpandable: (record) =>
                                        (record?.evaluationCriterionComment?.length || 0) > 0,
                                    onExpand: (expanded, record) => {
                                        toggleCommentRow(record.id)
                                    },
                                    expandIcon: () => null,
                                }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default CriteriaAnalysisSubPage
