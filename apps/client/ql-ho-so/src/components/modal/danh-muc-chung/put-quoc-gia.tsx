import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { DM_QuocGia } from '@workspace/db'
import { useCreateDM_QuocGia, useUpdateDM_QuocGia } from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function QuocGiaModal() {
    const [form] = Form.useForm<DM_QuocGia>()

    const { isOpen, onClose, input } = useDisclosure<Partial<DM_QuocGia>>({
        tag: 'PutDanhMucQuocGiaModal',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createDM_NhomMau } = useCreateDM_QuocGia()
    const { mutateAsync: updateDM_NhomMau } = useUpdateDM_QuocGia()

    async function onOk(output: DM_QuocGia) {
        if (!output) return
        try {
            showSpinner()
            if (input?.id) {
                await updateDM_QuocGia({
                    where: {
                        id: input.id,
                    },
                    data: {
                        name: output.sTen.trim(),
                        description: output.sGhiChu,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createDM_QuocGia({
                    data: {
                        name: output.sTen.trim(),
                        description: output.sGhiChu,
                    },
                })
                message.success('Thêm mới thành công')
            }
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    useEffect(() => {
        if (input && isOpen) {
            form.setFieldsValue({
                name: input.sTen,
                description: input.sGhiChu,
            })
        }
    }, [input, isOpen, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input?.id ? 'Cập nhật quốc tịch' : 'Thêm mới quốc tịch'}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Tên quốc tịch" name="name" required form={form}>
                    <Input placeholder="Nhập tên quốc tịch" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Mô tả" name="description" form={form}>
                    <Input.TextArea rows={3} placeholder="Nhập ghi chú" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
