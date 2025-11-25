import { getDeadlineStatus } from '@/utils/getDeadlineStatus'
import CommentList from '@components/commons/comment-list'
import DatePicker from '@components/commons/date-picker'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import ApproveIcon from '@components/icons/approve'
import { DEADLINE_OPTIONS, getStatusEvaluation } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { formatDate } from '@lib/utils'
import type { ReviewDataTabType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/review-criteria-analysis'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from '@workspace/db'
import { $Enums } from '@workspace/db/client'
import {
    useCreateEvaluationCriterionComment,
    useUpdateAnalysisCriterion,
    useUpdateEvaluationCriterion,
    useUpdateEvaluationPeriod,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Empty, Form, message, Popconfirm, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { SquareX } from 'lucide-react'
import { useState } from 'react'

type CommentType = {
    comment: Record<
        string,
        {
            content?: string
            newDeadline?: Date
        }
    >
}

type Props = {
    data: ReviewDataTabType
    idx: number
    role: 'BAN_TU_VAN' | 'THU_KY'
}

const ReviewCriteriaAnalysisSubPage = ({ data, idx, role = 'BAN_TU_VAN' }: Props) => {
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
    const [deadlineFilter, setDeadlineFilter] = useState<string | null>(null)
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const { showSpinner, hideSpinner } = useSpinner()
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '97edb89d-9803-45b9-ac83-e81125dd59c4'
    const { can } = useAbility()
    const [form] = Form.useForm<CommentType>()

    const filteredCriteria = data?.criteria?.filter((item) => {
        if (!item.analysisCriterions) return false

        if (deadlineFilter && item.analysisCriterions.deadline) {
            const now = dayjs()
            const deadlineDate = dayjs(item.analysisCriterions.deadline)
            const daysUntilDeadline = deadlineDate.diff(now, 'day')

            if (deadlineFilter === 'overdue' && daysUntilDeadline >= 0) return false
            if (deadlineFilter === 'near' && (daysUntilDeadline < 0 || daysUntilDeadline > 3))
                return false
        } else if (deadlineFilter && !item.analysisCriterions.deadline) {
            return false
        }

        return true
    })

    const toggleCommentRow = (recordId: string) => {
        setExpandedRowKeys((prev) =>
            prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
        )
    }

    const { mutateAsync: updateAnalysisCriterion } = useUpdateAnalysisCriterion()
    const { mutateAsync: createEvaluationCriterionComment } = useCreateEvaluationCriterionComment()
    const { mutateAsync: updateEvaluationCriterion } = useUpdateEvaluationCriterion()
    const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()

    const handleCheckAndChangeStatus = async () => {
        if (!selectedEvaluationPeriodId) return
        try {
            const totalCriteria = await sqlTransaction([
                {
                    model: 'AnalysisCriterion',
                    operation: 'count',
                    data: {
                        where: {
                            criterionPeriod: {
                                evaluationStandard: {
                                    periodId: selectedEvaluationPeriodId,
                                },
                            },
                            deletedAt: null,
                        },
                    },
                },
            ])

            const checkStatus =
                role === 'BAN_TU_VAN'
                    ? $Enums.EvaluationCriterionStatus.APPROVED
                    : $Enums.EvaluationCriterionStatus.COMPLETED

            const submittedCriteria = await sqlTransaction([
                {
                    model: 'AnalysisCriterion',
                    operation: 'count',
                    data: {
                        where: {
                            criterionPeriod: {
                                evaluationStandard: {
                                    periodId: selectedEvaluationPeriodId,
                                },
                            },
                            status: checkStatus,
                            deletedAt: null,
                        },
                    },
                },
            ])

            if (
                (totalCriteria.data[0] as number) > 0 &&
                totalCriteria.data[0] === submittedCriteria.data[0]
            ) {
                const newStatus =
                    role === 'BAN_TU_VAN'
                        ? $Enums.EvaluationPeriodStatus.DIRECTOR_REVIEW
                        : $Enums.EvaluationPeriodStatus.EVALUATION_WRITING

                await updateEvaluationPeriod({
                    where: {
                        id: selectedEvaluationPeriodId,
                    },
                    data: {
                        status: newStatus,
                    },
                })
            }
        } catch (error) {
            console.error('Error updating evaluation period status:', error)
        }
    }

    const handleApproveCriterionAnalysis = async (analysisCriterionId: string) => {
        try {
            showSpinner()
            await updateAnalysisCriterion({
                where: {
                    id: analysisCriterionId,
                },
                data: {
                    status: $Enums.EvaluationCriterionStatus.APPROVED,
                },
            })

            await handleCheckAndChangeStatus()

            message.success('Phê duyệt tiêu chí thành công')
        } catch (error) {
            message.error('Phê duyệt tiêu chí thất bại, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

    const handleRejectCriterionAnalysis = async (
        analysisCriterionId: string,
        requirementCriterionId: string,
        isOverdue: boolean
    ) => {
        try {
            const values = await form.validateFields()
            if (!values) return
            showSpinner()

            const commentData = values.comment[requirementCriterionId]

            const filteredCommentData = Object.entries(commentData).reduce(
                (acc, [key, value]) => {
                    if (value !== undefined && value !== null) {
                        acc[key] = value
                    }
                    return acc
                },
                {} as Record<string, any>
            )

            const updateData: {
                status: $Enums.EvaluationCriterionStatus
                deadline?: string
            } = {
                status: $Enums.EvaluationCriterionStatus.REVISION,
            }

            if (isOverdue && filteredCommentData?.newDeadline) {
                updateData.deadline = dayjs(filteredCommentData.newDeadline).toISOString()
            }

            await updateAnalysisCriterion({
                where: {
                    id: analysisCriterionId,
                },
                data: updateData,
            })

            await createEvaluationCriterionComment({
                data: {
                    reviewerId: idProfile,
                    requirementCriterionId: requirementCriterionId,
                    analysisCriterionId: analysisCriterionId,
                    content: filteredCommentData?.content,
                },
            })

            form.resetFields()
            toggleCommentRow(requirementCriterionId)
            message.success('Gửi yêu cầu chỉnh sửa tiêu chí thành công')
        } catch (error) {
            message.error('Gửi yêu cầu chỉnh sửa tiêu chí thất bại, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

    const handleApproveCriterionAnalysisFinal = async (
        analysisCriterionId: string,
        criterionPeriodId: string
    ) => {
        try {
            showSpinner()
            await updateAnalysisCriterion({
                where: {
                    id: analysisCriterionId,
                },
                data: {
                    status: $Enums.EvaluationCriterionStatus.COMPLETED,
                },
            })

            await handleCheckAndChangeStatus()

            await updateEvaluationCriterion({
                where: {
                    criterionPeriodId: criterionPeriodId,
                },
                data: {
                    status: $Enums.EvaluationStatus.PENDING,
                },
            })

            message.success('Phê duyệt tiêu chí thành công')
        } catch (error) {
            message.error('Phê duyệt tiêu chí thất bại, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

    const handleSubmitedAll = async () => {
        try {
            showSpinner()

            if (!filteredCriteria || filteredCriteria.length === 0) {
                message.warning('Không có tiêu chí nào để phê duyệt')
                return
            }

            const approvableCriteria = filteredCriteria.filter((item) => {
                const status = item.analysisCriterions?.status

                if (role === 'BAN_TU_VAN') {
                    return (
                        status !== $Enums.EvaluationCriterionStatus.APPROVED &&
                        status !== $Enums.EvaluationCriterionStatus.COMPLETED
                    )
                }

                if (role === 'THU_KY') {
                    return status === $Enums.EvaluationCriterionStatus.APPROVED
                }

                return false
            })

            if (approvableCriteria.length === 0) {
                message.warning('Không có tiêu chí nào đủ điều kiện để phê duyệt')
                return
            }

            if (role === 'BAN_TU_VAN') {
                await Promise.all(
                    approvableCriteria
                        .filter((item) => item.analysisCriterions?.id)
                        .map((item) =>
                            updateAnalysisCriterion({
                                where: {
                                    id: item.analysisCriterions?.id as string,
                                },
                                data: {
                                    status: $Enums.EvaluationCriterionStatus.APPROVED,
                                },
                            })
                        )
                )
            } else if (role === 'THU_KY') {
                await Promise.all(
                    approvableCriteria
                        .filter((item) => item.analysisCriterions?.id)
                        .map((item) =>
                            Promise.all([
                                updateAnalysisCriterion({
                                    where: {
                                        id: item.analysisCriterions?.id as string,
                                    },
                                    data: {
                                        status: $Enums.EvaluationCriterionStatus.COMPLETED,
                                    },
                                }),
                                updateEvaluationCriterion({
                                    where: {
                                        criterionPeriodId: item.id,
                                    },
                                    data: {
                                        status: $Enums.EvaluationStatus.PENDING,
                                    },
                                }),
                            ])
                        )
                )
            }

            await handleCheckAndChangeStatus()

            message.success(`Phê duyệt thành công ${approvableCriteria.length} tiêu chí`)
        } catch (error) {
            message.error('Phê duyệt tiêu chí thất bại. Vui lòng thử lại.')
            console.error('Error approving all criteria:', error)
        } finally {
            hideSpinner()
        }
    }

    return (
        <div className="h-[calc(100vh-200px)] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="text-base">
                    <span className="font-bold">Tiêu chuẩn {idx}: </span>
                    <span>{data?.name}</span>
                </div>
                <div className="flex gap-2">
                    <Select
                        allowClear
                        placeholder="Lọc theo hạn"
                        style={{ width: 150, height: 27 }}
                        options={DEADLINE_OPTIONS}
                        value={deadlineFilter}
                        onChange={(value) => setDeadlineFilter(value)}
                    />
                    {can(
                        KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                        'DUYET'
                    ) && (
                        <Popconfirm
                            title="Xác nhận phê duyệt tất cả tiêu chí?"
                            description="Bạn có chắc chắn muốn phê duyệt tất cả tiêu chí này?"
                            onConfirm={handleSubmitedAll}
                            okText="Đồng ý"
                            cancelText="Hủy"
                            placement="topRight"
                        >
                            <Button type="primary" size="small">
                                Phê duyệt tất cả
                            </Button>
                        </Popconfirm>
                    )}
                </div>
            </div>
            {!filteredCriteria || filteredCriteria.length === 0 ? (
                <div className="flex items-center justify-center h-[calc(100%-50px)]">
                    <Empty description="Không có dữ liệu" />
                </div>
            ) : (
                filteredCriteria?.map((item, idx: number) => {
                    return (
                        <div key={item.id} className="ml-4 mb-6">
                            <div className="mb-3">
                                <div className="text-base">
                                    <span className="font-bold">Tiêu chí {idx + 1}: </span>
                                    <span>{item?.name}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="text-sm text-gray-600">
                                        Người thực hiện:{' '}
                                        {item?.analysisCriterions?.lecturer?.userProfile
                                            ?.fullname || 'Chưa phân công'}
                                    </span>

                                    {item?.analysisCriterions?.deadline && (
                                        <Tag
                                            color={
                                                getDeadlineStatus(item.analysisCriterions.deadline)
                                                    .color
                                            }
                                        >
                                            Hạn: {formatDate(item.analysisCriterions.deadline)}
                                            {getDeadlineStatus(item.analysisCriterions.deadline)
                                                .text &&
                                                ` (${getDeadlineStatus(item.analysisCriterions.deadline).text})`}
                                        </Tag>
                                    )}
                                    {item?.analysisCriterions?.status && (
                                        <Tag
                                            color={
                                                getStatusEvaluation(item.analysisCriterions.status)
                                                    ?.color
                                            }
                                        >
                                            {
                                                getStatusEvaluation(item.analysisCriterions.status)
                                                    ?.label
                                            }
                                        </Tag>
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
                                                    align: 'left',
                                                },
                                                {
                                                    title: 'Các câu hỏi đặt ra',
                                                    dataIndex: 'questions',
                                                    width: 200,
                                                    align: 'left',
                                                    render: (questions: string[]) => {
                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                {questions?.map(
                                                                    (question: string) => {
                                                                        return (
                                                                            <div key={question}>
                                                                                - {question}
                                                                            </div>
                                                                        )
                                                                    }
                                                                )}
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
                                                            <div className="flex flex-col gap-1">
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
                                                                                    evidence
                                                                                        ?.evidence
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
                                            hidden:
                                                item.analysisCriterions?.status ===
                                                    $Enums.EvaluationCriterionStatus.COMPLETED ||
                                                (role === 'BAN_TU_VAN' &&
                                                    item.analysisCriterions?.status ===
                                                        $Enums.EvaluationCriterionStatus
                                                            .APPROVED) ||
                                                (role === 'THU_KY' &&
                                                    item.analysisCriterions?.status !==
                                                        $Enums.EvaluationCriterionStatus
                                                            .APPROVED) ||
                                                !can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                                                    'DUYET'
                                                ),
                                            render: (__, record) => {
                                                return (
                                                    <div className="flex gap-2 items-center justify-center">
                                                        {can(
                                                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                                                            'DUYET'
                                                        ) && (
                                                            <>
                                                                {role === 'BAN_TU_VAN' && (
                                                                    <ApproveIcon
                                                                        popConfirm={{
                                                                            onConfirm: (e) => {
                                                                                e?.stopPropagation()
                                                                                handleApproveCriterionAnalysis(
                                                                                    record.analysisCriterionId
                                                                                )
                                                                            },
                                                                            onCancel: (e) => {
                                                                                e?.stopPropagation()
                                                                            },
                                                                        }}
                                                                    />
                                                                )}

                                                                {role === 'THU_KY' && (
                                                                    <ApproveIcon
                                                                        popConfirm={{
                                                                            onConfirm: (e) => {
                                                                                e?.stopPropagation()
                                                                                handleApproveCriterionAnalysisFinal(
                                                                                    record.analysisCriterionId,
                                                                                    item.id
                                                                                )
                                                                            },
                                                                            onCancel: (e) => {
                                                                                e?.stopPropagation()
                                                                            },
                                                                        }}
                                                                    />
                                                                )}
                                                            </>
                                                        )}

                                                        {can(
                                                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                                                            'DUYET'
                                                        ) && (
                                                            <Tooltip title="Yêu cầu chỉnh sửa">
                                                                <SquareX
                                                                    size={16}
                                                                    strokeWidth={1.5}
                                                                    className={
                                                                        'text-red-600 cursor-pointer'
                                                                    }
                                                                    onClick={() => {
                                                                        toggleCommentRow(record.id)
                                                                    }}
                                                                />
                                                            </Tooltip>
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
                                            const deadline = item?.analysisCriterions?.deadline
                                            const isOverdue =
                                                deadline && dayjs(deadline).diff(dayjs(), 'day') < 0

                                            const previousComments =
                                                record?.evaluationCriterionComment || []

                                            return (
                                                <div className="space-y-4">
                                                    {previousComments.length > 0 && (
                                                        <CommentList comments={previousComments} />
                                                    )}

                                                    <Form form={form} layout="vertical">
                                                        <Form.Item
                                                            label="Yêu cầu chỉnh sửa"
                                                            name={['comment', record.id, 'content']}
                                                            rules={[
                                                                {
                                                                    required: true,
                                                                    message:
                                                                        'Vui lòng nhập yêu cầu chỉnh sửa',
                                                                },
                                                            ]}
                                                        >
                                                            <RichTextEditor />
                                                        </Form.Item>
                                                        {isOverdue && (
                                                            <Form.Item
                                                                label="Gia hạn mới"
                                                                name={[
                                                                    'comment',
                                                                    record.id,
                                                                    'newDeadline',
                                                                ]}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message:
                                                                            'Vui lòng chọn ngày gia hạn mới',
                                                                    },
                                                                ]}
                                                            >
                                                                <DatePicker
                                                                    format="DD/MM/YYYY"
                                                                    placeholder="Chọn ngày gia hạn"
                                                                    disabledDate={(current) =>
                                                                        current &&
                                                                        current <
                                                                            dayjs().startOf('day')
                                                                    }
                                                                    className="w-full"
                                                                />
                                                            </Form.Item>
                                                        )}
                                                        <div className="flex justify-end gap-2 mt-2">
                                                            <Button
                                                                onClick={() => {
                                                                    form.resetFields()
                                                                    toggleCommentRow(record.id)
                                                                }}
                                                            >
                                                                Hủy
                                                            </Button>
                                                            <Button
                                                                type="primary"
                                                                onClick={() =>
                                                                    handleRejectCriterionAnalysis(
                                                                        record.analysisCriterionId,
                                                                        record.id,
                                                                        !!isOverdue
                                                                    )
                                                                }
                                                            >
                                                                Gửi yêu cầu
                                                            </Button>
                                                        </div>
                                                    </Form>
                                                </div>
                                            )
                                        },
                                        rowExpandable: (record) =>
                                            expandedRowKeys.includes(record.id) ||
                                            (record?.evaluationCriterionComment?.length || 0) > 0,
                                        onExpand: (expanded, record) => {
                                            toggleCommentRow(record.id)
                                        },
                                        expandIconColumnIndex: -1,
                                    }}
                                />
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    )
}

export default ReviewCriteriaAnalysisSubPage
