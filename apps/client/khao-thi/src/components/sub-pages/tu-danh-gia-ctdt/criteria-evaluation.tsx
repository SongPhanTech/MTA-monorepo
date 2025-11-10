import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import { Button, Collapse, Form, message } from 'antd'
import { useEffect } from 'react'
import type { EvaluationCriterion } from '@workspace/db'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'

export type PutRequirementCriterion = {
    opening: string
    conclusion: string
    criteria: Record<string, any>
}

const CriteriaEvaluationSubPage = ({
    data,
    idx,
}: {
    data: DataTabEvaluationCriterionType
    idx: number
}) => {
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
                        id: data?.id,
                    },
                    data: {
                        opening: dataSubmit?.opening,
                        conclusion: dataSubmit?.conclusion,
                    },
                },
            },
        ]

        if (dataSubmit?.criteria && dataSubmit?.criteria.length > 0) {
            listSqlTransaction = [
                ...listSqlTransaction,
                ...dataSubmit.criteria.map((i: EvaluationCriterion) => {
                    return {
                        model: 'EvaluationCriterion',
                        operation: 'update',
                        data: {
                            where: {
                                id: i?.id,
                            },
                            data: {
                                currentSituation: i?.currentSituation || '',
                                strengths: i?.strengths || '',
                                weakness: i?.weakness || '',
                                actionPlan: i?.actionPlan || '',
                                score: i?.score,
                            },
                        },
                    }
                }),
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

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                criteria: data.criteria,
                opening: data?.opening,
                conclusion: data?.conclusion,
            })
        }
    }, [data, form])

    return (
        <div>
            <div className="flex justify-end">
                <Button type="primary" onClick={() => handleSubmit()}>
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
                                                                name={[name, 'currentSituation']}
                                                            >
                                                                <RichTextEditor id={item.id} />
                                                            </Form.Item>

                                                            <Form.Item
                                                                label="2. Điểm mạnh"
                                                                name={[name, 'strengths']}
                                                            >
                                                                <RichTextEditor id={item.id} />
                                                            </Form.Item>

                                                            <Form.Item
                                                                label="3. Điểm tồn tại"
                                                                name={[name, 'weakness']}
                                                            >
                                                                <RichTextEditor id={item.id} />
                                                            </Form.Item>

                                                            <Form.Item
                                                                label="4. Kế hoạch hành động"
                                                                name={[name, 'actionPlan']}
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
