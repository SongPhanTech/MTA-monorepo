import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { DM_MoiQuanHe } from '@workspace/db'
import { useCreateDM_MoiQuanHe, useUpdateDM_MoiQuanHe } from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function MoiQuanHeModal() {
    const [form] = Form.useForm<DM_MoiQuanHe>()

    const { isOpen, onClose, input } = useDisclosure<Partial<DM_MoiQuanHe>>({
        tag: MoiQuanHeModal.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createDM_MoiQuanHe } = useCreateDM_MoiQuanHe()
    const { mutateAsync: updateDM_MoiQuanHe } = useUpdateDM_MoiQuanHe()

    async function onOk(output: DM_MoiQuanHe) {
        console.log(output)
        if (!output) return
        try {
            showSpinner()
            if (input?.id) {
                await updateDM_MoiQuanHe({
                    where: {
                        id: input.id,
                    },
                    data: {
                        name: output.name,
                        description: output.description,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createDM_MoiQuanHe({
                    data: {
                        name: output.name,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    useEffect(() => {
        if (input && isOpen) {
            form.setFieldsValue({
                name: input.name,
                description: input.description,
            })
        }
    }, [input, isOpen, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input?.id ? 'Cập nhật mối quan hệ thân nhân' : 'Thêm mới mối quan hệ thân nhân'}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Tên mối quan hệ" name="name" required form={form}>
                    <Input placeholder="Nhập tên mối quan hệ" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Mô tả" name="description" form={form}>
                    <Input.TextArea rows={3} placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
