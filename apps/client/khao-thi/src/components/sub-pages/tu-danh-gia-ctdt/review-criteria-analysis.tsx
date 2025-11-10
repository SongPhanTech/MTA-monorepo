import Table from '@components/commons/table'
import ApproveIcon from '@components/icons/approve'
import RejectIcon from '@components/icons/reject'
import type { ReviewDataTabType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/review-criteria-analysis'
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from '@workspace/db'

const ReviewCriteriaAnalysisSubPage = ({ data, idx }: { data: ReviewDataTabType; idx: number }) => {
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
                            <div className="flex gap-2">
                                <span className="text-sm text-gray-600">
                                    Người thực hiện:{' '}
                                    {item?.analysisCriterions?.lecturer?.userProfile?.fullname ||
                                        'Chưa phân công'}
                                </span>
                            </div>
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
                                                align: 'left',
                                            },
                                            {
                                                title: 'Các câu hỏi đặt ra',
                                                dataIndex: 'questions',
                                                width: 200,
                                                align: 'left',
                                                render: (questions: string[]) => {
                                                    return (
                                                        <div className="flex flex-col gap-1">
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
                                                        <div className="flex flex-col gap-1">
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
                                                    <ApproveIcon />
                                                    <RejectIcon title="Yêu cầu chỉnh sửa" />
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

export default ReviewCriteriaAnalysisSubPage
