import { RichTextEditor } from '@components/commons/rich-text-editor'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { AddEvidenceToPeriod } from '@components/modal'
import type { AnalysisFormEvidence, Evidence } from '@workspace/db'
import { Collapse, Form, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import './index.css'
type PutRequirementCriterion = {
    opening: string
    conclusion: string
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

    const { onOpen: onOpenAddEvaluationPeriod } = useDisclosure<{
        id: string
        refetch: () => void
    }>({
        tag: AddEvidenceToPeriod.name,
    })

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
                        {data?.criteria?.map((item: any, idx: number) => {
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
                                                            render: (questions: any) => {
                                                                return (
                                                                    <div className="flex flex-col gap-2">
                                                                        {questions?.map(
                                                                            (question: any) => {
                                                                                return (
                                                                                    <div>
                                                                                        {question}
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
                                                                return record?.evidences.length ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        {record?.evidences?.map(
                                                                            (
                                                                                evidence: AnalysisFormEvidence & {
                                                                                    evidence?: Evidence
                                                                                }
                                                                            ) => {
                                                                                return (
                                                                                    <div>
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
                                                                        onOpenAddEvaluationPeriod({
                                                                            id,
                                                                            refetch,
                                                                        })
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
                        })}
                    </div>
                ),
            },
            {
                key: 'examBank',
                label: 'Phiếu đánh giá',
                children: (
                    <div>
                        <Form layout="horizontal" className="mt-4 form-evidence">
                            <Form.Item label="Mở đầu" name={'explanation'}>
                                <RichTextEditor />
                            </Form.Item>
                            <div className="text-sm mb-3 font-bold">Đánh giá tiêu chí: </div>

                            <div className="">
                                <Collapse
                                    items={data?.criteria?.map((item: any, idx: number) => {
                                        return {
                                            label: (
                                                <div>
                                                    <span className="font-bold">
                                                        Tiêu chí {idx + 1}:{' '}
                                                    </span>
                                                    {item?.name}
                                                </div>
                                            ),
                                            key: item.value,
                                            children: (
                                                <div>
                                                    <Form layout="horizontal" className="mt-4">
                                                        <Form.Item
                                                            label="1. Mô tả hiện trạng"
                                                            name={'explanation'}
                                                        >
                                                            <RichTextEditor />
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="2. Điểm mạnh"
                                                            name={'explanation'}
                                                        >
                                                            <RichTextEditor />
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="3. Điểm tồn tại"
                                                            name={'explanation'}
                                                        >
                                                            <RichTextEditor />
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="4. Kế hoạch hành động"
                                                            name={'explanation'}
                                                        >
                                                            <RichTextEditor />
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="5. Tự đánh giá"
                                                            name={'explanation'}
                                                        >
                                                            <RichTextEditor />
                                                        </Form.Item>
                                                    </Form>
                                                </div>
                                            ),
                                        }
                                    })}
                                    bordered={true}
                                    expandIconPosition="end"
                                    className="bg-transparent mb-6"
                                    // onChange={(value) => {
                                    //     setExpland([...value])
                                    // }}
                                />
                            </div>

                            <Form.Item label="Kết luận" name={'explanation'}>
                                <RichTextEditor />
                            </Form.Item>
                        </Form>
                    </div>
                ),
            },
        ]
    }, [data, index, onOpenAddEvaluationPeriod, refetch])
    return (
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
            <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
        </div>
    )
}
