import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { Col, Form, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutKeKhaiTaiSanModal() {
    const [form] = Form.useForm()

    const { isOpen, onClose, input } = useDisclosure({
        tag: PutKeKhaiTaiSanModal.name,
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
            title={input ? 'Cập nhật kê khai tài sản' : 'Thêm mới kê khai tài sản '}
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem label="Tên đợt" name="academicDegreeTypeId" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Loại" name="linhVuc" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Thời gian kê khai" name="truongId" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
