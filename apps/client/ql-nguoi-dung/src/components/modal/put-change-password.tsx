import FormItem from '@components/commons/form-item'
import PutFormModal, { type PutModalFormType } from '@components/commons/put-modal'
import { Col, Form, Input } from 'antd'
import { type ChangeEvent, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutChangePasswordFormType = {
    oldPassword: string
    newPassword: string
    confirmPassword: string
} & PutModalFormType
const PutChangePasswordModal = () => {
    const [isOldPasswordEntered, setIsOldPasswordEntered] = useState(false)

    const handleOldPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setIsOldPasswordEntered(!!e.target.value)
    }
    const [form] = Form.useForm<PutChangePasswordFormType>()
    const { isOpen, onClose, onOk, input } = useDisclosure<string>({
        tag: 'PutChangePasswordModal',
        onClose: form.resetFields,
    })

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            width={300}
            title="Đổi mật khẩu"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="oldPassword"
                    label="Mật khẩu hiện tại"
                    rules={[
                        {
                            required: true,
                            message: '• Vui lòng nhập mật khẩu hiện tại',
                        },
                    ]}
                >
                    <Input.Password onChange={handleOldPasswordChange} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="newPassword"
                    label="Mật khẩu mới"
                    rules={[
                        {
                            required: true,
                            message: '• Vui lòng nhập mật khẩu mới',
                        },
                        {
                            pattern: /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).+$/,
                            message:
                                '• Mật khẩu phải có ít nhất một chữ hoa, một ký tự đặc biệt và một số',
                        },
                        {
                            min: 8,
                            message: '• Mật khẩu phải có ít nhất 8 kí tự',
                        },
                    ]}
                >
                    <Input.Password disabled={!isOldPasswordEntered} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    dependencies={['newPassword']}
                    rules={[
                        {
                            required: true,
                            message: '• Vui lòng xác nhận mật khẩu',
                        },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const referencePassword = getFieldValue('newPassword')
                                if (!value || referencePassword === value) {
                                    return Promise.resolve()
                                }

                                return Promise.reject(new Error('• Mật khẩu xác nhận không khớp'))
                            },
                        }),
                    ]}
                >
                    <Input.Password disabled={!isOldPasswordEntered} />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutChangePasswordModal
