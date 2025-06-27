import {
    CopyOutlined,
    EditFilled,
    SafetyCertificateOutlined,
} from '@ant-design/icons'
import {
    fetchTerminateSessionBySessionId,
    useGetSessionsByUserId,
} from '@api/open-api/appComponents'
import FormItem from '@components/commons/form-item'
import PutFormModal, {
    type PutModalFormType,
} from '@components/commons/put-modal'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { formatDateReadable, generatePassword } from '@lib/utils'
import { useFindManyGroup, useFindUniqueUser } from '@workspace/db/hooks'
import { Button, Col, Form, Input, Space, Tooltip, message } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutUserFormType = {
    id?: string
    username: string
    name: string
    email?: string
    groups?: string[]
    password?: string
} & PutModalFormType
const PutNguoiDungModal = () => {
    const [isAllowEditPassword, setIsAllowEditPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
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
        where: { id: id },
        include: { groups: true },
    })

    const { data: sessions, refetch: refetchSessions } = useGetSessionsByUserId(
        {
            pathParams: { id: id || '' },
        }
    )

    const { data: groups = [] } = useFindManyGroup()
    const copyToClipboard = () => {
        navigator.clipboard.writeText(newPassword)
        message.success('Mật khẩu mới đã được sao chép!', 3)
    }
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
                        maxTagCount={'responsive'}
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
                                        style={{ color: '#028850' }}
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
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập mật khẩu',
                        },
                    ]}
                >
                    <Space.Compact style={{ width: '100%' }}>
                        <Input.Password
                            disabled={!isAllowEditPassword && !!id}
                            value={newPassword}
                        />
                        {newPassword.length !== 8 ? (
                            <Tooltip title="Tạo mật khẩu mới">
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        const generated = generatePassword(8)
                                        setNewPassword(generated)
                                        form.setFieldsValue({
                                            password: generated,
                                        })
                                        navigator.clipboard.writeText(generated)
                                        message.success(
                                            'Mật khẩu mới đã được sao chép!',
                                            3
                                        )
                                    }}
                                    disabled={!isAllowEditPassword && !!id}
                                    icon={<SafetyCertificateOutlined />}
                                />
                            </Tooltip>
                        ) : (
                            <Tooltip title="Sao chép">
                                <Button
                                    icon={<CopyOutlined />}
                                    type="primary"
                                    onClick={() => copyToClipboard()}
                                    disabled={!isAllowEditPassword && !!id}
                                />
                            </Tooltip>
                        )}
                    </Space.Compact>
                </FormItem>
            </Col>
            <Col span={24}>
                <Table
                    columns={[
                        {
                            title: 'STT',
                            width: 20,
                            align: 'center',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'userAgent',
                            dataIndex: 'userAgent',
                        },
                        {
                            title: 'IP',
                            dataIndex: 'ip',
                        },
                        {
                            title: 'Thời gian đăng nhập',
                            dataIndex: 'loginTime',
                            render: (_, { loginTime }) =>
                                loginTime ? formatDateReadable(loginTime) : '',
                        },
                        {
                            title: 'Thời gian truy cập cuối',
                            dataIndex: 'lastAccessTime',
                            render: (_, { lastAccessTime }) =>
                                lastAccessTime
                                    ? formatDateReadable(lastAccessTime)
                                    : '',
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            render: (_, { id: sessionId }) => (
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () => {
                                            fetchTerminateSessionBySessionId({
                                                pathParams: {
                                                    id: id || '',
                                                    sessionId: sessionId || '',
                                                },
                                            })
                                            refetchSessions()
                                        },
                                    }}
                                />
                            ),
                        },
                    ]}
                    data={sessions?.sessions || []}
                    pagination={{ hideOnSinglePage: true }}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutNguoiDungModal
