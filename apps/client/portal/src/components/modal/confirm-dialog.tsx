import { Modal } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const ConfirmModal = () => {
    const { isOpen, onClose, onOk, input } = useDisclosure<string>({
        tag: ConfirmModal.name,
    })

    return (
        <Modal
            title="Xác nhận"
            open={isOpen}
            className="w-[30vw]"
            okText="Đồng ý"
            cancelText="Hủy"
            onCancel={onClose}
            onOk={onOk}
        >
            {input}
        </Modal>
    )
}

export default ConfirmModal
