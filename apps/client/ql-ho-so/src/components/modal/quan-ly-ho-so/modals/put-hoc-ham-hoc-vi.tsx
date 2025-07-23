import PutFormModal from '@components/commons/put-modal'
import { Form, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutHocHamHocViModal() {
    const [form] = Form.useForm()

    const { isOpen, onClose } = useDisclosure({
        tag: PutHocHamHocViModal.name,
    })

    function onOk() {}

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={<span>Thêm mới học vị</span>}
            className="w-[60vw]"
            layout="vertical"
        >
            <Form.Item
                label="Lĩnh vực"
                name="linhVuc"
                rules={[
                    {
                        required: true,
                        message: 'Vui lòng nhập lĩnh vực!',
                    },
                ]}
            >
                <Input placeholder="Nhập lĩnh vực" size="large" />
            </Form.Item>

            <Form.Item
                label="Trường"
                name="truong"
                rules={[
                    {
                        required: true,
                        message: 'Vui lòng nhập tên trường!',
                    },
                ]}
            >
                <Input placeholder="Nhập tên trường" size="large" />
            </Form.Item>

            <Form.Item
                label="Quốc gia"
                name="quocGia"
                rules={[
                    {
                        required: true,
                        message: 'Vui lòng nhập quốc gia!',
                    },
                ]}
            >
                <Input placeholder="Nhập quốc gia" size="large" />
            </Form.Item>

            <Form.Item
                label="Năm nhận"
                name="namNhan"
                rules={[
                    {
                        required: true,
                        message: 'Vui lòng nhập năm nhận!',
                    },
                ]}
            >
                <Input placeholder="06-2025" size="large" />
            </Form.Item>
        </PutFormModal>
    )
}
