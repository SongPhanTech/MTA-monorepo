import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingLocation } from '@workspace/db'
import {
    useCreateTrainingLocation,
    useFindUniqueTrainingLocation,
    useUpdateTrainingLocation,
} from '@workspace/db/hooks'
import { Col, Form, Input, Radio, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutTrainingLocation = TrainingLocation
const PutTrainingLocationModal = () => {
    const [form] = Form.useForm<PutTrainingLocation>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingLocationModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createTrainingLocation } = useCreateTrainingLocation()
    const { mutateAsync: updateTrainingLocation } = useUpdateTrainingLocation()
    async function onOk(value: PutTrainingLocation) {
        try {
            showSpinner()
            if (id) {
                await updateTrainingLocation({
                    data: {
                        ...value,
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingLocation({
                    data: {
                        ...value,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingLocation'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data } = useFindUniqueTrainingLocation(
        {
            where: { id },
            include: {},
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
            title={
                id ? 'Chỉnh sửa khu vực đào tạo' : 'Thêm mới khu vực đào tạo'
            }
            className="w-[45vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã khu vực đào tạo"
                    required
                >
                    <Input placeholder="Nhập mã khu vực đào tạo" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên khu vực đào tạo"
                    required
                >
                    <Input placeholder="Nhập tên khu vực đào tạo" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name={'active'}
                    label="Trạng thái"
                    required
                >
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đang hoạt động</Radio>
                        <Radio value={false}>Ngừng hoạt động</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingLocationModal
