import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import { Button, Collapse, Form, message, Tag, Card, Avatar, Badge } from 'antd'
import { useEffect, useState } from 'react'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import { $Enums, type CriterionPeriod, type EvaluationCriterion } from '@workspace/db/client'
import { useUpdateEvaluationCriterion } from '@workspace/db/hooks'
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    LockOutlined,
    MessageOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
}

const CriteriaEvaluationSubPage = ({ data }: { data: DataTabEvaluationCriterionType }) => {
    const [form] = Form.useForm<PutRequirementCriterion>()
    const [showComments, setShowComments] = useState(false)

    const { hideSpinner, showSpinner } = useSpinner()

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

    const handleSubmit = async () => {
        const dataSubmit = form.getFieldsValue()

        let listSqlTransaction: any[] = []

        if (dataSubmit?.criteria && dataSubmit.criteria.length > 0) {
            listSqlTransaction = [
                ...listSqlTransaction,
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
                                    currentSituation: i.evaluationCriterion.currentSituation || '',
                                    strengths: i.evaluationCriterion.strengths || '',
                                    weakness: i.evaluationCriterion.weakness || '',
                                    actionPlan: i.evaluationCriterion.actionPlan || '',
                                },
                            },
                        }
                    }
                ),
            ]
        }
        try {
            showSpinner()
            const res = await sqlTransaction(listSqlTransaction)
            if (res.status !== 200) {
                message.error('Có lỗi xảy ra, vui lòng thử lại')
                return
            }
            message.success('Lưu đánh giá tiêu chí thành công')
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { mutateAsync: updateEvaluationCriterion } = useUpdateEvaluationCriterion()

    const handleEvaluationForm = async () => {
        try {
            const dataSubmit = form.getFieldsValue()
            showSpinner()
            if (!dataSubmit.criteria || dataSubmit.criteria.length === 0) return

            await Promise.all(
                dataSubmit.criteria.map(
                    (
                        i: CriterionPeriod & {
                            evaluationCriterion: EvaluationCriterion
                        }
                    ) => {
                        return updateEvaluationCriterion({
                            where: {
                                id: i.evaluationCriterion.id,
                            },
                            data: {
                                status: $Enums.EvaluationStatus.SUBMITTED,
                            },
                        })
                    }
                )
            )

            message.success('Nộp phiếu đánh giá tiêu chí thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
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
                    },
                })),
            })
        }
    }, [data, form])

    const statusConfig = getStatusConfig(
        data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK
    )

    const currentStatus =
        data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK

    const commentsCount =
        data?.criteria?.[0]?.evaluationCriterion?.evaluationCriterionComments?.length || 0

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

    const deadline = data?.criteria?.[0]?.evaluationCriterion?.deadline
    const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null

    return (
        <div className="overflow-x-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-4 pt-2 gap-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center flex-wrap">
                    <div>
                        <div className="text-gray-500 text-sm mb-1">Trạng thái</div>
                        <Tag
                            color={statusConfig.color}
                            icon={statusConfig.icon}
                            className="text-sm"
                        >
                            {statusConfig.text}
                        </Tag>
                    </div>

                    <div>
                        <div className="text-gray-500 text-sm mb-1">Hạn làm phiếu</div>
                        <div className="flex items-center gap-2">
                            <ClockCircleOutlined className="text-gray-400" />
                            <span className="font-medium">
                                {data?.criteria?.[0]?.evaluationCriterion?.deadline
                                    ? dayjs(data.criteria[0].evaluationCriterion.deadline).format(
                                          'DD/MM/YYYY'
                                      )
                                    : 'Chưa có hạn'}
                            </span>
                            {deadline && deadlineStatus && deadlineStatus.text && (
                                <Tag color={deadlineStatus.color}>{deadlineStatus.text}</Tag>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-gray-500 text-sm mb-1">Người được giao</div>
                        <div className="font-medium">
                            {data?.criteria?.[0]?.evaluationCriterion?.lecturer?.userProfile
                                ?.fullname || 'Chưa phân công'}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-2 mr-1">
                    <Badge count={commentsCount} showZero offset={[-5, 5]}>
                        <Button
                            type="primary"
                            className="bg-yellow-400"
                            onClick={() => setShowComments(!showComments)}
                        >
                            Xem đánh giá
                        </Button>
                    </Badge>
                    {currentStatus !== $Enums.EvaluationStatus.APPROVED &&
                        currentStatus !== $Enums.EvaluationStatus.COMPLETED && (
                            <>
                                <Button
                                    type="primary"
                                    className="bg-blue-500"
                                    onClick={handleEvaluationForm}
                                >
                                    Nộp phiếu đánh giá
                                </Button>
                                <Button type="primary" onClick={handleSubmit}>
                                    Lưu đánh giá
                                </Button>
                            </>
                        )}
                </div>
            </div>

            {showComments && (
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <MessageOutlined />
                            <span>Ý kiến phản biện</span>
                            <span className="text-gray-400 font-normal text-sm ml-auto">
                                {commentsCount} phản hồi
                            </span>
                        </div>
                    }
                    className="mb-4"
                >
                    <div className="max-h-96 overflow-y-auto">
                        {data?.criteria?.[0]?.evaluationCriterion?.evaluationCriterionComments &&
                        commentsCount > 0 ? (
                            <div className="space-y-3">
                                {data.criteria[0].evaluationCriterion.evaluationCriterionComments.map(
                                    (comment: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                                        >
                                            <Avatar size={40} className="flex-shrink-0 bg-red-500">
                                                {comment.reviewer?.fullname
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || 'U'}
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-1">
                                                    <span className="font-semibold text-sm">
                                                        {comment.reviewer?.fullname ||
                                                            'Người đánh giá'}
                                                    </span>
                                                    <span className="text-red-500 text-sm font-medium">
                                                        Đánh giá
                                                    </span>
                                                </div>
                                                <div className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                                                    <ClockCircleOutlined />
                                                    {dayjs(comment.createdAt).format(
                                                        'DD/MM/YYYY HH:mm'
                                                    )}
                                                </div>
                                                <div
                                                    className="text-gray-700 text-sm"
                                                    dangerouslySetInnerHTML={{
                                                        __html: comment.content,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm text-center py-8">
                                Chưa có phản hồi nào
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Form form={form} layout="horizontal" className="form-evidence">
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
                                                                Tiêu chí {idx + 1}:{' '}
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
                                                                <RichTextEditor id={item.id} />
                                                            </Form.Item>

                                                            <Form.Item
                                                                label="2. Điểm mạnh"
                                                                name={[
                                                                    name,
                                                                    'evaluationCriterion',
                                                                    'strengths',
                                                                ]}
                                                            >
                                                                <RichTextEditor id={item.id} />
                                                            </Form.Item>

                                                            <Form.Item
                                                                label="3. Điểm tồn tại"
                                                                name={[
                                                                    name,
                                                                    'evaluationCriterion',
                                                                    'weakness',
                                                                ]}
                                                            >
                                                                <RichTextEditor id={item.id} />
                                                            </Form.Item>

                                                            <Form.Item
                                                                label="4. Kế hoạch hành động"
                                                                name={[
                                                                    name,
                                                                    'evaluationCriterion',
                                                                    'actionPlan',
                                                                ]}
                                                            >
                                                                <RichTextEditor id={item.id} />
                                                            </Form.Item>
                                                            <div className="mb-3 font-bold">
                                                                5. Tự đánh giá
                                                            </div>
                                                            {/* <div className="mb-1">
                                                                Điểm tối thiểu:{' '}
                                                                <span className="font-bold">
                                                                    {item?.scoreScale?.minValue},{' '}
                                                                </span>{' '}
                                                                Điểm tối đa:{' '}
                                                                <span className="font-bold">
                                                                    {item?.scoreScale?.maxValue},{' '}
                                                                </span>{' '}
                                                                Điểm đạt:{' '}
                                                                <span className="font-bold">
                                                                    {item?.scoreScale?.passFrom}
                                                                </span>
                                                            </div>
                                                            <Form.Item
                                                                label=""
                                                                name={[name, 'score']}
                                                            >
                                                                <InputNumber
                                                                    precision={0}
                                                                    min={
                                                                        item?.scoreScale
                                                                            ?.minValue || 1
                                                                    }
                                                                    max={
                                                                        item?.scoreScale
                                                                            ?.maxValue || 7
                                                                    }
                                                                    type="number"
                                                                    placeholder="Nhập điểm tự đánh giá"
                                                                    step={1}
                                                                    className="w-full"
                                                                />
                                                            </Form.Item> */}
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
    )
}

export default CriteriaEvaluationSubPage
