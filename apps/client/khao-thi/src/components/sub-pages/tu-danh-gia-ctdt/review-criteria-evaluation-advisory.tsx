import { getDeadlineStatus } from '@/utils/getDeadlineStatus'
import CommentList from '@components/commons/comment-list'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import { getStatusConfig } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { DataReviewCriteriaEvaluationType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-evaluation'
import { useSession } from '@workspace/auth/react'
import { $Enums, type CriterionPeriod, type EvaluationCriterion } from '@workspace/db/client'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Badge, Button, Card, Collapse, Form, message, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
}

const ReviewCriteriaEvaluationAdvisorySubpage = ({
    data,
    onRefetch,
}: {
    data: DataReviewCriteriaEvaluationType
    onRefetch: () => void
}) => {
    const { hideSpinner, showSpinner } = useSpinner()
    const [showCommentsCriterionId, setShowCommentsCriterionId] = useState<string | null>(null)

    const [form] = Form.useForm<PutRequirementCriterion>()
    const [commentForm] = Form.useForm<{ crossReview: string }>()

    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'f1218263-341e-40c4-b269-a711a0186c74'

    const handleSendCrossReview = async (evaluationCriterionId: string) => {
        try {
            const values = await commentForm.validateFields()

            if (!values.crossReview) {
                message.error('Vui lòng nhập ý kiến phản biện')
                return
            }

            showSpinner()

            const listSqlTransaction: any[] = [
                {
                    model: 'EvaluationCriterionComment',
                    operation: 'create',
                    data: {
                        data: {
                            reviewerId: idProfile,
                            evaluationCriterionId: evaluationCriterionId,
                            content: values.crossReview,
                        },
                    },
                },
                {
                    model: 'EvaluationCriterion',
                    operation: 'update',
                    data: {
                        where: {
                            id: evaluationCriterionId,
                        },
                        data: {
                            status: $Enums.EvaluationStatus.REVISION,
                        },
                    },
                },
            ]

            const res = await sqlTransaction(listSqlTransaction)
            if (res.status !== 200) {
                message.error('Có lỗi xảy ra, vui lòng thử lại')
                return
            }

            message.success('Gửi ý kiến phản biện thành công')
            commentForm.resetFields()
            setShowCommentsCriterionId(null)
            onRefetch()
        } catch (error) {
            message.error('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            hideSpinner()
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
                                        status: $Enums.EvaluationStatus.COMPLETED,
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
                criteria: data?.criteria?.map((item) => ({
                    ...item,
                    evaluationCriterion: {
                        id: item.evaluationCriterion?.id,
                        criterionPeriodId: item.evaluationCriterion?.criterionPeriodId,
                        currentSituation: item.evaluationCriterion?.currentSituation || '',
                        strengths: item.evaluationCriterion?.strengths || '',
                        weakness: item.evaluationCriterion?.weakness || '',
                        actionPlan: item.evaluationCriterion?.actionPlan || '',
                        score: item.evaluationCriterion?.score || '',
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

                {status !== $Enums.EvaluationStatus.PENDING &&
                    status !== $Enums.EvaluationStatus.COMPLETED && (
                        <div className="flex gap-2 mr-2">
                            <Button type="primary" size="small" onClick={handleSubmitCross}>
                                Phê duyệt
                            </Button>
                        </div>
                    )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
                <Form form={form} layout="vertical" className="form-evidence">
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
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">
                                                                    Tiêu chí {data.order}.
                                                                    {item.order}:{' '}
                                                                </span>
                                                                <span>{item?.name}</span>
                                                                {item.evaluationCriterion
                                                                    ?.evaluationCriterionComments &&
                                                                    item.evaluationCriterion
                                                                        .evaluationCriterionComments
                                                                        .length > 0 && (
                                                                        <Badge
                                                                            count={
                                                                                item
                                                                                    .evaluationCriterion
                                                                                    .evaluationCriterionComments
                                                                                    .length
                                                                            }
                                                                            style={{
                                                                                backgroundColor:
                                                                                    '#faad14',
                                                                            }}
                                                                        />
                                                                    )}
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
                                                                <Form.Item
                                                                    label="5. Tự đánh giá"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'score',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={false}
                                                                    />
                                                                </Form.Item>

                                                                {item.evaluationCriterion && (
                                                                    <>
                                                                        {status !==
                                                                            $Enums.EvaluationStatus
                                                                                .PENDING &&
                                                                            status !==
                                                                                $Enums
                                                                                    .EvaluationStatus
                                                                                    .COMPLETED && (
                                                                                <div className="flex justify-end mb-4">
                                                                                    <Button
                                                                                        type="primary"
                                                                                        size="small"
                                                                                        className="bg-yellow-400"
                                                                                        onClick={() =>
                                                                                            setShowCommentsCriterionId(
                                                                                                showCommentsCriterionId ===
                                                                                                    item
                                                                                                        .evaluationCriterion
                                                                                                        ?.id
                                                                                                    ? null
                                                                                                    : item
                                                                                                          .evaluationCriterion
                                                                                                          ?.id ||
                                                                                                          null
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        {showCommentsCriterionId ===
                                                                                        item
                                                                                            .evaluationCriterion
                                                                                            ?.id
                                                                                            ? 'Đóng'
                                                                                            : 'Gửi ý kiến phản biện'}
                                                                                    </Button>
                                                                                </div>
                                                                            )}

                                                                        {showCommentsCriterionId ===
                                                                            item.evaluationCriterion
                                                                                ?.id && (
                                                                            <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                                                                                <Card>
                                                                                    {item
                                                                                        .evaluationCriterion
                                                                                        ?.evaluationCriterionComments &&
                                                                                        item
                                                                                            .evaluationCriterion
                                                                                            .evaluationCriterionComments
                                                                                            .length >
                                                                                            0 && (
                                                                                            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                                                                                                <CommentList
                                                                                                    comments={
                                                                                                        item
                                                                                                            .evaluationCriterion
                                                                                                            .evaluationCriterionComments
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                        )}

                                                                                    <Form
                                                                                        form={
                                                                                            commentForm
                                                                                        }
                                                                                        layout="vertical"
                                                                                    >
                                                                                        <Form.Item
                                                                                            label="Gửi ý kiến phản biện"
                                                                                            name="crossReview"
                                                                                            rules={[
                                                                                                {
                                                                                                    required: true,
                                                                                                    message:
                                                                                                        'Vui lòng nhập ý kiến phản biện',
                                                                                                },
                                                                                            ]}
                                                                                        >
                                                                                            <RichTextEditor />
                                                                                        </Form.Item>
                                                                                        <div className="flex justify-end gap-2">
                                                                                            <Button
                                                                                                onClick={() => {
                                                                                                    commentForm.resetFields()
                                                                                                    setShowCommentsCriterionId(
                                                                                                        null
                                                                                                    )
                                                                                                }}
                                                                                            >
                                                                                                Hủy
                                                                                            </Button>
                                                                                            <Button
                                                                                                type="primary"
                                                                                                onClick={() => {
                                                                                                    if (
                                                                                                        item
                                                                                                            .evaluationCriterion
                                                                                                            ?.id
                                                                                                    ) {
                                                                                                        handleSendCrossReview(
                                                                                                            item
                                                                                                                .evaluationCriterion
                                                                                                                .id
                                                                                                        )
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                Gửi
                                                                                                ý
                                                                                                kiến
                                                                                            </Button>
                                                                                        </div>
                                                                                    </Form>
                                                                                </Card>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
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
                </Form>
            </div>
        </div>
    )
}

export default ReviewCriteriaEvaluationAdvisorySubpage
