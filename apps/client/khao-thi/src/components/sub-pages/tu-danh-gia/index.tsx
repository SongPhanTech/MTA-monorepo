import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { AddEvidenceToPeriod } from '@components/modal'
import { Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluatedPage({ data, index }: { data: any; index: number }) {
    const [activeKey, setActiveKey] = useState('infor')

    const { onOpen: onOpenAddEvaluationPeriod } = useDisclosure<string>({
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
                                                            title: 'Cần thu thập',
                                                            width: 200,
                                                            align: 'center',
                                                            type: 'input',
                                                        },
                                                        {
                                                            title: 'Nơi thu thập',
                                                            width: 150,
                                                            align: 'center',
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
                        })}
                    </div>
                ),
            },
            {
                key: 'examBank',
                label: 'Phiếu đánh giá',
                children: <div>3423</div>,
            },
        ]
    }, [data, index, onOpenAddEvaluationPeriod])
    return (
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
            <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
        </div>
    )
}
