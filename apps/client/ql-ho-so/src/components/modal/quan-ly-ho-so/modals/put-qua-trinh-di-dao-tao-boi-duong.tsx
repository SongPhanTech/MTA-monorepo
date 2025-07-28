import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { Col, Form, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutQuaTrinhCuDiBoiDuongModal() {
    const [form] = Form.useForm()

    const { isOpen, onClose, input } = useDisclosure({
        tag: PutQuaTrinhCuDiBoiDuongModal.name,
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
            title={
                input
                    ? 'Cập nhật quá trình đi đào tạo bồi dưỡng'
                    : 'Thêm mới quá trình đi đào tạo bồi dưỡng'
            }
            className="w-[40vw]"
            layout="vertical"
        >
            <Col span={24}>
                <FormItem
                    label="Khóa đào tạo, bồi dưỡng tập huấn"
                    name="academicDegreeTypeId"
                    required
                    form={form}
                >
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem label="Đơn vị tổ chức" name="linhVuc" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Loại" name="truongId" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Từ ngày" name="nationalityId" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem label="Đến ngày " name="year" required form={form}>
                    <Input placeholder="Nhập lĩnh vực" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}
