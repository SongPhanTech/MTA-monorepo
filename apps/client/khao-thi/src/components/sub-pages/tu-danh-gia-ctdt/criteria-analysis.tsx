import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import type { DataTabType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/criteria-analysis'
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from '@workspace/db'
import { Button } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const CriteriaAnalysisSubPage = ({ data, idx }: { data: DataTabType; idx: number }) => {
    const { onOpen } = useDisclosure<{
        id?: string
        analysisCriterionId?: string
    }>({
        tag: 'PutTieuChiMinhChungModal',
    })

    return (
        <div className="h-[calc(100vh-200px)] overflow-y-auto p-4">
            <div className="text-base mb-3">
                <span className="font-bold">Tiêu chuẩn {idx}: </span>
                <span>{data?.name}</span>
            </div>
            {data?.criteria?.map((item, idx: number) => {
                return (
                    <div key={item.id} className="ml-4 mb-6">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-base">
                                <span className="font-bold">Tiêu chí {idx + 1}: </span>
                                <span>{item?.name}</span>
                            </div>
                            <Button
                                type="primary"
                                onClick={() =>
                                    onOpen({
                                        analysisCriterionId: item.analysisCriterions?.id,
                                    })
                                }
                            >
                                Thêm mới
                            </Button>
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
                                                            {questions?.map((question: string) => {
                                                                return (
                                                                    <div key={question}>
                                                                        - {question}
                                                                    </div>
                                                                )
                                                            })}
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
                                                                        <div key={evidence.id}>
                                                                            -{' '}
                                                                            {
                                                                                evidence?.evidence
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
                                                render: (record: RequirementCriterion) => {
                                                    return record?.evidencePlaces || ''
                                                },
                                            },
                                            {
                                                title: 'Phương pháp thu thập',
                                                width: 150,
                                                align: 'center',
                                                render: (record: RequirementCriterion) => {
                                                    return record?.collectionMethod || ''
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        title: 'Thao tác',
                                        width: 100,
                                        align: 'center',
                                        render: (__, record) => {
                                            return (
                                                <div className="flex gap-2 items-center justify-center">
                                                    <EditIcon
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onOpen({
                                                                id: record.id,
                                                                analysisCriterionId:
                                                                    record.analysisCriterionId,
                                                            })
                                                        }}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                </div>
                                            )
                                        },
                                    },
                                ]}
                                data={item?.analysisCriterions?.requirementCriterions || []}
                                pagination={false}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default CriteriaAnalysisSubPage
