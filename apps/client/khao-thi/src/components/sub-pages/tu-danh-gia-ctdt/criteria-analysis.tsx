import CommentList from '@components/commons/comment-list'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { getStatusEvaluation } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { DataTabType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/criteria-analysis'
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from '@workspace/db'
import { $Enums } from '@workspace/db/client'
import { useUpdateAnalysisCriterion } from '@workspace/db/hooks'
import { Badge, Button, message, Popconfirm, Tag } from 'antd'
import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const CriteriaAnalysisSubPage = ({ data, idx }: { data: DataTabType; idx: number }) => {
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])

    const { onOpen } = useDisclosure<{
        id?: string
        analysisCriterionId?: string
    }>({
        tag: 'PutTieuChiMinhChungModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const toggleCommentRow = (recordId: string) => {
        setExpandedRowKeys((prev) =>
            prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
        )
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

                return (
                    <div key={item.id} className="ml-4 mb-6">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-base flex items-center gap-2">
                                <span className="font-bold">Tiêu chí {idx + 1}: </span>
                                <span>{item?.name}</span>
                                <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
                            </div>
                            <div className="flex gap-2">
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

                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpen({
                                            analysisCriterionId: item.analysisCriterions?.id,
                                        })
                                    }
                                >
                                    Thêm mới
                                </Button>
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
                                        title: 'Thông tin, minh chứng',
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
                                                    <EditIcon
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onOpen({
                                                                id: record.id,
                                                                analysisCriterionId:
                                                                    record.analysisCriterionId,
                                                            })
                                                        }}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
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
                                            <div className="px-4 py-3">
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
