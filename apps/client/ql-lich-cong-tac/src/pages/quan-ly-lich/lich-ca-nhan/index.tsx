import { PersonalScheduleInfoPanel } from "@components/lich-ca-nhan/personal-schedule-info-panel"
import { PersonalScheduleProfileCard } from "@components/lich-ca-nhan/personal-schedule-profile-card"
import { PersonalScheduleTable } from "@components/lich-ca-nhan/personal-schedule-table"
import DefaultLayout from "@layouts/default-layout"
import { usePersonalScheduleView } from "@hooks/use-personal-schedule-view"
import { ROUTER_PATH } from "@workspace/router"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { Result } from "antd"
import Link from "next/link"
import { useRouter } from "next/router"
import type React from "react"
import "@components/lich-ca-nhan/personal-schedule.css"

function LichCaNhanPage() {
  const router = useRouter()
  const {
    leader,
    profile,
    rows,
    periodType,
    periodStart,
    periodEnd,
    from,
    changePeriodType,
    goToPreviousPeriod,
    goToNextPeriod,
    pickPeriod,
  } = usePersonalScheduleView(router.query)

  const backHref =
    from ||
    (periodType === "month"
      ? ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_THANG
      : ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_TUAN)

  if (!leader) {
    return (
      <Result
        status="404"
        title="Không tìm thấy thủ trưởng"
        extra={
          <Link href={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_TUAN}>Quay lại lịch tuần</Link>
        }
      />
    )
  }

  return (
    <div className="personal-schedule-shell space-y-4">
      <Link href={backHref} className="personal-schedule-back">
        <ArrowLeftOutlined />
        Quay lại lịch chung
      </Link>

      <div className="personal-schedule-header">
        <PersonalScheduleProfileCard
          leader={leader}
          periodType={periodType}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onChangePeriodType={changePeriodType}
          onPreviousPeriod={goToPreviousPeriod}
          onNextPeriod={goToNextPeriod}
          onPickPeriod={pickPeriod}
        />
        <PersonalScheduleInfoPanel leader={leader} profile={profile} />
      </div>

      <PersonalScheduleTable rows={rows} />
    </div>
  )
}

export default LichCaNhanPage

LichCaNhanPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout className="!bg-white">{page}</DefaultLayout>
}
