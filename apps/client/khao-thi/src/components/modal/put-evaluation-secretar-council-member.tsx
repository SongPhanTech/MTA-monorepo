import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'

import { Col, Form, message } from 'antd'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const PutEvaluationSecretaryMember = () => {
    const [form] = Form.useForm<PutEvaluationSecretaryMemberType>()
    const router = useRouter()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutEvaluationSecretaryMember',
        onClose: form.resetFields,
    })
    const evaluationSecretaryId = router.query.id as string
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createEvaluationSecretaryMember } = useCreateEvaluationSecretaryMember()
    const { mutateAsync: updateEvaluationSecretaryMember } = useUpdateEvaluationSecretaryMember()
    async function onOk(output?: PutEvaluationSecretaryMemberType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                evaluationSecretarYCouncilId: evaluationSecretaryId,
                lecturerId: output.lecturerId,
                role: output.role,
            }
            if (id && evaluationSecretaryId) {
                await updateEvaluationSecretaryMember({
                    data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createEvaluationSecretaryMember({
                    data: {
                        ...data,
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['EvaluationSecretaryMember'],
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

    const { data: initialValue } = useFindUniqueEvaluationSecretaryMember(
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
            title={id ? 'Chỉnh sửa hội đồng thư ký' : 'Thêm mới hội đồng thư ký'}
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
                <FormItem form={form} name="role" label="Chương mục" required>
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn chương mục"
                        options={EVALUATION_SECRETARY_MEMBER_ROLE}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutEvaluationSecretaryMember
