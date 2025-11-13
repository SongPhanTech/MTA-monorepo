import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import type { DataTabCrossReviewType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/cross-review'
import { useSession } from '@workspace/auth/react'
import { $Enums, type CriterionPeriod, type EvaluationCriterion } from '@workspace/db/client'
import { useCreateEvaluationCriterionComment } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Button, Collapse, Drawer, Form, message, Card, Timeline } from 'antd'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

export type PutRequirementCriterion = {
    opening: string
    conclusion: string
    criteria: Record<string, any>
}

export default function CrossReviewSubPage({ data }: { data: DataTabCrossReviewType }) {
    const [form] = Form.useForm<PutRequirementCriterion>()
    const [commentForm] = Form.useForm<{ crossReview: string }>()

    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'ad3cd5ec-2dfd-4839-8aeb-85f5e535f3db'

    const { hideSpinner, showSpinner } = useSpinner()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const { mutateAsync: createEvaluationCriterionComment } = useCreateEvaluationCriterionComment()

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

            let listSqlTransaction: any[] = []

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
            setIsDrawerOpen(false)
            commentForm.resetFields()
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
                    },
                })),
                opening: data?.opening,
                conclusion: data?.conclusion,
            })
        }
    }, [data, form])

    return (
        <div>
            <div className="flex justify-end gap-2">
                <Button type="primary" onClick={handleSubmitCross}>
                    Phê duyệt
                </Button>
                <Button type="primary" className="mb-2" onClick={() => setIsDrawerOpen(true)}>
                    Gửi ý kiến phản biện
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

            <Drawer
                title="Gửi ý kiến phản biện"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                width={720}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setIsDrawerOpen(false)}>Hủy</Button>
                        <Button type="primary" onClick={handleSendCrossReview}>
                            Gửi ý kiến
                        </Button>
                    </div>
                }
            >
                {data?.criteria?.[0]?.evaluationCriterion?.evaluationCriterionComments &&
                    data.criteria[0].evaluationCriterion.evaluationCriterionComments.length > 0 && (
                        <Card title="Lịch sử phản biện" className="mb-4">
                            <Timeline
                                items={data.criteria[0].evaluationCriterion.evaluationCriterionComments.map(
                                    (comment: any) => ({
                                        children: (
                                            <div>
                                                <div className="font-medium text-sm mb-1">
                                                    {comment.reviewer?.fullname ||
                                                        'Người phản biện'}
                                                </div>
                                                <div
                                                    className="text-gray-600 text-sm mb-1"
                                                    dangerouslySetInnerHTML={{
                                                        __html: comment.content || '',
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
                        </Card>
                    )}

                <Form form={commentForm} layout="vertical">
                    <Form.Item
                        label="Ý kiến phản biện"
                        name="crossReview"
                        rules={[{ required: true, message: 'Vui lòng nhập ý kiến phản biện' }]}
                    >
                        <RichTextEditor />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    )
}
