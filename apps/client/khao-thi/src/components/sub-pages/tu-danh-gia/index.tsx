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
import { Button, Collapse, Form, Tabs } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import './index.css'
import { useUpdateEvaluationCriterion } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'

interface SubmitForm {
    currentSituation: string
    strengths: string
    weakness: string
    actionPlan: string
}
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
    data: any
    index: number
    refetch: () => void
}) {
    const [activeKey, setActiveKey] = useState('infor')
    const [form] = Form.useForm<PutRequirementCriterion>()
    const { onOpen: onOpenAddEvaluationPeriod } = useDisclosure<{
        id: string
        refetch: () => void
    }>({
        tag: AddEvidenceToPeriod.name,
    })

    const { mutateAsync: UpdateEvaluationCriterion } = useUpdateEvaluationCriterion()

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
                            },
                        },
                    }
                }),
            ]
        }

        await sqlTransaction(listSqlTransaction)
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
                                                                align: 'left',
                                                            },
                                                            {
                                                                title: 'Phương pháp thu thập',
                                                                width: 150,
                                                                align: 'center',
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
                                                                                {
                                                                                    id,
                                                                                    refetch,
                                                                                }
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
    }, [data, index, onOpenAddEvaluationPeriod, refetch, handleSubmit, form])

    return (
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
            <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
        </div>
    )
}
