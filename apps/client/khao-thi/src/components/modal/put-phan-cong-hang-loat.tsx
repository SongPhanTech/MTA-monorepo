import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import LecturerSelector from '@components/commons/lecturer-selector'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { PutPhanCongHangLoatModalProps } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/assigment'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Col, Form, message, Tree } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type CriteriaAssignmentModalFormType = {
    lecturerId: string
    deadline: Date
}

export default function PutPhanCongHangLoatModal() {
    const [form] = Form.useForm<CriteriaAssignmentModalFormType>()
    const { showSpinner, hideSpinner } = useSpinner()

    const { isOpen, onClose, input } = useDisclosure<PutPhanCongHangLoatModalProps>({
        tag: 'PutPhanCongHangLoatModal',
        onClose: form.resetFields,
    })

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

    const handleFinish = async (values: CriteriaAssignmentModalFormType) => {
        try {
            if (!values) return
            showSpinner()
            if (input?.selectedCriteriaIds) {
                const operations: any[] = input.selectedCriteriaIds.flatMap((criterionId) => [
                    {
                        model: 'AnalysisCriterion',
                        operation: 'upsert',
                        data: {
                            where: {
                                criterionPeriodId: criterionId,
                            },
                            create: {
                                criterionPeriodId: criterionId,
                                lecturerId: values.lecturerId,
                                deadline: values.deadline
                                    ? dayjs(values.deadline).toISOString()
                                    : undefined,
                            },
                            update: {
                                lecturerId: values.lecturerId,
                                deadline: values.deadline
                                    ? dayjs(values.deadline).toISOString()
                                    : undefined,
                            },
                        },
                    },
                    {
                        model: 'EvaluationCriterion',
                        operation: 'upsert',
                        data: {
                            where: {
                                criterionPeriodId: criterionId,
                            },
                            create: {
                                criterionPeriodId: criterionId,
                                lecturerId: values.lecturerId,
                                deadline: values.deadline
                                    ? dayjs(values.deadline).toISOString()
                                    : undefined,
                            },
                            update: {
                                lecturerId: values.lecturerId,
                                deadline: values.deadline
                                    ? dayjs(values.deadline).toISOString()
                                    : undefined,
                            },
                        },
                    },
                ])

                const res = await sqlTransaction(operations)

                if (res.status !== 200) {
                    message.error('Đã có lỗi xảy ra, vui lòng thử lại')
                    return
                }

                message.success('Phân công giảng viên đánh giá hàng loạt thành công')
                if (input?.refetch) {
                    input.refetch()
                }
                if (input?.clearSelected) {
                    input.clearSelected()
                }
                onClose()
            }
        } catch (error) {
            message.error('Phân công giảng viên đánh giá hàng loạt thất bại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <PutFormModal
            title="Phân công giảng viên đánh giá hàng loạt"
            form={form}
            open={isOpen}
            onCancel={onClose}
            onFinish={handleFinish}
            className="w-[40vw]"
        >
            <Col span={24}>
                <FormItem label="Chọn giảng viên" form={form} name="lecturerId" required>
                    <LecturerSelector />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Hạn hoàn thành" form={form} name="deadline" required>
                    <DatePicker
                        className="w-full"
                        format={'DD/MM/YYYY'}
                        disabledDate={(current) => current?.isBefore(dayjs(), 'day')}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <h3>Các tiêu chí đã chọn:</h3>
                <Tree defaultExpandAll treeData={treeData} selectable={false} />
            </Col>
        </PutFormModal>
    )
}
