import FormItem from '@components/commons/form-item'
import PutFormModal, { PutModalFormType } from '@components/commons/put-modal'
import useDisclosure from '@hooks/disclosure'
import { Col, Form, Input, Switch } from 'antd'
export type PutUserFormType = {
    username?: string
} & PutModalFormType
const PutUserModal = () => {
    const { isOpen, onClose, onOk, input } = useDisclosure({
        tag: PutUserModal.name,
    })

    const [form] = Form.useForm<PutUserFormType>()

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={
                input?.username ? 'Chỉnh sửa tài khoản' : 'Thêm mới tài khoản'
            }
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="username"
                    label="Tên đăng nhập"
                    required
                >
                    <Input />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutUserModal
