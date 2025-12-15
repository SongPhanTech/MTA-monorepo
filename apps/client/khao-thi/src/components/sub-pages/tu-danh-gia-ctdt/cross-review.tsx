import { getDeadlineStatus } from '@/utils/getDeadlineStatus'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import CommentList from '@components/commons/comment-list'
import { getStatusConfig } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import { $Enums, type CriterionPeriod, type EvaluationCriterion } from '@workspace/db/client'
import type { DataTabCrossReviewType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review'
import {
    useFindFirstEvaluationCouncilMember,
    useFindUniqueLecturer,
    useUpdateEvaluationPeriod,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Button, Collapse, Form, message, Card, Tag, Badge } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
    opening: string
    conclusion: string
}

export default function CrossReviewSubPage({
    data,
    onRefetch,
    role,
}: {
    data: DataTabCrossReviewType
    onRefetch: () => void
    role: 'P13' | 'REVIEWER'
}) {
    const [form] = Form.useForm<PutRequirementCriterion>()
    const [commentForm] = Form.useForm<{ crossReview: string }>()
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '97edb89d-9803-45b9-ac83-e81125dd59c4'

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

    const { data: councilMember } = useFindFirstEvaluationCouncilMember(
        {
            where: {
                lecturerId: lecturer?.id || '',
                evaluationCouncil: {
                    periodId: selectedEvaluationPeriodId || '',
                },
            },
            include: {
                evaluationCouncil: true,
            },
        },
        {
            enabled: !!lecturer?.id && !!selectedEvaluationPeriodId,
        }
    )

    const isCouncilMember = !!councilMember

    const { hideSpinner, showSpinner } = useSpinner()
    const [showComments, setShowComments] = useState(false)

    const handleSendCrossReview = async () => {
        try {
            const values = await commentForm.validateFields()

            if (!values.crossReview) {
                message.error('Vui lòng nhập ý kiến phản biện')
                return
            }

            showSpinner()

            const criteriaWithEvaluation = data.criteria.filter(
                (criterion) => criterion.evaluationCriterion
            )

            const listSqlTransaction: any[] = []

            for (const criterion of criteriaWithEvaluation) {
                if (criterion.evaluationCriterion) {
                    listSqlTransaction.push({
                        model: 'EvaluationCriterionComment',
                        operation: 'create',
                        data: {
                            data: {
                                reviewerId: idProfile,
                                evaluationCriterionId: criterion.evaluationCriterion.id,
                                content: values.crossReview,
                            },
                        },
                    })

                    listSqlTransaction.push({
                        model: 'EvaluationCriterion',
                        operation: 'update',
                        data: {
                            where: {
                                id: criterion.evaluationCriterion.id,
                            },
                            data: {
                                status: $Enums.EvaluationStatus.REVISION,
                            },
                        },
                    })
                }
            }

            const res = await sqlTransaction(listSqlTransaction)
            if (res.status !== 200) {
                message.error('Có lỗi xảy ra, vui lòng thử lại')
                return
            }

            message.success('Gửi ý kiến phản biện thành công')
            commentForm.resetFields()
            onRefetch()
        } catch (error) {
            message.error('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

    const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()

    const checkAndUpdateEvaluationPeriodStatus = async () => {
        if (!selectedEvaluationPeriodId) return

        try {
            const totalCriteria = await sqlTransaction([
                {
                    model: 'EvaluationCriterion',
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

            const submittedEvaluationCriterion = await sqlTransaction([
                {
                    model: 'EvaluationCriterion',
                    operation: 'count',
                    data: {
                        where: {
                            criterionPeriod: {
                                evaluationStandard: {
                                    periodId: selectedEvaluationPeriodId,
                                },
                            },
                            status: $Enums.EvaluationStatus.APPROVED,
                            deletedAt: null,
                        },
                    },
                },
            ])

            if (
                (totalCriteria.data[0] as number) > 0 &&
                totalCriteria.data[0] === submittedEvaluationCriterion.data[0]
            ) {
                await updateEvaluationPeriod({
                    where: {
                        id: selectedEvaluationPeriodId,
                    },
                    data: {
                        status: $Enums.EvaluationPeriodStatus.CONSOLIDATION,
                    },
                })
            }
        } catch (error) {
            console.error('Error updating evaluation period status:', error)
        }
    }

    const handleSubmitCross = async () => {
        try {
            showSpinner()
            const dataSubmit = form.getFieldsValue()

            let listSqlTransaction: any[] = []

            if (dataSubmit.criteria && dataSubmit.criteria.length > 0) {
                listSqlTransaction = [
                    ...dataSubmit.criteria.map(
                        (
                            i: CriterionPeriod & {
                                evaluationCriterion: EvaluationCriterion
                            }
                        ) => {
                            return {
                                model: 'EvaluationCriterion',
                                operation: 'update',
                                data: {
                                    where: {
                                        id: i.evaluationCriterion.id,
                                        criterionPeriodId: i.evaluationCriterion.criterionPeriodId,
                                    },
                                    data: {
                                        status: $Enums.EvaluationStatus.APPROVED,
                                    },
                                },
                            }
                        }
                    ),
                ]
            }

            const res = await sqlTransaction(listSqlTransaction)

            if (res.status !== 200) {
                message.error('Có lỗi xảy ra, vui lòng thử lại')
                return
            }

            await checkAndUpdateEvaluationPeriodStatus()

            message.success('Phê duyệt thành công')
            onRefetch()
        } catch (error) {
            message.error('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                opening: data?.opening || '',
                conclusion: data?.conclusion || '',
                criteria: data?.criteria?.map((item) => ({
                    ...item,
                    evaluationCriterion: {
                        id: item.evaluationCriterion?.id,
                        criterionPeriodId: item.evaluationCriterion?.criterionPeriodId,
                        currentSituation: item.evaluationCriterion?.currentSituation || '',
                        strengths: item.evaluationCriterion?.strengths || '',
                        weakness: item.evaluationCriterion?.weakness || '',
                        actionPlan: item.evaluationCriterion?.actionPlan || '',
                    },
                })),
            })
        }
    }, [data, form])

    const firstEvaluationCriterion = data.criteria.find(
        (c) => c.evaluationCriterion
    )?.evaluationCriterion
    const evaluatorName = firstEvaluationCriterion?.lecturer?.userProfile?.fullname
    const reviewDeadline = firstEvaluationCriterion?.deadlineReview
    const deadlineStatus = reviewDeadline ? getDeadlineStatus(reviewDeadline) : null
    const status = firstEvaluationCriterion?.status
    const statusConfig = getStatusConfig(status || $Enums.EvaluationStatus.LOCK)
    const commentsCount = firstEvaluationCriterion?.evaluationCriterionComments?.length || 0

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="sticky top-0 z-10 bg-white py-2 flex flex-row justify-between items-center gap-2">
                <div className="flex flex-row gap-4 items-center text-xs">
                    <div className="flex items-center gap-1">
                        {evaluatorName && (
                            <span className="text-sm text-gray-500">
                                Người viết đánh giá: {evaluatorName}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {reviewDeadline && deadlineStatus && deadlineStatus.text && (
                            <Tag color={deadlineStatus.color}>
                                Hạn phản biện: {dayjs(reviewDeadline).format('DD/MM/YYYY')}
                                {deadlineStatus.text && ` (${deadlineStatus.text})`}
                            </Tag>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">Trạng thái:</span>
                        <Tag color={statusConfig.color} className="text-xs">
                            {statusConfig.text}
                        </Tag>
                    </div>
                </div>

                <div className="flex gap-2 mr-2">
                    {role === 'P13' ? (
                        <Badge count={commentsCount} showZero offset={[-5, 5]}>
                            <Button
                                type="primary"
                                className="bg-yellow-400"
                                size="small"
                                onClick={() => setShowComments(!showComments)}
                            >
                                Xem đánh giá
                            </Button>
                        </Badge>
                    ) : (
                        isCouncilMember &&
                        status !== $Enums.EvaluationStatus.APPROVED &&
                        status !== $Enums.EvaluationStatus.COMPLETED && (
                            <>
                                <Button
                                    type="primary"
                                    size="small"
                                    className="bg-yellow-400"
                                    onClick={() => setShowComments(!showComments)}
                                >
                                    Gửi ý kiến phản biện
                                </Button>
                                <Button type="primary" size="small" onClick={handleSubmitCross}>
                                    Phê duyệt
                                </Button>
                            </>
                        )
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
                <Form form={form} layout="vertical" className="form-evidence">
                    {/* Phần mở đầu */}
                    <Form.Item label="Mở đầu" name="opening">
                        <RichTextEditor id="opening" editable={false} />
                    </Form.Item>

                    <Form.List name="criteria">
                        {(fields) => (
                            <>
                                {fields.map(({ key, name }, idx: number) => {
                                    const item = data.criteria[name]
                                    return (
                                        <div key={key} style={{ marginBottom: 24 }}>
                                            <Collapse
                                                items={[
                                                    {
                                                        label: (
                                                            <div>
                                                                <span className="font-bold">
                                                                    Tiêu chí {item.order}:{' '}
                                                                </span>
                                                                {item?.name}
                                                            </div>
                                                        ),
                                                        key: item.id,
                                                        children: (
                                                            <>
                                                                <Form.Item
                                                                    label="1. Mô tả hiện trạng"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'currentSituation',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={false}
                                                                    />
                                                                </Form.Item>

                                                                <Form.Item
                                                                    label="2. Điểm mạnh"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'strengths',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={false}
                                                                    />
                                                                </Form.Item>

                                                                <Form.Item
                                                                    label="3. Điểm tồn tại"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'weakness',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={false}
                                                                    />
                                                                </Form.Item>

                                                                <Form.Item
                                                                    label="4. Kế hoạch hành động"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'actionPlan',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={false}
                                                                    />
                                                                </Form.Item>
                                                                {/* <div className="mb-3 font-bold">
                                                                5. Tự đánh giá
                                                            </div> */}
                                                            </>
                                                        ),
                                                    },
                                                ]}
                                                bordered={true}
                                                expandIconPosition="end"
                                                className="bg-transparent mb-6"
                                            />
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </Form.List>

                    {/* Phần kết luận */}
                    <Form.Item label="Kết luận" name="conclusion">
                        <RichTextEditor id="conclusion" editable={false} />
                    </Form.Item>
                </Form>

                {showComments && (
                    <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                        <Card>
                            {firstEvaluationCriterion?.evaluationCriterionComments &&
                                firstEvaluationCriterion.evaluationCriterionComments.length > 0 && (
                                    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                                        <CommentList
                                            comments={
                                                firstEvaluationCriterion.evaluationCriterionComments
                                            }
                                        />
                                    </div>
                                )}
                            {role !== 'P13' && isCouncilMember && (
                                <Form form={commentForm} layout="vertical">
                                    <Form.Item
                                        label="Gửi ý kiến phản biện"
                                        name="crossReview"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Vui lòng nhập ý kiến phản biện',
                                            },
                                        ]}
                                    >
                                        <RichTextEditor editable={isCouncilMember} />
                                    </Form.Item>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={() => {
                                                commentForm.resetFields()
                                                setShowComments(false)
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            type="primary"
                                            onClick={() => {
                                                handleSendCrossReview()
                                                setShowComments(false)
                                            }}
                                        >
                                            Gửi ý kiến
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
