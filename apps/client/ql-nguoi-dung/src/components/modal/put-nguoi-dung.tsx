import { useCreateUser } from '@api/open-api/appComponents'
import FormItem from '@components/commons/form-item'
import PutFormModal, {
    type PutModalFormType,
} from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useDisclosure from '@hooks/disclosure'
import { useFindManyGroup, useFindUniqueUser } from '@workspace/db/hooks'
import { Col, Form, Input } from 'antd'
import { useEffect } from 'react'
export type PutUserFormType = {
    username: string
    name: string
    email?: string
    password: string
    groups?: string[]
} & PutModalFormType
const PutNguoiDungModal = () => {
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
            <Col span={12}>
                <FormItem
                    form={form}
                    name="username"
                    label="Tên đăng nhập"
                    required
                >
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="password"
                    label="Mật khẩu"
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
                        {
                            required: true,
                            message: 'Vui lòng nhập mật khẩu',
                        },
                    ]}
                >
                    <Input.Password disabled={!!id} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Họ và tên" required>
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="email" label="Email">
                    <Input />
                </FormItem>
            </Col>
            <Col span={24}>
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
        </PutFormModal>
    )
}

export default PutNguoiDungModal
