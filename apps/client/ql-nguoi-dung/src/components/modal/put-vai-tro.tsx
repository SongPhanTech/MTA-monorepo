import FormItem from '@components/commons/form-item'
import PutFormModal, {
    type PutModalFormType,
} from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useDisclosure from '@hooks/disclosure'
import useQuyenCoBan from '@hooks/quyen-co-ban'
import { useFindManyGroup, useFindUniqueRole } from '@workspace/db/hooks'
import { Col, Form, Input } from 'antd'
import { useEffect } from 'react'
export type PutVaiTroFormType = {
    id?: string
    name: string
    groups: string[]
    permissions: string[]
} & PutModalFormType
const PutVaiTroModal = () => {
    const [form] = Form.useForm<PutVaiTroFormType>()
    const { isOpen, onClose, onOk, input } = useDisclosure<string>({
        tag: PutVaiTroModal.name,
        onClose: form.resetFields,
    })
    const quyenCoBan = useQuyenCoBan()

    const { data: role } = useFindUniqueRole({
        where: {
            id: input,
        },
        include: {
            groups: true,
            permissions: true,
        },
    })

    const { data: groups = [] } = useFindManyGroup()
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (role) {
            form.setFieldsValue({
                id: role.id,
                description: role.description || '',
                name: role.name,
                groups: role.groups.map((user) => user.id),
                permissions: role.permissions.map((user) => user.name),
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
            <FormItem form={form} name="id" hidden>
                <Input />
            </FormItem>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên vai trò" required>
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="groups"
                    label="Nhóm người dùng"
                    required
                >
                    <Select
                        mode="multiple"
                        showSearch
                        options={groups.map((group) => ({
                            label: group.name,
                            value: group.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="permissions" label="Quyền" required>
                    <Select
                        mode="multiple"
                        showSearch
                        options={quyenCoBan.map((item) => ({
                            label: item.label,
                            value: item.id,
                        }))}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutVaiTroModal
