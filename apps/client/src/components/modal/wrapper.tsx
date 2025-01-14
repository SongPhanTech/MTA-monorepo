import { useModal } from '@hooks/disclosure'

const ModalWrapper = () => {
    const modals = useModal()
    return modals.map((Modal) => <Modal key={Modal.name} />)
}

export default ModalWrapper
