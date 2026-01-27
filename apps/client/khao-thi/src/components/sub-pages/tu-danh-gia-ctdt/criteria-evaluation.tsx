import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import { Button, Collapse, Form, message, Tag, Badge } from 'antd'
import { useEffect, useState } from 'react'
import { sqlTransaction } from '@workspace/libs/api/model'
import {
    $Enums,
    type EvaluationCriterionComment,
    type StandardPeriod,
    type CriterionPeriod,
    type EvaluationCriterion,
} from '@workspace/db/client'
import dayjs from 'dayjs'
import { getStatusConfig } from '@constants/constants'
import { getDeadlineStatus } from '@/utils/getDeadlineStatus'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import CommentList from '@components/commons/comment-list'
import ExportCriteriaEvaluation from '@components/modal/export-criteria-evaluation'

export type DataTabEvaluationCriterionType = StandardPeriod & {
    criteria: (CriterionPeriod & {
        evaluationCriterion?:
            | (EvaluationCriterion & {
                  evaluationCriterionComments?: (EvaluationCriterionComment & {
                      reviewer?: { fullname?: string | null }
                  })[]
                  lecturer?: { userProfile?: { fullname?: string | null } } | null
              })
            | null
    })[]
}

export type PutRequirementCriterion = {
    criteria: Record<string, any>
}

const CriteriaEvaluationSubPage = ({
    data,
    onRefetch,
}: {
    data: DataTabEvaluationCriterionType
    onRefetch?: () => void
}) => {
    const [form] = Form.useForm<PutRequirementCriterion>()
    const [showCommentsCriterionId, setShowCommentsCriterionId] = useState<string | null>(null)
    const [activeCollapseKeys, setActiveCollapseKeys] = useState<string[]>([])
    const { can } = useAbility()

    const canEdit = can(
        KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
        'THEM'
    )

    const { hideSpinner, showSpinner } = useSpinner()

    const statusConfig = getStatusConfig(
        data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK
    )

    const currentStatus =
        data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK

    const handleSubmit = async () => {
        const dataSubmit = form.getFieldsValue()

        let listSqlTransaction: any[] = []

        // Cập nhật các tiêu chí
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
                                    score: i.evaluationCriterion.score || '',
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

            if (!dataSubmit.criteria || dataSubmit.criteria.length === 0) {
                message.warning('Không có dữ liệu để nộp')
                return
            }
            showSpinner()

            const listSqlTransaction = dataSubmit.criteria.map(
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
                            },
                            data: {
                                status: $Enums.EvaluationStatus.SUBMITTED,
                            },
                        },
                    }
                }
            )

            const res = await sqlTransaction(listSqlTransaction)

            if (res.status !== 200) {
                message.error('Có lỗi xảy ra, vui lòng thử lại')
                return
            }

            message.success('Nộp phiếu đánh giá tiêu chí thành công')

            if (onRefetch) {
                onRefetch()
            }
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
                criteria: data?.criteria?.map((item) => ({
                    ...item,
                    evaluationCriterion: {
                        id: item.evaluationCriterion?.id,
                        criterionPeriodId: item.evaluationCriterion?.criterionPeriodId,
                        currentSituation: item.evaluationCriterion?.currentSituation || '',
                        strengths: item.evaluationCriterion?.strengths || '',
                        weakness: item.evaluationCriterion?.weakness || '',
                        actionPlan: item.evaluationCriterion?.actionPlan || '',
                        score: item.evaluationCriterion?.score || '',
                    },
                })),
            })
        }
    }, [data, form])

    // Tự động mở collapse cho các tiêu chí có comment khi ở trạng thái REJECTED
    useEffect(() => {
        if (data && currentStatus === $Enums.EvaluationStatus.REVISION) {
            const criteriaWithComments = data.criteria
                .filter((item) => {
                    const hasComments =
                        item.evaluationCriterion?.evaluationCriterionComments &&
                        item.evaluationCriterion.evaluationCriterionComments.length > 0
                    return hasComments
                })
                .map((item) => item.id)

            if (criteriaWithComments.length > 0) {
                setActiveCollapseKeys(criteriaWithComments)
            }
        }
    }, [data, currentStatus])

    const isReadOnly =
        !canEdit ||
        currentStatus === $Enums.EvaluationStatus.SUBMITTED ||
        currentStatus === $Enums.EvaluationStatus.APPROVED ||
        currentStatus === $Enums.EvaluationStatus.COMPLETED

    const deadline = data?.criteria?.[0]?.evaluationCriterion?.deadline
    const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null

    const headerSection = (
        <div className="sticky top-0 z-10 bg-white py-2 flex flex-row justify-between items-center gap-2">
            <div className="flex flex-row gap-4 items-center text-xs">
                <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">
                        Người viết phiếu:{' '}
                        {data?.criteria?.[0]?.evaluationCriterion?.lecturer?.userProfile
                            ?.fullname || 'Chưa phân công'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {deadline && deadlineStatus && deadlineStatus.text && (
                        <Tag color={deadlineStatus.color}>
                            Hạn: {dayjs(deadline).format('DD/MM/YYYY')}
                            {deadlineStatus.text && ` (${deadlineStatus.text})`}
                        </Tag>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">Trạng thái:</span>
                    <Tag color={statusConfig.color} className="text-xs">
                        {statusConfig.text}
                    </Tag>
                </div>
            </div>

            <div className="flex gap-2 mr-2">
                <ExportCriteriaEvaluation data={data} />
                {currentStatus !== $Enums.EvaluationStatus.SUBMITTED &&
                    currentStatus !== $Enums.EvaluationStatus.APPROVED &&
                    currentStatus !== $Enums.EvaluationStatus.COMPLETED && (
                        <>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleSubmit}
                                disabled={!canEdit}
                            >
                                Lưu đánh giá
                            </Button>
                            <Button
                                type="primary"
                                className="bg-blue-500"
                                size="small"
                                onClick={handleEvaluationForm}
                                disabled={!canEdit}
                            >
                                Nộp phiếu đánh giá
                            </Button>
                        </>
                    )}
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            {headerSection}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
                <Form form={form} layout="vertical" className="form-evidence">
                    <Form.List name="criteria">
                        {(fields) => (
                            <>
                                {fields.map(({ key, name }, idx: number) => {
                                    const item = data.criteria[name]
                                    return (
                                        <div key={key} style={{ marginBottom: 24 }}>
                                            <Collapse
                                                activeKey={activeCollapseKeys}
                                                onChange={(keys) =>
                                                    setActiveCollapseKeys(
                                                        Array.isArray(keys) ? keys : [keys]
                                                    )
                                                }
                                                items={[
                                                    {
                                                        label: (
                                                            <div>
                                                                <span className="font-bold">
                                                                    Tiêu chí {data.order}.
                                                                    {item.order}:{' '}
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
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={!isReadOnly}
                                                                        stickyToolbar={true}
                                                                    />
                                                                </Form.Item>

                                                                <Form.Item
                                                                    label="2. Điểm mạnh"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'strengths',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={!isReadOnly}
                                                                        stickyToolbar={true}
                                                                    />
                                                                </Form.Item>

                                                                <Form.Item
                                                                    label="3. Điểm tồn tại"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'weakness',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={!isReadOnly}
                                                                        stickyToolbar={true}
                                                                    />
                                                                </Form.Item>

                                                                <Form.Item
                                                                    label="4. Kế hoạch hành động"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'actionPlan',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={!isReadOnly}
                                                                        stickyToolbar={true}
                                                                    />
                                                                </Form.Item>
                                                                <Form.Item
                                                                    label="5. Tự đánh giá"
                                                                    name={[
                                                                        name,
                                                                        'evaluationCriterion',
                                                                        'score',
                                                                    ]}
                                                                >
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={!isReadOnly}
                                                                        stickyToolbar={true}
                                                                    />
                                                                </Form.Item>

                                                                {item.evaluationCriterion && (
                                                                    <>
                                                                        <div className="flex justify-end mb-4">
                                                                            <Badge
                                                                                count={
                                                                                    item
                                                                                        .evaluationCriterion
                                                                                        ?.evaluationCriterionComments
                                                                                        ?.length ||
                                                                                    0
                                                                                }
                                                                                showZero
                                                                                offset={[-5, 5]}
                                                                            >
                                                                                <Button
                                                                                    type="primary"
                                                                                    className="bg-yellow-400"
                                                                                    size="small"
                                                                                    onClick={() =>
                                                                                        setShowCommentsCriterionId(
                                                                                            showCommentsCriterionId ===
                                                                                                item
                                                                                                    .evaluationCriterion
                                                                                                    ?.id
                                                                                                ? null
                                                                                                : item
                                                                                                      .evaluationCriterion
                                                                                                      ?.id ||
                                                                                                      null
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {showCommentsCriterionId ===
                                                                                    item
                                                                                        .evaluationCriterion
                                                                                        ?.id
                                                                                        ? 'Đóng đánh giá'
                                                                                        : 'Xem đánh giá'}
                                                                                </Button>
                                                                            </Badge>
                                                                        </div>

                                                                        {showCommentsCriterionId ===
                                                                            item.evaluationCriterion
                                                                                ?.id && (
                                                                            <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                                                                                <CommentList
                                                                                    comments={
                                                                                        item
                                                                                            .evaluationCriterion
                                                                                            ?.evaluationCriterionComments ||
                                                                                        []
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </>
                                                        ),
                                                    },
                                                ]}
                                                bordered={true}
                                                expandIconPosition="end"
                                            />
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </Form.List>
                </Form>
            </div>
        </div>
    )
}

export default CriteriaEvaluationSubPage
