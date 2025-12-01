import { RichTextEditor } from '@components/commons/rich-text-editor'
import { Collapse, Form, Tag, Button, Badge } from 'antd'
import { useEffect, useState } from 'react'
import { $Enums } from '@workspace/db/client'
import dayjs from 'dayjs'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import { getStatusConfig } from '@constants/constants'
import { getDeadlineStatus } from '@/utils/getDeadlineStatus'
import CommentList from '@components/commons/comment-list'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
    opening: string
    conclusion: string
}

export default function CriteriaEvaluationListSubPage({
    data,
}: {
    data: DataTabEvaluationCriterionType
}) {
    const [form] = Form.useForm<PutRequirementCriterion>()
    const [showComments, setShowComments] = useState<Record<string, boolean>>({})

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

    const groupedCriteria = data?.criteria?.reduce(
        (acc, criterion, index) => {
            const lecturerName =
                criterion?.evaluationCriterion?.lecturer?.userProfile?.fullname || 'unassigned'
            if (!acc[lecturerName]) {
                acc[lecturerName] = {
                    lecturer: criterion?.evaluationCriterion?.lecturer,
                    status: criterion?.evaluationCriterion?.status,
                    deadline: criterion?.evaluationCriterion?.deadline,
                    criteria: [],
                }
            }
            acc[lecturerName].criteria.push({ ...criterion, originalIndex: index })
            return acc
        },
        {} as Record<string, any>
    )

    const renderLecturerSection = (lecturerId: string, group: any) => {
        const statusConfig = getStatusConfig(group.status || $Enums.EvaluationStatus.LOCK)
        const deadline = group.deadline
        const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null

        const commentsCount =
            group.criteria?.[0]?.evaluationCriterion?.evaluationCriterionComments?.length || 0

        return (
            <div key={lecturerId}>
                <div className="sticky top-0 z-10 bg-white py-2 flex flex-row justify-between items-center gap-2">
                    <div className="flex flex-row gap-4 items-center text-xs">
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">
                                Người viết phiếu:{' '}
                                {group.lecturer?.userProfile?.fullname || 'Chưa phân công'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {deadline && deadlineStatus && deadlineStatus.text && (
                                <Tag color={deadlineStatus.color}>
                                    Hạn: {dayjs(deadline).format('DD/MM/YYYY')}
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
                                onClick={() =>
                                    setShowComments((prev) => ({
                                        ...prev,
                                        [lecturerId]: !prev[lecturerId],
                                    }))
                                }
                            >
                                Xem đánh giá
                            </Button>
                        </Badge>
                    </div>
                </div>

                {showComments[lecturerId] && (
                    <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                        <CommentList
                            comments={
                                group.criteria?.[0]?.evaluationCriterion
                                    ?.evaluationCriterionComments || []
                            }
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            {Object.entries(groupedCriteria || {}).map(([lecturerId, group]: [string, any]) =>
                renderLecturerSection(lecturerId, group)
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
                <Form form={form} layout="vertical" className="form-evidence">
                    {/* Phần mở đầu */}
                    <Form.Item label="Mở đầu" name="opening" required>
                        <RichTextEditor id="opening" editable={false} />
                    </Form.Item>

                    <Form.List name="criteria">
                        {() => (
                            <>
                                {Object.entries(groupedCriteria || {}).map(
                                    ([lecturerId, group]: [string, any]) => {
                                        return (
                                            <div key={lecturerId} className="mb-8">
                                                {group.criteria.map((item: any) => {
                                                    const originalIndex = item.originalIndex
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            style={{ marginBottom: 24 }}
                                                        >
                                                            <Collapse
                                                                items={[
                                                                    {
                                                                        label: (
                                                                            <div>
                                                                                <span className="font-bold">
                                                                                    Tiêu chí{' '}
                                                                                    {originalIndex +
                                                                                        1}
                                                                                    :{' '}
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
                                                                                        originalIndex,
                                                                                        'evaluationCriterion',
                                                                                        'currentSituation',
                                                                                    ]}
                                                                                >
                                                                                    <RichTextEditor
                                                                                        id={item.id}
                                                                                        editable={
                                                                                            false
                                                                                        }
                                                                                    />
                                                                                </Form.Item>

                                                                                <Form.Item
                                                                                    label="2. Điểm mạnh"
                                                                                    name={[
                                                                                        originalIndex,
                                                                                        'evaluationCriterion',
                                                                                        'strengths',
                                                                                    ]}
                                                                                >
                                                                                    <RichTextEditor
                                                                                        id={item.id}
                                                                                        editable={
                                                                                            false
                                                                                        }
                                                                                    />
                                                                                </Form.Item>

                                                                                <Form.Item
                                                                                    label="3. Điểm tồn tại"
                                                                                    name={[
                                                                                        originalIndex,
                                                                                        'evaluationCriterion',
                                                                                        'weakness',
                                                                                    ]}
                                                                                >
                                                                                    <RichTextEditor
                                                                                        id={item.id}
                                                                                        editable={
                                                                                            false
                                                                                        }
                                                                                    />
                                                                                </Form.Item>

                                                                                <Form.Item
                                                                                    label="4. Kế hoạch hành động"
                                                                                    name={[
                                                                                        originalIndex,
                                                                                        'evaluationCriterion',
                                                                                        'actionPlan',
                                                                                    ]}
                                                                                >
                                                                                    <RichTextEditor
                                                                                        id={item.id}
                                                                                        editable={
                                                                                            false
                                                                                        }
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
                                            </div>
                                        )
                                    }
                                )}
                            </>
                        )}
                    </Form.List>

                    {/* Phần kết luận */}
                    <Form.Item label="Kết luận" name="conclusion" required>
                        <RichTextEditor id="conclusion" editable={false} />
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}
