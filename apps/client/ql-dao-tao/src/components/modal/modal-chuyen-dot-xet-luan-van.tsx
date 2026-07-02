import { Button, Modal } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

export type ModalChuyenDotXetLuanVanInput = {
  thesisProjectId: string
  thesisSessionId: string
  onSuccess?: () => void | Promise<void>
}

const ModalChuyenDotXetLuanVan = () => {
  const { isOpen, onClose, input } = useDisclosure<ModalChuyenDotXetLuanVanInput>({
    tag: "ModalChuyenDotXetLuanVan",
  })

  return (
    <Modal
      title="Chuyển đợt xét"
      open={isOpen}
      onCancel={onClose}
      destroyOnClose
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      {/* Nội dung modal sẽ được bổ sung sau */}
    </Modal>
  )
}

export default ModalChuyenDotXetLuanVan
