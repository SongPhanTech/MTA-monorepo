import { EditFilled } from '@ant-design/icons'
import FormItem from '@components/commons/form-item'
import PutFormModal, {
    type PutModalFormType,
} from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useDisclosure from '@hooks/disclosure'
import { useFindManyGroup, useFindUniqueUser } from '@workspace/db/hooks'
import { Col, Form, Input, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
export type PutUserFormType = {
    id?: string
    username: string
    name: string
    email?: string
    groups?: string[]
    password?: string
    confirmPassword?: string
} & PutModalFormType
const PutNguoiDungModal = () => {
    const [isAllowEditPassword, setIsAllowEditPassword] = useState(false)
    const [form] = Form.useForm<PutUserFormType>()
    const {
        isOpen,
        onClose,
        onOk,
        input: id,
    } = useDisclosure<string>({
        tag: PutNguoiDungModal.name,
        onClose: form.resetFields,
    })
    const { data: user } = useFindUniqueUser({
        where: {
            id: id,
        },
        include: {
            groups: true,
        },
    })

    const { data: groups = [] } = useFindManyGroup()

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                id: user.id,
                description: user.description || '',
                email: user.email || '',
                name: user.name,
                username: user.userName,
                groups: user.groups.map((group) => group.id),
            })
        }
    }, [user])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={id ? 'Chỉnh sửa tài khoản' : 'Thêm mới tài khoản'}
        >
            <FormItem form={form} name="id" hidden>
                <Input />
            </FormItem>
            <Col span={12}>
                <FormItem form={form} name="name" label="Họ và tên" required>
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="email"
                    label="Email"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập email',
                        },
                        {
                            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Email không đúng định dạng',
                        },
                    ]}
                >
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="username"
                    label="Tên đăng nhập"
                    required
                >
                    <Input disabled={!!id} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="groups" label="Nhóm người dùng">
                    <Select
                        mode="multiple"
                        allowClear
                        placeholder="Chọn nhóm người dùng"
                        options={groups.map((group) => ({
                            label: group.name,
                            value: group.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="password"
                    label={
                        <div className="flex justify-between gap-2">
                            {!!id && (
                                <Tooltip title={'Đổi mật khẩu'}>
                                    <EditFilled
                                        style={{ color: '#005f37' }}
                                        onClick={() =>
                                            setIsAllowEditPassword(
                                                (prev) => !prev
                                            )
                                        }
                                    />
                                </Tooltip>
                            )}
                            {isAllowEditPassword ? (
                                <span>Mật khẩu mới</span>
                            ) : (
                                <span>Mật khẩu</span>
                            )}
                        </div>
                    }
                    required={!id}
                    rules={[
                        {
                            pattern: /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).+$/,
                            message:
                                'Mật khẩu phải có ít nhất một chữ hoa, một ký tự đặc biệt và một số',
                        },
                        {
                            min: 8,
                            message: 'Mật khẩu phải có ít nhất 8 kí tự',
                        },
                    ]}
                >
                    <Input.Password disabled={!isAllowEditPassword && !!id} />
                </FormItem>
            </Col>

            {(isAllowEditPassword || !id) && (
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="confirmPassword"
                        label={
                            isAllowEditPassword ? (
                                <span>Xác nhận mật khẩu mới</span>
                            ) : (
                                <span>Xác nhận mật khẩu</span>
                            )
                        }
                        dependencies={['password']}
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng xác nhận mật khẩu',
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const referencePassword =
                                        getFieldValue('password')
                                    if (!value || referencePassword === value) {
                                        return Promise.resolve()
                                    }

                                    return Promise.reject(
                                        new Error(
                                            'Mật khẩu xác nhận không khớp'
                                        )
                                    )
                                },
                            }),
                        ]}
                    >
                        <Input.Password />
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutNguoiDungModal
