import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import { Button, Collapse, Form, message, Tag } from 'antd'
import { useEffect } from 'react'
import { sqlTransaction } from '@workspace/libs/api/model'
import { $Enums, type CriterionPeriod, type EvaluationCriterion } from '@workspace/db/client'
import { useUpdateStandardPeriod } from '@workspace/db/hooks'
import dayjs from 'dayjs'
import { getStatusConfig } from '@constants/constants'
import { getDeadlineStatus } from '@/utils/getDeadlineStatus'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/standar-reports'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
    opening: string
    conclusion: string
}

const StandarReportsSubPage = ({
    data,
    onRefetch,
}: {
    data: DataTabEvaluationCriterionType
    onRefetch?: () => void
}) => {
    const [form] = Form.useForm<PutRequirementCriterion>()

    const { hideSpinner, showSpinner } = useSpinner()

    const { mutateAsync: updateStandardPeriod } = useUpdateStandardPeriod()

    const handleSubmit = async () => {
        const dataSubmit = form.getFieldsValue()

        try {
            showSpinner()

            if (data?.id) {
                await updateStandardPeriod({
                    where: {
                        id: data.id,
                    },
                    data: {
                        opening: dataSubmit?.opening || '',
                        conclusion: dataSubmit?.conclusion || '',
                    },
                })
            }

            message.success('Lưu báo cáo tiêu chuẩn thành công')
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

    const handleEvaluationForm = async () => {
        try {
            const dataSubmit = form.getFieldsValue()

            if (!dataSubmit.criteria || dataSubmit.criteria.length === 0) {
                message.warning('Không có dữ liệu để nộp')
                return
            }
            showSpinner()

            const listSqlTransaction = dataSubmit.criteria.map(
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
                            },
                            data: {
                                status: $Enums.EvaluationStatus.COMPLETED,
                            },
                        },
                    }
                }
            )

            const res = await sqlTransaction(listSqlTransaction)

            if (res.status !== 200) {
                message.error('Có lỗi xảy ra, vui lòng thử lại')
                return
            }

            message.success('Nộp báo cáo tiêu chí thành công')

            if (onRefetch) {
                onRefetch()
            }
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

    const statusConfig = getStatusConfig(
        data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK
    )

    const deadline = data?.criteria?.[0]?.evaluationCriterion?.deadline
    const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null

    const headerSection = (
        <div className="sticky top-0 z-10 bg-white py-2 flex flex-row justify-between items-center gap-2">
            <div className="flex flex-row gap-4 items-center text-xs">
                <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">
                        Người viết phiếu:{' '}
                        {data?.criteria?.[0]?.evaluationCriterion?.lecturer?.userProfile
                            ?.fullname || 'Chưa phân công'}
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
                {
                    <>
                        <Button type="primary" size="small" onClick={handleSubmit}>
                            Lưu báo cáo
                        </Button>
                        <Button
                            type="primary"
                            className="bg-blue-500"
                            size="small"
                            onClick={handleEvaluationForm}
                        >
                            Nộp báo cáo tiêu chuẩn
                        </Button>
                    </>
                }
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            {headerSection}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
                <Form form={form} layout="vertical" className="form-evidence">
                    {/* Phần mở đầu */}
                    <Form.Item label="Mở đầu" name="opening" required>
                        <RichTextEditor id="opening" editable={true} />
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
                    <Form.Item label="Kết luận" name="conclusion" required>
                        <RichTextEditor id="conclusion" editable={true} />
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}

export default StandarReportsSubPage
