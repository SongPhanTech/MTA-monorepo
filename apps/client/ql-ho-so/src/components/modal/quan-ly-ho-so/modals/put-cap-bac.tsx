import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { Col, Form, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutCapBacModal() {
    const [form] = Form.useForm()

    const { isOpen, onClose, input } = useDisclosure({
        tag: PutCapBacModal.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    async function onOk(output: any) {}

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input ? 'Cập nhật cấp bậc' : 'Thêm mới cấp bậc'}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Tên cấp bậc" name="academicDegreeTypeId" required form={form}>
                    <Input placeholder="Nhập tên cấp bậc" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Nơi ra quyết định" name="linhVuc" required form={form}>
                    <Input placeholder="Nhập nơi ra quyết định" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Cấp ra quyết định" name="truongId" required form={form}>
                    <Input placeholder="Nhập cấp ra quyết định" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Ngày nhận quyết định" name="nationalityId" required form={form}>
                    <Input placeholder="Nhập ngày nhận quyết định" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
