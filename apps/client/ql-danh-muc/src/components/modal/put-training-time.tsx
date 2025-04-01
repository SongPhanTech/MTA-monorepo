import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingTime } from "@workspace/db"
import {
    useCreateTrainingTime,
    useFindUniqueTrainingTime,
    useUpdateTrainingTime,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutTrainingTimeType = TrainingTime
const PutTrainingTimeModal = () => {
    const [form] = Form.useForm<TrainingTime>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingTimeModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createLevel } = useCreateTrainingTime()
    const { mutateAsync: updateLevel } = useUpdateTrainingTime()
    async function onOk(output?: TrainingTime) {
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
                queryKey: ['TraningTime'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueTrainingTime({
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
                    ? 'Chỉnh sửa thời gian đào tạo'
                    : 'Thêm mới thời gian đào tạo'
            }
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã thời gian đào tạo"
                    required
                >
                    <Input placeholder='Nhập mã thời gian đào tạo' />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên thời gian đào tạo"
                    required
                >
                    <Input placeholder="Nhập thời gian đào tạo" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingTimeModal
