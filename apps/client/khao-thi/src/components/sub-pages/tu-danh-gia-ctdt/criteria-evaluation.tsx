import { RichTextEditor } from '@components/commons/rich-text-editor'
import useSpinner from '@hooks/spinner'
import { Button, Collapse, Form, message, Tag, Badge } from 'antd'
import { useEffect, useState } from 'react'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import { $Enums, type CriterionPeriod, type EvaluationCriterion } from '@workspace/db/client'
import { useUpdateEvaluationPeriod } from '@workspace/db/hooks'
import dayjs from 'dayjs'
import { getStatusConfig } from '@constants/constants'
import { getDeadlineStatus } from '@/utils/getDeadlineStatus'
import { useStore } from '@tanstack/react-store'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import CommentList from '@components/commons/comment-list'

export type PutRequirementCriterion = {
    criteria: Record<string, any>
    opening: string
    conclusion: string
}

const CriteriaEvaluationSubPage = ({
    data,
    onRefetch,
}: {
    data: DataTabEvaluationCriterionType
    onRefetch?: () => void
}) => {
    const [form] = Form.useForm<PutRequirementCriterion>()
    const [showComments, setShowComments] = useState(false)
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const { can } = useAbility()

    const canEdit = can(
        KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI,
        'THEM'
    )

    const { hideSpinner, showSpinner } = useSpinner()

    const handleSubmit = async () => {
        const dataSubmit = form.getFieldsValue()

        let listSqlTransaction: any[] = []

        // Cập nhật opening và conclusion cho StandardPeriod
        if (data?.id) {
            listSqlTransaction.push({
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
            })
        }

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

    const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()

    const checkAndUpdateEvaluationPeriodStatus = async () => {
        if (!selectedEvaluationPeriodId) return

        try {
            const totalCriteria = await sqlTransaction([
                {
                    model: 'EvaluationCriterion',
                    operation: 'count',
                    data: {
                        where: {
                            criterionPeriod: {
                                evaluationStandard: {
                                    periodId: selectedEvaluationPeriodId,
                                },
                            },
                            deletedAt: null,
                        },
                    },
                },
            ])

            const submittedEvaluationCriterion = await sqlTransaction([
                {
                    model: 'EvaluationCriterion',
                    operation: 'count',
                    data: {
                        where: {
                            criterionPeriod: {
                                evaluationStandard: {
                                    periodId: selectedEvaluationPeriodId,
                                },
                            },
                            status: $Enums.EvaluationStatus.SUBMITTED,
                            deletedAt: null,
                        },
                    },
                },
            ])

            if (
                (totalCriteria.data[0] as number) > 0 &&
                totalCriteria.data[0] === submittedEvaluationCriterion.data[0]
            ) {
                await updateEvaluationPeriod({
                    where: {
                        id: selectedEvaluationPeriodId,
                    },
                    data: {
                        status: $Enums.EvaluationPeriodStatus.CROSS_REVIEW_ASSIGNMENT,
                    },
                })
            }
        } catch (error) {
            console.error('Error updating evaluation period status:', error)
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

            await checkAndUpdateEvaluationPeriodStatus()

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
                opening: data?.opening || '',
                conclusion: data?.conclusion || '',
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
            })
        }
    }, [data, form])

    const statusConfig = getStatusConfig(
        data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK
    )

    const currentStatus =
        data?.criteria?.[0]?.evaluationCriterion?.status || $Enums.EvaluationStatus.LOCK

    const commentsCount =
        data?.criteria?.[0]?.evaluationCriterion?.evaluationCriterionComments?.length || 0

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
                <Badge count={commentsCount} showZero offset={[-5, 5]}>
                    <Button
                        type="primary"
                        className="bg-yellow-400"
                        size="small"
                        onClick={() => setShowComments(!showComments)}
                    >
                        Xem đánh giá
                    </Button>
                </Badge>
                {currentStatus !== $Enums.EvaluationStatus.SUBMITTED &&
                    currentStatus !== $Enums.EvaluationStatus.APPROVED &&
                    currentStatus !== $Enums.EvaluationStatus.COMPLETED && (
                        <>
                            <Button
                                type="primary"
                                className="bg-blue-500"
                                size="small"
                                onClick={handleEvaluationForm}
                                disabled={!canEdit}
                            >
                                Nộp phiếu đánh giá
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleSubmit}
                                disabled={!canEdit}
                            >
                                Lưu đánh giá
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
                {showComments && (
                    <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                        <CommentList
                            comments={
                                data?.criteria?.[0]?.evaluationCriterion
                                    ?.evaluationCriterionComments || []
                            }
                        />
                    </div>
                )}

                <Form form={form} layout="vertical" className="form-evidence">
                    {/* Phần mở đầu */}
                    <Form.Item label="Mở đầu" name="opening" required>
                        <RichTextEditor id="opening" editable={!isReadOnly} />
                    </Form.Item>

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
                                                                    <RichTextEditor
                                                                        id={item.id}
                                                                        editable={!isReadOnly}
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
                                                                    />
                                                                </Form.Item>
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

                    {/* Phần kết luận */}
                    <Form.Item label="Kết luận" name="conclusion" required>
                        <RichTextEditor id="conclusion" editable={!isReadOnly} />
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}

export default CriteriaEvaluationSubPage
