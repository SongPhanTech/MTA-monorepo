import { RichTextEditor } from '@components/commons/rich-text-editor'
import { Collapse, Form, Tag } from 'antd'
import { useEffect } from 'react'
import { $Enums } from '@workspace/db/client'

import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    LockOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
}

export default function CriteriaEvaluationListSubPage({
    data,
}: {
    data: DataTabEvaluationCriterionType
}) {
    const [form] = Form.useForm<PutRequirementCriterion>()

    const getStatusConfig = (status: $Enums.EvaluationStatus) => {
        switch (status) {
            case $Enums.EvaluationStatus.LOCK:
                return { color: 'default', text: 'Khoá', icon: <LockOutlined /> }
            case $Enums.EvaluationStatus.PENDING:
                return { color: 'warning', text: 'Chưa nộp', icon: <ClockCircleOutlined /> }
            case $Enums.EvaluationStatus.SUBMITTED:
                return { color: 'processing', text: 'Đã nộp', icon: <CheckCircleOutlined /> }
            case $Enums.EvaluationStatus.REVISION:
                return {
                    color: 'error',
                    text: 'Yêu cầu chỉnh sửa',
                    icon: <ExclamationCircleOutlined />,
                }
            case $Enums.EvaluationStatus.APPROVED:
                return { color: 'success', text: 'Đã duyệt', icon: <CheckCircleOutlined /> }
            case $Enums.EvaluationStatus.COMPLETED:
                return { color: 'success', text: 'Hoàn thành', icon: <CheckCircleOutlined /> }
            default:
                return { color: 'default', text: 'Không xác định', icon: null }
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
                    },
                })),
            })
        }
    }, [data, form])

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
            <Form form={form} layout="horizontal" className="form-evidence">
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
                                            <div className="flex flex-col lg:flex-row justify-between items-start mb-4 pt-2 gap-4">
                                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center flex-wrap">
                                                    <div>
                                                        <div className="text-gray-500 text-sm mb-1">
                                                            Trạng thái
                                                        </div>
                                                        <Tag
                                                            color={statusConfig.color}
                                                            icon={statusConfig.icon}
                                                            className="text-sm"
                                                        >
                                                            {statusConfig.text}
                                                        </Tag>
                                                    </div>

                                                    <div>
                                                        <div className="text-gray-500 text-sm mb-1">
                                                            Hạn làm phiếu
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <ClockCircleOutlined className="text-gray-400" />
                                                            <span className="font-medium">
                                                                {deadline
                                                                    ? dayjs(deadline).format(
                                                                          'DD/MM/YYYY'
                                                                      )
                                                                    : 'Chưa có hạn'}
                                                            </span>
                                                            {deadline &&
                                                                deadlineStatus &&
                                                                deadlineStatus.text && (
                                                                    <Tag
                                                                        color={deadlineStatus.color}
                                                                    >
                                                                        {deadlineStatus.text}
                                                                    </Tag>
                                                                )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-gray-500 text-sm mb-1">
                                                            Người được giao
                                                        </div>
                                                        <div className="font-medium">
                                                            {group.lecturer?.userProfile
                                                                ?.fullname || 'Chưa phân công'}
                                                        </div>
                                                    </div>
                                                </div>
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
