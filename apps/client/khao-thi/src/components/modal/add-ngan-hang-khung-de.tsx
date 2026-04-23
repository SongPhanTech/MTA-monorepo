import { store } from "@pages/thiet-lap-de-thi/khung-de"
import KhungDeList from "@pages/thiet-lap-de-thi/khung-de/_component/khung-de-page"
import MaTranDePage from "@pages/thiet-lap-de-thi/khung-de/_component/ma-tran-de"
import QuestionBankLite from "@pages/thiet-lap-de-thi/khung-de/_component/ngan-hang-cau-hoi-lite"
import { useStore } from "@tanstack/react-store"
import { Modal, Tabs } from "antd"
import { TabsProps } from "antd/lib"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const AddNganHangKhungDe = () => {
  const [activeKey, setActiveKey] = useState("1")
  const { examFrameworkId, matrixId } = useStore(store)
  const { isOpen, onClose, input } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "AddNganHangKhungDe",
  })

  const items: TabsProps["items"] = useMemo(() => {
    return [
      {
        label: "Khung đề",
        key: "1",
        children: <KhungDeList defaultSubjectVersionId={input?.subjectVersionId} />,
      },
      {
        label: "Ma trận đề",
        key: "2",
        children: <MaTranDePage id={examFrameworkId} />,
        disabled: !examFrameworkId,
      },
      {
        label: "Câu hỏi trong ma trận",
        key: "3",
        children: <QuestionBankLite examFrameworkId={examFrameworkId} questionBankId="" />,
        disabled: !examFrameworkId || !matrixId,
      },
    ]
  }, [examFrameworkId, matrixId, input?.subjectVersionId])

  return (
    <Modal footer={null} open={isOpen} className="top-0 w-[100vw] h-screen" onCancel={onClose}>
      <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
    </Modal>
  )
}

export default AddNganHangKhungDe
