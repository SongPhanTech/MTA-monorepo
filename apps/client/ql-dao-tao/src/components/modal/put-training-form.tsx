import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingForm } from '@workspace/db'
import {
    useCreateTrainingForm,
    useFindUniqueTrainingForm,
    useUpdateTrainingForm,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutRoom = TrainingForm
const PutTrainingFormModal = () => {
    const [form] = Form.useForm<PutRoom>()
    const { isOpen, onClose, input } = useDisclosure<{
        id?: string
    }>({
        tag: PutTrainingFormModal.name,
        onClose: form.resetFields,
    })

    const id = input?.id
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateTrainingForm()
    const { mutateAsync: update } = useUpdateTrainingForm()
    async function onOk(value: PutRoom) {
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        ...value,
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await create({
                    data: {
                        ...value,
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['Room'],
            })
            queryClient.invalidateQueries({
                queryKey: ['Building'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data } = useFindUniqueTrainingForm(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                ...data,
            })
        } else {
            form.setFieldsValue({
                active: true,
            })
        }
    }, [data])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa hình thức huấn luyên' : 'Thêm mới thời gian đào tạog'}
            className="w-[45vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã hình thức huấn luyên" required>
                    <Input placeholder="Nhập mã hình thức huấn luyên" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên hình thức huấn luyên" required>
                    <Input placeholder="Nhập tên hình thức huấn luyên" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name={'active'} label="Trạng thái" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đang hoạt động</Radio>
                        <Radio value={false}>Ngừng hoạt động</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingFormModal
