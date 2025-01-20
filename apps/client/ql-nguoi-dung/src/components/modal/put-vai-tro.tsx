import FormItem from '@components/commons/form-item'
import PutFormModal, {
    type PutModalFormType,
} from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useDisclosure from '@hooks/disclosure'
import { useFindManyGroup, useFindUniqueRole } from '@workspace/db/hooks'
import { Col, Form, Input } from 'antd'
import { useEffect } from 'react'
export type PutVaiTroFormType = {
    name: string
    code: string
    groups: string[]
    permissions: string[]
} & PutModalFormType
const PutVaiTroModal = () => {
    const [form] = Form.useForm<PutVaiTroFormType>()
    const { isOpen, onClose, onOk, input } = useDisclosure<string>({
        tag: PutVaiTroModal.name,
        onClose: form.resetFields,
    })
    const { data: role } = useFindUniqueRole({
        where: {
            id: input,
        },
        include: {
            groups: true,
        },
    })

    const { data: groups = [] } = useFindManyGroup()

    useEffect(() => {
        if (role) {
            form.setFieldsValue({
                description: role.description || '',
                name: role.name,
                groups: role.groups.map((user) => user.id),
            })
        }
    }, [role])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input ? 'Chỉnh sửa vai trò' : 'Thêm mới vai trò'}
        >
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên vai trò" required>
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã quyền">
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="groups" label="Nhóm người dùng">
                    <Select
                        showSearch
                        options={groups.map((group) => ({
                            label: group.name,
                            value: group.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="permissions" label="Quyền">
                    <Select
                        showSearch
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

export default PutVaiTroModal
