import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { RELATIONSHIP_OPTIONS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { Relative } from '@workspace/db'
import { Col, Form, Input, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutThongTinThanNhan() {
    const [form] = Form.useForm<Relative>()

    const { isOpen, onClose, input } = useDisclosure<
        Partial<Relative> & { onSave: (val: Relative) => void }
    >({
        tag: PutThongTinThanNhan.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    async function onOk(output: Relative) {
        try {
            showSpinner()
            if (input?.onSave) {
                input.onSave(output)
            }
            message.success(
                isEdit
                    ? 'Cập nhật thông tin thân nhân thành công'
                    : 'Thêm mới thông tin thân nhân thành công'
            )
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    useEffect(() => {
        if (isOpen && input) {
            const { onSave, ...formData } = input
            if (Object.keys(formData).length > 0) {
                form.setFieldsValue(formData)
            }
        }
    }, [isOpen, input, form])

    const isEdit = input && Object.keys(input).some((key) => key !== 'onSave')

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={isEdit ? 'Cập nhật thông tin thân nhân' : 'Thêm mới thông tin thân nhân'}
            layout="vertical"
            className="w-[40vw]"
        >
            <Col span={24}>
                <FormItem label="Tên thân nhân" name="name" required form={form}>
                    <Input placeholder="Nhập tên nhân thân" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Tên mối quan hệ" name="type" required form={form}>
                    <Select
                        placeholder="Chọn mối quan hệ"
                        options={RELATIONSHIP_OPTIONS.map((i) => ({
                            label: i.label,
                            value: i.value,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Năm sinh" name="birthYear" form={form}>
                    <InputNumber
                        precision={0}
                        style={{ width: '100%' }}
                        max={new Date().getFullYear()}
                        min={0}
                        placeholder="Nhập năm sinh"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Nhập nghề nghiệp" name="job" form={form}>
                    <Input placeholder="Nhập tên nghề nghiệp" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Tên thông tin khác" name="information" form={form}>
                    <Input placeholder="Nhập tên thông tin khác" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
