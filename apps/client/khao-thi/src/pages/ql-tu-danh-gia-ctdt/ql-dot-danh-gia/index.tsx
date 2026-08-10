import EvaluateLayout from "@layouts/evaluate-layout"
import AssigmentOfAssessmentTab from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/assigment"
import CriteriaAnalysisPeriodList from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/criteria-analysis"
import CriteriaEvaluationPeriodList from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/criteria-evaluation"
import CrossReviewPeriod from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/cross-review"
import EvaluationCouncilTab from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-council"
import EvaluationPeriod from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-period"
import EvaluationStandardTab from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-standard"
import NoCounCilMemberTab from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/nocouncil-member"
import { Store, useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import { useFindFirstEvaluationCouncilMember, useFindUniqueLecturer } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Col, Row, Tabs, type TabsProps } from "antd"
import { useMemo, useState } from "react"
import PeriodEvidenceRepositoryTab from "./_components/period-evidence-repository"
import SumaryReport from "./_components/sumary-report"
import CrossReviewNoCouncilMember from "./_components/cross-review-nocouncil-member"

export type EvaluationPeriodStoreState = {
  selectedEvaluationPeriodId?: string
}

export const evaluationPeriodStore = new Store<EvaluationPeriodStoreState>({
  selectedEvaluationPeriodId: undefined,
})
export default function EvaluationPeriodTabPage() {
  const [activeKey, setActiveKey] = useState("1")
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "f1218263-341e-40c4-b269-a711a0186c74"
  const { can } = useAbility()
  const { data: lecturer } = useFindUniqueLecturer(
    {
      where: {
        userProfileId: idProfile || "",
      },
    },
    {
      enabled: !!idProfile,
    }
  )

  const { data: councilMember } = useFindFirstEvaluationCouncilMember(
    {
      where: {
        lecturerId: lecturer?.id || "",
        evaluationCouncil: {
          periodId: selectedEvaluationPeriodId || "",
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

  const isHeadSecretary = councilMember?.role?.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY)
  const isVicePeresident = councilMember?.role?.includes($Enums.EvaluationMemberRole.VICE_PRESIDENT)
  const isNonCouncilMember = councilMember?.role?.includes(
    $Enums.EvaluationMemberRole.NONCOUNCIL_MEMBERS
  )

  const tabItems = useMemo(() => {
    const tabs: TabsProps["items"] = [
      {
        key: "1",
        label: "Danh sách đợt đánh giá",
        children: <EvaluationPeriod />,
      },
    ]

    if (can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA, "THEM")) {
      tabs.push(
        {
          key: "2",
          label: "Hội đồng",
          children: <EvaluationCouncilTab />,
          disabled: !selectedEvaluationPeriodId,
        },
        {
          key: "3",
          label: "Tiêu chuẩn, tiêu chí",
          children: <EvaluationStandardTab />,
          disabled: !selectedEvaluationPeriodId,
        }
      )
    }

    if (
      isHeadSecretary ||
      isVicePeresident ||
      can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA, "XEM")
    ) {
      tabs.push({
        key: "4",
        label: "Phân công giảng viên",
        children: <AssigmentOfAssessmentTab />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    if (can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA, "XEM_CHI_TIET")) {
      tabs.push(
        {
          key: "5",
          label: "Danh sách phiếu phân tích tiêu chí",
          children: <CriteriaAnalysisPeriodList />,
          disabled: !selectedEvaluationPeriodId,
        },
        {
          key: "6",
          label: "Danh sách phiếu đánh giá tiêu chí",
          children: <CriteriaEvaluationPeriodList />,
          disabled: !selectedEvaluationPeriodId,
        },
        {
          key: "7",
          label: "Báo cáo tiêu chuẩn",
          children: <CrossReviewPeriod />,
          disabled: !selectedEvaluationPeriodId,
        },
        {
          key: "8",
          label: "Viết báo cáo tự đánh giá",
          children: <SumaryReport />,
          disabled: !selectedEvaluationPeriodId,
        }
      )
    }

    tabs.push({
      key: "9",
      label: "Phân công phản biện ngoài hội đồng",
      children: <NoCounCilMemberTab />,
      disabled: !selectedEvaluationPeriodId,
    })

    if (isNonCouncilMember) {
      tabs.push({
        key: "10",
        label: "Phản biện ngoài hội đồng",
        children: <CrossReviewNoCouncilMember />,
        disabled: !selectedEvaluationPeriodId,
      })
    }

    tabs.push({
      key: "11",
      label: "Kho minh chứng theo đợt",
      children: <PeriodEvidenceRepositoryTab />,
    })

    return tabs
  }, [selectedEvaluationPeriodId, councilMember, can])

  return (
    <Row gutter={[12, 0]}>
      <Col span={24}>
        <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          items={tabItems}
          tabBarGutter={10}
        />
      </Col>
    </Row>
  )
}

EvaluationPeriodTabPage.getLayout = function getLayout(page: React.ReactElement) {
  return <EvaluateLayout>{page}</EvaluateLayout>
}
