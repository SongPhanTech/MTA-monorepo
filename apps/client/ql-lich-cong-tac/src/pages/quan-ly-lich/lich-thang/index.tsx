import { MonthScheduleMatrix } from "@components/lich-thang/month-schedule-matrix"
import { MonthScheduleToolbar } from "@components/lich-thang/month-schedule-toolbar"
import { ScheduleEntryDrawer } from "@components/lich-tuan/schedule-entry-drawer"
import { WeekScheduleLegend } from "@components/lich-tuan/week-schedule-shared"
import DefaultLayout from "@layouts/default-layout"
import { useMonthScheduleView } from "@hooks/use-month-schedule-view"
import { formatMonthLabel, formatMonthPeriodLabel } from "@/utils/work-schedule-month"
import { printScheduleCard } from "@/utils/print-schedule"
import type { WeekScheduleEntry, WeekScheduleLeader } from "@/types/work-schedule-week-view"
import { ROUTER_PATH } from "@workspace/router"
import { Typography } from "antd"
import type React from "react"
import { useCallback, useState } from "react"
import "@components/lich-tuan/week-schedule.css"
import "@components/lich-thang/month-schedule.css"

const { Title, Text } = Typography

function LichThangPage() {
  const {
    monthStart,
    monthEnd,
    monthDays,
    leaders,
    entriesByCell,
    eventCount,
    hiddenTypes,
    toggleType,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    pickMonth,
  } = useMonthScheduleView()

  const [selectedEntry, setSelectedEntry] = useState<WeekScheduleEntry | null>(null)
  const [selectedLeader, setSelectedLeader] = useState<WeekScheduleLeader | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleEntryClick = useCallback((entry: WeekScheduleEntry, leader: WeekScheduleLeader) => {
    setSelectedEntry(entry)
    setSelectedLeader(leader)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  return (
    <div className="week-schedule-page space-y-4">
      <div>
        <Title level={4} className="!mb-1">
          Lịch tháng
        </Title>
        <Text type="secondary">
          Tổng hợp lịch công tác tháng của Ban Giám đốc theo từng thành viên
        </Text>
      </div>

      <div className="week-schedule-card">
        <div className="week-schedule-header">
          <Title level={3} className="!mb-2 !text-[#13ab55] uppercase tracking-wide">
            Lịch công tác tháng của Ban Giám đốc
          </Title>
          <Text className="text-base text-gray-600 block">{formatMonthLabel(monthStart)}</Text>
          <Text className="text-sm text-gray-500">
            ({formatMonthPeriodLabel(monthStart, monthEnd)})
          </Text>
        </div>

        <MonthScheduleToolbar
          monthStart={monthStart}
          monthEnd={monthEnd}
          eventCount={eventCount}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onCurrentMonth={goToCurrentMonth}
          onPickMonth={pickMonth}
          onPrint={() => printScheduleCard()}
        />

        <MonthScheduleMatrix
          monthDays={monthDays}
          leaders={leaders}
          entriesByCell={entriesByCell}
          monthStart={monthStart}
          returnPath={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_THANG}
          onEntryClick={handleEntryClick}
        />

        <WeekScheduleLegend hiddenTypes={hiddenTypes} onToggleType={toggleType} />
      </div>

      <ScheduleEntryDrawer
        open={drawerOpen}
        entry={selectedEntry}
        leader={selectedLeader}
        onClose={closeDrawer}
      />
    </div>
  )
}

export default LichThangPage

LichThangPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
