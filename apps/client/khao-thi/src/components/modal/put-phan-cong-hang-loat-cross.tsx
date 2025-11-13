import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import type { PutPhanCongHangLoatCrossModalInput } from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/cross-review-assignment'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useFindManyUserProfile } from '@workspace/db/hooks'
import { Col, Form, Tree } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type CrossReviewAssignmentModalFormType = {
    reviewerId: string
    deadlineReview: Date
}

export default function PutPhanCongHangLoatCrossModal() {
    const [form] = Form.useForm<CrossReviewAssignmentModalFormType>()

    const { isOpen, onClose, input } = useDisclosure<PutPhanCongHangLoatCrossModalInput>({
        tag: 'PutPhanCongHangLoatCrossModal',
    })

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const { data: lecturers = [] } = useFindManyUserProfile(
        {
            where: {
                lecturer: {
                    evaluationCouncilMember: {
                        some: {
                            deletedAt: null,
                            evaluationCouncil: {
                                periodId: selectedEvaluationPeriodId || '',
                            },
                        },
                    },
                },
            },
            select: {
                id: true,
                fullname: true,
                firstName: true,
                lastName: true,
                academicDegreeType: {
                    select: {
                        sTen: true,
                    },
                },
                academicRankType: {
                    select: {
                        sTen: true,
                    },
                },
            },
        },
        {
            enabled: isOpen && !!selectedEvaluationPeriodId,
        }
    )

    const treeData = useMemo(() => {
        if (!input?.tableData || !input?.selectedCriteriaIds) return []

        return input.tableData
            .filter((standard) => {
                const hasCriteria = standard.criteria?.some((criterion) =>
                    input.selectedCriteriaIds?.includes(criterion.id)
                )
                return hasCriteria
            })
            .map((standard) => ({
                title: `Tiêu chuẩn ${standard.order}: ${standard.name}`,
                key: standard.id,
                children: standard.criteria
                    ?.filter((criterion) => input.selectedCriteriaIds?.includes(criterion.id))
                    .map((criterion) => ({
                        title: `Tiêu chí ${criterion.order}: ${criterion.name}`,
                        key: criterion.id,
                    })),
            }))
    }, [input?.tableData, input?.selectedCriteriaIds])

    const handleFinish = async () => {}

    return (
        <PutFormModal
            form={form}
            title="Phân công đánh giá chéo hàng loạt"
            open={isOpen}
            onCancel={onClose}
            onFinish={handleFinish}
            className="w-[40vw]"
        >
            <Col span={24}>
                <FormItem form={form} label="Chọn giảng viên phản biện" name="reviewerId" required>
                    <Select
                        placeholder="Chọn người phản biện"
                        className="w-full"
                        options={lecturers.map((i) => {
                            const academicRank = i.academicRankType?.sTen || ''
                            const degreeRank = i.academicDegreeType?.sTen || ''

                            const fullName = i.fullname
                                ? i.fullname
                                : `${i.firstName} ${i.lastName}`

                            const academicTitle = [academicRank, degreeRank]
                                .filter(Boolean)
                                .join('.')

                            return {
                                value: i?.id,
                                label: `${academicTitle ? `${academicTitle} ` : ''}${fullName}`,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} label="Hạn phản biện" name="deadlineReview">
                    <DatePicker
                        className="w-full"
                        format="DD/MM/YYYY"
                        disabledDate={(current) => current?.isBefore(dayjs(), 'day')}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <h3>Các tiêu chí đã chọn</h3>
                <Tree defaultExpandAll treeData={treeData} selectable={false} />
            </Col>
        </PutFormModal>
    )
}
