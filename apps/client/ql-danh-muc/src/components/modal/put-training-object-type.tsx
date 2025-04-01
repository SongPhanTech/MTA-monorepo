import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingObjectType } from "@workspace/db"
import {
    useCreateTrainingObjectType,
    useFindUniqueTrainingObjectType,
    useUpdateTrainingObjectType,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutTrainingObjectType = TrainingObjectType
const PutTrainingObjectTypeModal = () => {
    const [form] = Form.useForm<TrainingObjectType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingObjectTypeModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createLevel } = useCreateTrainingObjectType()
    const { mutateAsync: updateLevel } = useUpdateTrainingObjectType()
    async function onOk(output?: TrainingObjectType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateLevel({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createLevel({
                    data: {
                        code : output.code,
                        name: output.name,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TraningObjectType'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueTrainingObjectType({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa đối tượng đào tạo'
                    : 'Thêm mới đối tượng đào tạo'
            }
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã đối tượng đào tạo"
                    required
                >
                    <Input placeholder='Nhập mã đối tượng đào tạo' />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên đối tượng đào tào"
                    required
                >
                    <Input placeholder="Nhập tên đối tượng đào tạo" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingObjectTypeModal
