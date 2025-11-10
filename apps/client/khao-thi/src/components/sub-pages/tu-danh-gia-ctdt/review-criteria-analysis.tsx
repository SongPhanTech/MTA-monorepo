import FormItem from '@components/commons/form-item'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import Table from '@components/commons/table'
import ApproveIcon from '@components/icons/approve'
import useSpinner from '@hooks/spinner'
import type { ReviewDataTabType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/review-criteria-analysis'
import { useSession } from '@workspace/auth/react'
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from '@workspace/db'
import { $Enums, type EvaluationCriterionComment } from '@workspace/db/client'
import {
    useCreateEvaluationCriterionComment,
    useUpdateAnalysisCriterion,
} from '@workspace/db/hooks'
import { Button, Form, message, Tooltip } from 'antd'
import { SquareX } from 'lucide-react'
import { useState } from 'react'

type CommentType = EvaluationCriterionComment

const ReviewCriteriaAnalysisSubPage = ({ data, idx }: { data: ReviewDataTabType; idx: number }) => {
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
    const { showSpinner, hideSpinner } = useSpinner()
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'ad3cd5ec-2dfd-4839-8aeb-85f5e535f3db'

    const [form] = Form.useForm<CommentType>()

    const toggleCommentRow = (recordId: string) => {
        setExpandedRowKeys((prev) =>
            prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
        )
    }

    const { mutateAsync: updateAnalysisCriterion } = useUpdateAnalysisCriterion()

    const handleApproveCriterionAnalysis = async (analysisCriterionId: string) => {
        try {
            showSpinner()
            await updateAnalysisCriterion({
                where: {
                    id: analysisCriterionId,
                },
                data: {
                    status: $Enums.EvaluationCriterionStatus.APPROVED,
                },
            })

            message.success('Phê duyệt tiêu chí thành công')
        } catch (error) {
            message.error('Phê duyệt tiêu chí thất bại, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

    const { mutateAsync: createEvaluationCriterionComment } = useCreateEvaluationCriterionComment()

    const handleRejectCriterionAnalysis = async (
        analysisCriterionId: string,
        requirementCriterionId: string
    ) => {
        try {
            const values = await form.validateFields()
            if (!values) return
            showSpinner()

            await updateAnalysisCriterion({
                where: {
                    id: analysisCriterionId,
                },
                data: {
                    status: $Enums.EvaluationCriterionStatus.REVISION,
                },
            })

            await createEvaluationCriterionComment({
                data: {
                    reviewerId: idProfile,
                    requirementCriterionId: requirementCriterionId,
                    analysisCriterionId: analysisCriterionId,
                    content: values.content,
                },
            })

            // form.resetFields()
            // toggleCommentRow(requirementCriterionId)
            // message.success('Gửi yêu cầu chỉnh sửa tiêu chí thành công')
        } catch (error) {
            message.error('Gửi yêu cầu chỉnh sửa tiêu chí thất bại, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

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
                                                    <ApproveIcon
                                                        onClick={() =>
                                                            handleApproveCriterionAnalysis(
                                                                record.analysisCriterionId
                                                            )
                                                        }
                                                    />
                                                    <Tooltip title="Yêu cầu chỉnh sửa">
                                                        <SquareX
                                                            size={16}
                                                            strokeWidth={1.5}
                                                            className={
                                                                'text-red-600 cursor-pointer'
                                                            }
                                                            onClick={() => {
                                                                toggleCommentRow(record.id)
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            )
                                        },
                                    },
                                ]}
                                data={item?.analysisCriterions?.requirementCriterions || []}
                                pagination={false}
                                expandable={{
                                    expandedRowKeys: expandedRowKeys,
                                    expandedRowRender: (record) => {
                                        return (
                                            <div>
                                                <Form form={form}>
                                                    <FormItem
                                                        label="Yêu cầu chỉnh sửa"
                                                        form={form}
                                                        name="content"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message:
                                                                    'Vui lòng nhập yêu cầu chỉnh sửa',
                                                            },
                                                        ]}
                                                    >
                                                        <RichTextEditor />
                                                    </FormItem>
                                                    <div className="flex justify-end gap-2 mt-3">
                                                        <Button
                                                            onClick={() => {
                                                                form.resetFields()
                                                                toggleCommentRow(record.id)
                                                            }}
                                                        >
                                                            Hủy
                                                        </Button>
                                                        <Button
                                                            type="primary"
                                                            onClick={() =>
                                                                handleRejectCriterionAnalysis(
                                                                    record.analysisCriterionId,
                                                                    record.id
                                                                )
                                                            }
                                                        >
                                                            Gửi yêu cầu
                                                        </Button>
                                                    </div>
                                                </Form>
                                            </div>
                                        )
                                    },
                                    rowExpandable: (record) =>
                                        (record?.evaluationCriterionComment?.length || 0) > 0,
                                    onExpand: (expanded, record) => {
                                        toggleCommentRow(record.id)
                                    },
                                    expandIcon: () => null,
                                }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ReviewCriteriaAnalysisSubPage
