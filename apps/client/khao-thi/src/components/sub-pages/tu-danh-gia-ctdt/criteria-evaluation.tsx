import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import { Button, Collapse, Form, message } from 'antd'
import { useEffect } from 'react'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import type { CriterionPeriod, EvaluationCriterion } from '@workspace/db/client'

export type PutRequirementCriterion = {
    opening: string
    conclusion: string
    criteria: Record<string, any>
}

const CriteriaEvaluationSubPage = ({ data }: { data: DataTabEvaluationCriterionType }) => {
    const [form] = Form.useForm<PutRequirementCriterion>()

    const { hideSpinner, showSpinner } = useSpinner()

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

    const handleEvaluationForm = async () => {
        try {
            const dataSubmit = form.getFieldsValue()

            console.log('dataSubmit ', dataSubmit)
        } catch (error) {
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
    )
}

export default CriteriaEvaluationSubPage
