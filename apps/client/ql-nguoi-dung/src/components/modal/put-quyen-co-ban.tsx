import FormItem from '@components/commons/form-item'
import PutFormModal, { type PutModalFormType } from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { useFindFirstGroup } from '@workspace/db/hooks'
import { Col, Form, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutNhomNguoiDungFormType = {
    name: string
    permissionName: string
    subSystem: number
} & PutModalFormType
const PutQuyenCoBanModal = () => {
    const [form] = Form.useForm<PutNhomNguoiDungFormType>()
    const { isOpen, onClose, onOk, input } = useDisclosure<string>({
        tag: PutQuyenCoBanModal.name,
        onClose: form.resetFields,
    })
    const { data: group } = useFindFirstGroup({
        where: {
            id: input,
        },
        include: {
            users: true,
            roles: true,
        },
    })

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input ? 'Chỉnh sửa quyền cơ bản' : 'Thêm mới quyền cơ bản'}
        >
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên quyền cơ bản" required>
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="permissionName" label="Mã quyền">
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="subSystem" label="Phân hệ">
                    <Select
                        showSearch
                        options={[
                            { value: 1, label: 'Quản lý người dùng' },
                            { value: 2, label: 'Quản lý hệ thống' },
                            { value: 3, label: 'Quản lý đào tạo' },
                            { value: 4, label: 'Quản lý CSVC' },
                            { value: 5, label: 'Quản lý thông tin điều hành' },
                        ]}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutQuyenCoBanModal
