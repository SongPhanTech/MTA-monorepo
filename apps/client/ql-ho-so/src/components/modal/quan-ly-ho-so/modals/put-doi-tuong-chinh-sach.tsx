import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { Col, Form, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutDoiTuongChinhSachModal() {
    const [form] = Form.useForm()

    const { isOpen, onClose, input } = useDisclosure({
        tag: PutDoiTuongChinhSachModal.name,
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
            title={input ? 'Cập nhật đối tượng chính sách' : 'Thêm mới đối tượng chính sách'}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Đối tượng" name="academicDegreeTypeId" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Bắt đầu từ" name="linhVuc" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Kết thúc vào" name="truongId" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Ghi chú" name="nationalityId" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
