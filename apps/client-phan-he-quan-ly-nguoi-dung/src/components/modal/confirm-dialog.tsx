import useDisclosure from '@hooks/disclosure'
import { Modal } from 'antd'

const ConfirmModal = () => {
    const { isOpen, onClose } = useDisclosure({
        tag: ConfirmModal.name,
    })

    const onLogout = (id: string) => {}

    return (
        <Modal
            title="Xác nhận"
            open={isOpen}
            className="w-[30vw]"
            onCancel={onLogout.bind(null, '1')}
        ></Modal>
    )
}

export default ConfirmModal
