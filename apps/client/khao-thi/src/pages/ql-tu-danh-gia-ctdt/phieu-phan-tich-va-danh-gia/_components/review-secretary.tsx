import ReviewCriteriaAnalysis from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-analysis"
import ReviewCriteriaEvaluation from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-evaluation"
import { Tabs, type TabsProps } from "antd"
import { useMemo, useState } from "react"

const ReviewSecretary = () => {
  const [activeKey, setActiveKey] = useState("1")

  const tabItems = useMemo(() => {
    const tabs: TabsProps["items"] = [
      {
        key: "1",
        label: "Phiếu phân tích tiêu chí",
        children: <ReviewCriteriaAnalysis />,
      },
      {
        key: "2",
        label: "Phiếu đánh giá tiêu chí",
        children: <ReviewCriteriaEvaluation />,
      },
    ]

    return tabs
  }, [])

  return <Tabs items={tabItems} activeKey={activeKey} onChange={setActiveKey} />
}

export default ReviewSecretary
