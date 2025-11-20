import { RichTextEditor } from '@components/commons/rich-text-editor'
import { Collapse, Form, Tag } from 'antd'
import { useEffect } from 'react'
import { $Enums } from '@workspace/db/client'
import dayjs from 'dayjs'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import { getStatusConfig } from '@constants/constants'
import { getDeadlineStatus } from '@/utils/getDeadlineStatus'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
}

export default function CriteriaEvaluationListSubPage({
    data,
}: {
    data: DataTabEvaluationCriterionType
}) {
    const [form] = Form.useForm<PutRequirementCriterion>()

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

    return (
        <div className="overflow-x-hidden">
            <Form form={form} layout="vertical" className="form-evidence">
                <Form.List name="criteria">
                    {(fields) => (
                        <>
                            {Object.entries(groupedCriteria || {}).map(
                                ([lecturerId, group]: [string, any]) => {
                                    const statusConfig = getStatusConfig(
                                        group.status || $Enums.EvaluationStatus.LOCK
                                    )
                                    const deadline = group.deadline
                                    const deadlineStatus = deadline
                                        ? getDeadlineStatus(deadline)
                                        : null

                                    return (
                                        <div key={lecturerId} className="mb-8">
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                <span className="text-sm text-gray-600">
                                                    Người được giao:{' '}
                                                    {group.lecturer?.userProfile?.fullname ||
                                                        'Chưa phân công'}
                                                </span>
                                                {deadline && deadlineStatus && (
                                                    <Tag color={deadlineStatus.color}>
                                                        Hạn: {dayjs(deadline).format('DD/MM/YYYY')}
                                                        {deadlineStatus.text &&
                                                            ` (${deadlineStatus.text})`}
                                                    </Tag>
                                                )}
                                                <Tag color={statusConfig.color}>
                                                    {statusConfig.text}
                                                </Tag>
                                            </div>

                                            {group.criteria.map((item: any) => {
                                                const originalIndex = item.originalIndex
                                                return (
                                                    <div key={item.id} style={{ marginBottom: 24 }}>
                                                        <Collapse
                                                            items={[
                                                                {
                                                                    label: (
                                                                        <div>
                                                                            <span className="font-bold">
                                                                                Tiêu chí{' '}
                                                                                {originalIndex + 1}:{' '}
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
                                                                                    editable={false}
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
                                                                                    editable={false}
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
                                                                                    editable={false}
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
                                        </div>
                                    )
                                }
                            )}
                        </>
                    )}
                </Form.List>
            </Form>
        </div>
    )
}
