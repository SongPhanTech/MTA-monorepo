import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import { Button, Collapse, Form, message, Tag, Card, Timeline } from 'antd'
import { useEffect } from 'react'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import { $Enums, type CriterionPeriod, type EvaluationCriterion } from '@workspace/db/client'
import { useUpdateEvaluationCriterion } from '@workspace/db/hooks'
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    LockOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

export type PutRequirementCriterion = {
    opening: string
    conclusion: string
    criteria: Record<string, any>
}

const CriteriaEvaluationSubPage = ({ data }: { data: DataTabEvaluationCriterionType }) => {
    const [form] = Form.useForm<PutRequirementCriterion>()

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

        let listSqlTransaction: any = [
            {
                model: 'StandardPeriod',
                operation: 'update',
                data: {
                    where: {
                        id: data.id,
                    },
                    data: {
                        opening: dataSubmit?.opening || '',
                        conclusion: dataSubmit?.conclusion || '',
                    },
                },
            },
        ]

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
                opening: data?.opening,
                conclusion: data?.conclusion,
            })
        }
    }, [data, form])

    const statusConfig = getStatusConfig(
        data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK
    )

    return (
        <div className="flex gap-6">
            {/* Left Sidebar - Info Panel */}
            <div className="w-80 flex-shrink-0">
                <Card title="Thông tin phiếu đánh giá" className="mb-4">
                    <div className="space-y-4">
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
                            <div className="text-gray-500 text-sm mb-1">Hạn làm</div>
                            <div className="flex items-center gap-2">
                                <ClockCircleOutlined className="text-gray-400" />
                                <span className="font-medium">
                                    {data?.criteria?.[0]?.evaluationCriterion?.deadline
                                        ? dayjs(
                                              data.criteria[0].evaluationCriterion.deadline
                                          ).format('DD/MM/YYYY HH:mm')
                                        : 'Chưa có hạn'}
                                </span>
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
                </Card>

                {/* Comments Section */}
                <Card title="Nhận xét đánh giá" className="mb-4">
                    {data?.criteria?.[0]?.evaluationCriterion?.evaluationCriterionComments &&
                    data.criteria[0].evaluationCriterion.evaluationCriterionComments.length > 0 ? (
                        <Timeline
                            items={data.criteria[0].evaluationCriterion.evaluationCriterionComments.map(
                                (comment: any) => ({
                                    children: (
                                        <div>
                                            <div className="font-medium text-sm mb-1">
                                                {comment.reviewer?.fullname || 'Người đánh giá'}
                                            </div>
                                            <div
                                                className="text-gray-600 text-sm mb-1"
                                                dangerouslySetInnerHTML={{
                                                    __html: comment.content,
                                                }}
                                            />

                                            <div className="text-gray-400 text-xs">
                                                {dayjs(comment.createdAt).format(
                                                    'DD/MM/YYYY HH:mm'
                                                )}
                                            </div>
                                        </div>
                                    ),
                                })
                            )}
                        />
                    ) : (
                        <div className="text-gray-400 text-sm text-center py-4">
                            Chưa có nhận xét
                        </div>
                    )}
                </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                <div className="flex justify-end gap-2" onClick={handleEvaluationForm}>
                    <Button type="primary" className="bg-blue-500">
                        Nộp phiếu đánh giá
                    </Button>
                    <Button type="primary" onClick={handleSubmit} className="mb-2">
                        Lưu đánh giá
                    </Button>
                </div>
                <Form form={form} layout="horizontal" className="form-evidence">
                    <Form.Item label="Mở đầu" name={'opening'}>
                        <RichTextEditor />
                    </Form.Item>
                    <div className="mb-3 font-bold">Đánh giá tiêu chí : </div>

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

                    <Form.Item label="Kết luận" name={'conclusion'}>
                        <RichTextEditor />
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}

export default CriteriaEvaluationSubPage
