import ReviewCriteriaAnalysisAdvisory from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-analysis-advisory"
import ReviewCriteriaEvaluationAdvisory from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-evaluation-advisory"
import { Tabs, type TabsProps } from "antd"
import { useMemo, useState } from "react"

const ReviewAdvisory = () => {
  const [activeKey, setActiveKey] = useState("1")

  const tabItems = useMemo(() => {
    const tabs: TabsProps["items"] = [
      {
        key: "1",
        label: "Phiếu phân tích tiêu chí",
        children: <ReviewCriteriaAnalysisAdvisory />,
      },
      {
        key: "2",
        label: "Phiếu đánh giá tiêu chí",
        children: <ReviewCriteriaEvaluationAdvisory />,
      },
    ]

    return tabs
  }, [])

  return <Tabs items={tabItems} activeKey={activeKey} onChange={setActiveKey} />
}

export default ReviewAdvisory
