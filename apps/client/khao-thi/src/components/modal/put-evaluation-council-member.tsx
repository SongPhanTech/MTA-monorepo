import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { EVALUATION_MEMBER_ROLE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { EvaluationCouncilMember } from '@workspace/db'
import {
    useCreateEvaluationCouncilMember,
    useFindManyLecturer,
    useFindUniqueEvaluationCouncilMember,
    useUpdateEvaluationCouncilMember,
} from '@workspace/db/hooks'
import { Col, Form, message } from 'antd'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvaluationCouncilMemberType = EvaluationCouncilMember
const PutEvaluationCouncilMember = () => {
    const [form] = Form.useForm<PutEvaluationCouncilMemberType>()
    const router = useRouter()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutEvaluationCouncilMember',
        onClose: form.resetFields,
    })
    const evaluationCouncilId = router.query.id as string
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createEvaluationCouncilMember } = useCreateEvaluationCouncilMember()
    const { mutateAsync: updateEvaluationCouncilMember } = useUpdateEvaluationCouncilMember()
    async function onOk(output?: PutEvaluationCouncilMemberType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                evaluationCouncilId: evaluationCouncilId,
                lecturerId: output.lecturerId,
                role: output.role,
            }
            if (id && evaluationCouncilId) {
                await updateEvaluationCouncilMember({
                    data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createEvaluationCouncilMember({
                    data: {
                        ...data,
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['EvaluationCouncilMember'],
            })
            onClose()
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

    const { data: lecturerData = [] } = useFindManyLecturer({
        include: {
            userProfile: true,
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
    })

    const { data: initialValue } = useFindUniqueEvaluationCouncilMember(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa hội đồng đánh giá' : 'Thêm mới hội đồng đánh giá'}
            className="w-[600px]"
        >
            <Col span={24}>
                <FormItem form={form} name="lecturerId" label="Giáo viên">
                    <Select
                        placeholder="Chọn giáo viên"
                        options={lecturerData.map((i) => {
                            return {
                                value: i?.id,
                                label: `${i.code} - ${i?.userProfile?.fullname ? i?.userProfile?.fullname : `${i?.userProfile?.firstName} ${i?.userProfile?.lastName}`}`,
                            }
                        })}
                        // onChange={(val) =>handleMajorChange(val)}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="role" label="Chức vụ trong hội đồng" required>
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn chương mục"
                        options={EVALUATION_MEMBER_ROLE}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutEvaluationCouncilMember
