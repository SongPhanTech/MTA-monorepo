import EvaluateLayout from "@layouts/evaluate-layout"
import CriteriaAnalysisWrite from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/criteria-analysis"
import CriteriaEvaluationWrite from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/criteria-evaluation"
import CrossReview from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review"
import CrossReviewAssignment from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review-assignment"
import CrossReviewExternal from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review-external"
import EvaluationPeriod from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/evaluation-period"
import ReviewCriteriaEvaluationAdvisory from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-evaluation-advisory"
import ReviewSecretary from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-secretary"
import StandardReports from "@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/standar-reports"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import { useFindFirstEvaluationCouncilMember, useFindUniqueLecturer } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Col, Row, Tabs, type TabsProps } from "antd"
import { useMemo, useState } from "react"

export default function CriteriaAnalysisAndEvaluationPage() {
  const [activeKey, setActiveKey] = useState("1")
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "0fac9683-9dc2-4296-a051-7c739e46785f"

  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const { can } = useAbility()

  const { data: lecturer } = useFindUniqueLecturer(
    {
      where: {
        userProfileId: idProfile,
      },
    },
    {
      enabled: !!idProfile,
    }
  )

  const { data: councilMember } = useFindFirstEvaluationCouncilMember(
    {
      where: {
        lecturerId: lecturer?.id,
        evaluationCouncil: {
          periodId: selectedEvaluationPeriodId,
        },
      },
      include: {
        evaluationCouncil: true,
      },
    },
    {
      enabled: !!lecturer?.id && !!selectedEvaluationPeriodId,
    }
  )

  const tabItems = useMemo(() => {
    const tabs: TabsProps["items"] = [
      {
        key: "1",
        label: "Danh sách đợt đánh giá",
        children: <EvaluationPeriod />,
      },
    ]

    const isAdvisoryBoard = councilMember?.role?.includes(
      $Enums.EvaluationMemberRole.ADVISORY_BOARD
    )

    const isHeadSpecialized = councilMember?.role?.includes(
      $Enums.EvaluationMemberRole.HEAD_SPECIALIZED
    )

    const isSecretary =
      councilMember?.role?.includes($Enums.EvaluationMemberRole.SECRETARY) ||
      councilMember?.role?.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY)

    const isNonCouncilMember = councilMember?.role?.includes(
      $Enums.EvaluationMemberRole.NONCOUNCIL_MEMBERS
    )

    const isCouncilMember = !!councilMember

    if (can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA, "THEM")) {
      tabs.push({
        key: "2",
        label: "Phiếu phân tích tiêu chí",
        children: <CriteriaAnalysisWrite />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    if (can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA, "THEM")) {
      tabs.push({
        key: "3",
        label: "Phiếu đánh giá tiêu chí",
        children: <CriteriaEvaluationWrite />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    if (isSecretary) {
      tabs.push({
        key: "4",
        label: "Xét duyệt phiếu (Thư ký)",
        children: <ReviewSecretary />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    if (isAdvisoryBoard) {
      tabs.push({
        key: "5",
        label: "Xét duyệt phiếu (Ban tư vấn)",
        children: <ReviewCriteriaEvaluationAdvisory />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    if (isSecretary) {
      tabs.push({
        key: "6",
        label: "Phân công phản biện chéo",
        children: <CrossReviewAssignment />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    if (isCouncilMember) {
      tabs.push({
        key: "7",
        label: "Phản biện chéo",
        children: <CrossReview userRole="REVIEWER" />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    if (isHeadSpecialized) {
      tabs.push({
        key: "8",
        label: "Báo cáo tiêu chuẩn",
        children: <StandardReports />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    if (isNonCouncilMember) {
      tabs.push({
        key: "9",
        label: "Phản biện chéo ngoài hội đồng",
        children: <CrossReviewExternal />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    return tabs
  }, [can, selectedEvaluationPeriodId, councilMember])

  return (
    <Row gutter={[12, 0]}>
      <Col span={24}>
        <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} tabBarGutter={10} />
      </Col>
    </Row>
  )
}

CriteriaAnalysisAndEvaluationPage.getLayout = function getLayout(page: React.ReactElement) {
  return <EvaluateLayout>{page}</EvaluateLayout>
}
