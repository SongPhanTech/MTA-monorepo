import DefaultLayout from "@layouts/default-layout"
import { Store, useStore } from "@tanstack/react-store"
import { Tabs, type TabsProps } from "antd"
import { useMemo, useState } from "react"
import KhungDeList from "./_component/khung-de-page"
import MaTranDePage from "./_component/ma-tran-de"
import QuestionBankLite from "./_component/ngan-hang-cau-hoi-lite"
export const store = new Store<{
  examFrameworkId: string | undefined
  semesterId: string | undefined
  matrixId: string | undefined
}>({
  examFrameworkId: undefined,
  semesterId: undefined,
  matrixId: undefined,
})
export default function KhungDePage() {
  const [activeKey, setActiveKey] = useState("1")
  const { examFrameworkId, matrixId } = useStore(store)

  const items: TabsProps["items"] = useMemo(() => {
    return [
      {
        label: "Khung đề",
        key: "1",
        children: <KhungDeList />,
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
  }, [examFrameworkId, matrixId])

  return (
    <div>
      <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
    </div>
  )
}

KhungDePage.getLayout = function getLayout(page: React.ReactNode) {
  return <DefaultLayout>{page}</DefaultLayout>
}
