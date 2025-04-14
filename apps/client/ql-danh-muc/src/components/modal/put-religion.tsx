import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Religion } from '@workspace/db'
import {
    useCreateReligion,
    useFindUniqueReligion,
    useUpdateReligion,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutReligionType = Religion
const PutReligionModal = () => {
    const [form] = Form.useForm<Religion>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutReligionModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createLevel } = useCreateReligion()
    const { mutateAsync: updateLevel } = useUpdateReligion()
    async function onOk(output?: Religion) {
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
                        code: output.code,
                        name: output.name,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TraningForm'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueReligion({
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
            title={id ? 'Chỉnh sửa tôn giáo' : 'Thêm mới tôn giáo'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã tôn giáo" required>
                    <Input placeholder="Nhập mã tôn giáo" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên tôn giáo" required>
                    <Input placeholder="Nhập tôn giáo" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutReligionModal
