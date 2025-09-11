import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { fetchCreateUser } from '@api/open-api/appComponents'
import logo_mta from '@assets/images/logo_mta.png'
import { Button, Form, Input, message, Typography } from 'antd'
import Image from 'next/image'
import { useState } from 'react'
import { env } from '@/env'

export type DangKyTaiKhoanFormType = {
    username: string
    name: string
    email: string
    password: string
    confirmPassword: string
}

export default function DangKyTaiKhoanPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [form] = Form.useForm<DangKyTaiKhoanFormType>()
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStatus, setPasswordStatus] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
    })
    const [passwordValue, setPasswordValue] = useState('')

    const validatePassword = (value: string) => {
        setPasswordStatus({
            length: value.length >= 8,
            lowercase: /[a-z]/.test(value),
            uppercase: /[A-Z]/.test(value),
            number: /\d/.test(value),
            special: /[\W_]/.test(value),
        })
    }

    const onFinish = async (values: DangKyTaiKhoanFormType) => {
        setIsLoading(true)
        try {
            const _response = await fetchCreateUser({
                body: {
                    email: String(values.email),
                    password: String(values.password),
                    userName: values.username,
                    name: values.name,
                    description: 'Tài khoản trợ lý ảo',
                    groupIds: [],
                },
            })
            form.resetFields()
            setShowConfirmPassword(false)
            setPasswordStatus({
                length: false,
                lowercase: false,
                uppercase: false,
                number: false,
                special: false,
            })
            setPasswordValue('')
            message.success('Đăng ký tài khoản trợ lý ảo thành công!')
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Có lỗi xảy ra. Vui lòng thử lại sau.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white shadow-lg rounded-2xl px-8 py-10 w-full max-w-md">
                <div className="">
                    <Image src={logo_mta} alt="logo_mta" className="w-16 h-16 mx-auto mb-4" />
                </div>
                <Typography.Title level={3} className="text-center mb-4">
                    Đăng ký tài khoản Trợ lý ảo
                </Typography.Title>

                <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
                    <Form.Item
                        name="name"
                        label="Họ và tên"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập họ và tên',
                            },
                        ]}
                    >
                        <Input size="large" placeholder="Nhập họ và tên" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            {
                                type: 'email',
                                message: 'Email không đúng định dạng',
                            },
                        ]}
                    >
                        <Input size="large" placeholder="Nhập email" />
                    </Form.Item>

                    <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập tên đăng nhập',
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            prefix={<UserOutlined className="text-primary" />}
                            placeholder="Nhập tên đăng nhập"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập mật khẩu',
                            },
                            {
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
                                message:
                                    'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
                            },
                        ]}
                        hasFeedback
                        style={{ marginBottom: 8 }}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined className="text-primary" />}
                            placeholder="Nhập mật khẩu"
                            onChange={(e) => {
                                const value = e.target.value
                                setPasswordValue(value)
                                setShowConfirmPassword(!!value)
                                validatePassword(value)
                            }}
                        />
                    </Form.Item>
                    {passwordValue && (
                        <div className="mb-4 text-sm space-y-1 pl-2">
                            <div
                                className={
                                    passwordStatus.length ? 'text-green-600' : 'text-red-500'
                                }
                            >
                                {passwordStatus.length ? '✓' : '✗'} Ít nhất 8 ký tự
                            </div>
                            <div
                                className={
                                    passwordStatus.lowercase ? 'text-green-600' : 'text-red-500'
                                }
                            >
                                {passwordStatus.lowercase ? '✓' : '✗'} Có chữ thường
                            </div>
                            <div
                                className={
                                    passwordStatus.uppercase ? 'text-green-600' : 'text-red-500'
                                }
                            >
                                {passwordStatus.uppercase ? '✓' : '✗'} Có chữ hoa
                            </div>
                            <div
                                className={
                                    passwordStatus.number ? 'text-green-600' : 'text-red-500'
                                }
                            >
                                {passwordStatus.number ? '✓' : '✗'} Có số
                            </div>
                            <div
                                className={
                                    passwordStatus.special ? 'text-green-600' : 'text-red-500'
                                }
                            >
                                {passwordStatus.special ? '✓' : '✗'} Có ký tự đặc biệt
                            </div>
                        </div>
                    )}

                    {showConfirmPassword && (
                        <Form.Item
                            name="confirmPassword"
                            label="Xác nhận mật khẩu"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng xác nhận mật khẩu',
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve()
                                        }
                                        return Promise.reject(
                                            new Error('Mật khẩu xác nhận không khớp')
                                        )
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                size="large"
                                prefix={<LockOutlined className="text-primary" />}
                                placeholder="Xác nhận mật khẩu"
                            />
                        </Form.Item>
                    )}

                    <Form.Item className="mt-6">
                        <Button
                            type="default"
                            htmlType="submit"
                            block
                            size="large"
                            className="bg-primary text-white"
                            loading={isLoading}
                        >
                            Đăng ký
                        </Button>
                    </Form.Item>
                    <div className="text-center mt">
                        <span className="text-gray-600">Đã có tài khoản?</span>
                        <Button
                            type="link"
                            className="ml-2 p-0 text-primary"
                            onClick={() => {
                                window.location.href = env.NEXT_PUBLIC_TRO_LY_AO_URL
                            }}
                        >
                            Đăng nhập
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}
