import { Modal } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const ConfirmModal = () => {
  const { isOpen, input } = useDisclosure<string>({
    tag: "ConfirmModal",
  })

  const onLogout = (id: string) => {}

  return (
    <Modal
      title="Xác nhận"
      open={isOpen}
      className="w-[30vw]"
      okText="Đồng ý"
      cancelText="Hủy"
      onCancel={onLogout.bind(null, "1")}
    >
      {input}
    </Modal>
  )
}

export default ConfirmModal
