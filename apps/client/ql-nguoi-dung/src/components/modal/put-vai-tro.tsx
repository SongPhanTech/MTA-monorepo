import FormItem from '@components/commons/form-item'
import PutFormModal, { type PutModalFormType } from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useDisclosure from '@hooks/disclosure'
import { Col, Form, Input } from 'antd'
export type PutNhomNguoiDungFormType = {
    roleName: string
    roleCode: string
    roleList: any
} & PutModalFormType
const PutVaiTroModal = () => {
    const [form] = Form.useForm<PutNhomNguoiDungFormType>()
    const { isOpen, onClose, onOk, input } = useDisclosure<string>({
        tag: PutVaiTroModal.name,
        onClose: form.resetFields,
    })


    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={
                input ? 'Chỉnh sửa vai trò' : 'Thêm mới vai trò'
            }
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="roleName"
                    label="Tên vai trò"
                    required
                >
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="roleCode" label="Mã quyền">
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="roleList" label="Phân hệ">
                    <Select
                        showSearch
                        options={[
                            {value: 1, label: 'Thêm điểm'},
                            {value: 2, label: 'Xoá điểm'},
                            {value: 3, label: 'Sửa điểm'},
                            {value: 4, label: 'Thêm người dùng'},
                            {value: 5, label: 'Xoá người dùng'},
                            {value: 6, label: 'Sửa người dùng'},
                        ]}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutVaiTroModal
