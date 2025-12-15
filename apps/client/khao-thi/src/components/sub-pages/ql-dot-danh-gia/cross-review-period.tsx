import { getDeadlineStatus } from '@/utils/getDeadlineStatus'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import CommentList from '@components/commons/comment-list'
import { getStatusConfig } from '@constants/constants'
import { $Enums } from '@workspace/db/client'
import { Button, Collapse, Form, Card, Tag, Badge } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import type { DataTabCrossReviewPeriodType } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/cross-review'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
    opening: string
    conclusion: string
}

export default function CrossReviewPeriodSubPage({ data }: { data: DataTabCrossReviewPeriodType }) {
    const [showComments, setShowComments] = useState(false)
    const [form] = Form.useForm<PutRequirementCriterion>()
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
    const reviewerName = firstEvaluationCriterion?.reviewer?.lecturer?.userProfile?.fullname
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
                        {reviewerName && (
                            <span className="text-sm text-gray-500">
                                Người phản biện: {reviewerName}
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
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
