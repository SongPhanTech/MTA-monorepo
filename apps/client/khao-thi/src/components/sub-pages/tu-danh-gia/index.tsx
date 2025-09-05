import { RichTextEditor } from '@components/commons/rich-text-editor'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { AddEvidenceToPeriod } from '@components/modal'
import type {
    AnalysisFormEvidence,
    EvaluationCriterion,
    Evidence,
    RequirementCriterion,
} from '@workspace/db'
import { Button, Collapse, Form, InputNumber, message, Tabs } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import './index.css'
import useSpinner from '@hooks/spinner'
import type { DataIndex } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/[id]'
import { sqlTransaction } from '@workspace/libs/api/model'

export type PutRequirementCriterion = {
    opening: string
    conclusion: string
    criteria: Record<string, any>
}
export default function EvaluatedPage({
    data,
    index,
    refetch,
}: {
    data: DataIndex
    index: number
    refetch: () => void
}) {
    const [activeKey, setActiveKey] = useState('infor')
    const [form] = Form.useForm<PutRequirementCriterion>()
    const { onOpen: onOpenAddEvaluationPeriod } = useDisclosure<string>({
        tag: AddEvidenceToPeriod.name,
        onClose() {
            refetch()
        },
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const handleSubmit = async () => {
        const dataSubmit = form.getFieldsValue()
        let listSqlTransaction: any = [
            {
                model: 'EvaluationStandard',
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
        if (dataSubmit?.criteria.length) {
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
                                currentSituation: i?.currentSituation,
                                strengths: i?.strengths,
                                weakness: i?.weakness,
                                actionPlan: i?.actionPlan,
                                score: i?.score,
                            },
                        },
                    }
                }),
            ]
        }
        try {
            showSpinner()
            await sqlTransaction(listSqlTransaction)
            message.success('Lưu đánh giá thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (activeKey === 'examBank') {
            form.setFieldsValue({
                criteria: data.criteria,
                opening: data?.opening,
                conclusion: data?.conclusion,
            })
        }
    }, [data, activeKey])

    const items = useMemo(() => {
        return [
            {
                key: 'infor',
                label: 'Phiếu phân tích',
                children: (
                    <div>
                        <div className="text-base mb-3">
                            <span className="font-bold">Tiêu chuẩn {index}: </span>
                            <span>{data?.name}</span>
                        </div>
                        {data?.criteria?.map(
                            (
                                item: EvaluationCriterion & {
                                    requirementCriterions?: RequirementCriterion[]
                                },
                                idx: number
                            ) => {
                                return (
                                    <div key={item.id} className="ml-4 mb-6">
                                        <div className="text-base mb-3">
                                            <span className="font-bold">Tiêu chí {idx + 1}: </span>
                                            <span>{item?.name}</span>
                                        </div>
                                        <div>
                                            <Table
                                                rowKey="id"
                                                columns={[
                                                    {
                                                        title: 'STT',
                                                        width: 30,
                                                        align: 'center',
                                                        render: (_, __, index) => index + 1,
                                                    },
                                                    {
                                                        title: 'Phân tích tiêu chí',
                                                        children: [
                                                            {
                                                                title: 'Các yêu cầu',
                                                                dataIndex: 'name',
                                                                width: 200,
                                                                align: 'center',
                                                                type: 'input',
                                                            },
                                                            {
                                                                title: 'Các câu hỏi đặt ra',
                                                                dataIndex: 'questions',
                                                                width: 150,
                                                                render: (questions: string[]) => {
                                                                    return (
                                                                        <div className="flex flex-col gap-2">
                                                                            {questions?.map(
                                                                                (
                                                                                    question: string
                                                                                ) => {
                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                question
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                question
                                                                                            }
                                                                                        </div>
                                                                                    )
                                                                                }
                                                                            )}
                                                                        </div>
                                                                    )
                                                                },
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        title: 'Thông tin, minh chứng',
                                                        children: [
                                                            {
                                                                title: 'Tên minh chứng',
                                                                width: 200,
                                                                align: 'left',
                                                                render: (record: {
                                                                    evidences: AnalysisFormEvidence[]
                                                                }) => {
                                                                    return record?.evidences
                                                                        .length ? (
                                                                        <div className="flex flex-col gap-2">
                                                                            {record?.evidences?.map(
                                                                                (
                                                                                    evidence: AnalysisFormEvidence & {
                                                                                        evidence?: Evidence
                                                                                    }
                                                                                ) => {
                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                evidence.id
                                                                                            }
                                                                                        >
                                                                                            -{' '}
                                                                                            {
                                                                                                evidence
                                                                                                    ?.evidence
                                                                                                    ?.name
                                                                                            }
                                                                                        </div>
                                                                                    )
                                                                                }
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        ''
                                                                    )
                                                                },
                                                            },
                                                            {
                                                                title: 'Nơi thu thập',
                                                                width: 150,
                                                                align: 'center',
                                                                render: (
                                                                    record: RequirementCriterion
                                                                ) => {
                                                                    return (
                                                                        record?.evidencePlaces || ''
                                                                    )
                                                                },
                                                            },
                                                            {
                                                                title: 'Phương pháp thu thập',
                                                                width: 150,
                                                                align: 'center',
                                                                render: (
                                                                    record: RequirementCriterion
                                                                ) => {
                                                                    return (
                                                                        record?.collectionMethod ||
                                                                        ''
                                                                    )
                                                                },
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        title: 'Thao tác',
                                                        width: 100,
                                                        align: 'center',
                                                        render: (__, { id }) => {
                                                            return (
                                                                <div className="flex gap-2 items-center justify-center">
                                                                    <EditIcon
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            onOpenAddEvaluationPeriod(
                                                                                id
                                                                            )
                                                                        }}
                                                                        className="text-sm text-blue-700 cursor-pointer"
                                                                    />
                                                                </div>
                                                            )
                                                        },
                                                    },
                                                ]}
                                                data={item?.requirementCriterions || []}
                                                pagination={false}
                                            />
                                        </div>
                                    </div>
                                )
                            }
                        )}
                    </div>
                ),
            },
            {
                key: 'examBank',
                label: 'Phiếu đánh giá',
                children: (
                    <div>
                        <Form form={form} layout="horizontal" className="mt-4 form-evidence">
                            <Form.Item label="Mở đầu" name={'opening'}>
                                <RichTextEditor />
                            </Form.Item>
                            <div className="mb-3 font-bold">Đánh giá tiêu chí : </div>

                            <Form.List name="criteria">
                                {(fields) => (
                                    <>
                                        {fields.map(({ key, name }, idx: number) => {
                                            const item = data.criteria[name] // lấy ra dữ liệu gốc theo index
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
                                                                                name,
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
                                                                                name,
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
                                                                                name,
                                                                                'actionPlan',
                                                                            ]}
                                                                        >
                                                                            <RichTextEditor
                                                                                id={item.id}
                                                                            />
                                                                        </Form.Item>
                                                                        <div className="mb-3 font-bold">
                                                                            5. Tự đánh giá
                                                                        </div>
                                                                        <div className="mb-1">
                                                                            Điểm tối thiểu:{' '}
                                                                            <span className="font-bold">
                                                                                {
                                                                                    item?.scoreScale
                                                                                        ?.minValue
                                                                                }
                                                                                ,{' '}
                                                                            </span>{' '}
                                                                            Điểm tối đa:{' '}
                                                                            <span className="font-bold">
                                                                                {
                                                                                    item?.scoreScale
                                                                                        ?.maxValue
                                                                                }
                                                                                ,{' '}
                                                                            </span>{' '}
                                                                            Điểm đạt:{' '}
                                                                            <span className="font-bold">
                                                                                {
                                                                                    item?.scoreScale
                                                                                        ?.passFrom
                                                                                }
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
                                                                                        ?.minValue ||
                                                                                    1
                                                                                }
                                                                                max={
                                                                                    item?.scoreScale
                                                                                        ?.maxValue ||
                                                                                    7
                                                                                }
                                                                                type="number"
                                                                                placeholder="Nhập điểm tự đánh giá"
                                                                                step={1}
                                                                                className="w-full"
                                                                            />
                                                                        </Form.Item>
                                                                    </>
                                                                ),
                                                            },
                                                        ]}
                                                        bordered={true}
                                                        expandIconPosition="end"
                                                        className="bg-transparent mb-6"
                                                        // onChange={(value) => {
                                                        //     setExpland([...value])
                                                        // }}
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
                        <div className="flex justify-end">
                            <Button type="primary" onClick={() => handleSubmit()}>
                                Lưu đánh giá
                            </Button>
                        </div>
                    </div>
                ),
            },
        ]
    }, [data, index, onOpenAddEvaluationPeriod, handleSubmit, form])

    return (
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
            <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
        </div>
    )
}
