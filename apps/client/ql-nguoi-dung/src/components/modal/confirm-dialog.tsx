import useDisclosure from '@hooks/disclosure'
import { Modal } from 'antd'

const ConfirmModal = () => {
    const { isOpen, input } = useDisclosure({
        tag: ConfirmModal.name,
    })

    const onLogout = (id: string) => {}

    return (
        <Modal
            title="Xác nhận"
            open={isOpen}
            className="w-[30vw]"
            okText="Đồng ý"
            cancelText="Hủy"
            onCancel={onLogout.bind(null, '1')}
        >
            {input}
        </Modal>
    )
}

export default ConfirmModal
