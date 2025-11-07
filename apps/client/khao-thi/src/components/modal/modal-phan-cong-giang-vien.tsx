import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import LecturerSelector from '@components/commons/lecturer-selector'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useFindUniqueCriterionPeriod } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Col, Form, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type CriteriaAssignmentModalFormType = {
    lecturerId: string
    deadline: Date
}

export default function CriteriaAssignmentModal() {
    const [form] = Form.useForm<CriteriaAssignmentModalFormType>()

    const { isOpen, onClose, input } = useDisclosure<{
        criterionPeriodId?: string
    }>({
        tag: 'CriteriaAssignmentModal',
        onClose() {
            form.resetFields()
        },
    })

    const { hideSpinner, showSpinner } = useSpinner()

    const { data: initValue } = useFindUniqueCriterionPeriod(
        {
            where: {
                id: input?.criterionPeriodId,
            },
            include: {
                analysisCriterions: true,
            },
        },
        {
            enabled: !!input?.criterionPeriodId,
        }
    )

    useEffect(() => {
        if (initValue) {
            form.setFieldsValue({
                lecturerId: initValue.analysisCriterions?.lecturerId || '',
                deadline: initValue.analysisCriterions?.deadline
                    ? dayjs(initValue.analysisCriterions?.deadline)
                    : undefined,
            })
        }
    }, [initValue, form])

    const onOk = async (values: CriteriaAssignmentModalFormType) => {
        try {
            showSpinner()
            if (!values || !input?.criterionPeriodId) return

            const res = await sqlTransaction([
                {
                    model: 'AnalysisCriterion',
                    operation: 'delete',
                    data: {
                        where: {
                            criterionPeriodId: input?.criterionPeriodId,
                        },
                    },
                },
                {
                    model: 'EvaluationCriterion',
                    operation: 'delete',
                    data: {
                        where: {
                            criterionPeriodId: input?.criterionPeriodId,
                        },
                    },
                },
                {
                    model: 'AnalysisCriterion',
                    operation: 'create',
                    data: {
                        data: {
                            lecturerId: values.lecturerId,
                            deadline: values.deadline,
                        },
                    },
                },
                {
                    model: 'EvaluationCriterion',
                    operation: 'create',
                    data: {
                        data: {
                            lecturerId: values.lecturerId,
                            deadline: values.deadline,
                        },
                    },
                },
            ])

            if (res.status !== 200) {
                message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
                return
            }

            queryClient.invalidateQueries({
                queryKey: ['CriterionAssignment'],
            })
            queryClient.invalidateQueries({
                queryKey: ['EvaluationCriterion'],
            })

            onClose()
        } catch (error: any) {
            message.error(error.message || 'Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <PutFormModal
            title={input?.criterionPeriodId ? 'Chỉnh sửa giảng viên' : 'Thêm giảng viên'}
            open={isOpen}
            onCancel={onClose}
            form={form}
            onFinish={onOk}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="lecturerId" label="Giảng viên" required>
                    <LecturerSelector />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="deadline" label="Hạn hoàn thành" required>
                    <DatePicker
                        className="w-full"
                        format={'DD/MM/YYYY'}
                        disabledDate={(current) => current?.isBefore(dayjs(), 'day')}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
