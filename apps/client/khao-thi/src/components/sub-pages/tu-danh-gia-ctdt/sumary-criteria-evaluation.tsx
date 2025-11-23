import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import { Button, Collapse, Form, Empty, Card, message } from 'antd'
import { useEffect, useState } from 'react'
import { $Enums } from '@workspace/db/client'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useSession } from '@workspace/auth/react'
import { useStore } from '@tanstack/react-store'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useUpdateEvaluationCriterion, useUpdateEvaluationPeriod } from '@workspace/db/hooks'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
}
export default function SumaryCriteriaEvaluationSubPage({
    data,
}: {
    data: DataTabEvaluationCriterionType
}) {
    const [form] = Form.useForm<PutRequirementCriterion>()
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '97edb89d-9803-45b9-ac83-e81125dd59c4'
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const [commentForm] = Form.useForm<{ crossReview: string }>()
    const [showComments, setShowComments] = useState(false)

    const { hideSpinner, showSpinner } = useSpinner()

    const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()
    const { mutateAsync: updateEvaluationCriterion } = useUpdateEvaluationCriterion()

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
        } catch (error) {
            message.error('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

    const handleFinal = async () => {
        try {
            showSpinner()
        } catch (error) {
        } finally {
            hideSpinner()
        }
    }

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                criteria: data?.criteria
                    ?.filter((item) => item.evaluationCriterion)
                    ?.map((item) => ({
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

    const hasCompletedCriteria = data?.criteria && data.criteria.length > 0

    if (!hasCompletedCriteria) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <Empty
                    description="Chưa có phiếu đánh giá tiêu chí nào hoàn thành"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        )
    }

    return (
        <div className="overflow-x-hidden">
            <div className="flex justify-end mb-2 gap-2">
                <Button
                    type="primary"
                    size="small"
                    className="bg-yellow-400"
                    onClick={() => setShowComments(!showComments)}
                >
                    Yêu cầu chỉnh sửa
                </Button>
                <Button type="primary" size="small" onClick={handleFinal}>
                    Phê duyệt
                </Button>
            </div>

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
            </Form>
            {showComments && (
                <Card>
                    <Form form={commentForm} layout="vertical">
                        <Form.Item
                            label="Gửi ý kiến phản biện"
                            name="crossReview"
                            rules={[{ required: true, message: 'Vui lòng nhập ý kiến phản biện' }]}
                        >
                            <RichTextEditor />
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
                            <Button type="primary" onClick={handleSendCrossReview}>
                                Gửi ý kiến
                            </Button>
                        </div>
                    </Form>
                </Card>
            )}
        </div>
    )
}
