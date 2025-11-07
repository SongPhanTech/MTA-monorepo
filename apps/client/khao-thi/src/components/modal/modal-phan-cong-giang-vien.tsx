import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import LecturerSelector from '@components/commons/lecturer-selector'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useFindManyLecturer, useFindUniqueEvaluationCriterion } from '@workspace/db/hooks'
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
        evaluationCriterionId?: string
    }>({
        tag: 'CriteriaAssignmentModal',
        onClose() {
            form.resetFields()
        },
    })

    const { hideSpinner, showSpinner } = useSpinner()

    const { data: lecturers = [] } = useFindManyLecturer({
        where: {
            deletedAt: null,
        },
        include: {
            userProfile: {
                include: {
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
        },
    })

    const { data: initValue } = useFindUniqueEvaluationCriterion(
        {
            where: {
                id: input?.evaluationCriterionId,
            },
            include: {
                criterionAssignments: {
                    select: {
                        lecturerId: true,
                        deadline: true,
                        id: true,
                    },
                },
            },
        },
        {
            enabled: !!input?.evaluationCriterionId,
        }
    )

    useEffect(() => {
        if (initValue) {
            form.setFieldsValue({
                lecturerId: initValue.criterionAssignments[0]?.lecturerId,
                deadline: initValue.criterionAssignments[0]?.deadline
                    ? dayjs(initValue.criterionAssignments[0]?.deadline)
                    : undefined,
            })
        }
    }, [initValue, form])

    const { mutateAsync: createCriterionAssignment } = useCreateCriterionAssignment()
    const { mutateAsync: updateCriterionAssignment } = useUpdateCriterionAssignment()

    const onOk = async (values: CriteriaAssignmentModalFormType) => {
        try {
            showSpinner()
            if (!values || !input?.evaluationCriterionId) return

            const existingAssignment = initValue?.criterionAssignments?.[0]

            if (existingAssignment?.id) {
                await updateCriterionAssignment({
                    where: {
                        id: existingAssignment.id,
                    },
                    data: {
                        lecturerId: values.lecturerId,
                        deadline: dayjs(values.deadline).toDate(),
                    },
                })
                message.success('Cập nhật phân công giảng viên thành công')
            } else {
                await createCriterionAssignment({
                    data: {
                        evaluationCriterionId: input.evaluationCriterionId,
                        lecturerId: values.lecturerId,
                        deadline: dayjs(values.deadline).toDate(),
                    },
                })
                message.success('Thêm phân công giảng viên thành công')
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
            title={input?.evaluationCriterionId ? 'Chỉnh sửa giảng viên' : 'Thêm giảng viên'}
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
